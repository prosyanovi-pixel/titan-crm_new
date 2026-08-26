@echo off
REM TITAN CRM - Script for initializing Node.js dependencies
REM Installs dependencies in root, backend, and frontend directories

echo ╔════════════════════════════════════════════╗
echo ║     TITAN CRM - Dependencies Installer     ║
echo ╚════════════════════════════════════════════╝
echo.

REM Get the script's directory (project root)
set PROJECT_ROOT=%~dp0
set PROJECT_ROOT=%PROJECT_ROOT:~0,-1%

REM Function to install dependencies
:install_deps
set DIR=%1
set NAME=%2

echo [%NAME%] Installing dependencies...

if not exist "%DIR%\package.json" (
    echo [%NAME%] Error: package.json not found in %DIR%
    set FAILED=1
    goto :eof
)

pushd "%DIR%"

call npm install
if %ERRORLEVEL% neq 0 (
    echo [%NAME%] Failed to install dependencies
    popd
    set FAILED=1
    goto :eof
)

echo [%NAME%] Dependencies installed successfully
popd
echo.
goto :eof

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js first: https://nodejs.org/
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not available
    exit /b 1
)

for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i

echo Node.js version: %NODE_VERSION%
echo npm version: %NPM_VERSION%
echo.

REM Initialize failed flag
set FAILED=0

REM Root dependencies (E2E tests)
call :install_deps "%PROJECT_ROOT%" "ROOT"

REM Backend dependencies
call :install_deps "%PROJECT_ROOT%\backend" "BACKEND"

REM Frontend dependencies
call :install_deps "%PROJECT_ROOT%\frontend" "FRONTEND"

REM Summary
echo ╔════════════════════════════════════════════╗
if %FAILED% equ 0 (
    echo ║     All dependencies installed successfully! ║
    echo ╚════════════════════════════════════════════╝
    echo.
    echo Next steps:
    echo   Backend:  cd backend ^&^& npm run dev
    echo   Frontend: cd frontend ^&^& npm run dev
    echo.
) else (
    echo ║     Some installations failed!             ║
    echo ╚════════════════════════════════════════════╝
    echo.
    echo Please check the errors above and try again.
    exit /b 1
)

exit /b 0
