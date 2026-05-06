# Quantis Agent Instructions

## Dev Commands
- **Start backend**: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
- **Start frontend**: `cd frontend && npm run dev` (runs on 5173, proxies to 8000)
- **Start DB**: `docker-compose up -d` (PostgreSQL on 5433, pgAdmin on 5050)
- **Login**: demo@quantis.ai / demo123 (user_id=3)

## Architecture
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React 19 + Vite + Tailwind + Recharts
- State: JWT token in Authorization header

## Key Files
- `backend/api/portfolios.py` - Portfolio CRUD + generation
- `backend/models/schemas.py` - Pydantic schemas
- `backend/services/market_data.py` - yfinance integration
- `frontend/src/services/api.ts` - API client
- `frontend/src/pages/Workspace.tsx` - Portfolio view

## Common Issues
- **Port 5433**: PostgreSQL mapped from 5432 in docker-compose
- **bcrypt**: Use bcrypt==4.0.1 (later versions break passlib)
- **Rupee symbol**: Use "Rs." not "₹" in DB text fields (encoding)
- **Monte Carlo**: Truncate final_values to 100 items before JSON serialization (large arrays fail)

## Test User
- Email: demo@quantis.ai, Password: demo123
- Owns Portfolio 3 (portfolio 5 belongs to user_id=1)