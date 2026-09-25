@echo off
title SENTINEL-X - 1-Click Local Launch
color 0A
echo =====================================================================
echo       SENTINEL-X: LOCAL LAUNCHER (FastAPI + Vite React)
echo =====================================================================
cd /d %~dp0
echo [*] Starting Backend Server on http://localhost:8000 ...
start "SENTINEL-X Backend (Port 8000)" powershell -NoExit -Command "cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [*] Starting Frontend SOC Dashboard on http://localhost:5173 ...
start "SENTINEL-X Frontend (Port 5173)" powershell -NoExit -Command "cd frontend; npm.cmd run dev"

echo [*] Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo.
echo [SUCCESS] Local servers launched in separate windows!
echo Web SOC Dashboard : http://localhost:5173
echo Backend API Docs  : http://localhost:8000/docs
pause

