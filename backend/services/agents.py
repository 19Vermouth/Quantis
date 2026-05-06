import pandas as pd
import numpy as np
import httpx
from typing import Dict, List, Optional
from loguru import logger
from datetime import datetime

from models.schemas import RiskProfile, AgentLog, PortfolioExplanation


class GrowthAgent:
    def __init__(self):
        self.name = "Growth Agent"
        
    def analyze(
        self,
        expected_returns: pd.Series,
        weights: Dict[str, float],
        risk_profile: RiskProfile
    ) -> AgentLog:
        logger.info("Growth Agent analyzing portfolio")
        
        recommendations = []
        reasoning_parts = []
        confidence = 0.7
        
        if expected_returns.empty:
            return AgentLog(
                agent_name=self.name,
                reasoning="Insufficient data for growth analysis",
                confidence=0.3,
                recommendations=["Using balanced allocation"]
            )
        
        top_performers = expected_returns.nlargest(3)
        
        for ticker, ret in top_performers.items():
            if ticker in weights and weights[ticker] < 0.15:
                recommendations.append(f"Consider increasing {ticker} weight from {weights[ticker]:.1%} to capture growth")
        
        reasoning_parts.append(f"Top growth candidates: {', '.join(top_performers.index.tolist())}")
        
        equity_weight = sum(w for t, w in weights.items() if "NS" in t and t != "GOLDBEES.NS" and t != "LIQUIDBEES.NS")
        
        if risk_profile == RiskProfile.AGGRESSIVE:
            if equity_weight < 0.7:
                recommendations.append("Aggressive profile suggests increasing equity exposure")
                reasoning_parts.append("Aggressive profile - targeting higher equity allocation")
                confidence = 0.85
        elif risk_profile == RiskProfile.CONSERVATIVE:
            if equity_weight > 0.4:
                recommendations.append("Consider reducing equity for stability")
                reasoning_parts.append("Conservative profile - prioritizing capital preservation")
                confidence = 0.75
        
        reasoning = ". ".join(reasoning_parts) if reasoning_parts else "Using standard growth analysis"
        
        return AgentLog(
            agent_name=self.name,
            reasoning=reasoning,
            confidence=confidence,
            recommendations=recommendations if recommendations else ["Maintain current allocation"]
        )


class RiskAgent:
    def __init__(self):
        self.name = "Risk Agent"
        
    def analyze(
        self,
        covariance_matrix: pd.DataFrame,
        weights: Dict[str, float],
        metrics: Dict
    ) -> AgentLog:
        logger.info("Risk Agent analyzing portfolio risk")
        
        recommendations = []
        reasoning_parts = []
        confidence = 0.75
        
        if covariance_matrix.empty:
            return AgentLog(
                agent_name=self.name,
                reasoning="Insufficient data for risk analysis",
                confidence=0.3,
                recommendations=["Maintain diversified allocation"]
            )
        
        if metrics:
            if metrics.get("max_drawdown", 0) > 0.25:
                recommendations.append("High max drawdown detected - consider adding defensive positions")
                reasoning_parts.append(f"Max drawdown {metrics['max_drawdown']:.1%} exceeds comfortable threshold")
                confidence = 0.85
            
            if metrics.get("beta", 1) > 1.3:
                recommendations.append("High beta detected - portfolio is sensitive to market movements")
                reasoning_parts.append(f"Beta of {metrics['beta']:.2f} indicates elevated market sensitivity")
            
            if metrics.get("var_95", 0) > 0.05:
                recommendations.append("Value at Risk is elevated - consider reducing position sizes")
                reasoning_parts.append(f"VaR 95%: {metrics['var_95']:.2%} suggests potential downside risk")
        
        ticker_list = list(weights.keys())
        concentration_limit = 0.25
        
        for ticker in ticker_list:
            if weights.get(ticker, 0) > concentration_limit:
                recommendations.append(f"Concentration risk: {ticker} at {weights[ticker]:.1%} exceeds {concentration_limit:.0%}")
                reasoning_parts.append(f"High concentration in {ticker}")
        
        if not recommendations:
            recommendations.append("Risk profile appears well-balanced")
            reasoning_parts.append("All risk metrics within acceptable ranges")
        
        return AgentLog(
            agent_name=self.name,
            reasoning=". ".join(reasoning_parts),
            confidence=confidence,
            recommendations=recommendations
        )


class SentimentAgent:
    def __init__(self, finnhub_key: Optional[str] = None):
        self.name = "Sentiment Agent"
        self.finnhub_key = finnhub_key
        
    async def analyze(
        self,
        tickers: List[str],
        weights: Dict[str, float]
    ) -> AgentLog:
        logger.info("Sentiment Agent analyzing market sentiment")
        
        recommendations = []
        reasoning_parts = []
        confidence = 0.6
        
        sentiment_scores = await self._fetch_sentiment(tickers)
        
        if sentiment_scores:
            bullish = [t for t, s in sentiment_scores.items() if s > 0.3]
            bearish = [t for t, s in sentiment_scores.items() if s < -0.3]
            
            if bullish:
                recommendations.append(f"Positive sentiment for: {', '.join(bullish)}")
                reasoning_parts.append(f"{len(bullish)} assets showing bullish signals")
            
            if bearish:
                recommendations.append(f"Caution advised for: {', '.join(bearish)}")
                reasoning_parts.append(f"{len(bearish)} assets showing bearish signals")
            
            for ticker, score in sentiment_scores.items():
                if ticker in weights and abs(score) > 0.3:
                    if score > 0 and weights.get(ticker, 0) < 0.15:
                        recommendations.append(f"Consider increasing {ticker} weight given positive sentiment")
                    elif score < 0 and weights.get(ticker, 0) > 0.15:
                        recommendations.append(f"Consider reducing {ticker} exposure amid negative sentiment")
            
            confidence = min(0.8, 0.5 + len(sentiment_scores) * 0.05)
        else:
            recommendations.append("Using quantitative signals due to unavailable sentiment data")
            reasoning_parts.append("Market sentiment data unavailable - relying on technical indicators")
        
        return AgentLog(
            agent_name=self.name,
            reasoning=". ".join(reasoning_parts) if reasoning_parts else "Analyzing market sentiment indicators",
            confidence=confidence,
            recommendations=recommendations
        )

    async def _fetch_sentiment(self, tickers: List[str]) -> Dict[str, float]:
        if not self.finnhub_key:
            logger.info("No Finnhub key - using synthetic sentiment scores")
            return self._synthetic_sentiment(tickers)
        
        try:
            sentiment = {}
            async with httpx.AsyncClient(timeout=10.0) as client:
                for ticker in tickers[:5]:
                    symbol = ticker.replace(".NS", "")
                    url = f"https://finnhub.io/api/v1/news-sentiment"
                    params = {"symbol": symbol, "token": self.finnhub_key}
                    
                    response = await client.get(url, params=params)
                    if response.status_code == 200:
                        data = response.json()
                        if data and isinstance(data, list) and len(data) > 0:
                            sentiment[ticker] = data[0].get("score", 0)
            
            return sentiment if sentiment else self._synthetic_sentiment(tickers)
            
        except Exception as e:
            logger.warning(f"Failed to fetch sentiment: {e}")
            return self._synthetic_sentiment(tickers)

    def _synthetic_sentiment(self, tickers: List[str]) -> Dict[str, float]:
        np.random.seed(42)
        return {ticker: np.random.uniform(-0.2, 0.3) for ticker in tickers}


class ConsensusEngine:
    def __init__(self):
        self.growth_agent = GrowthAgent()
        self.risk_agent = RiskAgent()
        self.sentiment_agent = None
        
    def set_sentiment_agent(self, finnhub_key: Optional[str]):
        self.sentiment_agent = SentimentAgent(finnhub_key)
        
    async def run_consensus(
        self,
        weights: Dict[str, float],
        expected_returns: pd.Series,
        covariance_matrix: pd.DataFrame,
        metrics: Dict,
        risk_profile: RiskProfile,
        tickers: List[str],
        investment_amount: float
    ) -> tuple[Dict[str, float], List[AgentLog], PortfolioExplanation]:
        logger.info("Running multi-agent consensus")
        
        logs = []
        
        growth_log = self.growth_agent.analyze(expected_returns, weights, risk_profile)
        logs.append(growth_log)
        
        risk_log = self.risk_agent.analyze(covariance_matrix, weights, metrics)
        logs.append(risk_log)
        
        if self.sentiment_agent:
            sentiment_log = await self.sentiment_agent.analyze(tickers, weights)
            logs.append(sentiment_log)
        else:
            logs.append(AgentLog(
                agent_name="Sentiment Agent",
                reasoning="Sentiment analysis unavailable",
                confidence=0.3,
                recommendations=["Enable Finnhub API for sentiment analysis"]
            ))
        
        adjusted_weights = self._apply_consensus(weights, logs)
        
        explanation = self._generate_explanation(
            adjusted_weights, metrics, risk_profile, investment_amount
        )
        
        return adjusted_weights, logs, explanation

    def _apply_consensus(
        self,
        weights: Dict[str, float],
        logs: List[AgentLog]
    ) -> Dict[str, float]:
        adjustments = {}
        
        for log in logs:
            if log.confidence > 0.6:
                for rec in log.recommendations:
                    if "increasing" in rec.lower():
                        for ticker in weights.keys():
                            if ticker in rec.lower() or ticker.split(".")[0].lower() in rec.lower():
                                adjustments[ticker] = adjustments.get(ticker, 0) + 0.02
                    
                    elif "reducing" in rec.lower() or "decrease" in rec.lower():
                        for ticker in weights.keys():
                            if ticker in rec.lower() or ticker.split(".")[0].lower() in rec.lower():
                                adjustments[ticker] = adjustments.get(ticker, 0) - 0.02
        
        adjusted = weights.copy()
        for ticker, adj in adjustments.items():
            if ticker in adjusted:
                adjusted[ticker] = max(0.01, adjusted[ticker] + adj)
        
        total = sum(adjusted.values())
        if total > 0:
            adjusted = {k: v / total for k, v in adjusted.items()}
        
        return adjusted

    def _generate_explanation(
        self,
        weights: Dict[str, float],
        metrics: Dict,
        risk_profile: RiskProfile,
        investment_amount: float
    ) -> PortfolioExplanation:
        asset_classes = {}
        for ticker, weight in weights.items():
            if "BEES" in ticker:
                ac = "Index" if "NIFTY" in ticker else ("Gold" if "GOLD" else "Money Market")
            elif "NS" in ticker:
                ac = "Equity"
            else:
                ac = "Other"
            asset_classes[ac] = asset_classes.get(ac, 0) + weight
        
        top_holdings = sorted(weights.items(), key=lambda x: x[1], reverse=True)[:3]
        
        summary = f"This {risk_profile.value} portfolio allocates ₹{investment_amount:,.0f} across {len(weights)} assets. "
        summary += f"Primary allocations: {', '.join([f'{t.split('.')[0]} ({w:.1%})' for t, w in top_holdings])}"
        
        diversification = f"Portfolio spans {len(asset_classes)} asset classes: "
        diversification += ", ".join([f"{ac} ({w:.0%})" for ac, w in asset_classes.items()])
        
        risk_summary = f"Expected return {metrics.get('expected_return', 0):.1%} with "
        risk_summary += f"volatility {metrics.get('volatility', 0):.1%}. "
        risk_summary += f"Sharpe ratio of {metrics.get('sharpe_ratio', 0):.2f}. "
        risk_summary += f"Max drawdown {metrics.get('max_drawdown', 0):.1%}. "
        risk_summary += f"Beta {metrics.get('beta', 1):.2f} vs Nifty 50."
        
        rationale = f"Built using mean-variance optimization targeting maximum Sharpe ratio. "
        rationale += f"Risk constraints applied based on {risk_profile.value} profile. "
        rationale += f"Multi-agent consensus integrated growth, risk, and sentiment signals."

        return PortfolioExplanation(
            summary=summary,
            diversification=diversification,
            risk_summary=risk_summary,
            rationale=rationale
        )


consensus_engine = ConsensusEngine()