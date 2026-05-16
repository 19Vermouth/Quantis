# Quantis Agent Instructions

Last updated: May 16, 2026

## Dev Commands
- **Start backend**: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
- **Start frontend**: `cd frontend && npm run dev` (runs on 5173, proxies to 8000)
- **Start DB**: `docker-compose up -d` (PostgreSQL on 5433, pgAdmin on 5050)
- **Login**: demo@quantis.ai / demo123 (user_id=3)
- **Smoke tests**: `cd backend && python test_login.py` and `cd backend && python test_api.py`
- **Frontend build**: `cd frontend && npm run build`

## Architecture
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React 19 + Vite + Tailwind + Recharts
- State: JWT token in Authorization header

## Key Files
- `backend/app/main.py` - FastAPI app entry point, router registration, CORS
- `backend/api/auth.py` - Login and registration, JWT issuance
- `backend/api/portfolios.py` - Protected portfolio, scenario, watchlist, goal, alert, notification, and risk questionnaire APIs
- `backend/models/database.py` - SQLAlchemy models and relationships
- `backend/models/schemas.py` - Pydantic schemas
- `backend/services/market_data.py` - Historical data loading and cache layer
- `frontend/src/services/api.ts` - API client with bearer-token helper
- `frontend/src/context/AuthContext.tsx` - Token persistence and auth state
- `frontend/src/components/Layout.tsx` - Shared authenticated layout
- `frontend/src/pages/Dashboard.tsx` - Generated portfolio view and save action
- `frontend/src/pages/PortfolioInput.tsx` - Portfolio input, scenario save, and prefill

## Common Issues
- **Port 5433**: PostgreSQL mapped from 5432 in docker-compose
- **bcrypt**: Use bcrypt==4.0.1 (later versions break passlib)
- **Rupee symbol**: Use "Rs." not "₹" in DB text fields (encoding)
- **Monte Carlo**: Truncate final_values to 100 items before JSON serialization (large arrays fail)
- **Auth**: Protected endpoints require `Authorization: Bearer <token>` and a valid demo user in the database

## Test User
- Email: demo@quantis.ai, Password: demo123
- Owns Portfolio 3 (portfolio 5 belongs to user_id=1)
- Current protected feature set: My Portfolios, Saved Scenarios, Watchlists, Goals, Alerts, Notifications, Risk Assessment