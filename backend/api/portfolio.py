from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import pandas as pd
import numpy as np
from loguru import logger
import asyncio
from typing import List

from models.schemas import (
    PortfolioInput,
    PortfolioResponse,
    AssetAllocation,
    RiskProfile,
    AgentLog
)
from services.market_data import market_data_service
from services.portfolio_optimizer import portfolio_optimizer
from services.risk_model import risk_model
from services.monte_carlo import monte_carlo_engine
from services.agents import consensus_engine
from services.debate_agents import run_debate_flow, AgentOutput as DebateAgentOutput
from core.config import settings

router = APIRouter()


def convert_debate_to_agent_logs(agents: List[DebateAgentOutput], consensus) -> List[AgentLog]:
    logs = []
    for agent in agents:
        logs.append(AgentLog(
            agent_name=agent.agent_name,
            reasoning=agent.summary,
            confidence=agent.confidence,
            recommendations=agent.concerns + [f"{r.ticker}: {r.action}" for r in agent.recommendations[:3]]
        ))
    logs.append(AgentLog(
        agent_name="Consensus Engine",
        reasoning=consensus.final_summary,
        confidence=consensus.consensus_strength,
        recommendations=[f"Disagreement: {d['ticker']} - {d.get('conflict', '')}" for d in consensus.disagreements[:3]]
    ))
    return logs


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

        try:
            debate_consensus, debate_agents = await asyncio.wait_for(
                run_debate_flow(
                    weights,
                    metrics.model_dump(),
                    input_data.risk_profile.value,
                    input_data.investment_amount,
                    input_data.horizon_years,
                    list(weights.keys())
                ),
                timeout=5.0
            )
            adjusted_weights = debate_consensus.adjusted_weights
            logger.info("[DEBATE] Completed successfully")
        except asyncio.TimeoutError:
            logger.warning("[DEBATE] Timeout, using optimizer weights")
            debate_agents = []
            adjusted_weights = weights

        metrics = risk_model.calculate_metrics(adjusted_weights, returns_data, benchmark_returns)

        agent_logs = convert_debate_to_agent_logs(debate_agents, debate_consensus)

        consensus_engine.set_sentiment_agent(settings.finnhub_key)
        _, _, explanation = await consensus_engine.run_consensus(
            adjusted_weights,
            expected_returns,
            cov_matrix,
            metrics.model_dump(),
            input_data.risk_profile,
            list(adjusted_weights.keys()),
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

        logger.info(f"Portfolio generated with {len(allocation)} holdings - Debate consensus: {debate_consensus.consensus_strength:.0%}")

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