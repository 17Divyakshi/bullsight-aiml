
@echo off
title BULLSIGHT AI - Automatic Launcher
cd /d "%~dp0"

echo ==========================================
echo       BULLSIGHT AI - STARTING
echo ==========================================

where mongod >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    if not exist "mongodb_data" mkdir mongodb_data
    start "MongoDB" /min cmd /k "mongod --dbpath mongodb_data --port 27017"
)

echo [1/3] Starting Express Backend...
start "Express Backend - 5000" /D "%~dp0server" cmd /k "npm start"

echo [2/3] Starting Python AIML Backend...
start "Python AIML - 8000" /D "%~dp0backend" cmd /k "..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [3/3] Starting Production Frontend...
start "BULLSIGHT Frontend - 4173" /D "%~dp0frontend" cmd /k "npx vite preview --host 0.0.0.0 --port 4173 --strictPort"

timeout /t 10 /nobreak >nul

start "" "http://localhost:4173"

echo ==========================================
echo Check the server windows for startup errors.
echo Website: http://localhost:4173
echo ==========================================

pause
