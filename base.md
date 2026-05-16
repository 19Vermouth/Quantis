# Quantis - Project Semantics Reference

## Project Overview
AI Portfolio Intelligence Platform for Indian investors using mean-variance optimization, Monte Carlo simulation, and adversarial multi-agent debate orchestration.

## Architecture
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React 19 + Vite + Tailwind CSS + Recharts
- **State**: JWT token in Authorization header

## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI, pandas, numpy, PyPortfolioOpt |
| Market Data | Polygon.io (primary), Alpha Vantage (secondary), yfinance (fallback), Mock data (ultimate fallback) |
| AI/LLM | Groq (llama-3.3-70b-versatile) for debate agents |
| Frontend | React 19, TypeScript, Vite, Tailwind, Recharts |
| Database | PostgreSQL (port 5433), pgAdmin (port 5050) |

## Key Files

### Backend
- `backend/app/main.py` - FastAPI app entry point, CORS, routers
- `backend/api/portfolio.py` - Portfolio generation endpoint (POST /api/portfolio)
- `backend/api/live.py` - Live market data (mocked, GET /api/live)
- `backend/models/schemas.py` - Pydantic schemas (PortfolioInput, PortfolioResponse, etc.)
- `backend/services/market_data.py` - Market data service with hybrid caching (memory + file)
- `backend/services/portfolio_optimizer.py` - PyPortfolioOpt optimization by risk profile
- `backend/services/risk_model.py` - Risk metrics (VaR, Sharpe, max drawdown, beta, alpha)
- `backend/services/monte_carlo.py` - Monte Carlo simulation (1000 paths default)
- `backend/services/debate_agents.py` - LLM-powered debate agents (Aggressive, Historical, Risk)
- `backend/services/agents.py` - Consensus engine (Growth, Risk, Sentiment agents)
- `backend/services/llm_client.py` - Groq API client
- `backend/core/config.py` - Settings (API keys, risk-free rate 7.2%)

### Frontend
- `frontend/src/App.tsx` - Router with protected routes
- `frontend/src/pages/PortfolioInput.tsx` - Portfolio input form
- `frontend/src/pages/Dashboard.tsx` - Portfolio visualization (Allocation, Monte Carlo, Agents tabs)
- `frontend/src/services/api.ts` - API client functions
- `frontend/src/types/index.ts` - TypeScript interfaces
- `frontend/src/context/AuthContext.tsx` - Auth state management

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/portfolio` | Generate portfolio |
| GET | `/api/live` | Live market data (mock) |

## Supported Assets (Indian Market)
- NIFTYBEES.NS - Nifty Index ETF
- GOLDBEES.NS - Gold ETF
- LIQUIDBEES.NS - Money Market ETF
- RELIANCE.NS, INFY.NS, TCS.NS - Major stocks
- HDFCBANK.NS, ICICIBANK.NS, TATAMOTORS.NS - Banking/Automotive
- ^NSEI - Nifty 50 Index

## Portfolio Generation Flow
1. Fetch historical data for all tickers (hybrid cache: memory 5min + file 24hr)
2. Calculate expected returns and covariance matrix
3. Optimize using PyPortfolioOpt (max Sharpe) with risk profile constraints
4. Calculate risk metrics (VaR, Sharpe, max drawdown, beta, alpha)
5. Run Monte Carlo simulation (1000 paths)
6. Run debate agents (Aggressive, Historical, Risk) in parallel via Groq
7. Consensus engine averages agent recommendations
8. Recalculate metrics with adjusted weights
9. Generate human-readable explanation

## Risk Profile Constraints
| Profile | Max Volatility | Equity Weight | Gold Weight | Liquid Weight |
|---------|----------------|---------------|-------------|---------------|
| Conservative | 12% | 20-50% | 20%+ | 10%+ |
| Moderate | 18% | 40-70% | 10%+ | 5%+ |
| Aggressive | 25% | 60-90% | 5%+ | 0% |

## Debate Agents
- **Aggressive Agent**: Maximizes growth, high-beta exposure
- **Historical Agent**: Evaluates drawdowns, regime performance
- **Risk Agent**: Enforces volatility, VaR, diversification constraints
- **Consensus Engine**: Averages recommendations, highlights disagreements

## Caching System
- **Memory**: 5 minute TTL
- **File**: 24 hour TTL in `backend/cache/*.csv`
- **Incremental**: Fetches only new data since last cache

## Common Issues
- Port 5433: PostgreSQL mapped from 5432 in docker-compose
- bcrypt: Use bcrypt==4.0.1 (later versions break passlib)
- Rupee symbol: Use "Rs." not "₹" in DB text fields
- Monte Carlo: Truncate final_values to 100 items before JSON

## Test Credentials
- Email: demo@quantis.ai, Password: demo123
- User ID: 3, Owns Portfolio 3

## Dev Commands
```bash
# Backend
cd backend && python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev  # runs on 5173, proxies to 8000

# Database
docker-compose up -d  # PostgreSQL 5433, pgAdmin 5050
```

## Key Configuration (.env)
```
GROQ_API_KEY=your_groq_key
POLYGON_API_KEY=your_polygon_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
FINNHUB_KEY=your_finnhub_key
```