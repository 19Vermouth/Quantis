# Quantis - AI Portfolio Intelligence Platform

Last updated: May 16, 2026

An India-focused AI portfolio intelligence platform using deterministic portfolio construction, quantitative risk analytics, authenticated portfolio management, Monte Carlo simulation, and adversarial multi-agent debate orchestration.

## Features

- **Portfolio Optimization**: Mean-variance optimization using PyPortfolioOpt
- **Risk Analytics**: VaR, Sharpe ratio, max drawdown, beta, alpha calculations
- **Monte Carlo Simulation**: 1000+ path simulations for scenario analysis
- **Debate-Based Multi-Agent AI**: Adversarial reasoning with Groq LLM
  - Aggressive Agent - maximizes growth, high-beta exposure
  - Historical Agent - evaluates drawdowns, regime performance
  - Risk Agent - enforces volatility, VaR, diversification constraints
  - Consensus Engine - resolves disagreements, produces final allocation
- **Live Market Data**: Real-time NSE market quotes via Polygon.io / Alpha Vantage / Yahoo Finance
- **Hybrid Caching**: In-memory + persistent CSV cache with incremental updates
- **Mock Data Fallback**: Realistic generated data when all APIs fail
- **Authenticated Portfolio Management**: Save portfolios, saved scenarios, watchlists, goals, alerts, notifications, and risk assessment
- **Modern UI**: Bloomberg-style dark interface with Recharts and shared authenticated layout

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- pandas, numpy, scipy
- PyPortfolioOpt
- yfinance (fallback)
- Polygon.io (primary data source)
- Alpha Vantage (secondary)
- Groq (LLM inference)

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- JWT bearer token stored in localStorage by the auth context

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Add GROQ_API_KEY for AI agents (optional - falls back to deterministic)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Create `backend/.env` with:

```env
# Required for AI debate agents (get free key at https://console.groq.com/)
GROQ_API_KEY=your_groq_key

# Market Data APIs (at least one recommended)
POLYGON_API_KEY=your_polygon_key          # Primary - 5 calls/min free tier
ALPHA_VANTAGE_KEY=your_alpha_vantage_key  # Secondary - 5 calls/min free tier
FINNHUB_KEY=your_finnhub_key            # Optional - sentiment data

# Shoonya API (optional - for live Indian market data)
SHOONYA_API_KEY=
SHOONYA_USER_ID=
SHOONYA_PASSWORD=
```

## Caching System

The platform uses a **hybrid caching system** for market data:

| Layer | Storage | TTL | Purpose |
|-------|--------|-----|--------|
| **Memory** | In-memory (dict) | 5 minutes | Fast access for repeated requests |
| **File** | `backend/cache/*.csv` | 24 hours | Persist across restarts |
| **Incremental** | Date-range queries | Per request | Only fetch new data points |

### Cache Behavior

1. **First request**: Fetches full data from API, saves to memory + file
2. **Subsequent requests**: Uses cached data if recent
3. **Old cache**: Fetches only new data points since last cache date
4. **All APIs fail**: Generates realistic mock data as fallback

### Cache Directory

```
backend/cache/
├── RELIANCE_NS.csv    # Cached market data
├── TCS_NS.csv
├── INFY_NS.csv
└── ...
```

Cache files are gitignored and stored persistently.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/portfolio` | Generate portfolio with debate agents |
| GET | `/api/live` | Live market data |
| POST | `/api/auth/login` | Login and receive access token |
| POST | `/api/auth/register` | Register and receive access token |
| GET/POST/PUT/DELETE | `/api/portfolios` | Saved portfolio management |
| GET/POST/PUT/DELETE | `/api/scenarios` | Saved scenario management |
| GET/POST/PUT/DELETE | `/api/watchlists` | Watchlist management |
| GET/POST/PUT/DELETE | `/api/goals` | Goal tracking |
| GET/POST/PUT/DELETE | `/api/alerts` | Alert management |
| GET/PUT | `/api/notifications` | Notifications and read state |
| GET/POST | `/api/risk-questionnaire` | Risk assessment and submission |

## Example Request

```json
POST /api/portfolio
{
  "age": 30,
  "risk_profile": "moderate",
  "investment_amount": 100000,
  "horizon_years": 5
}
```

## Supported Assets

- NIFTYBEES.NS (Nifty Index ETF)
- GOLDBEES.NS (Gold ETF)
- LIQUIDBEES.NS (Money Market ETF)
- RELIANCE.NS, INFY.NS, TCS.NS
- HDFCBANK.NS, ICICIBANK.NS, TATAMOTORS.NS
- ^NSEI (Nifty 50 Index)

## Architecture

```
User Input → Market Data (with caching) → Feature Engineering → Portfolio Optimization → Risk Model → Monte Carlo → Debate Agents → Consensus → Output
```

### Data Source Priority

1. **Polygon.io** - Primary (reliable for Indian stocks)
2. **Alpha Vantage** - Secondary
3. **Yahoo Finance** - Tertiary fallback
4. **Mock Data** - Ultimate fallback (always works)

### Debate Flow

1. Three agents (Aggressive, Historical, Risk) analyze portfolio in parallel
2. Each returns JSON with recommendations and confidence scores
3. Consensus Engine averages recommendations, highlights disagreements
4. Final allocation adjusted based on weighted agent outputs

## Production Metrics

- **Expected Return**: Calculated from historical returns (annualized)
- **Volatility**: Annualized standard deviation
- **Sharpe Ratio**: (Return - Risk-Free Rate) / Volatility
- **Max Drawdown**: Largest peak-to-trough decline
- **Beta**: Correlation with Nifty 50 benchmark
- **VaR 95%**: Value at Risk at 95% confidence

## License

MIT

## Status

Current app date: May 16, 2026. The authenticated portfolio-management flows are active and the backend login/protected routes are verified with the demo account.