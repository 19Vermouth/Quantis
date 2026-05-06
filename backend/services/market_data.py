import yfinance as yf
import httpx
import pandas as pd
import numpy as np
from typing import Optional, Dict, List, Tuple
from datetime import datetime, timedelta
from loguru import logger
from core.config import settings
import asyncio


class MarketDataService:
    def __init__(self):
        self.cache: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
        self.cache_ttl = settings.cache_ttl
        
        self.tickers = {
            "NIFTYBEES.NS": "Nifty Bees (NSE)",
            "GOLDBEES.NS": "Gold Bees",
            "LIQUIDBEES.NS": "Liquid Bees",
            "RELIANCE.NS": "Reliance Industries",
            "INFY.NS": "Infosys",
            "TCS.NS": "TCS",
            "HDFCBANK.NS": "HDFC Bank",
            "ICICIBANK.NS": "ICICI Bank",
            "TATAMOTORS.NS": "Tata Motors",
            "^NSEI": "Nifty 50 Index"
        }
        
        self.asset_class_map = {
            "NIFTYBEES.NS": "Equity Index",
            "GOLDBEES.NS": "Gold",
            "LIQUIDBEES.NS": "Money Market",
            "RELIANCE.NS": "Equity",
            "INFY.NS": "Equity",
            "TCS.NS": "Equity",
            "HDFCBANK.NS": "Equity",
            "ICICIBANK.NS": "Equity",
            "TATAMOTORS.NS": "Equity"
        }

    def _is_cache_valid(self, key: str) -> bool:
        if key not in self.cache:
            return False
        _, timestamp = self.cache[key]
        return (datetime.now() - timestamp).total_seconds() < self.cache_ttl

    async def fetch_historical_data(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        cache_key = f"{ticker}_{period}"
        
        if self._is_cache_valid(cache_key):
            logger.info(f"Using cached data for {ticker}")
            return self.cache[cache_key][0]
        
        try:
            logger.info(f"Fetching historical data for {ticker}")
            await asyncio.sleep(0.1)
            
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            
            if df.empty:
                logger.warning(f"No data returned for {ticker}")
                return None
            
            df = df.dropna()
            self.cache[cache_key] = (df, datetime.now())
            logger.info(f"Successfully fetched {len(df)} records for {ticker}")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return await self._fetch_fallback(ticker, period)

    async def _fetch_fallback(self, ticker: str, period: str) -> Optional[pd.DataFrame]:
        if not settings.alpha_vantage_key:
            logger.warning("No Alpha Vantage key configured")
            return None
        
        try:
            symbol = ticker.replace(".NS", "")
            url = f"https://www.alphavantage.co/query"
            params = {
                "function": "TIME_SERIES_DAILY",
                "symbol": symbol,
                "outputsize": "compact",
                "apikey": settings.alpha_vantage_key
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                if "Time Series (Daily)" not in data:
                    logger.warning(f"Alpha Vantage no data for {ticker}")
                    return None
                
                ts = data["Time Series (Daily)"]
                records = []
                for date, values in ts.items():
                    records.append({
                        "Date": date,
                        "Open": float(values["1. open"]),
                        "High": float(values["2. high"]),
                        "Low": float(values["3. low"]),
                        "Close": float(values["4. close"]),
                        "Volume": int(values["5. volume"])
                    })
                
                df = pd.DataFrame(records)
                df["Date"] = pd.to_datetime(df["Date"])
                df = df.set_index("Date").sort_index()
                return df
                
        except Exception as e:
            logger.error(f"Alpha Vantage fallback failed for {ticker}: {e}")
            return None

    async def fetch_all_data(self) -> Dict[str, pd.DataFrame]:
        results = {}
        tasks = [self.fetch_historical_data(ticker) for ticker in self.tickers.keys()]
        dataframes = await asyncio.gather(*tasks)
        
        for ticker, df in zip(self.tickers.keys(), dataframes):
            if df is not None:
                results[ticker] = df
        
        return results

    def calculate_returns(self, df: pd.DataFrame) -> pd.Series:
        return np.log(df["Close"] / df["Close"].shift(1)).dropna()

    def calculate_covariance_matrix(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                returns_dict[ticker] = self.calculate_returns(df)
        
        returns_df = pd.DataFrame(returns_dict)
        return returns_df.cov()

    def calculate_correlation_matrix(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                returns_dict[ticker] = self.calculate_returns(df)
        
        returns_df = pd.DataFrame(returns_dict)
        return returns_df.corr()

    def get_expected_returns(self, data: Dict[str, pd.DataFrame]) -> pd.Series:
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                daily_returns = self.calculate_returns(df)
                annual_return = daily_returns.mean() * 252
                returns_dict[ticker] = annual_return
        
        return pd.Series(returns_dict)

    def get_volatility(self, data: Dict[str, pd.DataFrame]) -> pd.Series:
        vol_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                daily_returns = self.calculate_returns(df)
                annual_vol = daily_returns.std() * np.sqrt(252)
                vol_dict[ticker] = annual_vol
        
        return pd.Series(vol_dict)

    def get_ticker_name(self, ticker: str) -> str:
        return self.tickers.get(ticker, ticker)

    def get_asset_class(self, ticker: str) -> str:
        return self.asset_class_map.get(ticker, "Unknown")

    async def get_live_price(self, ticker: str) -> Optional[float]:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            return info.get("currentPrice") or info.get("regularMarketPreviousClose")
        except Exception as e:
            logger.error(f"Error fetching live price for {ticker}: {e}")
            return None


market_data_service = MarketDataService()