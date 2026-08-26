#!/bin/bash
# Аудит и очистка устаревшей документации TITAN CRM
# Дата: 26 марта 2026 г.

echo "═══════════════════════════════════════════════════════════"
echo "       TITAN CRM - Documentation Audit"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Счётчики
TOTAL=0
TO_DELETE=0
TO_UPDATE=0
TO_KEEP=0

# Функция для анализа файла
analyze_file() {
  local file=$1
  local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
  local date=$(stat -f%Sm "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d' ' -f1)
  local category=""
  local recommendation=""
  
  ((TOTAL++))
  
  # Определяем категорию
  if [[ "$file" == *"/test/"* ]] || [[ "$file" == *"TEST"* ]] || [[ "$file" == *"test"* ]]; then
    category="Тесты"
  elif [[ "$file" == *"/docs/"* ]]; then
    category="Документация"
  elif [[ "$file" == *"REFACTORING"* ]] || [[ "$file" == *"AUDIT"* ]]; then
    category="Отчёты"
  elif [[ "$file" == *"GUIDE"* ]] || [[ "$file" == *"README"* ]]; then
    category="Руководства"
  else
    category="Разное"
  fi
  
  # Определяем рекомендацию
  if [[ "$file" == *"_OLD"* ]] || [[ "$file" == *".old"* ]] || [[ "$file" == *"backup"* ]]; then
    recommendation="DELETE"
    ((TO_DELETE++))
  elif [[ "$file" == *"PLAN"* ]] && [[ "$date" < "2026-03-20" ]]; then
    recommendation="UPDATE"
    ((TO_UPDATE++))
  elif [[ "$file" == *"TEMP"* ]] || [[ "$file" == *"tmp"* ]]; then
    recommendation="DELETE"
    ((TO_DELETE++))
  elif [[ "$file" == *"REFACTORING_SUMMARY"* ]] || [[ "$file" == *"API_TEST_REPORT"* ]]; then
    recommendation="KEEP"
    ((TO_KEEP++))
  elif [[ "$date" < "2026-03-01" ]]; then
    recommendation="REVIEW"
    ((TO_UPDATE++))
  else
    recommendation="KEEP"
    ((TO_KEEP++))
  fi
  
  # Вывод
  case $recommendation in
    "DELETE")
      echo -e "${RED}[DELETE]${NC} $file"
      echo "        Размер: $size байт | Дата: $date | Категория: $category"
      ;;
    "UPDATE")
      echo -e "${YELLOW}[UPDATE]${NC} $file"
      echo "        Размер: $size байт | Дата: $date | Категория: $category"
      ;;
    "REVIEW")
      echo -e "${BLUE}[REVIEW]${NC} $file"
      echo "        Размер: $size байт | Дата: $date | Категория: $category"
      ;;
    "KEEP")
      echo -e "${GREEN}[KEEP]${NC} $file"
      echo "        Размер: $size байт | Дата: $date | Категория: $category"
      ;;
  esac
}

echo "📊 Root уровень:"
echo "───────────────────────────────────────────────────────────"
for file in /Users/titan/Documents/TITAN-CRM/*.md; do
  if [ -f "$file" ]; then
    analyze_file "$file"
  fi
done

echo ""
echo "📁 Frontend docs:"
echo "───────────────────────────────────────────────────────────"
for file in /Users/titan/Documents/TITAN-CRM/frontend/docs/*.md; do
  if [ -f "$file" ]; then
    analyze_file "$file"
  fi
done

echo ""
echo "🔧 Backend docs:"
echo "───────────────────────────────────────────────────────────"
for file in /Users/titan/Documents/TITAN-CRM/backend/docs/*.md; do
  if [ -f "$file" ]; then
    analyze_file "$file"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "                    Итоги аудита"
echo "═══════════════════════════════════════════════════════════"
echo "Всего файлов: $TOTAL"
echo -e "${GREEN}Оставить: $TO_KEEP${NC}"
echo -e "${YELLOW}Обновить: $TO_UPDATE${NC}"
echo -e "${RED}Удалить: $TO_DELETE${NC}"
echo ""

if [ $TO_DELETE -gt 0 ]; then
  echo -e "${RED}⚠️  Найдены файлы для удаления!${NC}"
  echo "Для удаления выполните:"
  echo "  bash /Users/titan/Documents/TITAN-CRM/docs_cleanup.sh --delete"
fi

if [ $TO_UPDATE -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Найдены файлы для обновления!${NC}"
  echo "Проверьте файлы с рекомендацией UPDATE и REVIEW"
fi
