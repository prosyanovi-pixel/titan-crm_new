# TITAN CRM - Script for initializing Node.js dependencies
# Installs dependencies in root, backend, and frontend directories

#Requires -Version 5.0

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║     TITAN CRM - Dependencies Installer     ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Get the script's directory (project root)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to install dependencies
function Install-Deps {
    param(
        [string]$Dir,
        [string]$Name
    )
    
    Write-Host "[$Name] Installing dependencies..." -ForegroundColor Yellow
    
    $PackageJson = Join-Path $Dir "package.json"
    if (-not (Test-Path $PackageJson)) {
        Write-Host "[$Name] Error: package.json not found in $Dir" -ForegroundColor Red
        return $false
    }
    
    $OriginalLocation = Get-Location
    Set-Location $Dir
    
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$Name] Dependencies installed successfully" -ForegroundColor Green
            Set-Location $OriginalLocation
            Write-Host ""
            return $true
        } else {
            Write-Host "[$Name] Failed to install dependencies" -ForegroundColor Red
            Set-Location $OriginalLocation
            Write-Host ""
            return $false
        }
    } catch {
        Write-Host "[$Name] Error: $_" -ForegroundColor Red
        Set-Location $OriginalLocation
        Write-Host ""
        return $false
    }
}

# Check if Node.js is installed
try {
    $NodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
} catch {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js first: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
try {
    $NpmVersion = npm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found"
    }
} catch {
    Write-Host "Error: npm is not available" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $NodeVersion" -ForegroundColor Green
Write-Host "npm version: $NpmVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies in all directories
$Failed = $false

# Root dependencies (E2E tests)
if (-not (Install-Deps -Dir $ProjectRoot -Name "ROOT")) {
    $Failed = $true
}

# Backend dependencies
if (-not (Install-Deps -Dir (Join-Path $ProjectRoot "backend") -Name "BACKEND")) {
    $Failed = $true
}

# Frontend dependencies
if (-not (Install-Deps -Dir (Join-Path $ProjectRoot "frontend") -Name "FRONTEND")) {
    $Failed = $true
}

# Summary
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Blue
if (-not $Failed) {
    Write-Host "║     All dependencies installed successfully! ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  Backend:  cd backend; npm run dev" -ForegroundColor Yellow
    Write-Host "  Frontend: cd frontend; npm run dev" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "║     Some installations failed!             ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Please check the errors above and try again." -ForegroundColor Red
    exit 1
}
