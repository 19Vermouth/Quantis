# Quantis - AI Portfolio Intelligence Platform

An India-focused AI portfolio intelligence platform using deterministic portfolio construction, quantitative risk analytics, Monte Carlo simulation, and controlled multi-agent reasoning.

## Features

- **Portfolio Optimization**: Mean-variance optimization using PyPortfolioOpt
- **Risk Analytics**: VaR, Sharpe ratio, max drawdown, beta calculations
- **Monte Carlo Simulation**: 1000+ path simulations for scenario analysis
- **Multi-Agent AI**: Deterministic Growth, Risk, and Sentiment agents
- **Live Market Data**: Real-time NSE market quotes
- **Modern UI**: Bloomberg-style dark interface

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- pandas, numpy
- PyPortfolioOpt
- yfinance

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
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Add your API keys (optional)

# Run the server
python -m uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Running with Docker

```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/portfolio` | Generate portfolio |
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
User Input → Market Data → Feature Engineering → Portfolio Optimization → Risk Model → Monte Carlo → Agent Layer → Output
```

## License

MIT