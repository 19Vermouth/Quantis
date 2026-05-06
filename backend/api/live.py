from fastapi import APIRouter
import random
from datetime import datetime

from models.schemas import LiveMarketResponse, LiveQuote

router = APIRouter()

TRACKED_SYMBOLS = ["NIFTYBEES.NS", "GOLDBEES.NS", "RELIANCE.NS", "INFY.NS", "TCS.NS", "^NSEI"]


@router.get("/live", response_model=LiveMarketResponse)
async def get_live_market():
    quotes = []
    
    base_prices = {
        "NIFTYBEES.NS": 245.50,
        "GOLDBEES.NS": 52.80,
        "RELIANCE.NS": 2850.00,
        "INFY.NS": 1750.00,
        "TCS.NS": 4200.00,
        "^NSEI": 22150.00
    }
    
    for symbol in TRACKED_SYMBOLS:
        base = base_prices.get(symbol, 100.0)
        
        change_pct = random.uniform(-1.5, 1.5)
        change = base * change_pct / 100
        last_price = base + change
        
        quotes.append(LiveQuote(
            symbol=symbol,
            last_price=round(last_price, 2),
            change=round(change, 2),
            change_percent=round(change_pct, 2),
            volume=random.randint(100000, 5000000),
            timestamp=datetime.now().isoformat()
        ))
    
    return LiveMarketResponse(
        quotes=quotes,
        timestamp=datetime.now().isoformat()
    )


@router.get("/quote/{symbol}", response_model=LiveQuote)
async def get_quote(symbol: str):
    base_prices = {
        "NIFTYBEES.NS": 245.50,
        "GOLDBEES.NS": 52.80,
        "LIQUIDBEES.NS": 1500.00,
        "RELIANCE.NS": 2850.00,
        "INFY.NS": 1750.00,
        "TCS.NS": 4200.00,
        "HDFCBANK.NS": 1680.00,
        "ICICIBANK.NS": 980.00,
        "TATAMOTORS.NS": 720.00,
        "^NSEI": 22150.00
    }
    
    base = base_prices.get(symbol.upper(), 100.0)
    change_pct = random.uniform(-1.5, 1.5)
    change = base * change_pct / 100
    
    return LiveQuote(
        symbol=symbol.upper(),
        last_price=round(base + change, 2),
        change=round(change, 2),
        change_percent=round(change_pct, 2),
        volume=random.randint(100000, 5000000),
        timestamp=datetime.now().isoformat()
    )