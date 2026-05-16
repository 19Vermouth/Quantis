import yfinance as yf
import httpx
import pandas as pd
import numpy as np
from typing import Optional, Dict, Tuple, List
from datetime import datetime, timedelta
from loguru import logger
from core.config import settings
import asyncio
import time
import os
import hashlib


class CacheManager:
    """Hybrid cache: in-memory + persistent file-based with Parquet"""
    
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = cache_dir
        self.memory_cache: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
        self.memory_ttl = settings.cache_ttl  # 5 minutes default
        
        os.makedirs(cache_dir, exist_ok=True)
    
    def _get_cache_path(self, ticker: str) -> str:
        """Get file path for ticker - prefers Parquet, falls back to CSV"""
        safe_name = ticker.replace("^", "").replace(".", "_")
        parquet_path = os.path.join(self.cache_dir, f"{safe_name}.parquet")
        csv_path = os.path.join(self.cache_dir, f"{safe_name}.csv")
        
        if os.path.exists(parquet_path):
            return parquet_path
        if os.path.exists(csv_path):
            return csv_path
        return parquet_path
    
    def _is_parquet(self, path: str) -> bool:
        return path.endswith('.parquet')
    
    def _is_memory_valid(self, key: str) -> bool:
        """Check in-memory cache validity"""
        if key not in self.memory_cache:
            return False
        _, timestamp = self.memory_cache[key]
        return (datetime.now() - timestamp).total_seconds() < self.memory_ttl
    
    def get(self, ticker: str, allow_stale: bool = True) -> Optional[pd.DataFrame]:
        """Get from cache (memory first, then file)"""
        cache_key = ticker
        
        # Try memory first
        if self._is_memory_valid(cache_key):
            logger.info(f"[CACHE] Memory hit for {ticker}")
            return self.memory_cache[cache_key][0]
        
        # Try persistent file
        cache_file = self._get_cache_path(ticker)
        if os.path.exists(cache_file):
            try:
                if self._is_parquet(cache_file):
                    df = pd.read_parquet(cache_file)
                else:
                    df = pd.read_csv(cache_file, index_col=0, parse_dates=True)
                
                if not df.empty:
                    last_date = df.index[-1]
                    age_days = (datetime.now() - last_date).days
                    
                    # Fresh cache (< 1 day)
                    if age_days < 1:
                        self.memory_cache[cache_key] = (df, datetime.now())
                        logger.info(f"[CACHE] Disk hit (fresh) for {ticker}: {len(df)} rows, age={age_days}d")
                        return df
                    
                    # Stale but allowed
                    if allow_stale and age_days < 2:
                        logger.info(f"[CACHE] Stale disk hit for {ticker}: {len(df)} rows, age={age_days}d")
                        return df
                        
                    logger.info(f"[CACHE] Expired for {ticker}: age={age_days}d")
            except Exception as e:
                logger.warning(f"[CACHE] Read error for {ticker}: {e}")
        
        logger.info(f"[CACHE] Miss for {ticker}")
        return None
    
    def set(self, ticker: str, df: pd.DataFrame):
        """Save to both memory and file (Parquet)"""
        if df is None or df.empty:
            return
        
        cache_key = ticker
        
        # Save to memory
        self.memory_cache[cache_key] = (df, datetime.now())
        
        # Save to persistent file as Parquet
        try:
            cache_file = self._get_cache_path(ticker)
            if not cache_file.endswith('.parquet'):
                cache_file = cache_file.replace('.csv', '.parquet')
            df.to_parquet(cache_file, index=True)
            logger.info(f"[CACHE] Wrote Parquet for {ticker}: {len(df)} rows")
        except Exception as e:
            logger.warning(f"[CACHE] Write error for {ticker}: {e}")
    
    def get_last_date(self, ticker: str) -> Optional[datetime]:
        """Get last cached date for incremental updates"""
        df = self.get(ticker, allow_stale=True)
        if df is not None and not df.empty:
            return df.index[-1]
        return None


class BulkFetcher:
    """Bulk yfinance fetcher with threading"""
    
    def __init__(self, cache: CacheManager):
        self.cache = cache
        self.polygon_limiter = RateLimiter(5)
        self.alpha_limiter = RateLimiter(5)
    
    async def fetch_all_bulk(self, tickers: List[str], period: str = "1y") -> Dict[str, pd.DataFrame]:
        """Bulk fetch all tickers using yfinance with threads"""
        logger.info(f"[FETCH] Starting bulk fetch for {len(tickers)} tickers")
        start_time = time.time()
        
        # Check which tickers need fetching
        tickers_needed = []
        for ticker in tickers:
            cached = self.cache.get(ticker, allow_stale=False)
            if cached is None:
                tickers_needed.append(ticker)
        
        logger.info(f"[FETCH] {len(tickers_needed)} tickers need fetching, {len(tickers) - len(tickers_needed)} from cache")
        
        results = {}
        
        # First, get all cached data
        for ticker in tickers:
            cached = self.cache.get(ticker, allow_stale=True)
            if cached is not None:
                results[ticker] = cached
        
        if not tickers_needed:
            elapsed = time.time() - start_time
            logger.info(f"[FETCH] All cached, took {elapsed:.2f}s")
            return results
        
        # Bulk download missing tickers via yfinance
        try:
            logger.info(f"[FETCH] Downloading {len(tickers_needed)} tickers via yfinance bulk")
            fetch_start = time.time()
            
            # Use yfinance bulk download with threads
            yf_data = yf.download(
                tickers_needed,
                period=period,
                progress=False,
                threads=True,
                auto_adjust=True,
                group_by='ticker'
            )
            
            fetch_time = time.time() - fetch_start
            logger.info(f"[FETCH] yfinance download took {fetch_time:.2f}s")
            
            # Process each ticker
            for ticker in tickers_needed:
                try:
                    if group_by := 'ticker' and len(tickers_needed) > 1:
                        if ticker in yf_data.columns.get_level_values(0):
                            df = yf_data[ticker].dropna()
                        else:
                            df = pd.DataFrame()
                    else:
                        df = yf_data.dropna()
                    
                    if df.empty:
                        logger.warning(f"[FETCH] Empty data for {ticker}")
                        continue
                    
                    # Standardize columns
                    if 'Close' not in df.columns:
                        df = df.rename(columns={
                            'Open': 'Open', 'High': 'High', 'Low': 'Low', 
                            'Close': 'Close', 'Volume': 'Volume'
                        })
                    
                    results[ticker] = df
                    self.cache.set(ticker, df)
                    logger.info(f"[FETCH] Got {len(df)} rows for {ticker}")
                    
                except Exception as e:
                    logger.warning(f"[FETCH] Error processing {ticker}: {e}")
            
        except Exception as e:
            logger.error(f"[FETCH] yfinance bulk failed: {e}")
        
        # Fill missing with mock data
        for ticker in tickers_needed:
            if ticker not in results:
                logger.info(f"[FETCH] Using mock data for {ticker}")
                df = self._generate_mock(ticker, period)
                results[ticker] = df
                self.cache.set(ticker, df)
        
        total_time = time.time() - start_time
        logger.info(f"[FETCH] Total fetch time: {total_time:.2f}s, got {len(results)}/{len(tickers)}")
        
        return results
    
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
        
        logger.info(f"[MOCK] Generated {len(df)} rows for {ticker}")
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


class ComputationCache:
    """Cache for computed metrics"""
    
    def __init__(self):
        self.expected_returns_cache: Optional[pd.Series] = None
        self.cov_matrix_cache: Optional[pd.DataFrame] = None
        self.data_hash: str = ""
        self.timestamp: Optional[datetime] = None
        self.ttl = 300  # 5 minutes
    
    def is_valid(self, data_hash: str) -> bool:
        if self.timestamp is None:
            return False
        if self.data_hash != data_hash:
            return False
        return (datetime.now() - self.timestamp).total_seconds() < self.ttl
    
    def set(self, data_hash: str, expected_returns: pd.Series, cov_matrix: pd.DataFrame):
        self.data_hash = data_hash
        self.expected_returns_cache = expected_returns
        self.cov_matrix_cache = cov_matrix
        self.timestamp = datetime.now()
    
    def get(self, data_hash: str) -> Tuple[Optional[pd.Series], Optional[pd.DataFrame]]:
        if self.is_valid(data_hash):
            logger.info("[COMP_CACHE] Hit")
            return self.expected_returns_cache, self.cov_matrix_cache
        logger.info("[COMP_CACHE] Miss")
        return None, None


class MarketDataService:
    def __init__(self):
        self.cache = CacheManager("cache")
        self.bulk_fetcher = BulkFetcher(self.cache)
        self.comp_cache = ComputationCache()
        
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
    
    async def fetch_all_data(self) -> Dict[str, pd.DataFrame]:
        """Fetch all tickers using bulk download"""
        logger.info("[MARKET_DATA] fetch_all_data started")
        start = time.time()
        
        results = await self.bulk_fetcher.fetch_all_bulk(
            list(self.tickers.keys()), 
            period="1y"
        )
        
        elapsed = time.time() - start
        logger.info(f"[MARKET_DATA] fetch_all_data completed in {elapsed:.2f}s, got {len(results)} tickers")
        
        return results
    
    def calculate_returns(self, df: pd.DataFrame) -> pd.Series:
        returns = np.log(df["Close"] / df["Close"].shift(1)).dropna()
        if returns.index.tz is not None:
            returns.index = returns.index.tz_localize(None)
        return returns
    
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
    
    def get_expected_returns(self, data: Dict[str, pd.DataFrame], use_cache: bool = True) -> pd.Series:
        # Create hash of data to use for caching
        data_hash = str(sum(len(df) for df in data.values()))
        
        if use_cache:
            cached_er, cached_cov = self.comp_cache.get(data_hash)
            if cached_er is not None:
                return cached_er
        
        returns_dict = {}
        for ticker, df in data.items():
            if ticker != "^NSEI" and not df.empty:
                daily = self.calculate_returns(df)
                returns_dict[ticker] = daily.mean() * 252
        
        result = pd.Series(returns_dict)
        
        if use_cache:
            cov = self.calculate_covariance_matrix(data)
            self.comp_cache.set(data_hash, result, cov)
        
        return result
    
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