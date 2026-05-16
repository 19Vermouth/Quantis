import sys
sys.path.insert(0, '.')
from api.auth import login, LoginRequest
from models.database import SessionLocal

db = SessionLocal()
req = LoginRequest(email='demo@quantis.ai', password='demo123')
try:
    result = login(req, db)
    print("Login successful!")
    print("Token:", result['access_token'][:50] + "...")
except Exception as e:
    print("Login failed:", str(e))
finally:
    db.close()