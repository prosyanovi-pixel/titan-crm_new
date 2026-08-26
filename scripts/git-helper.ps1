# ============================================================
# TITAN CRM - Git Helper Script (PowerShell)
# ============================================================

# Отключаем лишние выводы Git
$env:GIT_TERMINAL_PROMPT = "0"
$env:GIT_PAGER = "cat"
$env:GIT_PROGRESS_DELAY = "0"

# Принудительная UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# --- Функции ---

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   🔧 Git Helper Script" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   1) 📦 Коммит + пуш всех изменений" -ForegroundColor Yellow
    Write-Host "   2) 🌿 Создать новую ветку" -ForegroundColor Yellow
    Write-Host "   3) 🔄 Обновить текущую ветку (pull)" -ForegroundColor Yellow
    Write-Host "   4) 📊 Показать статус" -ForegroundColor Yellow
    Write-Host "   5) 📜 Показать историю (log)" -ForegroundColor Yellow
    Write-Host "   6) 🗑️  Очистить старые ветки" -ForegroundColor Yellow
    Write-Host "   7) 🚀 Быстрый коммит (с авто-сообщением)" -ForegroundColor Yellow
    Write-Host "   8) 🌐 Открыть GitHub для создания PR" -ForegroundColor Yellow
    Write-Host "   i) 🚀 Инициализировать Git репозиторий" -ForegroundColor Yellow
    Write-Host "   u) 👤 Настроить пользователя Git" -ForegroundColor Yellow
    Write-Host "   0) 🚪 Выход" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Check-GitRepository {
    $isGitRepo = Test-Path ".git"
    if (-not $isGitRepo) {
        Write-Host "   ⚠️  Git репозиторий не инициализирован!" -ForegroundColor Yellow
        Write-Host "   Используйте пункт 'i' для инициализации" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Check-GitUser {
    $userName = git config --global user.name 2>$null
    $userEmail = git config --global user.email 2>$null
    
    if (-not $userName -or -not $userEmail) {
        Write-Host "   ⚠️  Пользователь Git не настроен!" -ForegroundColor Yellow
        Write-Host "   Используйте пункт 'u' для настройки" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Check-GitRemote {
    $remoteUrl = git config --get remote.origin.url 2>$null
    if (-not $remoteUrl) {
        Write-Host "   ⚠️  Удаленный репозиторий не настроен!" -ForegroundColor Yellow
        Write-Host "   Используйте пункт 'i' для инициализации с remote" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Setup-GitUser {
    Write-Host ""
    Write-Host "   👤 Настройка пользователя Git" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    
    # Показываем текущие настройки
    $currentName = git config --global user.name 2>$null
    $currentEmail = git config --global user.email 2>$null
    
    if ($currentName -or $currentEmail) {
        Write-Host "   📋 Текущие настройки:" -ForegroundColor Yellow
        if ($currentName) { Write-Host "   Имя: $currentName" -ForegroundColor Gray }
        if ($currentEmail) { Write-Host "   Email: $currentEmail" -ForegroundColor Gray }
        Write-Host ""
    }
    
    Write-Host "   💡 Для работы с Git необходимо указать имя и email" -ForegroundColor Cyan
    Write-Host "   (Эти данные будут видны в истории коммитов)" -ForegroundColor Gray
    Write-Host ""
    
    $name = Read-HostSafe "   📝 Введите ваше имя (для коммитов)"
    if ($name) {
        git config --global user.name "$name"
        Write-Host "   ✅ Имя установлено: $name" -ForegroundColor Green
    }
    
    $email = Read-HostSafe "   📧 Введите ваш email (для коммитов)"
    if ($email) {
        git config --global user.email "$email"
        Write-Host "   ✅ Email установлен: $email" -ForegroundColor Green
    }
    
    if ($name -or $email) {
        Write-Host ""
        Write-Host "   📋 Проверка настроек:" -ForegroundColor Yellow
        git config --list | Select-String "user\."
        Write-Host ""
        Write-Host "   ✅ Пользователь Git настроен!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
    Read-Host
}

function Initialize-GitRepository {
    Write-Host ""
    Write-Host "   🚀 Инициализация Git репозитория" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    
    # Проверяем настройки пользователя
    $userName = git config --global user.name 2>$null
    $userEmail = git config --global user.email 2>$null
    
    if (-not $userName -or -not $userEmail) {
        Write-Host "   ⚠️  Пользователь Git не настроен!" -ForegroundColor Yellow
        Write-Host "   Сначала настройте пользователя (пункт 'u')" -ForegroundColor Yellow
        Write-Host ""
        Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
        Read-Host
        return
    }
    
    # Проверяем, есть ли уже .git
    if (Test-Path ".git") {
        Write-Host "   ⚠️  Git репозиторий уже инициализирован" -ForegroundColor Yellow
        
        # Проверяем remote
        $remoteUrl = git config --get remote.origin.url 2>$null
        if (-not $remoteUrl) {
            Write-Host "   💡 Удаленный репозиторий не настроен" -ForegroundColor Yellow
            $addRemote = Read-HostSafe "   Добавить удаленный репозиторий? (y/n)"
            if ($addRemote -eq 'y') {
                Add-GitRemote
            }
        }
        
        Write-Host ""
        Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
        Read-Host
        return
    }
    
    # Инициализируем репозиторий
    Write-Host "   📁 Инициализация Git..." -ForegroundColor Gray
    git init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Ошибка инициализации Git" -ForegroundColor Red
        Read-Host
        return
    }
    
    Write-Host "   ✅ Git репозиторий инициализирован" -ForegroundColor Green
    
    # Создаем .gitignore если его нет
    if (-not (Test-Path ".gitignore")) {
        Write-Host "   📝 Создаем .gitignore..." -ForegroundColor Gray
        @"
# Node.js / JavaScript
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
pip-log.txt
pip-delete-this-directory.txt
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Logs
*.log
logs/
.logs/

# Build outputs
dist/
build/
out/
*.exe
*.dll
*.so
*.dylib

# Database
*.db
*.sqlite
*.sqlite3
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
        Write-Host "   ✅ .gitignore создан" -ForegroundColor Green
    }
    
    # Добавляем все файлы
    Write-Host "   📦 Добавляем файлы в репозиторий..." -ForegroundColor Gray
    git add .
    
    # Создаем первый коммит
    Write-Host "   💾 Создаем первый коммит..." -ForegroundColor Gray
    $projectName = Split-Path (Get-Location) -Leaf
    git commit -m "Initial commit: $projectName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Первый коммит создан!" -ForegroundColor Green
        
        # Показываем статус
        Write-Host ""
        Write-Host "   📊 Текущий статус:" -ForegroundColor Yellow
        git status --short
        
        # Предлагаем добавить удаленный репозиторий
        Write-Host ""
        Add-GitRemote
    }
    
    Write-Host ""
    Write-Host "   ✅ Git репозиторий готов к работе!" -ForegroundColor Green
    Write-Host ""
    Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
    Read-Host
}

function Add-GitRemote {
    Write-Host "   🌐 Настройка удаленного репозитория" -ForegroundColor Cyan
    Write-Host "   💡 Примеры URL:" -ForegroundColor Gray
    Write-Host "   - GitHub (SSH): git@github.com:username/repo.git" -ForegroundColor Gray
    Write-Host "   - GitHub (HTTPS): https://github.com/username/repo.git" -ForegroundColor Gray
    
    $remoteUrl = Read-HostSafe "   🔗 Введите URL удаленного репозитория (или Enter для пропуска)"
    
    if ($remoteUrl) {
        git remote add origin $remoteUrl
        Write-Host "   ✅ Удаленный репозиторий добавлен" -ForegroundColor Green
        
        $pushNow = Read-HostSafe "   ⬆️  Отправить изменения в remote? (y/n)"
        if ($pushNow -eq 'y') {
            Write-Host "   ⏳ Отправка в remote..." -ForegroundColor Gray
            
            # Пробуем main
            git push -u origin main 2>&1
            if ($LASTEXITCODE -ne 0) {
                # Если main не работает, пробуем master
                Write-Host "   ⚠️  Пробуем ветку master..." -ForegroundColor Yellow
                git push -u origin master 2>&1
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Изменения отправлены в remote!" -ForegroundColor Green
                $repoUrl = Convert-GitUrlToHttps
                if ($repoUrl) {
                    Write-Host "   🔗 Репозиторий: $repoUrl" -ForegroundColor Cyan
                }
            } else {
                Write-Host "   ❌ Ошибка отправки. Проверьте URL и права доступа" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ⏭️  Пропускаем настройку remote" -ForegroundColor Gray
    }
}

function Convert-GitUrlToHttps {
    $remoteUrl = git config --get remote.origin.url 2>$null
    if (-not $remoteUrl) {
        return $null
    }
    
    if ($remoteUrl -match '^git@([^:]+):(.+)$') {
        $hostName = $Matches[1]
        $path = $Matches[2] -replace '\.git$', ''
        return "https://$hostName/$path"
    }
    if ($remoteUrl -match '^ssh://git@([^/]+)/(.+)$') {
        $hostName = $Matches[1]
        $path = $Matches[2] -replace '\.git$', ''
        return "https://$hostName/$path"
    }
    if ($remoteUrl -match '^https?://') {
        $url = $remoteUrl -replace '\.git$', ''
        $url = $url -replace '^http://', 'https://'
        return $url
    }
    
    $url = $remoteUrl -replace '\.git$', ''
    return $url
}

function Read-HostSafe {
    param(
        [string]$Prompt = ""
    )
    
    if ($Prompt) {
        Write-Host -NoNewline $Prompt -ForegroundColor Yellow
    } else {
        Write-Host -NoNewline "   ➜ " -ForegroundColor DarkGray
    }
    
    $input = Read-Host
    if ($input -eq $null) {
        return ""
    }
    return $input.Trim()
}

# --- Основной цикл ---
while ($true) {
    Show-Menu
    $choice = Read-HostSafe "   Выберите действие"
    
    # Если пустой ввод - показываем ошибку
    if ([string]::IsNullOrEmpty($choice)) {
        Write-Host "   ⚠️  Пожалуйста, введите номер действия" -ForegroundColor Yellow
        Write-Host ""
        Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
        Read-Host
        continue
    }
    
    # Проверка на инициализацию Git (кроме пунктов i, u, 0)
    if ($choice -ne 'i' -and $choice -ne 'u' -and $choice -ne '0') {
        if (-not (Check-GitRepository)) {
            Write-Host ""
            Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
            Read-Host
            continue
        }
    }
    
    switch ($choice) {
        'u' {
            Setup-GitUser
        }
        'i' {
            Initialize-GitRepository
        }
        '1' {
            # Проверяем пользователя
            if (-not (Check-GitUser)) {
                Write-Host ""
                Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
                Read-Host
                continue
            }
            
            # Проверяем remote
            if (-not (Check-GitRemote)) {
                Write-Host ""
                Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
                Read-Host
                continue
            }
            
            $status = git status -s 2>$null
            if (-not $status) {
                Write-Host "   ❌ Нет изменений для коммита" -ForegroundColor Red
            } else {
                Write-Host "   📊 Изменения:" -ForegroundColor Yellow
                git status -s
                $msg = Read-HostSafe "   📝 Сообщение коммита"
                if (-not $msg) {
                    $msg = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
                }
                Write-Host "   ⏳ Выполняется коммит..." -ForegroundColor Gray
                git add . 2>$null
                git commit -m $msg
                git push
                Write-Host "   ✅ Готово!" -ForegroundColor Green
            }
        }
        '2' {
            # Проверяем пользователя
            if (-not (Check-GitUser)) {
                Write-Host ""
                Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
                Read-Host
                continue
            }
            
            $branch = Read-HostSafe "   📝 Имя новой ветки"
            
            if ($branch) {
                git checkout -b $branch
                Write-Host "   ✅ Ветка $branch создана" -ForegroundColor Green
                $answer = Read-HostSafe "   🌐 Создать PR? (y/n)"
                if ($answer -eq 'y') {
                    git push -u origin $branch
                    $repoUrl = Convert-GitUrlToHttps
                    if ($repoUrl) {
                        Write-Host "   🔗 Ссылка для PR: $($repoUrl)/pull/new/$branch" -ForegroundColor Cyan
                        $createPr = Read-HostSafe "   Открыть ссылку в браузере? (y/n)"
                        if ($createPr -eq 'y') {
                            Start-Process "$repoUrl/pull/new/$branch"
                        }
                    }
                }
            }
        }
        '3' {
            Write-Host "   🔄 Выполняем git pull..." -ForegroundColor Yellow
            git pull
            Write-Host "   ✅ Обновлено!" -ForegroundColor Green
        }
        '4' {
            Write-Host "   📊 Статус репозитория:" -ForegroundColor Yellow
            git status
        }
        '5' {
            Write-Host "   📜 Последние 10 коммитов:" -ForegroundColor Yellow
            git log -n 10 --oneline --graph --decorate
        }
        '6' {
            Write-Host "   🗑️  Удаляем смерженные ветки (кроме main/master)..." -ForegroundColor Yellow
            $branches = git branch --merged 2>$null | Where-Object { $_ -notmatch '^\*\s*(main|master)$' }
            if ($branches) {
                $branches -replace '^\*\s*', '' | ForEach-Object {
                    git branch -d $_
                }
            } else {
                Write-Host "   Нет веток для удаления" -ForegroundColor Gray
            }
            Write-Host "   ✅ Готово" -ForegroundColor Green
        }
        '7' {
            # Проверяем пользователя
            if (-not (Check-GitUser)) {
                Write-Host ""
                Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
                Read-Host
                continue
            }
            
            # Проверяем remote
            if (-not (Check-GitRemote)) {
                Write-Host ""
                Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
                Read-Host
                continue
            }
            
            $status = git status -s 2>$null
            if (-not $status) {
                Write-Host "   ❌ Нет изменений" -ForegroundColor Red
            } else {
                $msg = "Quick update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
                Write-Host "   ⏳ Быстрый коммит..." -ForegroundColor Gray
                git add . 2>$null
                $commitResult = git commit -m $msg 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $pushResult = git push 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "   ✅ Быстрый коммит выполнен" -ForegroundColor Green
                    } else {
                        Write-Host "   ❌ Ошибка при пуше:" -ForegroundColor Red
                        Write-Host $pushResult -ForegroundColor Red
                    }
                } else {
                    Write-Host "   ❌ Ошибка при коммите:" -ForegroundColor Red
                    Write-Host $commitResult -ForegroundColor Red
                }
            }
        }
        '8' {
            $repoUrl = Convert-GitUrlToHttps
            if ($repoUrl) {
                $currentBranch = git branch --show-current 2>$null
                $prUrl = "$repoUrl/pull/new/$currentBranch"
                Write-Host "   🔗 Открываю: $prUrl" -ForegroundColor Green
                $open = Read-HostSafe "   Нажмите Enter для открытия в браузере"
                if ($open -eq '') {
                    Start-Process $prUrl
                }
            } else {
                Write-Host "   ❌ Удаленный репозиторий не найден" -ForegroundColor Red
            }
        }
        '0' {
            Write-Host "`n   👋 До свидания!`n" -ForegroundColor Green
            exit 0
        }
        default {
            Write-Host "   ❌ Неверный выбор: '$choice'" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host -NoNewline "   Нажмите Enter для продолжения..." -ForegroundColor DarkGray
    Read-Host
}