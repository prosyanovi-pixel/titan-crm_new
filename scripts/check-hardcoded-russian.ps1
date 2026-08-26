# Скрипт проверки на хардкоженный русский текст в модулях
# Проверяет только файлы в frontend/src/modules/

Write-Host "=== Проверка на хардкоженный русский текст в модулях ===" -ForegroundColor Cyan
Write-Host ""

$modulesDir = "frontend\src\modules"
$foundIssues = @()

# Получаем все .ts и .tsx файлы, исключая папки i18n
$files = Get-ChildItem -Path $modulesDir -Include *.ts,*.tsx -Recurse | 
    Where-Object { $_.FullName -notmatch '\\i18n\\' }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Ищем русские буквы в кавычках (простая эвристика)
    $matches = [regex]::Matches($content, "['`"][^'`"]*[\u0400-\u04FF][^'`"]*['`"]")
    
    foreach ($match in $matches) {
        $lineInfo = $content.Substring(0, $match.Index) -split "`n"
        $lineNumber = $lineInfo.Count
        $foundIssues += "$($file.FullName):$lineNumber - $($match.Value)"
    }
}

if ($foundIssues.Count -eq 0) {
    Write-Host "✅ Хардкоженный русский текст не найден!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Найден хардкоженный русский текст:" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $foundIssues) {
        Write-Host $issue -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "=== Рекомендуется вынести текст в файлы переводов ===" -ForegroundColor Cyan
    Write-Host "Путь для переводов: frontend\src\modules\<module>\i18n\ru\index.ts" -ForegroundColor Cyan
    exit 1
}
