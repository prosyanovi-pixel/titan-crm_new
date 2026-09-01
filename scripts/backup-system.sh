#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/local-backups}"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
TARGET_DIR="$BACKUP_ROOT/system-backup-$TIMESTAMP"
ARCHIVE_PATH="$BACKUP_ROOT/system-backup-$TIMESTAMP.tar.gz"

print_usage() {
  cat <<EOF
Использование:
  ./backup-system.sh [--include-node-modules] [--keep-folder]

Опции:
  --include-node-modules  Включить node_modules в бэкап (по умолчанию исключаются)
  --keep-folder           Оставить распакованную папку-копию после упаковки

Переменные окружения:
  BACKUP_ROOT             Корневая папка для бэкапов (по умолчанию: ./local-backups)
EOF
}

INCLUDE_NODE_MODULES=false
KEEP_FOLDER=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-node-modules)
      INCLUDE_NODE_MODULES=true
      shift
      ;;
    --keep-folder)
      KEEP_FOLDER=true
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "❌ Неизвестный аргумент: $1"
      print_usage
      exit 1
      ;;
  esac
done

mkdir -p "$TARGET_DIR"

echo "🔄 Создание полного бэкапа проекта..."
echo "📁 Источник: $ROOT_DIR"
echo "📦 Назначение: $TARGET_DIR"

RSYNC_ARGS=(
  -a
  --progress
  --exclude=.git/
  --exclude=local-backups/
  --exclude=.DS_Store
  --exclude=package-lock.json
  --exclude=backend/package-lock.json
  --exclude=frontend/package-lock.json
)

if [[ "$INCLUDE_NODE_MODULES" == "false" ]]; then
  RSYNC_ARGS+=(
    --exclude=node_modules/
    --exclude=frontend/node_modules/
    --exclude=backend/node_modules/
  )
fi

rsync "${RSYNC_ARGS[@]}" "$ROOT_DIR/" "$TARGET_DIR/"

cat > "$TARGET_DIR/BACKUP_INFO.txt" <<EOF
TITAN CRM Full Backup
Created: $(date '+%Y-%m-%d %H:%M:%S')
Source: $ROOT_DIR
Backup destination: $TARGET_DIR
Archive path: $ARCHIVE_PATH
Included node_modules: $INCLUDE_NODE_MODULES
EOF

echo "🗜️ Упаковка бэкапа в архив..."
tar -czf "$ARCHIVE_PATH" -C "$BACKUP_ROOT" "system-backup-$TIMESTAMP"

if [[ "$KEEP_FOLDER" == "false" ]]; then
  rm -rf "$TARGET_DIR"
fi

echo "✅ Бэкап создан успешно"
if [[ "$KEEP_FOLDER" == "true" ]]; then
  echo "📂 Папка: $TARGET_DIR"
else
  echo "📂 Папка-копия удалена (поведение по умолчанию)"
fi
echo "🗄️ Архив: $ARCHIVE_PATH"
