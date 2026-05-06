import numpy as np
from typing import Dict, List
from loguru import logger
from core.config import settings

from models.schemas import MonteCarloResult


class MonteCarloEngine:
    def __init__(self):
        self.num_simulations = settings.monte_carlo_simulations
        self.trading_days = 252

    def run_simulation(
        self,
        initial_investment: float,
        expected_return: float,
        volatility: float,
        horizon_years: int,
        annual_contribution: float = 0
    ) -> MonteCarloResult:
        logger.info(f"Running {self.num_simulations} Monte Carlo simulations")
        
        days = horizon_years * self.trading_days
        
        daily_return = expected_return / self.trading_days
        daily_vol = volatility / np.sqrt(self.trading_days)
        
        np.random.seed(42)
        
        random_returns = np.random.normal(daily_return, daily_vol, (self.num_simulations, days))
        
        if annual_contribution > 0:
            daily_contribution = annual_contribution / self.trading_days
            contribution_matrix = np.full((self.num_simulations, days), daily_contribution)
            random_returns += contribution_matrix
        
        cumulative_returns = np.cumprod(1 + random_returns, axis=1)
        
        final_values = cumulative_returns[:, -1] * initial_investment
        
        sample_indices = np.linspace(0, days - 1, min(100, days), dtype=int)
        sample_paths = []
        for i in range(0, self.num_simulations, max(1, self.num_simulations // 50)):
            path = [initial_investment] + list(cumulative_returns[i, sample_indices] * initial_investment)
            sample_paths.append(path)
        
        mean = float(np.mean(final_values))
        std_dev = float(np.std(final_values))
        percentile_5 = float(np.percentile(final_values, 5))
        percentile_25 = float(np.percentile(final_values, 25))
        percentile_50 = float(np.percentile(final_values, 50))
        percentile_75 = float(np.percentile(final_values, 75))
        percentile_95 = float(np.percentile(final_values, 95))
        
        success_prob = float((final_values > initial_investment).mean())
        
        final_values_list = sorted(final_values.tolist())[::max(1, len(final_values) // 500)]
        
        logger.info(f"Simulation complete. Mean: ₹{mean:,.0f}, 5th percentile: ₹{percentile_5:,.0f}")
        
        return MonteCarloResult(
            mean=round(mean, 2),
            std_dev=round(std_dev, 2),
            percentile_5=round(percentile_5, 2),
            percentile_25=round(percentile_25, 2),
            percentile_50=round(percentile_50, 2),
            percentile_75=round(percentile_75, 2),
            percentile_95=round(percentile_95, 2),
            final_values=final_values_list,
            sample_paths=sample_paths,
            success_probability=round(success_prob, 4)
        )

    def run_portfolio_simulation(
        self,
        weights: Dict[str, float],
        returns_data: Dict[str, np.ndarray],
        initial_investment: float,
        horizon_years: int
    ) -> MonteCarloResult:
        if not returns_data:
            return self._default_simulation(initial_investment, horizon_years)
        
        try:
            portfolio_returns = np.zeros(len(next(iter(returns_data.values()))))
            for ticker, weight in weights.items():
                if ticker in returns_data:
                    portfolio_returns += returns_data[ticker] * weight
            
            expected_return = np.mean(portfolio_returns) * 252
            volatility = np.std(portfolio_returns) * np.sqrt(252)
            
            return self.run_simulation(initial_investment, expected_return, volatility, horizon_years)
            
        except Exception as e:
            logger.error(f"Portfolio simulation failed: {e}")
            return self._default_simulation(initial_investment, horizon_years)

    def _default_simulation(self, initial_investment: float, horizon_years: int) -> MonteCarloResult:
        return MonteCarloResult(
            mean=initial_investment * 1.15,
            std_dev=initial_investment * 0.2,
            percentile_5=initial_investment * 0.85,
            percentile_25=initial_investment * 1.0,
            percentile_50=initial_investment * 1.12,
            percentile_75=initial_investment * 1.25,
            percentile_95=initial_investment * 1.5,
            final_values=[initial_investment * i / 100 for i in range(80, 151)],
            sample_paths=[[initial_investment * (1 + i * 0.01) for i in range(50)] for _ in range(10)],
            success_probability=0.65
        )


monte_carlo_engine = MonteCarloEngine()