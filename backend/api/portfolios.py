from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from core.database import get_db
from core.auth import get_current_user
from models.models import User, Portfolio, PortfolioVersion
from models.schemas import (
    PortfolioInput,
    PortfolioResponse,
    AssetAllocation,
    PortfolioMetrics,
    MonteCarloResult,
    AgentLog,
    PortfolioExplanation,
    RiskProfile
)
from services.market_data import market_data_service
from services.portfolio_optimizer import portfolio_optimizer
from services.risk_model import risk_model
from services.monte_carlo import monte_carlo_engine
from services.debate_agents import run_debate_flow
from services.agents import consensus_engine
from core.config import settings

router = APIRouter(prefix="/api/portfolios", tags=["Portfolios"])


def generate_portfolio_data(
    risk_profile: str,
    investment_amount: float,
    horizon_years: int,
    age: int
) -> dict:
    import asyncio
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        data = loop.run_until_complete(market_data_service.fetch_all_data())
        
        if not data:
            raise Exception("Unable to fetch market data")
        
        benchmark_returns = None
        if "^NSEI" in data:
            benchmark_returns = market_data_service.calculate_returns(data["^NSEI"])
        
        expected_returns = market_data_service.get_expected_returns(data)
        cov_matrix = market_data_service.calculate_covariance_matrix(data)
        
        risk_profile_enum = RiskProfile(risk_profile)
        
        weights = portfolio_optimizer.optimize_portfolio(
            expected_returns,
            cov_matrix,
            risk_profile_enum,
            {}
        )
        
        returns_data = {}
        for ticker in data.keys():
            if ticker != "^NSEI" and not data[ticker].empty:
                returns_data[ticker] = market_data_service.calculate_returns(data[ticker])
        
        metrics = risk_model.calculate_metrics(weights, returns_data, benchmark_returns)
        
        monte_carlo_result = monte_carlo_engine.run_simulation(
            investment_amount,
            metrics.expected_return,
            metrics.volatility,
            horizon_years
        )
        
        loop.run_until_complete(consensus_engine.set_sentiment_agent(settings.finnhub_key))
        
        adjusted_weights, agent_logs, explanation = loop.run_until(
            consensus_engine.run_consensus(
                weights,
                expected_returns,
                cov_matrix,
                metrics.model_dump(),
                risk_profile_enum,
                list(weights.keys()),
                investment_amount
            )
        )
        
        return {
            "weights": adjusted_weights,
            "metrics": metrics,
            "monte_carlo": monte_carlo_result,
            "agent_logs": agent_logs,
            "explanation": explanation,
            "data": data
        }
    finally:
        loop.close()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_input: PortfolioInput,
    name: str = "My Portfolio",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        portfolio_data = generate_portfolio_data(
            portfolio_input.risk_profile.value,
            portfolio_input.investment_amount,
            portfolio_input.horizon_years,
            portfolio_input.age
        )
        
        portfolio = Portfolio(
            user_id=current_user.id,
            name=name,
            risk_profile=portfolio_input.risk_profile.value,
            investment_amount=portfolio_input.investment_amount,
            horizon_years=portfolio_input.horizon_years,
            age=portfolio_input.age,
            current_version=1
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
        
        version = PortfolioVersion(
            portfolio_id=portfolio.id,
            version_number=1,
            allocation=[{"ticker": k, "weight": v} for k, v in portfolio_data["weights"].items()],
            metrics=portfolio_data["metrics"].model_dump(),
            monte_carlo=portfolio_data["monte_carlo"].model_dump(),
            agent_logs=[a.model_dump() for a in portfolio_data["agent_logs"]],
            explanation=portfolio_data["explanation"].model_dump()
        )
        db.add(version)
        db.commit()
        
        return {
            "id": portfolio.id,
            "name": portfolio.name,
            "message": "Portfolio created successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portfolio: {str(e)}"
        )


@router.get("", response_model=List[dict])
async def get_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    result = []
    for p in portfolios:
        latest_version = db.query(PortfolioVersion).filter(
            PortfolioVersion.portfolio_id == p.id
        ).order_by(PortfolioVersion.version_number.desc()).first()
        
        if latest_version:
            expected_value = latest_version.monte_carlo.get("percentile_50", p.investment_amount)
        else:
            expected_value = p.investment_amount
        
        result.append({
            "id": p.id,
            "name": p.name,
            "risk_profile": p.risk_profile,
            "investment_amount": p.investment_amount,
            "expected_value": expected_value,
            "horizon_years": p.horizon_years,
            "current_version": p.current_version,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        })
    
    return result


@router.get("/{portfolio_id}", response_model=dict)
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    latest_version = db.query(PortfolioVersion).filter(
        PortfolioVersion.portfolio_id == portfolio.id
    ).order_by(PortfolioVersion.version_number.desc()).first()
    
    if not latest_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio version not found"
        )
    
    allocation = []
    for item in latest_version.allocation:
        ticker = item["ticker"]
        allocation.append(AssetAllocation(
            ticker=ticker,
            name=market_data_service.get_ticker_name(ticker),
            weight=item["weight"],
            amount=portfolio.investment_amount * item["weight"],
            asset_class=market_data_service.get_asset_class(ticker)
        ))
    
    metrics = PortfolioMetrics(**latest_version.metrics)
    monte_carlo = MonteCarloResult(**latest_version.monte_carlo)
    agent_logs = [AgentLog(**log) for log in latest_version.agent_logs]
    explanation = PortfolioExplanation(**latest_version.explanation)
    
    return PortfolioResponse(
        allocation=allocation,
        metrics=metrics,
        monte_carlo=monte_carlo,
        agent_logs=agent_logs,
        explanation=explanation,
        timestamp=latest_version.created_at.isoformat() if latest_version.created_at else datetime.now().isoformat()
    )


@router.put("/{portfolio_id}", response_model=dict)
async def update_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    try:
        portfolio_data = generate_portfolio_data(
            portfolio.risk_profile,
            portfolio.investment_amount,
            portfolio.horizon_years,
            portfolio.age
        )
        
        new_version = portfolio.current_version + 1
        portfolio.current_version = new_version
        db.commit()
        
        version = PortfolioVersion(
            portfolio_id=portfolio.id,
            version_number=new_version,
            allocation=[{"ticker": k, "weight": v} for k, v in portfolio_data["weights"].items()],
            metrics=portfolio_data["metrics"].model_dump(),
            monte_carlo=portfolio_data["monte_carlo"].model_dump(),
            agent_logs=[a.model_dump() for a in portfolio_data["agent_logs"]],
            explanation=portfolio_data["explanation"].model_dump()
        )
        db.add(version)
        db.commit()
        
        return {
            "id": portfolio.id,
            "message": f"Portfolio regenerated to version {new_version}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update portfolio: {str(e)}"
        )


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    db.delete(portfolio)
    db.commit()
    
    return None


@router.get("/{portfolio_id}/versions", response_model=List[dict])
async def get_portfolio_versions(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    versions = db.query(PortfolioVersion).filter(
        PortfolioVersion.portfolio_id == portfolio.id
    ).order_by(PortfolioVersion.version_number.desc()).all()
    
    return [
        {
            "version_number": v.version_number,
            "metrics": v.metrics,
            "created_at": v.created_at.isoformat() if v.created_at else None
        }
        for v in versions
    ]


@router.get("/{portfolio_id}/versions/{version_number}", response_model=dict)
async def get_portfolio_version(
    portfolio_id: int,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    version = db.query(PortfolioVersion).filter(
        PortfolioVersion.portfolio_id == portfolio.id,
        PortfolioVersion.version_number == version_number
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    
    return {
        "version_number": version.version_number,
        "allocation": version.allocation,
        "metrics": version.metrics,
        "monte_carlo": version.monte_carlo,
        "agent_logs": version.agent_logs,
        "explanation": version.explanation,
        "created_at": version.created_at.isoformat() if version.created_at else None
    }