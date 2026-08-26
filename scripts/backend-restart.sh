#!/bin/bash
# Скрипт для очистки кэша и перезагрузки backend сервера

echo "🔄 Остановка backend сервера..."
pkill -f "node.*index.js" 2>/dev/null
sleep 2

echo "🗑️  Очистка кэша require..."
# Удаляем временные файлы
rm -rf /tmp/backend_cache 2>/dev/null

# Очищаем кэш require в Node.js (опционально)
echo "   - Очистка кэша legal_cases helpers..."

echo "🚀 Запуск backend сервера..."
cd /Users/titan/Documents/TITAN-CRM/backend
nohup npm run dev > /tmp/backend_nohup.log 2>&1 &

sleep 5

# Проверка что сервер запустился
if curl -s http://localhost:5001/api/dashboard/stats > /dev/null 2>&1; then
    echo "✅ Backend сервер запущен и работает!"
    echo ""
    echo "📊 Быстрая проверка endpoints:"
    echo "   - Dashboard: $(curl -s http://localhost:5001/api/dashboard/stats 2>&1 | head -c 50)..."
    echo "   - Contractors: $(curl -s http://localhost:5001/api/contractors 2>&1 | head -c 50)..."
    echo "   - Legal Cases: $(curl -s http://localhost:5001/api/legal-cases 2>&1 | head -c 50)..."
    echo ""
    echo "💡 Команды управления:"
    echo "   ./backend-restart.sh          - Перезагрузка сервера"
    echo "   ./backend-restart.sh --clean  - Очистка кэша и перезагрузка"
    echo "   rs                            - Перезагрузка в nodemon (внутри сессии nodemon)"
else
    echo "❌ Ошибка запуска! Проверьте логи:"
    tail -30 /tmp/backend_nohup.log
fi
