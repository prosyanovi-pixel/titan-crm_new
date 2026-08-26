#!/bin/bash
# Анализ документации в корне TITAN CRM

echo "=== ДОКУМЕНТАЦИЯ В КОРНЕ ПРОЕКТА ==="
echo ""
echo "📊 Актуальные (25-26 марта 2026):"
for file in /Users/titan/Documents/TITAN-CRM/*_2026-03-2*.md /Users/titan/Documents/TITAN-CRM/*_25*.md /Users/titan/Documents/TITAN-CRM/*_26*.md; do
  if [ -f "$file" ]; then
    basename "$file"
  fi
done 2>/dev/null

echo ""
echo "📚 Старые (21-23 марта 2026):"
for file in /Users/titan/Documents/TITAN-CRM/*_2026-03-2[123]*.md /Users/titan/Documents/TITAN-CRM/Google*.md /Users/titan/Documents/TITAN-CRM/QWEN.md /Users/titan/Documents/TITAN-CRM/ЗАПУСК.md; do
  if [ -f "$file" ]; then
    basename "$file"
  fi
done 2>/dev/null

echo ""
echo "📁 Текстовые файлы:"
ls -1 /Users/titan/Documents/TITAN-CRM/*.txt 2>/dev/null | xargs -I {} basename {}
