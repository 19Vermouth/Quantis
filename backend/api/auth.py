from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import jwt
import bcrypt

from models.database import get_db

router = APIRouter(prefix="/api", tags=["Authentication"])


def create_access_token(user_id: str) -> str:
    from core.config import settings
    return jwt.encode({"sub": user_id}, settings.jwt_secret, algorithm="HS256")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


@router.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    from models.database import User
    
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not bcrypt.checkpw(req.password.encode(), user.password_hash.encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token(user.id)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name}
        }
    except Exception as e:
        print(f"Login error: {e}")
        raise


@router.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    from models.database import User
    
    try:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
        user = User(id=f"user_{req.email}", email=req.email, name=req.name, password_hash=password_hash)
        db.add(user)
        db.commit()
        
        token = create_access_token(user.id)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "name": user.name}
        }
    except Exception as e:
        print(f"Register error: {e}")
        raise