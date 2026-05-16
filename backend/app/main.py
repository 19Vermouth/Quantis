from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from core.config import settings
from core.logging import logger
from api import portfolio, health, live
from api.portfolios import router as portfolios_router
from api.auth import router as auth_router
from models.database import init_db
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    os.makedirs("logs", exist_ok=True)
    
    # Initialize database tables
    try:
        init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")
    
    yield
    logger.info("Shutting down Quantis")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI Portfolio Intelligence Platform for Indian Investors",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio Generation"])
app.include_router(live.router, prefix="/api", tags=["Live Market"])
app.include_router(portfolios_router)
app.include_router(auth_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)