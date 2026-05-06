.PHONY: help install start-backend start-frontend start-db start all test lint

help:
	@echo "Available commands:"
	@echo "  make install      - Install backend and frontend dependencies"
	@echo "  make start-db   - Start PostgreSQL database (docker-compose)"
	@echo "  make start-backend - Start backend server (port 8000)"
	@echo "  make start-frontend - Start frontend server (port 5173)"
	@echo "  make start     - Start backend and frontend"
	@echo "  make test      - Run backend tests"
	@echo "  make lint      - Run linting"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

start-db:
	docker-compose up -d

start-backend:
	cd backend && python -m uvicorn app.main:app --reload --port 8000

start-frontend:
	cd frontend && npm run dev

start: start-backend start-frontend

test:
	cd backend && pytest

lint:
	cd backend && ruff check .