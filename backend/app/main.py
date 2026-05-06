from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from core.config import settings
from core.logging import logger
from core.database import init_db, check_db_connection
from api import portfolio, health, live
from api import auth, portfolios, watchlist
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    os.makedirs("logs", exist_ok=True)
    
    if check_db_connection():
        init_db()
        logger.info("Database initialized successfully")
    else:
        logger.warning("Database not available - running in offline mode")
    
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
app.include_router(auth.router, tags=["Authentication"])
app.include_router(portfolios.router, tags=["Portfolios"])
app.include_router(watchlist.router, tags=["Watchlist"])
app.include_router(portfolio.router, tags=["Legacy Portfolio"])
app.include_router(live.router, tags=["Live Market"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)