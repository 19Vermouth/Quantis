import pandas as pd
import numpy as np
from pypfopt import EfficientFrontier, risk_models, expected_returns
from typing import Dict, List, Optional
from loguru import logger
from core.config import settings

from models.schemas import RiskProfile


class PortfolioOptimizer:
    def __init__(self):
        self.risk_free_rate = settings.risk_free_rate
        
        self.risk_profile_constraints = {
            RiskProfile.CONSERVATIVE: {
                "max_volatility": 0.12,
                "min_equity_weight": 0.2,
                "max_equity_weight": 0.5,
                "min_gold_weight": 0.2,
                "min_liquid_weight": 0.1,
            },
            RiskProfile.MODERATE: {
                "max_volatility": 0.18,
                "min_equity_weight": 0.4,
                "max_equity_weight": 0.7,
                "min_gold_weight": 0.1,
                "min_liquid_weight": 0.05,
            },
            RiskProfile.AGGRESSIVE: {
                "max_volatility": 0.25,
                "min_equity_weight": 0.6,
                "max_equity_weight": 0.9,
                "min_gold_weight": 0.05,
                "min_liquid_weight": 0.0,
            },
        }

    def optimize_portfolio(
        self,
        expected_returns: pd.Series,
        cov_matrix: pd.DataFrame,
        risk_profile: RiskProfile,
        constraints: Optional[Dict] = None
    ) -> Dict[str, float]:
        try:
            logger.info(f"Optimizing portfolio for {risk_profile.value} profile")
            
            ef = EfficientFrontier(expected_returns, cov_matrix)
            
            constraints = constraints or {}
            profile_constraints = self.risk_profile_constraints.get(risk_profile, {})
            profile_constraints.update(constraints)
            
            ef.add_constraint(lambda w: w.sum() == 1)
            ef.add_constraint(lambda w: w >= 0)
            
            if "max_volatility" in profile_constraints:
                ef.add_constraint(
                    lambda w: risk_models.portfolio_volatility(w, cov_matrix) <= profile_constraints["max_volatility"]
                )
            
            weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)
            
            cleaned_weights = ef.clean_weights()
            
            result = {ticker: float(weight) for ticker, weight in cleaned_weights.items() if weight > 0.001}
            
            logger.info(f"Optimization complete. Generated {len(result)} allocations")
            return result
            
        except Exception as e:
            logger.error(f"Portfolio optimization failed: {e}")
            return self._fallback_allocation(risk_profile)

    def _fallback_allocation(self, risk_profile: RiskProfile) -> Dict[str, float]:
        fallback_allocations = {
            RiskProfile.CONSERVATIVE: {
                "NIFTYBEES.NS": 0.25,
                "GOLDBEES.NS": 0.35,
                "LIQUIDBEES.NS": 0.20,
                "HDFCBANK.NS": 0.10,
                "INFY.NS": 0.10,
            },
            RiskProfile.MODERATE: {
                "NIFTYBEES.NS": 0.30,
                "GOLDBEES.NS": 0.15,
                "LIQUIDBEES.NS": 0.10,
                "RELIANCE.NS": 0.15,
                "TCS.NS": 0.10,
                "HDFCBANK.NS": 0.10,
                "INFY.NS": 0.10,
            },
            RiskProfile.AGGRESSIVE: {
                "NIFTYBEES.NS": 0.25,
                "RELIANCE.NS": 0.20,
                "TCS.NS": 0.15,
                "HDFCBANK.NS": 0.15,
                "INFY.NS": 0.15,
                "TATAMOTORS.NS": 0.10,
            },
        }
        
        return fallback_allocations.get(risk_profile, fallback_allocations[RiskProfile.MODERATE])

    def apply_agent_adjustments(
        self,
        weights: Dict[str, float],
        adjustments: Dict[str, float]
    ) -> Dict[str, float]:
        adjusted = weights.copy()
        
        for ticker, adjustment in adjustments.items():
            if ticker in adjusted:
                adjusted[ticker] = max(0, adjusted[ticker] + adjustment)
        
        total = sum(adjusted.values())
        if total > 0:
            adjusted = {k: v / total for k, v in adjusted.items()}
        
        return adjusted


portfolio_optimizer = PortfolioOptimizer()