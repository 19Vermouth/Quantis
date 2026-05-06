# Quantis Setup Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

---

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- pgAdmin on `http://localhost:5050` (email: admin@quantis.ai, password: admin123)

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Run the server
python -m uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create `backend/.env`:

```env
# Database
POSTGRES_USER=quantis
POSTGRES_PASSWORD=quantis_pass_2024
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=quantis

# JWT
SECRET_KEY=your_super_secret_key

# Optional APIs
GROQ_API_KEY=
ALPHA_VANTAGE_KEY=
FINNHUB_KEY=
```

---

## Database Access

### pgAdmin
- URL: http://localhost:5050
- Email: admin@quantis.ai
- Password: admin123

### Connect to PostgreSQL
- Host: localhost
- Port: 5432
- Database: quantis
- User: quantis
- Password: quantis_pass_2024

---

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Portfolios
- GET `/api/portfolios` - List user portfolios
- POST `/api/portfolios` - Create portfolio
- GET `/api/portfolios/{id}` - Get portfolio details
- PUT `/api/portfolios/{id}` - Regenerate portfolio
- DELETE `/api/portfolios/{id}` - Delete portfolio
- GET `/api/portfolios/{id}/versions` - List versions
- GET `/api/portfolios/{id}/versions/{v}` - Get specific version

### Watchlist
- GET `/api/watchlist` - Get watchlist
- POST `/api/watchlist` - Add ticker
- DELETE `/api/watchlist/{ticker}` - Remove ticker

---

## Troubleshooting

### Database Connection Failed
```bash
# Check if Docker is running
docker ps

# Restart containers
docker-compose restart

# Check logs
docker-compose logs postgres
```

### Port Already in Use
```bash
# Check what's using port 5432
netstat -ano | findstr :5432
```