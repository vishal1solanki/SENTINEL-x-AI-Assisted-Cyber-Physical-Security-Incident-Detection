@echo off
title SENTINEL-X - Stop Docker
color 0C
cd /d %~dp0
echo Stopping all SENTINEL-X containers...
docker compose down
echo Containers stopped successfully.
pause
