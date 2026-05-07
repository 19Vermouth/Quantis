import yfinance as yf
import httpx
import pandas as pd
import numpy as np
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
from loguru import logger
from core.config import settings
import asyncio
import time
import os
import hashlib


class CacheManager:
    """Hybrid cache: in-memory + persistent file-based"""
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        self.memory_cache: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
        self.memory_ttl = settings.cache_ttl  # 5 minutes default
        
        # Create cache directory
        os.makedirs(cache_dir, exist_ok=True)
    
    def _get_cache_path(self, ticker: str) -> str:
        """Get file path for ticker"""
        safe_name = ticker.replace("^", "").replace(".", "_")
        return os.path.join(self.cache_dir, f"{safe_name}.csv")
    
    def _is_memory_valid(self, key: str) -> bool:
        """Check in-memory cache validity"""
        if key not in self.memory_cache:
            return False
        _, timestamp = self.memory_cache[key]
        return (datetime.now() - timestamp).total_seconds() < self.memory_ttl
    
    def get(self, ticker: str) -> Optional[pd.DataFrame]:
        """Get from cache (memory first, then file)"""
        cache_key = ticker
        
        # Try memory first
        if self._is_memory_valid(cache_key):
            logger.info(f"Using memory cache for {ticker}")
            return self.memory_cache[cache_key][0]
        
        # Try persistent file
        cache_file = self._get_cache_path(ticker)
        if os.path.exists(cache_file):
            try:
                df = pd.read_csv(cache_file, index_col=0, parse_dates=True)
                # Validate file is not stale (>24 hours)
                if not df.empty:
                    last_date = df.index[-1]
                    if (datetime.now() - last_date).days < 1:
                        # Update memory cache
                        self.memory_cache[cache_key] = (df, datetime.now())
                        logger.info(f"Using file cache for {ticker} ({len(df)} rows)")
                        return df
            except Exception as e:
                logger.warning(f"Cache read error for {ticker}: {e}")
        
        return None
    
    def set(self, ticker: str, df: pd.DataFrame):
        """Save to both memory and file"""
        if df is None or df.empty:
            return
        
        cache_key = ticker
        
        # Save to memory
        self.memory_cache[cache_key] = (df, datetime.now())
        
        # Save to persistent file
        try:
            cache_file = self._get_cache_path(ticker)
            df.to_csv(cache_file)
            logger.info(f"Cached {ticker} to {cache_file} ({len(df)} rows)")
        except Exception as e:
            logger.warning(f"Cache write error for {ticker}: {e}")
    
    def get_last_date(self, ticker: str) -> Optional[datetime]:
        """Get last cached date for incremental updates"""
        df = self.get(ticker)
        if df is not None and not df.empty:
            return df.index[-1]
        return None


class IncrementalFetcher:
    """Fetch only new data since last cached date"""
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
        self.polygon_limiter = RateLimiter(5)
        self.alpha_limiter = RateLimiter(5)
    
    async def fetch_incremental(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """Fetch incremental data - only new points since last cache"""
        last_date = self.cache.get_last_date(ticker)
        
        # If no cache, do full fetch
        if last_date is None:
            return await self._fetch_full(ticker, period)
        
        # Calculate date range for new data only
        days_since = (datetime.now() - last_date).days
        
        # If cache is recent (<2 days), use cached data
        if days_since < 2:
            logger.info(f"Cache recent for {ticker}, using cached data")
            return self.cache.get(ticker)
        
        # Fetch new data from last cached date
        start_date = last_date + timedelta(days=1)
        end_date = datetime.now()
        
        if start_date >= end_date:
            logger.info(f"No new data needed for {ticker}")
            return self.cache.get(ticker)
        
        logger.info(f"Fetching incremental data for {ticker} from {start_date.date()}")
        
        # Try to get new data
        new_df = await self._fetch_range(ticker, start_date, end_date)
        
        if new_df is not None and not new_df.empty:
            # Merge with cached data
            cached_df = self.cache.get(ticker)
            if cached_df is not None and not cached_df.empty:
                # Combine, remove duplicates, sort
                combined = pd.concat([cached_df, new_df])
                combined = combined[~combined.index.duplicated(keep='last')]
                combined = combined.sort_index()
                merged_df = combined
            else:
                merged_df = new_df
            
            # Update cache
            self.cache.set(ticker, merged_df)
            return merged_df
        
        # If incremental fetch fails, return cached
        return self.cache.get(ticker)
    
    async def _fetch_full(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """Full fetch from all sources"""
        # Try Polygon first
        df = await self._fetch_polygon(ticker, period)
        if df is not None and not df.empty:
            self.cache.set(ticker, df)
            return df
        
        # Try Alpha Vantage
        df = await self._fetch_alpha(ticker, period)
        if df is not None and not df.empty:
            self.cache.set(ticker, df)
            return df
        
        # Try Yahoo
        df = await self._fetch_yahoo(ticker, period)
        if df is not None and not df.empty:
            self.cache.set(ticker, df)
            return df
        
        # Generate mock data
        df = self._generate_mock(ticker, period)
        self.cache.set(ticker, df)
        return df
    
    async def _fetch_range(self, ticker: str, start_date: datetime, end_date: datetime) -> Optional[pd.DataFrame]:
        """Fetch data for specific date range"""
        # Try Yahoo (most flexible for date ranges)
        try:
            stock = yf.Ticker(ticker)
            start_str = start_date.strftime("%Y-%m-%d")
            end_str = end_date.strftime("%Y-%m-%d")
            df = stock.history(start=start_str, end=end_str)
            
            if not df.empty:
                logger.info(f"Yahoo range fetch for {ticker}: {len(df)} new rows")
                return df
        except Exception as e:
            logger.warning(f"Yahoo range fetch failed: {e}")
        
        # Try Polygon for range
        if settings.polygon_api_key:
            try:
                await self.polygon_limiter.acquire()
                symbol = ticker.replace(".NS", "").replace("^NSEI", "NSEI")
                url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}.NS/range/1/day/{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"
                params = {"adjusted": "true", "apikey": settings.polygon_api_key}
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url, params=params)
                    data = response.json()
                    
                    if data.get("results"):
                        records = []
                        for r in data["results"]:
                            records.append({
                                "Date": datetime.fromtimestamp(r["t"] / 1000),
                                "Open": r["o"],
                                "High": r["h"],
                                "Low": r["l"],
                                "Close": r["c"],
                                "Volume": r["v"]
                            })
                        df = pd.DataFrame(records).set_index("Date")
                        logger.info(f"Polygon range fetch for {ticker}: {len(df)} new rows")
                        return df
            except Exception as e:
                logger.warning(f"Polygon range fetch failed: {e}")
        
        return None
    
    async def _fetch_polygon(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        if not settings.polygon_api_key:
            return None
        
        try:
            await self.polygon_limiter.acquire()
            
            symbol = ticker.replace(".NS", "").replace("^NSEI", "NSEI")
            from_date = (datetime.now() - timedelta(days=365 if period == "1y" else 100)).strftime("%Y-%m-%d")
            to_date = datetime.now().strftime("%Y-%m-%d")
            
            url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}.NS/range/1/day/{from_date}/{to_date}"
            params = {"adjusted": "true", "apikey": settings.polygon_api_key}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                data = response.json()
                
                if data.get("status") != "OK" or not data.get("results"):
                    return None
                
                records = []
                for r in data["results"]:
                    records.append({
                        "Date": datetime.fromtimestamp(r["t"] / 1000),
                        "Open": r["o"],
                        "High": r["h"],
                        "Low": r["l"],
                        "Close": r["c"],
                        "Volume": r["v"]
                    })
                
                df = pd.DataFrame(records).set_index("Date").sort_index()
                logger.info(f"Polygon: {len(df)} rows for {ticker}")
                return df
                
        except Exception as e:
            logger.error(f"Polygon failed: {e}")
            return None
    
    async def _fetch_alpha(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        if not settings.alpha_vantage_key:
            return None
        
        try:
            await self.alpha_limiter.acquire()
            
            symbol = ticker.replace(".NS", "")
            url = "https://www.alphavantage.co/query"
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
                    return None
                
                records = []
                for date, values in data["Time Series (Daily)"].items():
                    records.append({
                        "Date": date,
                        "Open": float(values["1. open"]),
                        "High": float(values["2. high"]),
                        "Low": float(values["3. low"]),
                        "Close": float(values["4. close"]),
                        "Volume": int(values["5. volume"])
                    })
                
                df = pd.DataFrame(records).set_index("Date").sort_index()
                logger.info(f"Alpha Vantage: {len(df)} rows for {ticker}")
                return df
                
        except Exception as e:
            logger.error(f"Alpha Vantage failed: {e}")
            return None
    
    async def _fetch_yahoo(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            
            if df.empty:
                return None
            
            df = df.dropna()
            logger.info(f"Yahoo: {len(df)} rows for {ticker}")
            return df
            
        except Exception as e:
            logger.error(f"Yahoo failed: {e}")
            return None
    
    def _generate_mock(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        """Generate realistic mock data"""
        days = 365 if period == "1y" else 100
        
        base_prices = {
            "NIFTYBEES.NS": 200, "GOLDBEES.NS": 50, "LIQUIDBEES.NS": 1000,
            "RELIANCE.NS": 2500, "INFY.NS": 1800, "TCS.NS": 3800,
            "HDFCBANK.NS": 1400, "ICICIBANK.NS": 900, "TATAMOTORS.NS": 600, "^NSEI": 22000
        }
        
        base = base_prices.get(ticker, 1000)
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        
        np.random.seed(hash(ticker) % 2**32)
        returns = np.random.normal(0.0005, 0.015, days)
        prices = base * np.exp(np.cumsum(returns))
        
        df = pd.DataFrame({
            "Open": prices * (1 + np.random.uniform(-0.005, 0.005, days)),
            "High": prices * (1 + np.random.uniform(0, 0.01, days)),
            "Low": prices * (1 + np.random.uniform(-0.01, 0, days)),
            "Close": prices,
            "Volume": np.random.randint(100000, 10000000, days)
        }, index=dates)
        
        logger.info(f"Mock: {len(df)} rows for {ticker}")
        return df


class RateLimiter:
    """Rate limiter for API calls"""
    def __init__(self, calls_per_minute: int):
        self.interval = 60.0 / calls_per_minute
        self.last_call = 0.0
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = time.time()
            if elapsed := now - self.last_call < self.interval:
                await asyncio.sleep(self.interval - elapsed)
            self.last_call = time.time()


class MarketDataService:
    def __init__(self):
        # Initialize hybrid cache
        self.cache = CacheManager("cache")
        self.fetcher = IncrementalFetcher(self.cache)
        
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
    
    async def fetch_historical_data(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """Fetch using incremental cache - only downloads new data"""
        # Try cache first
        cached = self.cache.get(ticker)
        if cached is not None and not cached.empty:
            return cached
        
        # Fetch with incremental updates
        return await self.fetcher.fetch_incremental(ticker, period)
    
    async def fetch_all_data(self) -> Dict[str, pd.DataFrame]:
        """Fetch all tickers"""
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
        return pd.DataFrame(returns_dict).cov()
    
    def calculate_correlation_matrix(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                returns_dict[ticker] = self.calculate_returns(df)
        return pd.DataFrame(returns_dict).corr()
    
    def get_expected_returns(self, data: Dict[str, pd.DataFrame]) -> pd.Series:
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                daily = self.calculate_returns(df)
                returns_dict[ticker] = daily.mean() * 252
        return pd.Series(returns_dict)
    
    def get_volatility(self, data: Dict[str, pd.DataFrame]) -> pd.Series:
        vol_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                daily = self.calculate_returns(df)
                vol_dict[ticker] = daily.std() * np.sqrt(252)
        return pd.Series(vol_dict)
    
    def get_ticker_name(self, ticker: str) -> str:
        return self.tickers.get(ticker, ticker)
    
    def get_asset_class(self, ticker: str) -> str:
        return self.asset_class_map.get(ticker, "Unknown")
    
    async def get_live_price(self, ticker: str) -> Optional[float]:
        try:
            # Try Polygon first
            if settings.polygon_api_key:
                try:
                    symbol = ticker.replace(".NS", "").replace("^NSEI", "NSEI")
                    url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}.NS/prev"
                    params = {"adjusted": "true", "apikey": settings.polygon_api_key}
                    
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(url, params=params)
                        data = response.json()
                        if data.get("results"):
                            return data["results"][-1]["c"]
                except:
                    pass
            
            # Fallback to Yahoo
            stock = yf.Ticker(ticker)
            try:
                return stock.fast_info.last_price
            except:
                df = stock.history(period="5d")
                if not df.empty:
                    return float(df["Close"].iloc[-1])
            return None
            
        except Exception as e:
            logger.error(f"Live price error for {ticker}: {e}")
            return None


market_data_service = MarketDataService()