# Quantis - AI Portfolio Intelligence Platform

An India-focused AI portfolio intelligence platform using deterministic portfolio construction, quantitative risk analytics, Monte Carlo simulation, and adversarial multi-agent debate orchestration.

## Features

- **Portfolio Optimization**: Mean-variance optimization using PyPortfolioOpt
- **Risk Analytics**: VaR, Sharpe ratio, max drawdown, beta, alpha calculations
- **Monte Carlo Simulation**: 1000+ path simulations for scenario analysis
- **Debate-Based Multi-Agent AI**: Adversarial reasoning with Groq LLM
  - Aggressive Agent - maximizes growth, high-beta exposure
  - Historical Agent - evaluates drawdowns, regime performance
  - Risk Agent - enforces volatility, VaR, diversification constraints
  - Consensus Engine - resolves disagreements, produces final allocation
- **Live Market Data**: Real-time NSE market quotes via yfinance
- **Modern UI**: Bloomberg-style dark interface with Recharts

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- pandas, numpy, scipy
- PyPortfolioOpt
- yfinance
- Groq (LLM inference)
- LangGraph (orchestration)

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts

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

# Optional APIs
ALPHA_VANTAGE_KEY=
FINNHUB_KEY=
SHOONYA_API_KEY=
SHOONYA_USER_ID=
SHOONYA_PASSWORD=
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/portfolio` | Generate portfolio with debate agents |
| GET | `/api/live` | Live market data |

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

- NIFTYBEES.NS (Nifty Index)
- GOLDBEES.NS (Gold)
- LIQUIDBEES.NS (Money Market)
- RELIANCE.NS, INFY.NS, TCS.NS
- HDFCBANK.NS, ICICIBANK.NS, TATAMOTORS.NS

## Architecture

```
User Input → Market Data → Feature Engineering → Portfolio Optimization → Risk Model → Monte Carlo → Debate Agents → Consensus → Output
```

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