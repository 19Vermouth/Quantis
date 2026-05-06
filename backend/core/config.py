from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    app_name: str = "Quantis"
    app_version: str = "1.0.0"
    
    # API Keys
    alpha_vantage_key: Optional[str] = os.getenv("ALPHA_VANTAGE_KEY", "")
    finnhub_key: Optional[str] = os.getenv("FINNHUB_KEY", "")
    shoonya_api_key: Optional[str] = os.getenv("SHOONYA_API_KEY", "")
    shoonya_user_id: Optional[str] = os.getenv("SHOONYA_USER_ID", "")
    shoonya_password: Optional[str] = os.getenv("SHOONYA_PASSWORD", "")
    shoonya_token: Optional[str] = os.getenv("SHOONYA_TOKEN", "")
    groq_api_key: Optional[str] = os.getenv("GROQ_API_KEY", "")
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Data settings
    cache_ttl: int = 300
    default_lookback_days: int = 365
    monte_carlo_simulations: int = 1000
    
    # Risk-free rate (India 10-year bond yield approx)
    risk_free_rate: float = 0.072
    
    class Config:
        env_file = ".env"


settings = Settings()