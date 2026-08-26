@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ========================================
REM TITAN CRM - Start Script
REM ========================================

title TITAN CRM - Startup

echo.
echo ========================================
echo   TITAN CRM - Starting
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found
node --version
echo.

REM Check npm
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm not found!
    echo.
    pause
    exit /b 1
)
echo [OK] npm found
echo.

REM Set paths
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ========================================
echo Starting servers...
echo ========================================
echo.

REM Start backend
echo [1/2] Backend (port 3001)...
start "TITAN CRM - Backend" cmd /k "cd /d %BACKEND_DIR% && echo. && echo === Backend === && echo Starting... && npm run dev"

REM Wait
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/2] Frontend (port 3000)...
start "TITAN CRM - Frontend" cmd /k "cd /d %FRONTEND_DIR% && echo. && echo === Frontend === && echo Starting... && npm run dev"

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Terminal windows opened separately.
echo.
echo To stop:
echo   - Close windows TITAN CRM - Backend and TITAN CRM - Frontend
echo   - Or run stop.bat
echo.
echo ========================================
echo.
echo This window will close in 10 seconds...
timeout /t 10 /nobreak
exit /b 0
