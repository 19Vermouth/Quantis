from fastapi import APIRouter, HTTPException, Depends, status, Header
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
import jwt

from models.database import get_db, Portfolio, User, Scenario, Watchlist, WatchlistItem, Goal, Alert, Notification, RiskQuestionnaireResponse, RiskProfileEnum, AlertTypeEnum, AlertStatusEnum, NotificationTypeEnum, PortfolioReview, EmailReportSettings
from models.schemas import PortfolioResponse, PortfolioInput, RiskProfile
from core.config import settings

router = APIRouter(prefix="/api", tags=["Portfolio Management"])


# Auth dependency
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


# Pydantic schemas for new endpoints
class PortfolioSaveRequest(BaseModel):
    name: Optional[str] = None
    age: int
    risk_profile: str
    investment_amount: float
    horizon_years: int
    allocation: List[dict]
    metrics: dict
    monte_carlo: dict
    agent_logs: List[dict]
    explanation: dict


class PortfolioListResponse(BaseModel):
    id: int
    name: Optional[str]
    risk_profile: str
    investment_amount: float
    horizon_years: int
    created_at: datetime
    updated_at: datetime


class ScenarioRequest(BaseModel):
    name: str
    age: int
    risk_profile: str
    investment_amount: float
    horizon_years: int
    result: Optional[dict] = None


class WatchlistRequest(BaseModel):
    name: str
    tickers: List[str] = []


class GoalRequest(BaseModel):
    name: str
    target_amount: float
    target_date: datetime
    current_amount: float = 0
    portfolio_id: Optional[int] = None


class AlertRequest(BaseModel):
    name: str
    alert_type: str
    ticker: Optional[str] = None
    threshold_value: Optional[float] = None
    condition: Optional[str] = None


class QuestionnaireRequest(BaseModel):
    answers: dict


# Portfolio CRUD
@router.get("/portfolios", response_model=List[PortfolioListResponse])
def list_portfolios(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user.id).order_by(Portfolio.created_at.desc()).all()
    return [
        PortfolioListResponse(
            id=p.id,
            name=p.name,
            risk_profile=p.risk_profile.value,
            investment_amount=p.investment_amount,
            horizon_years=p.horizon_years,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in portfolios
    ]


@router.get("/portfolios/{portfolio_id}", response_model=dict)
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "age": portfolio.age,
        "risk_profile": portfolio.risk_profile.value,
        "investment_amount": portfolio.investment_amount,
        "horizon_years": portfolio.horizon_years,
        "allocation": json.loads(portfolio.allocation_json),
        "metrics": json.loads(portfolio.metrics_json),
        "monte_carlo": json.loads(portfolio.monte_carlo_json),
        "agent_logs": json.loads(portfolio.agent_logs_json),
        "explanation": json.loads(portfolio.explanation_json),
        "created_at": portfolio.created_at.isoformat(),
        "updated_at": portfolio.updated_at.isoformat()
    }


@router.post("/portfolios", response_model=dict)
def save_portfolio(
    request: PortfolioSaveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolio = Portfolio(
        user_id=user.id,
        name=request.name,
        age=request.age,
        risk_profile=RiskProfileEnum(request.risk_profile),
        investment_amount=request.investment_amount,
        horizon_years=request.horizon_years,
        allocation_json=json.dumps(request.allocation),
        metrics_json=json.dumps(request.metrics),
        monte_carlo_json=json.dumps(request.monte_carlo),
        agent_logs_json=json.dumps(request.agent_logs),
        explanation_json=json.dumps(request.explanation)
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    
    return {"id": portfolio.id, "message": "Portfolio saved successfully"}


@router.delete("/portfolios/{portfolio_id}")
def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    db.delete(portfolio)
    db.commit()
    
    return {"message": "Portfolio deleted successfully"}


# Scenarios
@router.get("/scenarios")
def list_scenarios(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    scenarios = db.query(Scenario).filter(Scenario.user_id == user.id).order_by(Scenario.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "age": s.age,
            "risk_profile": s.risk_profile.value,
            "investment_amount": s.investment_amount,
            "horizon_years": s.horizon_years,
            "result": json.loads(s.result_json) if s.result_json else None,
            "created_at": s.created_at.isoformat()
        }
        for s in scenarios
    ]


@router.post("/scenarios")
def save_scenario(
    request: ScenarioRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    scenario = Scenario(
        user_id=user.id,
        name=request.name,
        age=request.age,
        risk_profile=RiskProfileEnum(request.risk_profile),
        investment_amount=request.investment_amount,
        horizon_years=request.horizon_years,
        result_json=json.dumps(request.result) if request.result else None
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    
    return {"id": scenario.id, "message": "Scenario saved successfully"}


@router.delete("/scenarios/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.user_id == user.id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    db.delete(scenario)
    db.commit()
    
    return {"message": "Scenario deleted successfully"}


# Watchlists
@router.get("/watchlists")
def list_watchlists(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    watchlists = db.query(Watchlist).filter(Watchlist.user_id == user.id).all()
    result = []
    for w in watchlists:
        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == w.id).order_by(WatchlistItem.position).all()
        result.append({
            "id": w.id,
            "name": w.name,
            "tickers": [i.ticker for i in items],
            "created_at": w.created_at.isoformat()
        })
    return result


@router.post("/watchlists")
def create_watchlist(
    request: WatchlistRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    watchlist = Watchlist(user_id=user.id, name=request.name)
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    
    for i, ticker in enumerate(request.tickers):
        item = WatchlistItem(watchlist_id=watchlist.id, ticker=ticker, position=i)
        db.add(item)
    
    db.commit()
    
    return {"id": watchlist.id, "message": "Watchlist created"}


@router.put("/watchlists/{watchlist_id}")
def update_watchlist(
    watchlist_id: int,
    request: WatchlistRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    watchlist.name = request.name
    db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist.id).delete()
    
    for i, ticker in enumerate(request.tickers):
        item = WatchlistItem(watchlist_id=watchlist.id, ticker=ticker, position=i)
        db.add(item)
    
    db.commit()
    
    return {"message": "Watchlist updated"}


@router.delete("/watchlists/{watchlist_id}")
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    watchlist = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    db.delete(watchlist)
    db.commit()
    
    return {"message": "Watchlist deleted"}


# Goals
@router.get("/goals")
def list_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "target_date": g.target_date.isoformat(),
            "current_amount": g.current_amount,
            "portfolio_id": g.portfolio_id,
            "created_at": g.created_at.isoformat()
        }
        for g in goals
    ]


@router.post("/goals")
def create_goal(
    request: GoalRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    goal = Goal(
        user_id=user.id,
        name=request.name,
        target_amount=request.target_amount,
        target_date=request.target_date,
        current_amount=request.current_amount,
        portfolio_id=request.portfolio_id
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {"id": goal.id, "message": "Goal created"}


@router.put("/goals/{goal_id}")
def update_goal(
    goal_id: int,
    request: GoalRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal.name = request.name
    goal.target_amount = request.target_amount
    goal.target_date = request.target_date
    goal.current_amount = request.current_amount
    goal.portfolio_id = request.portfolio_id
    
    db.commit()
    
    return {"message": "Goal updated"}


@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    
    return {"message": "Goal deleted"}


# Alerts
@router.get("/alerts")
def list_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    alerts = db.query(Alert).filter(Alert.user_id == user.id).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "alert_type": a.alert_type.value,
            "ticker": a.ticker,
            "threshold_value": a.threshold_value,
            "condition": a.condition,
            "status": a.status.value,
            "created_at": a.created_at.isoformat(),
            "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None
        }
        for a in alerts
    ]


@router.post("/alerts")
def create_alert(
    request: AlertRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    alert = Alert(
        user_id=user.id,
        name=request.name,
        alert_type=AlertTypeEnum(request.alert_type),
        ticker=request.ticker,
        threshold_value=request.threshold_value,
        condition=request.condition
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {"id": alert.id, "message": "Alert created"}


@router.put("/alerts/{alert_id}")
def update_alert(
    alert_id: int,
    request: AlertRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.name = request.name
    alert.alert_type = AlertTypeEnum(request.alert_type)
    alert.ticker = request.ticker
    alert.threshold_value = request.threshold_value
    alert.condition = request.condition
    
    db.commit()
    
    return {"message": "Alert updated"}


@router.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted"}


# Notifications
@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type.value,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}


# Risk Questionnaire
QUESTIONNAIRE = [
    {"id": 1, "question": "What is your age?", "options": [{"text": "Under 30", "score": 10}, {"text": "30-45", "score": 7}, {"text": "45-60", "score": 4}, {"text": "Over 60", "score": 1}]},
    {"id": 2, "question": "What is your investment horizon?", "options": [{"text": "Less than 1 year", "score": 1}, {"text": "1-3 years", "score": 3}, {"text": "3-5 years", "score": 5}, {"text": "5-10 years", "score": 8}, {"text": "More than 10 years", "score": 10}]},
    {"id": 3, "question": "What is your primary investment goal?", "options": [{"text": "Capital preservation", "score": 1}, {"text": "Income generation", "score": 3}, {"text": "Balanced growth", "score": 6}, {"text": "Aggressive growth", "score": 10}]},
    {"id": 4, "question": "How would you describe your knowledge of investments?", "options": [{"text": "Novice", "score": 1}, {"text": "Some knowledge", "score": 3}, {"text": "Experienced", "score": 6}, {"text": "Expert", "score": 10}]},
    {"id": 5, "question": "If your portfolio lost 20% in a month, what would you do?", "options": [{"text": "Sell everything", "score": 1}, {"text": "Sell some", "score": 3}, {"text": "Hold", "score": 6}, {"text": "Buy more", "score": 10}]},
    {"id": 6, "question": "What is your annual income range?", "options": [{"text": "Under ₹5 Lakh", "score": 2}, {"text": "₹5-15 Lakh", "score": 5}, {"text": "₹15-30 Lakh", "score": 7}, {"text": "Over ₹30 Lakh", "score": 10}]},
    {"id": 7, "question": "What percentage of savings are you investing?", "options": [{"text": "Less than 10%", "score": 2}, {"text": "10-25%", "score": 5}, {"text": "25-50%", "score": 7}, {"text": "Over 50%", "score": 10}]},
    {"id": 8, "question": "Do you have emergency funds?", "options": [{"text": "No", "score": 1}, {"text": "Less than 3 months", "score": 3}, {"text": "3-6 months", "score": 7}, {"text": "Over 6 months", "score": 10}]},
    {"id": 9, "question": "What is your risk tolerance?", "options": [{"text": "Very low", "score": 1}, {"text": "Low", "score": 3}, {"text": "Medium", "score": 6}, {"text": "High", "score": 10}]},
    {"id": 10, "question": "Have you invested in stocks before?", "options": [{"text": "Never", "score": 1}, {"text": "A little", "score": 4}, {"text": "Regularly", "score": 8}, {"text": "Extensively", "score": 10}]},
]


@router.get("/risk-questionnaire")
def get_questionnaire():
    return QUESTIONNAIRE


@router.post("/risk-questionnaire/submit")
def submit_questionnaire(
    request: QuestionnaireRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    total_score = 0
    for q in QUESTIONNAIRE:
        answer_id = request.answers.get(str(q["id"]))
        if answer_id:
            for opt in q["options"]:
                if opt.get("text") == answer_id:
                    total_score += opt.get("score", 0)
                    break
    
    # Map score to risk profile
    if total_score <= 25:
        profile = RiskProfileEnum.CONSERVATIVE
    elif total_score <= 50:
        profile = RiskProfileEnum.MODERATE
    else:
        profile = RiskProfileEnum.AGGRESSIVE
    
    # Save response
    response = RiskQuestionnaireResponse(
        user_id=user.id,
        answers_json=json.dumps(request.answers),
        score=total_score,
        risk_profile=profile
    )
    db.add(response)
    db.commit()
    
    return {
        "score": total_score,
        "risk_profile": profile.value,
        "message": f"Your risk profile is {profile.value}"
    }


# Suitability check
@router.get("/suitability/{portfolio_id}")
def check_suitability(
    portfolio_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get latest questionnaire response
    latest_response = db.query(RiskQuestionnaireResponse).filter(
        RiskQuestionnaireResponse.user_id == user.id
    ).order_by(RiskQuestionnaireResponse.created_at.desc()).first()
    
    if not latest_response:
        return {
            "has_questionnaire": False,
            "message": "Please complete the risk questionnaire first"
        }
    
    questionnaire_profile = latest_response.risk_profile
    portfolio_profile = portfolio.risk_profile
    
    is_mismatch = questionnaire_profile != portfolio_profile
    
    return {
        "has_questionnaire": True,
        "questionnaire_profile": questionnaire_profile.value,
        "portfolio_profile": portfolio_profile.value,
        "is_mismatch": is_mismatch,
        "message": "Risk profile mismatch - please review your allocation" if is_mismatch else "Portfolio is suitable for your risk profile"
    }


# Rebalancing suggestions
@router.get("/portfolios/{portfolio_id}/rebalance")
def get_rebalance_suggestions(
    portfolio_id: int,
    drift_threshold: float = 0.05,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    allocation = json.loads(portfolio.allocation_json)
    
    # Simplified rebalancing logic
    # In production, you'd compare to target weights
    suggestions = []
    for item in allocation:
        current_weight = item.get("weight", 0)
        # Placeholder - in real implementation, compare to target
        # For now, suggest rebalancing if weight deviates significantly
        if abs(current_weight - 0.15) > drift_threshold:
            action = "sell" if current_weight > 0.15 else "buy"
            suggestions.append({
                "ticker": item.get("ticker"),
                "current_weight": current_weight,
                "action": action,
                "reason": f"Weight deviation from target"
            })
    
    return {
        "portfolio_id": portfolio_id,
        "drift_threshold": drift_threshold,
        "suggestions": suggestions,
        "needs_rebalancing": len(suggestions) > 0
    }