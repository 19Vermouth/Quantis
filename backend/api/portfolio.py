from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import pandas as pd
import numpy as np
from loguru import logger
import asyncio

from models.schemas import (
    PortfolioInput,
    PortfolioResponse,
    AssetAllocation,
    RiskProfile
)
from services.market_data import market_data_service
from services.portfolio_optimizer import portfolio_optimizer
from services.risk_model import risk_model
from services.monte_carlo import monte_carlo_engine
from services.agents import consensus_engine
from core.config import settings

router = APIRouter()


@router.post("/portfolio", response_model=PortfolioResponse)
async def generate_portfolio(input_data: PortfolioInput):
    logger.info(f"Portfolio request: {input_data.risk_profile}, ₹{input_data.investment_amount:,}")
    
    try:
        data = await market_data_service.fetch_all_data()
        
        if not data:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch market data"
            )
        
        benchmark_returns = None
        if "^NSEI" in data:
            benchmark_returns = market_data_service.calculate_returns(data["^NSEI"])
        
        expected_returns = market_data_service.get_expected_returns(data)
        cov_matrix = market_data_service.calculate_covariance_matrix(data)
        
        weights = portfolio_optimizer.optimize_portfolio(
            expected_returns,
            cov_matrix,
            input_data.risk_profile,
            input_data.constraints
        )
        
        returns_data = {}
        for ticker in data.keys():
            if ticker != "^NSEI" and not data[ticker].empty:
                returns_data[ticker] = market_data_service.calculate_returns(data[ticker])
        
        metrics = risk_model.calculate_metrics(weights, returns_data, benchmark_returns)
        
        monte_carlo_result = monte_carlo_engine.run_simulation(
            input_data.investment_amount,
            metrics.expected_return,
            metrics.volatility,
            input_data.horizon_years
        )
        
        consensus_engine.set_sentiment_agent(settings.finnhub_key)
        
        adjusted_weights, agent_logs, explanation = await consensus_engine.run_consensus(
            weights,
            expected_returns,
            cov_matrix,
            metrics.model_dump(),
            input_data.risk_profile,
            list(weights.keys()),
            input_data.investment_amount
        )
        
        allocation = []
        for ticker, weight in adjusted_weights.items():
            allocation.append(AssetAllocation(
                ticker=ticker,
                name=market_data_service.get_ticker_name(ticker),
                weight=round(weight, 4),
                amount=round(input_data.investment_amount * weight, 2),
                asset_class=market_data_service.get_asset_class(ticker)
            ))
        
        allocation = sorted(allocation, key=lambda x: x.weight, reverse=True)
        
        logger.info(f"Portfolio generated with {len(allocation)} holdings")
        
        return PortfolioResponse(
            allocation=allocation,
            metrics=metrics,
            monte_carlo=monte_carlo_result,
            agent_logs=agent_logs,
            explanation=explanation,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Portfolio generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Portfolio generation failed: {str(e)}"
        )