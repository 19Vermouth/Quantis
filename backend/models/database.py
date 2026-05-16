from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
import os

from core.config import settings

Base = declarative_base()

# Database URL from settings
DATABASE_URL = settings.database_url

# For SQLite, add connect_args and remove check_same_thread
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


# Enums
class RiskProfileEnum(str, enum.Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class AlertTypeEnum(str, enum.Enum):
    PRICE = "price"
    DRAWDOWN = "drawdown"
    GOAL = "goal"
    REBALANCE = "rebalance"


class AlertStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    DISABLED = "disabled"


class NotificationTypeEnum(str, enum.Enum):
    ALERT = "alert"
    GOAL = "goal"
    REPORT = "report"
    REBALANCE = "rebalance"
    SYSTEM = "system"


# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    portfolios = relationship("Portfolio", back_populates="user")
    scenarios = relationship("Scenario", back_populates="user")
    watchlists = relationship("Watchlist", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    questionnaire_responses = relationship("RiskQuestionnaireResponse", back_populates="user")


class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=True)
    
    # Input parameters
    age = Column(Integer, nullable=False)
    risk_profile = Column(SQLEnum(RiskProfileEnum), nullable=False)
    investment_amount = Column(Float, nullable=False)
    horizon_years = Column(Integer, nullable=False)
    
    # Serialized data
    allocation_json = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=False)
    monte_carlo_json = Column(Text, nullable=False)
    agent_logs_json = Column(Text, nullable=False)
    explanation_json = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="portfolios")


class Scenario(Base):
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    
    # Input parameters
    age = Column(Integer, nullable=False)
    risk_profile = Column(SQLEnum(RiskProfileEnum), nullable=False)
    investment_amount = Column(Float, nullable=False)
    horizon_years = Column(Integer, nullable=False)
    
    # Result (optional)
    result_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="scenarios")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), nullable=False)
    ticker = Column(String, nullable=False)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    watchlist = relationship("Watchlist", back_populates="items")


class Watchlist(Base):
    __tablename__ = "watchlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(DateTime, nullable=False)
    current_amount = Column(Float, default=0)
    
    # Linked portfolio (optional)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="goals")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    alert_type = Column(SQLEnum(AlertTypeEnum), nullable=False)
    
    # Configuration
    ticker = Column(String, nullable=True)
    threshold_value = Column(Float, nullable=True)
    condition = Column(String, nullable=True)  # "above", "below", "drift"
    
    status = Column(SQLEnum(AlertStatusEnum), default=AlertStatusEnum.ACTIVE)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="alerts")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SQLEnum(NotificationTypeEnum), nullable=False)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="notifications")


class RiskQuestionnaireResponse(Base):
    __tablename__ = "risk_questionnaire_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Answers stored as JSON
    answers_json = Column(Text, nullable=False)
    
    # Computed score and profile
    score = Column(Integer, nullable=False)
    risk_profile = Column(SQLEnum(RiskProfileEnum), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="questionnaire_responses")


class PortfolioReview(Base):
    __tablename__ = "portfolio_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Snapshot data
    allocation_json = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailReportSettings(Base):
    __tablename__ = "email_report_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    
    enabled = Column(Boolean, default=False)
    frequency = Column(String, default="weekly")  # "weekly", "monthly"
    
    last_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)