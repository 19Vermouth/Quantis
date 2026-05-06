@echo off
cd C:\Users\Dell\Major Project\AI-Fintech\backend
start /B python -m uvicorn app.main:app --port 8000 > backend.log 2>&1
timeout /t 5 /nobreak > nul
exit