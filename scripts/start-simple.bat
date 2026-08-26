@echo off
setlocal enabledelayedexpansion

REM ========================================
REM TITAN CRM - Start Script
REM ========================================

title TITAN CRM Startup

echo.
echo ========================================
echo    TITAN CRM - Starting...
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)

echo [OK] npm found
echo.

REM Set paths
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

REM Start backend
echo [1/2] Starting backend server...
start "TITAN CRM - Backend" cmd /k "cd /d %BACKEND_DIR% && echo Starting backend on port 3001... && npm run dev"

REM Wait
timeout /t 2 /nobreak >nul

REM Start frontend
echo [2/2] Starting frontend server...
start "TITAN CRM - Frontend" cmd /k "cd /d %FRONTEND_DIR% && echo Starting frontend on port 3000... && npm run dev"

echo.
echo ========================================
echo    PROJECT STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo To stop:
echo   1. Close terminal windows
echo   2. Or run stop.bat
echo.
echo ========================================
echo.

REM Wait and close
timeout /t 3 /nobreak >nul
exit /b 0
