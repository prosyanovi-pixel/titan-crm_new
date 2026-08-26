@echo off
REM ========================================
REM TITAN CRM - Stop Script
REM ========================================

title TITAN CRM - Stop

echo.
echo ========================================
echo   TITAN CRM - Stopping servers
echo ========================================
echo.

echo Stopping Backend...
taskkill /F /FI "WINDOWTITLE eq TITAN CRM - Backend" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend stopped
) else (
    echo [INFO] Backend was not running
)

echo.
echo Stopping Frontend...
taskkill /F /FI "WINDOWTITLE eq TITAN CRM - Frontend" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend stopped
) else (
    echo [INFO] Frontend was not running
)

echo.
echo ========================================
echo   All servers stopped!
echo ========================================
echo.
pause
