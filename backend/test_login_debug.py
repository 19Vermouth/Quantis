import requests
import traceback

base_url = "http://localhost:8000"

try:
    resp = requests.post(
        f"{base_url}/api/auth/login", 
        json={"email": "demo@quantis.ai", "password": "demo123"},
        timeout=5
    )
    print(f"Status: {resp.status_code}")
    print(f"Headers: {resp.headers}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()