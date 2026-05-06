import json
import asyncio
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from loguru import logger
from enum import Enum

from services.llm_client import llm_client
from core.config import settings


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class AgentRecommendation(BaseModel):
    ticker: str
    action: str = Field(description="buy/sell/hold/overweight/underweight")
    weight_adjustment: float = Field(description="Adjustment from -0.1 to +0.1")
    confidence: float = Field(ge=0, le=1)
    reasoning: str


class AgentOutput(BaseModel):
    agent_name: str
    recommendations: List[AgentRecommendation]
    summary: str
    confidence: float
    concerns: List[str]


class DebateContext(BaseModel):
    risk_profile: str
    investment_amount: float
    horizon_years: int
    current_allocation: Dict[str, float]
    metrics_summary: Dict[str, float]
    top_holdings: List[str]
    available_assets: List[str]


def build_context_summary(ctx: DebateContext) -> str:
    """Minimal context summary for agents"""
    holdings = ", ".join([f"{t}:{w:.1%}" for t, w in list(ctx.current_allocation.items())[:5]])
    metrics = f"Return:{ctx.metrics_summary.get('expected_return', 0):.1%}, Vol:{ctx.metrics_summary.get('volatility', 0):.1%}, Sharpe:{ctx.metrics_summary.get('sharpe_ratio', 0):.2f}, DD:{ctx.metrics_summary.get('max_drawdown', 0):.1%}"
    return f"Profile:{ctx.risk_profile}, ₹{ctx.investment_amount:,}, {ctx.horizon_years}y | Holdings:{holdings} | Metrics:{metrics}"


AGGRESSIVE_SYSTEM = """You are an Aggressive Growth Agent. Your goal is to maximize portfolio growth.

Return ONLY valid JSON with this exact schema:
{
  "recommendations": [{"ticker": "RELIANCE.NS", "action": "overweight", "weight_adjustment": 0.05, "confidence": 0.8, "reasoning": "..."}],
  "summary": "1-2 sentence summary",
  "concerns": ["concern1", "concern2"]
}

Focus on:
- High-beta stocks for momentum
- Growth-oriented allocation
- High conviction opportunities
- Keep reasoning concise"""


AGGRESSIVE_USER = """Context: {context}

Available assets: {assets}

Provide allocation recommendations focusing on growth. Consider current weights but recommend overweight/underweight adjustments."""


HISTORICAL_SYSTEM = """You are a Historical Performance Agent. Your goal is to evaluate assets based on historical drawdowns and regime performance.

Return ONLY valid JSON with this exact schema:
{
  "recommendations": [{"ticker": "RELIANCE.NS", "action": "hold", "weight_adjustment": 0.0, "confidence": 0.7, "reasoning": "..."}],
  "summary": "1-2 sentence summary",
  "concerns": ["concern1"]
}

Focus on:
- Historical max drawdown behavior
- Performance across market regimes (bull/bear/sideways)
- Drawdown recovery patterns
- Keep reasoning concise"""


HISTORICAL_USER = """Context: {context}

Assets to evaluate: {assets}

Analyze historical drawdown risk and regime performance. Recommend adjustments."""


RISK_SYSTEM = """You are a Risk Management Agent. Your goal is to enforce volatility, VaR, and diversification constraints.

Return ONLY valid JSON with this exact schema:
{
  "recommendations": [{"ticker": "RELIANCE.NS", "action": "underweight", "weight_adjustment": -0.03, "confidence": 0.75, "reasoning": "..."}],
  "summary": "1-2 sentence summary",
  "concerns": ["concern1", "concern2"]
}

Focus on:
- Volatility constraints
- VaR limits
- Concentration risk
- Asset class diversification
- Correlation reduction
- Keep reasoning concise"""


RISK_USER = """Context: {context}

Available assets: {assets}

Current metrics: expected_return={er:.1%}, volatility={vol:.1%}, var_95={var:.1%}, max_dd={dd:.1%}

Enforce risk constraints. Recommend underweight for risky assets."""


async def run_aggressive_agent(ctx: DebateContext) -> AgentOutput:
    """Aggressive Growth Agent - maximize returns"""
    logger.info("Running Aggressive Agent")

    if not llm_client.client:
        return _fallback_aggressive(ctx)

    context = build_context_summary(ctx)
    assets = ", ".join(ctx.available_assets)

    try:
        result = await llm_client.generate(
            system_prompt=AGGRESSIVE_SYSTEM,
            user_prompt=AGGRESSIVE_USER.format(context=context, assets=assets)
        )

        if result.get("fallback"):
            return _fallback_aggressive(ctx)

        return AgentOutput(
            agent_name="Aggressive Agent",
            recommendations=[AgentRecommendation(**r) for r in result.get("recommendations", [])],
            summary=result.get("summary", ""),
            confidence=result.get("confidence", 0.6),
            concerns=result.get("concerns", [])
        )
    except Exception as e:
        logger.error(f"Aggressive agent error: {e}")
        return _fallback_aggressive(ctx)


async def run_historical_agent(ctx: DebateContext) -> AgentOutput:
    """Historical Performance Agent - evaluate drawdowns"""
    logger.info("Running Historical Agent")

    if not llm_client.client:
        return _fallback_historical(ctx)

    context = build_context_summary(ctx)
    assets = ", ".join(ctx.available_assets)

    try:
        result = await llm_client.generate(
            system_prompt=HISTORICAL_SYSTEM,
            user_prompt=HISTORICAL_USER.format(context=context, assets=assets)
        )

        if result.get("fallback"):
            return _fallback_historical(ctx)

        return AgentOutput(
            agent_name="Historical Agent",
            recommendations=[AgentRecommendation(**r) for r in result.get("recommendations", [])],
            summary=result.get("summary", ""),
            confidence=result.get("confidence", 0.6),
            concerns=result.get("concerns", [])
        )
    except Exception as e:
        logger.error(f"Historical agent error: {e}")
        return _fallback_historical(ctx)


async def run_risk_agent(ctx: DebateContext) -> AgentOutput:
    """Risk Management Agent - enforce constraints"""
    logger.info("Running Risk Agent")

    if not llm_client.client:
        return _fallback_risk(ctx)

    context = build_context_summary(ctx)
    assets = ", ".join(ctx.available_assets)
    m = ctx.metrics_summary

    try:
        result = await llm_client.generate(
            system_prompt=RISK_SYSTEM,
            user_prompt=RISK_USER.format(context=context, assets=assets, er=m.get("expected_return", 0), vol=m.get("volatility", 0), var=m.get("var_95", 0), dd=m.get("max_drawdown", 0))
        )

        if result.get("fallback"):
            return _fallback_risk(ctx)

        return AgentOutput(
            agent_name="Risk Agent",
            recommendations=[AgentRecommendation(**r) for r in result.get("recommendations", [])],
            summary=result.get("summary", ""),
            confidence=result.get("confidence", 0.6),
            concerns=result.get("concerns", [])
        )
    except Exception as e:
        logger.error(f"Risk agent error: {e}")
        return _fallback_risk(ctx)


def _fallback_aggressive(ctx: DebateContext) -> AgentOutput:
    return AgentOutput(
        agent_name="Aggressive Agent",
        recommendations=[
            AgentRecommendation(ticker="RELIANCE.NS", action="overweight", weight_adjustment=0.03, confidence=0.7, reasoning="Growth recommendation"),
            AgentRecommendation(ticker="TATAMOTORS.NS", action="overweight", weight_adjustment=0.02, confidence=0.65, reasoning="Recovery potential"),
        ],
        summary="Prefer high-growth equities with momentum",
        confidence=0.6,
        concerns=["High volatility exposure"]
    )


def _fallback_historical(ctx: DebateContext) -> AgentOutput:
    return AgentOutput(
        agent_name="Historical Agent",
        recommendations=[
            AgentRecommendation(ticker="NIFTYBEES.NS", action="hold", weight_adjustment=0.0, confidence=0.7, reasoning="Index resilience"),
            AgentRecommendation(ticker="GOLDBEES.NS", action="hold", weight_adjustment=0.0, confidence=0.65, reasoning="Diversifier"),
        ],
        summary="Prefer index and gold for drawdown protection",
        confidence=0.6,
        concerns=["Avoid high drawdown assets"]
    )


def _fallback_risk(ctx: DebateContext) -> AgentOutput:
    m = ctx.metrics_summary
    concerns = []
    if m.get("max_drawdown", 0) > 0.2:
        concerns.append("Excessive max drawdown")
    if m.get("volatility", 0) > 0.2:
        concerns.append("High volatility")
    if len(ctx.current_allocation) < 5:
        concerns.append("Insufficient diversification")

    return AgentOutput(
        agent_name="Risk Agent",
        recommendations=[
            AgentRecommendation(ticker="GOLDBEES.NS", action="overweight", weight_adjustment=0.02, confidence=0.75, reasoning="Risk diversifier"),
        ],
        summary="Enforce diversification and risk limits",
        confidence=0.7,
        concerns=concerns
    )


class ConsensusResult(BaseModel):
    adjusted_weights: Dict[str, float]
    final_summary: str
    disagreements: List[Dict[str, str]]
    consensus_strength: float


def run_consensus(
    initial_weights: Dict[str, float],
    aggressive: AgentOutput,
    historical: AgentOutput,
    risk: AgentOutput
) -> ConsensusResult:
    """Compare agent outputs and produce final allocation"""
    logger.info("Running consensus engine")

    adjustments = {}
    disagreements = []

    all_recs = {
        "Aggressive": aggressive.recommendations,
        "Historical": historical.recommendations,
        "Risk": risk.recommendations
    }

    ticker_recs = {}
    for agent_name, recs in all_recs.items():
        for r in recs:
            if r.ticker not in ticker_recs:
                ticker_recs[r.ticker] = {}
            ticker_recs[r.ticker][agent_name] = r

    for ticker, recs in ticker_recs.items():
        total_adj = 0
        agents_agree = len(recs) > 0

        for agent_name, rec in recs.items():
            total_adj += rec.weight_adjustment

            if len(recs) > 1:
                actions = [r.action for r in recs.values()]
                if len(set(actions)) > 1:
                    disagreements.append({
                        "ticker": ticker,
                        "agents": ", ".join(recs.keys()),
                        "conflict": f"{list(recs.values())[0].action} vs {list(recs.values())[1].action}"
                    })

        adjustments[ticker] = total_adj / len(recs) if recs else 0

    adjusted = initial_weights.copy()
    for ticker, adj in adjustments.items():
        if ticker in adjusted:
            adjusted[ticker] = max(0.01, adjusted[ticker] + adj)

    total = sum(adjusted.values())
    if total > 0:
        adjusted = {k: round(v / total, 4) for k, v in adjusted.items()}

    avg_confidence = (aggressive.confidence + historical.confidence + risk.confidence) / 3

    return ConsensusResult(
        adjusted_weights=adjusted,
        final_summary=f"Consensus: Aggressive ({aggressive.confidence:.0%}), Historical ({historical.confidence:.0%}), Risk ({risk.confidence:.0%})",
        disagreements=disagreements[:5],
        consensus_strength=avg_confidence
    )


async def run_debate_flow(
    current_weights: Dict[str, float],
    metrics: Dict[str, float],
    risk_profile: str,
    investment_amount: float,
    horizon_years: int,
    available_assets: List[str]
) -> tuple[ConsensusResult, List[AgentOutput]]:
    """Run single-round debate using LangGraph-style orchestration"""
    logger.info("Starting debate flow")

    ctx = DebateContext(
        risk_profile=risk_profile,
        investment_amount=investment_amount,
        horizon_years=horizon_years,
        current_allocation=current_weights,
        metrics_summary=metrics,
        top_holdings=list(current_weights.keys())[:5],
        available_assets=available_assets
    )

    aggressive, historical, risk = await asyncio.gather(
        run_aggressive_agent(ctx),
        run_historical_agent(ctx),
        run_risk_agent(ctx)
    )

    agents = [aggressive, historical, risk]

    consensus = run_consensus(current_weights, aggressive, historical, risk)

    return consensus, agents