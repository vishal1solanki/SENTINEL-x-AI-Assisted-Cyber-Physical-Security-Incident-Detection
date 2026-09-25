@echo off
title SENTINEL-X - 1-Click Docker Launch
color 0B
echo =====================================================================
echo       SENTINEL-X: AI-ASSISTED CYBER-PHYSICAL SOC PLATFORM
echo                     1-CLICK DOCKER LAUNCHER
echo =====================================================================
echo.
cd /d %~dp0

echo [*] Spinning up SENTINEL-X Docker containers (Backend, Frontend, n8n)...
docker compose up -d

echo.
echo =====================================================================
echo  [SUCCESS] SENTINEL-X Containers are active!
echo.
echo  - Defender SOC Dashboard  : http://localhost:5173/dashboard
echo  - Red Team Attacker Site  : http://localhost:5173/attacker
echo  - 3D Server Room Digital  : http://localhost:5173/dashboard (front & center)
echo  - n8n Workflow Automation : http://localhost:5678
echo  - Backend API & Swagger   : http://localhost:8000/docs
echo =====================================================================
echo.
echo [*] Opening Defender SOC Dashboard and Attacker Website in browser...
start http://localhost:5173/dashboard
start http://localhost:5173/attacker
start http://localhost:5678
echo.
echo Press any key to close this launcher window (containers keep running in background).
pause >nul

