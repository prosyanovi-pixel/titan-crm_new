#!/bin/bash

# Скрипт проверки на хардкоженный русский текст в модулях
# Проверяет только файлы в frontend/src/modules/

echo "=== Проверка на хардкоженный русский текст в модулях ==="
echo ""

# Паттерн для поиска русского текста в строках (исключая комментарии и импорты)
# Ищем русские буквы в кавычках

MODULES_DIR="frontend/src/modules"

# Поиск в .ts и .tsx файлах
FOUND_ISSUES=$(grep -rn "['\"][^'\"]*[\u0400-\u04FF][^'\"]*['\"]" \
    "$MODULES_DIR" \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir="i18n" \
    2>/dev/null)

if [ -z "$FOUND_ISSUES" ]; then
    echo "✅ Хардкоженный русский текст не найден!"
    exit 0
else
    echo "❌ Найден хардкоженный русский текст:"
    echo ""
    echo "$FOUND_ISSUES"
    echo ""
    echo "=== Рекомендуется вынести текст в файлы переводов ==="
    echo "Путь для переводов: frontend/src/modules/<module>/i18n/ru/index.ts"
    exit 1
fi
