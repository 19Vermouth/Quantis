import requests
import json

# Test the login endpoint
base_url = "http://localhost:8000"

# Test 1: Login
print("Testing login endpoint...")
login_data = {"email": "demo@quantis.ai", "password": "demo123"}
resp = requests.post(f"{base_url}/api/auth/login", json=login_data)
print(f"Login status: {resp.status_code}")
print(f"Login response: {resp.text[:200]}")

if resp.status_code == 200:
    data = resp.json()
    token = data.get("access_token")
    print(f"Token received: {token[:50]}...")
    
    # Test 2: Use token to get portfolios
    print("\nTesting /api/portfolios with token...")
    headers = {"Authorization": f"Bearer {token}"}
    resp2 = requests.get(f"{base_url}/api/portfolios", headers=headers)
    print(f"Portfolios status: {resp2.status_code}")
    print(f"Portfolios response: {resp2.text[:200]}")
else:
    print("Login failed - cannot test authenticated endpoints")