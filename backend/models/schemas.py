from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class PortfolioInput(BaseModel):
    age: int = Field(..., ge=18, le=100, description="Investor age")
    risk_profile: RiskProfile = Field(..., description="Risk tolerance")
    investment_amount: float = Field(..., gt=0, description="Investment amount in INR")
    horizon_years: int = Field(..., ge=1, le=30, description="Investment horizon in years")
    constraints: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional portfolio constraints")

    @validator("investment_amount")
    def validate_amount(cls, v):
        if v < 1000:
            raise ValueError("Minimum investment amount is ₹1,000")
        return v


class AssetAllocation(BaseModel):
    ticker: str
    name: str
    weight: float = Field(..., ge=0, le=1)
    amount: float = Field(..., ge=0)
    asset_class: str


class PortfolioMetrics(BaseModel):
    expected_return: float
    volatility: float
    sharpe_ratio: float
    max_drawdown: float
    beta: float
    var_95: float
    probability_of_loss: float
    alpha: Optional[float] = None


class MonteCarloResult(BaseModel):
    mean: float
    std_dev: float
    percentile_5: float
    percentile_25: float
    percentile_50: float
    percentile_75: float
    percentile_95: float
    final_values: List[float]
    sample_paths: List[List[float]]
    success_probability: float


class AgentLog(BaseModel):
    agent_name: str
    reasoning: str
    confidence: float = Field(..., ge=0, le=1)
    recommendations: List[str]


class PortfolioExplanation(BaseModel):
    summary: str
    diversification: str
    risk_summary: str
    rationale: str


class PortfolioResponse(BaseModel):
    allocation: List[AssetAllocation]
    metrics: PortfolioMetrics
    monte_carlo: MonteCarloResult
    agent_logs: List[AgentLog]
    explanation: PortfolioExplanation
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class LiveQuote(BaseModel):
    symbol: str
    last_price: float
    change: float
    change_percent: float
    volume: int
    timestamp: str


class LiveMarketResponse(BaseModel):
    quotes: List[LiveQuote]
    timestamp: str


class UserCreate(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str