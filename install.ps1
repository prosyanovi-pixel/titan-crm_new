# ============================================================================
#  TITAN CRM - installation & setup wizard for Windows (PowerShell 5.1+)
# ----------------------------------------------------------------------------
#  What it does:
#    1. Checks environment (Node.js, npm, PostgreSQL/psql)
#    2. Configures backend/env (ports, DB, JWT/encryption secrets)
#    3. Creates frontend/.env (API URLs for Vite)
#    4. Creates the database (if permissions and psql are available)
#    5. Installs dependencies (root, backend, frontend)
#    6. Applies DB migrations
#    7. Creates an administrator account (password is prompted)
#
#  Usage:
#    .\install.ps1                  - interactive wizard
#    .\install.ps1 -Yes             - automatic install (defaults)
#    .\install.ps1 -Help            - list all options
# ============================================================================

param(
    [switch]$Yes,            # don't ask questions
    [switch]$SkipDeps,       # skip npm install
    [switch]$SkipDb,         # skip database creation
    [switch]$SkipUsers,      # skip admin creation
    [switch]$SkipMigrate,    # skip migrations
    [string]$BackendPort = "",
    [string]$FrontendUrl = "",
    [string]$DbHost = "",
    [string]$DbPort = "",
    [string]$DbName = "",
    [string]$DbUser = "",
    [string]$DbPass = "",
    [string]$AdminName = "",
    [string]$AdminEmail = "",
    [string]$AdminPass = "",
    [string]$AdminRole = "admin",
    [switch]$Help
)

# ---------------------------------------------------------------- helpers --
function Write-Info  { Write-Host $args -ForegroundColor Cyan }
function Write-Ok    { Write-Host "  OK  $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  WARN $args" -ForegroundColor Yellow }
function Write-Err   { Write-Host "  FAIL $args" -ForegroundColor Red }
function Write-Banner($Text) { Write-Host $Text -ForegroundColor Blue }

function Read-Secret($Prompt) {
    $ss = Read-Host -Prompt $Prompt -AsSecureString
    if ($null -eq $ss) { return "" }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

# Set-Key FILE KEY VALUE : add/replace "KEY=VALUE" line (keeps other content)
function Set-Key {
    param([string]$File, [string]$Key, [string]$Value)
    if (-not (Test-Path $File)) { New-Item -Path $File -ItemType File -Force | Out-Null }
    $lines = [System.Collections.Generic.List[string]]([System.IO.File]::ReadAllLines($File))
    $replaced = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^$Key=") {
            $lines[$i] = "$Key=$Value"; $replaced = $true; break
        }
    }
    if (-not $replaced) { $lines.Add("$Key=$Value") }
    [System.IO.File]::WriteAllLines($File, $lines)
}

function Get-Key {
    param([string]$File, [string]$Key)
    if (-not (Test-Path $File)) { return "" }
    foreach ($line in [System.IO.File]::ReadAllLines($File)) {
        if ($line -match "^$Key=(.*)$") { return $Matches[1] }
    }
    return ""
}

function New-Secret([int]$Bytes) {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $Bytes
    $rng.GetBytes($buf)
    return -join ($buf | ForEach-Object { $_.ToString("x2") })
}

function Invoke-Psql {
    param([string]$Database, [string]$Sql)
    $env:PGPASSWORD = $DbPass
    & psql -h $DbHost -p $DbPort -U $DbUser -d $Database -w -tAc $Sql
    return $LASTEXITCODE -eq 0
}

# -------------------------------------------------------------- help -------
if ($Help) {
    Write-Host "TITAN CRM - installation & setup wizard (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:  .\install.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Yes              don't ask questions (defaults)"
    Write-Host "  -SkipDeps         skip npm install"
    Write-Host "  -SkipDb           skip database creation"
    Write-Host "  -SkipUsers        skip admin account creation"
    Write-Host "  -SkipMigrate      skip DB migrations"
    Write-Host "  -BackendPort NNNN backend port (default 5001)"
    Write-Host "  -FrontendUrl URL  frontend URL for emails"
    Write-Host "  -DbHost HOST      PostgreSQL host"
    Write-Host "  -DbPort PORT      PostgreSQL port"
    Write-Host "  -DbName NAME      database name"
    Write-Host "  -DbUser USER      PostgreSQL user"
    Write-Host "  -DbPass PASS      PostgreSQL password"
    Write-Host "  -AdminEmail EMAIL admin e-mail (creates account)"
    Write-Host "  -AdminPass PASS   admin password"
    Write-Host "  -AdminName NAME   admin display name"
    Write-Host "  -AdminRole ROLE   admin role (default admin)"
    Write-Host "  -Help             this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\install.ps1"
    Write-Host "  .\install.ps1 -Yes"
    Write-Host "  .\install.ps1 -Yes -DbName crm -DbPass secret -SkipDeps"
    Write-Host "  .\install.ps1 -Yes -AdminEmail boss@mail.ru -AdminPass 'Qwerty123!'"
    exit 0
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$EnvFile     = Join-Path $BackendDir "env"
$FeEnv       = Join-Path $FrontendDir ".env"

Write-Banner "================================================================"
Write-Banner "   TITAN CRM - installation & setup wizard"
Write-Banner "================================================================"
if ($Yes) { Write-Info "Mode: automatic installation (-Yes)" }

# ----------------------------------------------------- check environment --
Write-Host ""; Write-Info "==> Checking environment"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js is not installed. Install Node.js >= 18: https://nodejs.org/"; exit 1
}
$nodeVer = (& node --version).TrimStart("v")
if ([int]($nodeVer.Split(".")[0]) -lt 18) {
    Write-Err "Node.js >= 18 required, found $nodeVer"; exit 1
}
Write-Ok "Node.js $nodeVer"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Err "npm not found"; exit 1
}
Write-Ok "npm $(& npm --version)"
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Ok "psql $((& psql --version) -replace '.*\s(\d[\w.]*).*','$1')"
} else {
    Write-Warn "psql not found in PATH - DB creation will be skipped"
    Write-Warn "Install PostgreSQL and add its bin\ to PATH (see INSTALL.md)"
}

# ------------------------------------------------------ collect options ----
$defPort   = Get-Key $EnvFile "PORT";         if (-not $defPort)   { $defPort = "5001" }
$defFeUrl  = Get-Key $EnvFile "FRONTEND_URL"; if (-not $defFeUrl)  { $defFeUrl = "http://localhost:3001" }
$defDbh    = Get-Key $EnvFile "DB_HOST";      if (-not $defDbh)    { $defDbh = "localhost" }
$defDbp    = (Get-Key $EnvFile "DB_PORT").Trim(); if (-not $defDbp) { $defDbp = "5432" }
$defDbn    = Get-Key $EnvFile "DB_NAME";      if (-not $defDbn)    { $defDbn = "titancrm1" }
$defDbu    = Get-Key $EnvFile "DB_USER";      if (-not $defDbu)    { $defDbu = "myuser" }
$defDbpw   = Get-Key $EnvFile "DB_PASSWORD"

if ($BackendPort) { $defPort = $BackendPort }
if ($FrontendUrl) { $defFeUrl = $FrontendUrl }
if ($DbHost)      { $defDbh = $DbHost }
if ($DbPort)      { $defDbp = $DbPort }
if ($DbName)      { $defDbn = $DbName }
if ($DbUser)      { $defDbu = $DbUser }
if ($DbPass)      { $defDbpw = $DbPass }

if ($Yes) {
    $BACKEND_PORT = $defPort; $FRONTEND_URL = $defFeUrl; $DB_HOST = $defDbh
    $DB_PORT = $defDbp; $DB_NAME = $defDbn; $DB_USER = $defDbu; $DB_PASS = $defDbpw
} else {
    Write-Host ""; Write-Info "==> System settings (press Enter for default)"
    $BACKEND_PORT = Read-Host "Backend port [$defPort]"; if (-not $BACKEND_PORT) { $BACKEND_PORT = $defPort }
    $FRONTEND_URL = Read-Host "Frontend URL for emails [$defFeUrl]"; if (-not $FRONTEND_URL) { $FRONTEND_URL = $defFeUrl }
    Write-Host ""
    Write-Info "PostgreSQL connection:"
    $DB_HOST = Read-Host "Host [$defDbh]"; if (-not $DB_HOST) { $DB_HOST = $defDbh }
    $DB_PORT = Read-Host "Port [$defDbp]"; if (-not $DB_PORT) { $DB_PORT = $defDbp }
    $DB_NAME = Read-Host "Database name [$defDbn]"; if (-not $DB_NAME) { $DB_NAME = $defDbn }
    $DB_USER = Read-Host "User [$defDbu]"; if (-not $DB_USER) { $DB_USER = $defDbu }
    if ($defDbpw) {
        Write-Warn "DB password: keeping existing (edit backend/env to change)"
        $DB_PASS = $defDbpw
    } else {
        $DB_PASS = Read-Secret "DB password"
    }
}

# --------------------------------------------------------- configure env ---
Write-Host ""; Write-Info "==> Configuring backend/env and frontend/.env"
if (Test-Path $EnvFile) {
    if ($Yes -or ((Read-Host "Update existing backend/env? [Y/n]") -notmatch "^[Nn]")) {
        Copy-Item $EnvFile "$EnvFile.bak.$(Get-Date -Format yyyyMMddHHmmss)"
        Write-Ok "Backup saved"
    }
} elseif (Test-Path (Join-Path $BackendDir "env.example")) {
    Copy-Item (Join-Path $BackendDir "env.example") $EnvFile
    Write-Ok "backend/env created from env.example"
} else {
    Write-Err "backend/env.example not found"; exit 1
}

Set-Key $EnvFile "PORT"          $BACKEND_PORT
Set-Key $EnvFile "API_URL"       "http://localhost:$BACKEND_PORT"
Set-Key $EnvFile "FRONTEND_URL"  $FRONTEND_URL
Set-Key $EnvFile "DB_HOST"       $DB_HOST
Set-Key $EnvFile "DB_PORT"       $DB_PORT
Set-Key $EnvFile "DB_NAME"       $DB_NAME
Set-Key $EnvFile "DB_USER"       $DB_USER
if ($DB_PASS) { Set-Key $EnvFile "DB_PASSWORD" $DB_PASS }

if ((Get-Key $EnvFile "JWT_SECRET") -in @("", "change_this_secret_key_to_something_secure")) {
    Set-Key $EnvFile "JWT_SECRET" (New-Secret 32); Write-Ok "JWT_SECRET regenerated"
}
if ((Get-Key $EnvFile "ENCRYPTION_KEY") -in @("", "mail-encryption-key-2024-change-this")) {
    Set-Key $EnvFile "ENCRYPTION_KEY" (New-Secret 16); Write-Ok "ENCRYPTION_KEY regenerated"
}
Write-Ok "backend/env configured (port $BACKEND_PORT, DB $DB_NAME on $DB_HOST`:$DB_PORT)"

if (Test-Path $FeEnv) {
    if ($Yes -or ((Read-Host "Recreate frontend/.env? [Y/n]") -notmatch "^[Nn]")) {
        Copy-Item (Join-Path $FrontendDir ".env.example") $FeEnv -Force
        Write-Ok "frontend/.env recreated"
    }
} else {
    if (Test-Path (Join-Path $FrontendDir ".env.example")) {
        Copy-Item (Join-Path $FrontendDir ".env.example") $FeEnv
    } else {
        Write-Err "frontend/.env.example not found"; exit 1
    }
}
Set-Key $FeEnv "VITE_API_URL"         "http://localhost:$BACKEND_PORT/api"
Set-Key $FeEnv "VITE_API_BACKEND_URL" "http://localhost:$BACKEND_PORT"
Write-Ok "frontend/.env configured (API: http://localhost:$BACKEND_PORT/api)"

# --------------------------------------------------------- create DB --------
if (-not $SkipDb) {
    Write-Host ""; Write-Info "==> PostgreSQL database"
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Warn "psql not found - create the DB manually:  CREATE DATABASE `"$DB_NAME`";"
    } else {
        $env:PGPASSWORD = $DB_PASS
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -tAc "SELECT 1" *> $null
        if ($LASTEXITCODE -eq 0) {
            $exists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'"
            if ($exists -match "1") {
                Write-Ok "Database '$DB_NAME' already exists"
            } else {
                & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -c "CREATE DATABASE `"$DB_NAME`"" *> $null
                if ($LASTEXITCODE -eq 0) { Write-Ok "Database '$DB_NAME' created" }
                else { Write-Warn "Could not create DB (no rights?) - create manually" }
            }
            & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -c "CREATE EXTENSION IF NOT EXISTS pgcrypto" *> $null
            if ($LASTEXITCODE -eq 0) { Write-Ok "pgcrypto available" }
            else { Write-Warn "pgcrypto not enabled - migrate.js will try" }
        } else {
            Write-Warn "No access to PostgreSQL ($DB_HOST`:$DB_PORT as $DB_USER)"
            Write-Warn "Start PostgreSQL and create the database manually."
        }
    }
}

# ------------------------------------------------------- install deps -------
if (-not $SkipDeps) {
    Write-Host ""; Write-Info "==> Installing npm dependencies"
    foreach ($pair in @(@("ROOT", $ProjectRoot), @("BACKEND", $BackendDir), @("FRONTEND", $FrontendDir))) {
        $name = $pair[0]; $dir = $pair[1]
        if (-not (Test-Path (Join-Path $dir "package.json"))) {
            Write-Warn "[$name] package.json not found - skipped"; continue
        }
        Write-Info "[$name] npm install in $dir"
        Push-Location $dir
        npm install
        if ($LASTEXITCODE -eq 0) { Write-Ok "[$name] dependencies installed" }
        else { Write-Err "[$name] npm install failed" }
        Pop-Location
    }
}

# --------------------------------------------------------- migrations -------
if (-not $SkipMigrate) {
    Write-Host ""; Write-Info "==> Applying DB migrations"
    Push-Location $BackendDir
    node migrate.js
    $migOk = $LASTEXITCODE -eq 0
    Pop-Location
    if (-not $migOk) {
        Write-Err "Migrations failed. Check backend/env and DB access."; exit 1
    }
    Write-Ok "Migrations applied"
}

# -------------------------------------------------- create admin account ----
if (-not $SkipUsers) {
    $adminName = $AdminName; if (-not $adminName) { $adminName = "Administrator" }
    $adminEmail = $AdminEmail; $adminPass = $AdminPass

    if (-not $Yes) {
        Write-Host ""; Write-Info "==> Administrator account"
        $createAdmin = Read-Host "Create administrator account? [Y/n]"
        if ($createAdmin -match "^[Nn]") { $adminEmail = "" }
        else {
            if (-not $adminEmail) { $adminEmail = Read-Host "E-mail (login)" }
            while (-not $adminPass -or $adminPass.Length -lt 6) {
                $adminPass = Read-Secret "Password (min 6 chars)"
            }
            $adminPass2 = Read-Secret "Password again"
            if ($adminPass2 -ne $adminPass) { Write-Err "Passwords do not match"; exit 1 }
        }
    }

    if ($adminEmail -and $adminPass) {
        if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
            Write-Warn "psql not found - admin not created (create later in UI)"
        } else {
            $env:PGPASSWORD = $DB_PASS
            & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -tAc "SELECT 1" *> $null
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""; Write-Info "==> Creating administrator ($adminEmail)"
                Push-Location $BackendDir
                $hash = & node -e "process.stdout.write(require('bcrypt').hashSync(process.argv[1], 10))" $adminPass
                Pop-Location
                $id  = [guid]::NewGuid().ToString()
                $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                $escName  = $adminName.Replace("'", "''")
                $escEmail = $adminEmail.Replace("'", "''")
                $existing = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -tAc "SELECT id FROM users WHERE email='$escEmail' LIMIT 1"
                if ($existing) {
                    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -c "UPDATE users SET name='$escName', role='$AdminRole', status='active', password_hash='$hash', updated_at='$now' WHERE email='$escEmail'" *> $null
                    Write-Ok "User '$adminEmail' updated (password/role reset)"
                } else {
                    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -c "INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at) VALUES ('$id', '$escName', '$escEmail', '$hash', '$AdminRole', 'active', '$now', '$now')" *> $null
                    Write-Ok "Administrator created: $adminEmail (role: $AdminRole)"
                }
            } else {
                Write-Warn "DB not reachable - admin not created"
            }
        }
    }
}

# ------------------------------------------------------------ summary ------
Write-Host ""
Write-Banner "================================================================"
Write-Banner "   TITAN CRM installed and configured!"
Write-Banner "================================================================"
Write-Host ""
Write-Info "Backend:  cd backend; npm run dev      ->  http://localhost:$BACKEND_PORT/api"
Write-Info "Frontend: cd frontend; npm run dev     ->  $FRONTEND_URL"
Write-Info "Migrations: cd backend; npm run migrate  (when needed)"
Write-Host ""
Write-Host "Use the created administrator account to sign in." -ForegroundColor Yellow