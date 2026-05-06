import pandas as pd
import numpy as np
from typing import Dict, List
from loguru import logger
from core.config import settings

from models.schemas import PortfolioMetrics


class RiskModel:
    def __init__(self):
        self.risk_free_rate = settings.risk_free_rate

    def calculate_metrics(
        self,
        weights: Dict[str, float],
        returns_data: Dict[str, pd.Series],
        benchmark_returns: pd.Series
    ) -> PortfolioMetrics:
        logger.info("Calculating portfolio risk metrics")
        
        if not returns_data or not weights:
            return self._default_metrics()
        
        try:
            portfolio_returns = self._calculate_portfolio_returns(weights, returns_data)
            
            expected_return = self._calculate_expected_return(portfolio_returns)
            volatility = self._calculate_volatility(portfolio_returns)
            sharpe = self._calculate_sharpe(expected_return, volatility)
            max_dd = self._calculate_max_drawdown(portfolio_returns)
            beta = self._calculate_beta(portfolio_returns, benchmark_returns)
            var_95 = self._calculate_var_95(portfolio_returns)
            prob_loss = self._calculate_probability_of_loss(portfolio_returns)
            alpha = self._calculate_alpha(expected_return, beta)
            
            return PortfolioMetrics(
                expected_return=round(expected_return, 4),
                volatility=round(volatility, 4),
                sharpe_ratio=round(sharpe, 4),
                max_drawdown=round(max_dd, 4),
                beta=round(beta, 4),
                var_95=round(var_95, 4),
                probability_of_loss=round(prob_loss, 4),
                alpha=round(alpha, 4) if alpha else None
            )
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return self._default_metrics()

    def _calculate_portfolio_returns(
        self,
        weights: Dict[str, float],
        returns_data: Dict[str, pd.Series]
    ) -> pd.Series:
        portfolio_returns = None
        
        for ticker, weight in weights.items():
            if ticker in returns_data and not returns_data[ticker].empty:
                asset_returns = returns_data[ticker]
                
                if portfolio_returns is None:
                    portfolio_returns = asset_returns * weight
                else:
                    portfolio_returns = portfolio_returns.add(asset_returns * weight, fill_value=0)
        
        if portfolio_returns is None:
            return pd.Series([0])
        
        return portfolio_returns.dropna()

    def _calculate_expected_return(self, returns: pd.Series) -> float:
        return returns.mean() * 252

    def _calculate_volatility(self, returns: pd.Series) -> float:
        return returns.std() * np.sqrt(252)

    def _calculate_sharpe(self, expected_return: float, volatility: float) -> float:
        if volatility == 0:
            return 0
        return (expected_return - self.risk_free_rate) / volatility

    def _calculate_max_drawdown(self, returns: pd.Series) -> float:
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.cummax()
        drawdown = (cumulative - running_max) / running_max
        return abs(drawdown.min())

    def _calculate_beta(self, portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> float:
        if benchmark_returns.empty or portfolio_returns.empty:
            return 1.0
        
        common_index = portfolio_returns.index.intersection(benchmark_returns.index)
        if len(common_index) < 10:
            return 1.0
        
        portfolio_aligned = portfolio_returns.loc[common_index]
        benchmark_aligned = benchmark_returns.loc[common_index]
        
        covariance = np.cov(portfolio_aligned, benchmark_aligned)[0][1]
        benchmark_variance = np.var(benchmark_aligned)
        
        if benchmark_variance == 0:
            return 1.0
        
        return covariance / benchmark_variance

    def _calculate_var_95(self, returns: pd.Series) -> float:
        if returns.empty:
            return 0
        return -np.percentile(returns, 5)

    def _calculate_probability_of_loss(self, returns: pd.Series) -> float:
        if returns.empty:
            return 0.5
        return (returns < 0).mean()

    def _calculate_alpha(self, expected_return: float, beta: float) -> float:
        return expected_return - (self.risk_free_rate + beta * (0.12 - self.risk_free_rate))

    def _default_metrics(self) -> PortfolioMetrics:
        return PortfolioMetrics(
            expected_return=0.10,
            volatility=0.15,
            sharpe_ratio=0.5,
            max_drawdown=0.20,
            beta=1.0,
            var_95=0.03,
            probability_of_loss=0.35,
            alpha=0.02
        )


risk_model = RiskModel()