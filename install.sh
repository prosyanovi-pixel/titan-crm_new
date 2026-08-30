#!/usr/bin/env bash
# ============================================================================
#  TITAN CRM — мастер установки и настройки системы
# ----------------------------------------------------------------------------
#  Поддерживаемые ОС: macOS (Intel / Apple Silicon), Linux, WSL.
#  Для Windows (PowerShell) используйте:  .\install.ps1
#
#  Что делает мастер:
#    1. Проверяет окружение (Node.js, npm, PostgreSQL/psql)
#       - недостающие компоненты устанавливаются автоматически
#         (brew / apt / dnf / pacman / zypper / apk; на macOS умеет ставить Homebrew)
#       - при отказе от установки мастер останавливается с объяснением причины
#    2. Настраивает backend/env (порты, БД, секреты JWT/шифрования)
#    3. Создаёт frontend/.env (адреса API для Vite)
#    4. Создаёт базу данных (если есть права и psql)
#    5. Устанавливает зависимости (root, backend, frontend)
#    6. Применяет миграции БД
#    7. Создаёт учётную запись администратора (пароль задаётся в мастере)
#    8. Сохраняет INSTALL-INFO.txt (доступы, пароли, правила запуска)
#
#  Использование:
#    ./install.sh                  — интерактивный мастер
#    ./install.sh --yes            — автоматически, со значениями по умолчанию
#    ./install.sh --help           — справка по всем опциям
# ============================================================================
set -euo pipefail

# ----------------------------- Определения ---------------------------------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

# Цвета
if [[ -t 1 ]] && [[ "${NO_COLOR:-}" == "" ]]; then
  C_RED=$'\033[0;31m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[1;33m'
  C_BLUE=$'\033[0;34m'; C_CYAN=$'\033[0;36m'; C_BOLD=$'\033[1m'; C_NC=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_CYAN=""; C_BOLD=""; C_NC=""
fi

# Значения по умолчанию (можно переопределить опциями)
YES_MODE=0
SKIP_DEPS=0
SKIP_DB=0
SKIP_USERS=0
SKIP_MIGRATE=0
DO_BACKEND_PORT=""
DO_FRONTEND_URL=""
DO_DB_HOST=""; DO_DB_PORT=""; DO_DB_NAME=""; DO_DB_USER=""; DO_DB_PASS=""
DO_ADMIN_NAME=""; DO_ADMIN_EMAIL=""; DO_ADMIN_PASS=""; DO_ADMIN_ROLE="admin"
ADMIN_NAME=""; ADMIN_EMAIL=""; ADMIN_PASS=""; ADMIN_ROLE="$DO_ADMIN_ROLE"

# ----------------------------- Утилиты печати -------------------------------
info()  { printf "${C_BLUE}%s${C_NC}\n" "$*"; }
ok()    { printf "${C_GREEN}  ✓ %s${C_NC}\n" "$*"; }
warn()  { printf "${C_YELLOW}  ⚠  %s${C_NC}\n" "$*"; }
err()   { printf "${C_RED}  ✗ %s${C_NC}\n" "$*"; }
step()  { printf "\n${C_BOLD}${C_CYAN}==> $*${C_NC}\n"; }
banner(){ printf "${C_BLUE}${C_BOLD}%s${C_NC}\n" "$*"; }

die() { err "$*"; exit 1; }

ask() { # ask "Вопрос" "дефолт"  -> в переменную ANSWER
  local prompt="${1}"; local def="${2:-}"
  printf "${C_CYAN}?${C_NC} %s" "$prompt"
  [[ -n "$def" ]] && printf " [${C_BOLD}%s${C_NC}]" "$def"
  printf ": "
  local ans; read -r ans
  ANSWER="${ans:-$def}"
}

ask_secret() { # скрытый ввод
  local prompt="${1}"; local def="${2:-}"
  printf "${C_CYAN}?${C_NC} %s: " "$prompt"
  local ans=""
  if [[ -n "$def" ]]; then
    # не спрашиваем скрыто, если есть значение по умолчанию (уже настроено)
    ANSWER="$def"; printf "${C_YELLOW}**** (оставлен существующий)${C_NC}\n"; return
  fi
  # shellcheck disable=SC2162
  IFS= read -r -s ans; printf "\n"
  ANSWER="${ans:-$def}"
}

confirm() { # confirm "Вопрос" (дефолт: да) -> 0/1
  local prompt="${1}"
  printf "${C_CYAN}?${C_NC} %s [Y/n]: " "$prompt"
  local ans; read -r ans
  [[ -z "$ans" || "$ans" =~ ^[YyДд] ]]
}

# ----------------------------- Справка --------------------------------------
usage() {
  cat <<EOF
${C_BOLD}TITAN CRM — мастер установки и настройки${C_NC}

  ${C_GREEN}./install.sh [опции]${C_NC}

${C_BOLD}Опции:${C_NC}
  -y, --yes                 Не задавать вопросов (значения по умолчанию)
      --skip-deps           Не устанавливать npm-зависимости
      --skip-db             Не создавать базу данных
      --skip-users          Не создавать администратора
      --skip-migrate        Не применять миграции
      --backend-port NNNN   Порт backend (по умолчанию 5001)
      --frontend-url URL    URL фронтенда для писем (по умолчанию http://localhost:3001)
      --db-host HOST        Хост PostgreSQL (localhost)
      --db-port PORT        Порт PostgreSQL (5432)
      --db-name NAME        Имя базы данных (titancrm1)
      --db-user USER        Пользователь PostgreSQL (myuser)
      --db-pass PASS        Пароль PostgreSQL
      --admin-name NAME     Имя администратора
      --admin-email EMAIL   E-mail администратора (создаст учётку)
      --admin-pass PASS     Пароль администратора
      --admin-role ROLE     Роль администратора (admin)
      --no-color            Без цветов
  -h, --help                Эта справка

${C_BOLD}Примеры:${C_NC}
  ./install.sh                          # интерактивный мастер
  ./install.sh -y                       # автоустановка
  ./install.sh -y --db-name crm --db-pass secret --skip-deps
  ./install.sh -y --admin-email boss@mail.ru --admin-pass 'Qwerty123!'
EOF
  exit 0
}

# ----------------------------- Парсинг аргументов ---------------------------
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -y|--yes)          YES_MODE=1 ;;
      --skip-deps)       SKIP_DEPS=1 ;;
      --skip-db)         SKIP_DB=1 ;;
      --skip-users)      SKIP_USERS=1 ;;
      --skip-migrate)    SKIP_MIGRATE=1 ;;
      --backend-port)    shift; DO_BACKEND_PORT="$1" ;;
      --frontend-url)    shift; DO_FRONTEND_URL="$1" ;;
      --db-host)         shift; DO_DB_HOST="$1" ;;
      --db-port)         shift; DO_DB_PORT="$1" ;;
      --db-name)         shift; DO_DB_NAME="$1" ;;
      --db-user)         shift; DO_DB_USER="$1" ;;
      --db-pass)         shift; DO_DB_PASS="$1" ;;
      --admin-name)      shift; DO_ADMIN_NAME="$1" ;;
      --admin-email)     shift; DO_ADMIN_EMAIL="$1" ;;
      --admin-pass)      shift; DO_ADMIN_PASS="$1" ;;
      --admin-role)      shift; DO_ADMIN_ROLE="$1" ;;
      --no-color)        C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_CYAN=""; C_BOLD=""; C_NC="" ;;
      -h|--help)         usage ;;
      *) die "Неизвестная опция: $1 (см. --help)" ;;
    esac
    shift
  done
}

# ----------------------------- Работа с env --------------------------------
# set_key ФАЙЛ КЛЮЧ ЗНАЧЕНИЕ — добавляет/заменяет строку "key=value" (awk, безопасно для спецсимволов)
set_key() {
  local file="$1" key="$2" val="$3"
  awk -v key="$key" -v val="$val" '
    BEGIN { done = 0 }
    $0 ~ "^" key "=" { print key "=" val; done = 1; next }
    { print }
    END { if (!done) print key "=" val }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
}

# get_key ФАЙЛ КЛЮЧ — возвращает значение (пусто, если нет)
get_key() {
  local file="$1" key="$2"
  awk -v key="$key" -F= '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$file"
}

gen_secret() { # N байт hex
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

env_has_secret() { # ФАЙЛ КЛЮЧ СТРОКА ПО УМОЛЧАНИЮ — 0 если секрет нужно заменить
  local file="$1" key="$2" def="$3"
  local cur; cur="$(get_key "$file" "$key")"
  [[ -z "$cur" || "$cur" == "$def" ]]
}

# ----------------------------- Проверки окружения ---------------------------
detect_pkg_manager() {
  PKG_MGR=""; PKG_INSTALL=""; PKG_START=""; PKG_UPDATE=""
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      PKG_MGR="brew"
    else
      PKG_MGR="none"
    fi
  elif command -v apt-get >/dev/null 2>&1; then
    PKG_MGR="apt"; PKG_INSTALL="sudo apt-get install -y"; PKG_UPDATE="sudo apt-get update"
  elif command -v dnf >/dev/null 2>&1; then
    PKG_MGR="dnf"; PKG_INSTALL="sudo dnf install -y"
  elif command -v pacman >/dev/null 2>&1; then
    PKG_MGR="pacman"; PKG_INSTALL="sudo pacman -S --noconfirm"
  elif command -v zypper >/dev/null 2>&1; then
    PKG_MGR="zypper"; PKG_INSTALL="sudo zypper install -y"
  elif command -v apk >/dev/null 2>&1; then
    PKG_MGR="apk"; PKG_INSTALL="sudo apk add"
  else
    PKG_MGR="none"
  fi
}

# build_install_command ТИП-ПАКЕТА -> формирует команду в переменной INSTALL_CMD
build_install_command() {
  local pkg="$1"; INSTALL_CMD=""
  case "$PKG_MGR" in
    brew)
      case "$pkg" in
        node)       INSTALL_CMD="brew install node" ;;
        postgresql) INSTALL_CMD="brew install postgresql@16 && export PATH=\"\$(brew --prefix)/opt/postgresql@16/bin:\$PATH\"" ;;
      esac ;;
    apt)
      case "$pkg" in
        node)       INSTALL_CMD="$PKG_INSTALL nodejs npm" ;;
        postgresql) INSTALL_CMD="$PKG_INSTALL postgresql postgresql-client" ;;
      esac ;;
    dnf|zypper)
      case "$pkg" in
        node)       INSTALL_CMD="$PKG_INSTALL nodejs npm" ;;
        postgresql) INSTALL_CMD="$PKG_INSTALL postgresql-server postgresql" ;;
      esac ;;
    pacman)
      case "$pkg" in
        node)       INSTALL_CMD="$PKG_INSTALL nodejs npm" ;;
        postgresql) INSTALL_CMD="$PKG_INSTALL postgresql postgresql-libs" ;;
      esac ;;
    apk)
      case "$pkg" in
        node)       INSTALL_CMD="$PKG_INSTALL nodejs npm" ;;
        postgresql) INSTALL_CMD="$PKG_INSTALL postgresql postgresql-client" ;;
      esac ;;
  esac
}

# install_brew — автоустановка Homebrew на macOS (если пакетного менеджера нет)
install_brew() {
  local brew_cmd='/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  if [[ "$YES_MODE" -eq 1 ]]; then
    info "Homebrew не найден — установка будет выполнена автоматически (--yes)"
  else
    if ! confirm "Homebrew не найден. Установить его автоматически?"; then
      warn "Пропущено. Установите Homebrew вручную:"
      printf "    %s\n" "$brew_cmd"
      return 1
    fi
  fi
  if [[ "${INSTALLER_DRY_RUN:-}" == "1" ]]; then
    info "DRY-RUN (ничего не выполняется): $brew_cmd"
    return 0
  fi
  info "Установка Homebrew... (займёт несколько минут)"
  if eval "$brew_cmd"; then
    ok "Homebrew установлен"
  else
    warn "Не удалось установить Homebrew. Выполните вручную:"
    printf "    %s\n" "$brew_cmd"
    return 1
  fi
  # brew не попадает в PATH текущей сессии — подключаем его сразу
  local brew_path=""
  for p in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [[ -x "$p" ]] && brew_path="$p" && break
  done
  if [[ -n "$brew_path" ]]; then
    eval "$("$brew_path" shellenv)" 2>/dev/null || export PATH="${brew_path%/*}:$PATH"
  fi
  command -v brew >/dev/null 2>&1 && ok "brew доступен в PATH" || warn "brew не в PATH — перезапустите терминал"
}

install_missing() {
  local todo=()
  command -v node >/dev/null 2>&1 || todo+=("node")
  command -v npm  >/dev/null 2>&1 || todo+=("npm")
  command -v psql >/dev/null 2>&1 || todo+=("postgresql")
  [[ ${#todo[@]} -eq 0 ]] && return 0

  local missing="${todo[*]}"
  step "Недостающие зависимости"
  printf "  Не найдено: ${C_YELLOW}%s${C_NC}\n" "${todo[*]}"

  detect_pkg_manager

  # macOS без Homebrew: ставим brew сами и продолжаем установку через него
  if [[ "$PKG_MGR" == "none" ]] && [[ "$(uname -s)" == "Darwin" ]]; then
    if install_brew; then
      PKG_MGR="brew"
      PKG_INSTALL="brew install"
    else
      die "Установка невозможна: нужен пакетный менеджер (не установлены: ${missing}), а Homebrew вы не установили. Установите Homebrew вручную (см. выше) и запустите скрипт заново."
    fi
  fi

  if [[ "$PKG_MGR" == "none" ]]; then
    warn "Пакетный менеджер не определён — установите вручную:"
    if [[ " ${todo[*]} " == *" node "* ]]; then
      printf "    Node.js:     ${C_BOLD}https://nodejs.org/${C_NC}\n"
      printf "    macOS без brew: ${C_BOLD}/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${C_NC}\n"
    fi
    if [[ " ${todo[*]} " == *" postgresql "* ]]; then
      printf "    PostgreSQL:  ${C_BOLD}https://www.postgresql.org/download/${C_NC}\n"
    fi
    die "Установка невозможна: пакетный менеджер не определён, а компоненты не установлены: ${missing}. Установите их вручную (адреса выше) и запустите скрипт заново."
  fi

  # Собираем единую команду установки
  local all_cmds=()
  for p in "${todo[@]}"; do
    build_install_command "$p"
    [[ -n "$INSTALL_CMD" ]] && all_cmds+=("$INSTALL_CMD")
  done
  local combined=""
  local first=1
  for c in "${all_cmds[@]}"; do
    if [[ $first -eq 1 ]]; then combined="$c"; first=0; else combined="$combined && $c"; fi
  done
  [[ -n "${PKG_UPDATE:-}" ]] && combined="$PKG_UPDATE && $combined"

  local do_install=0
  if [[ "$YES_MODE" -eq 1 ]]; then
    do_install=1
    info "Автоустановка (--yes): выполняем установку недостающих пакетов"
  else
    printf "\n${C_CYAN}?${C_NC} Установить недостающие пакеты: ${C_BOLD}%s${C_NC}\n" "${todo[*]}"
    confirm "Команда: $combined — выполнить?" && do_install=1
  fi

  if [[ $do_install -eq 1 ]]; then
    if [[ "${INSTALLER_DRY_RUN:-}" == "1" ]]; then
      info "DRY-RUN (ничего не выполняется): $combined"
    else
      info "Выполняется: $combined"
      if eval "$combined"; then
        ok "Пакеты установлены"
      else
        warn "Установка завершилась с ошибкой. Выполните команду вручную:"
        printf "    %s\n" "$combined"
      fi
    fi
  else
    die "Установка невозможна: недостающие компоненты (${missing}) не установлены — вы отказались от автоматической установки. Запустите скрипт заново и согласитесь на установку, либо установите их вручную (см. INSTALL.md)."
  fi

  # Перепроверка после установки
  if [[ "${INSTALLER_DRY_RUN:-}" != "1" ]]; then
    command -v node >/dev/null 2>&1 && ok "Node.js найден после установки"
    command -v npm  >/dev/null 2>&1 && ok "npm найден после установки"
    command -v psql >/dev/null 2>&1 && ok "psql найден после установки"
  fi
}

check_environment() {
  step "Проверка окружения"

  if command -v node >/dev/null 2>&1; then
    NODE_VER="$(node --version | sed 's/^v//')"
    if [[ "$(printf '%s\n' "$NODE_VER" | cut -d. -f1)" -lt 18 ]]; then
      warn "Требуется Node.js >= 18, установлено: ${NODE_VER} — возможны проблемы"
    else
      ok "Node.js ${C_BOLD}${NODE_VER}${C_NC}"
    fi
  fi
  command -v npm >/dev/null 2>&1 && ok "npm $(npm --version)"

  command -v perl >/dev/null 2>&1 || warn "perl не найден — часть операций выполнится через awk"

  # Проверка и установка недостающего
  install_missing

  # Финальные проверки
  if ! command -v node >/dev/null 2>&1; then
    die "Node.js не установлен. Установите Node.js >= 18: https://nodejs.org/"
  fi
  NODE_VER="$(node --version | sed 's/^v//')"
  if [[ "$(printf '%s\n' "$NODE_VER" | cut -d. -f1)" -lt 18 ]]; then
    die "Требуется Node.js >= 18, установлено: ${NODE_VER}. Обновите: https://nodejs.org/"
  fi
  command -v npm >/dev/null 2>&1 || die "npm не найден (поставляется с Node.js)"
  if ! command -v psql >/dev/null 2>&1; then
    if [[ "$SKIP_DB" -eq 1 ]]; then
      warn "psql не найден (--skip-db: создание БД пропущено)"
    else
      die "Установка невозможна: PostgreSQL (psql) не найден. Установите PostgreSQL или запустите скрипт заново с согласием на автоматическую установку."
    fi
  else
    ok "psql $(psql --version | awk '{print $3}')"
  fi
}

# ----------------------------- Сбор параметров ------------------------------
collect_params() {
  local ENV_FILE="$BACKEND_DIR/env"
  local EXISTING="${ENV_FILE:-}"
  [[ -f "$ENV_FILE" ]] && EXISTING="yes" || EXISTING="no"

  # Дефолты с учётом существующего env
  local def_port;        def_port="$(get_key "$ENV_FILE" PORT 2>/dev/null || true)";     [[ -n "$def_port" ]] || def_port="5001"
  local def_fe_url;      def_fe_url="$(get_key "$ENV_FILE" FRONTEND_URL 2>/dev/null || true)"; [[ -n "$def_fe_url" ]] || def_fe_url="http://localhost:3001"
  local def_dbh;         def_dbh="$(get_key "$ENV_FILE" DB_HOST 2>/dev/null || true)";    [[ -n "$def_dbh" ]] || def_dbh="localhost"
  local def_dbp;         def_dbp="$(get_key "$ENV_FILE" DB_PORT 2>/dev/null || true)"; def_dbp="$(printf '%s' "$def_dbp" | tr -d ' ')"; [[ -n "$def_dbp" ]] || def_dbp="5432"
  local def_dbn;         def_dbn="$(get_key "$ENV_FILE" DB_NAME 2>/dev/null || true)";    [[ -n "$def_dbn" ]] || def_dbn="titancrm1"
  local def_dbu;         def_dbu="$(get_key "$ENV_FILE" DB_USER 2>/dev/null || true)";    [[ -n "$def_dbu" ]] || def_dbu="myuser"
  local def_dbpw;        def_dbpw="$(get_key "$ENV_FILE" DB_PASSWORD 2>/dev/null || true)"

  [[ -n "$DO_BACKEND_PORT" ]] && def_port="$DO_BACKEND_PORT"
  [[ -n "$DO_FRONTEND_URL" ]] && def_fe_url="$DO_FRONTEND_URL"
  [[ -n "$DO_DB_HOST" ]] && def_dbh="$DO_DB_HOST"
  [[ -n "$DO_DB_PORT" ]] && def_dbp="$DO_DB_PORT"
  [[ -n "$DO_DB_NAME" ]] && def_dbn="$DO_DB_NAME"
  [[ -n "$DO_DB_USER" ]] && def_dbu="$DO_DB_USER"
  [[ -n "$DO_DB_PASS" ]] && def_dbpw="$DO_DB_PASS"

  if [[ "$YES_MODE" -eq 1 ]]; then
    BACKEND_PORT="$def_port"; FRONTEND_URL="$def_fe_url"; DB_HOST="$def_dbh"; DB_PORT="$def_dbp"
    DB_NAME="$def_dbn"; DB_USER="$def_dbu"; DB_PASS="$def_dbpw"
    return
  fi

  step "Настройка параметров системы (Enter — значение по умолчанию)"

  ask "Порт backend"            "$def_port";         BACKEND_PORT="$ANSWER"
  ask "URL фронтенда (для писем)" "$def_fe_url";      FRONTEND_URL="$ANSWER"
  printf "\n${C_BOLD}Параметры подключения к PostgreSQL:${C_NC}\n"
  ask "Хост"                    "$def_dbh";          DB_HOST="$ANSWER"
  ask "Порт"                    "$def_dbp";          DB_PORT="$ANSWER"
  ask "Имя базы данных"         "$def_dbn";          DB_NAME="$ANSWER"
  ask "Пользователь"            "$def_dbu";          DB_USER="$ANSWER"
  if [[ -n "$def_dbpw" ]]; then
    ask_secret "Пароль базы данных (оставить существующий)" "$def_dbpw"; DB_PASS="$ANSWER"
  else
    ask_secret "Пароль базы данных"; DB_PASS="$ANSWER"
  fi
  printf "\n"
}

# ----------------------------- Конфигурация env -----------------------------
configure_env() {
  local ENV_FILE="$BACKEND_DIR/env"
  local FE_ENV="$FRONTEND_DIR/.env"

  step "Конфигурация окружения (backend/env, frontend/.env)"

  # --- backend/env ---
  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$BACKEND_DIR/env.example" ]]; then
      cp "$BACKEND_DIR/env.example" "$ENV_FILE"
      ok "Создан $ENV_FILE из шаблона env.example"
    else
      die "Не найден шаблон $BACKEND_DIR/env.example — откуда брать настройки?"
    fi
  else
    if [[ "$YES_MODE" -eq 1 ]] || confirm "Обновить параметры в существующем backend/env?"; then
      cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"
      ok "Резервная копия: $ENV_FILE.bak.*"
    else
      info "backend/env оставлен как есть — применяем только при необходимости"
    fi
  fi

  set_key "$ENV_FILE" PORT          "$BACKEND_PORT"
  set_key "$ENV_FILE" API_URL       "http://localhost:$BACKEND_PORT"
  set_key "$ENV_FILE" FRONTEND_URL  "$FRONTEND_URL"
  set_key "$ENV_FILE" DB_HOST       "$DB_HOST"
  set_key "$ENV_FILE" DB_PORT       "$DB_PORT"
  set_key "$ENV_FILE" DB_NAME       "$DB_NAME"
  set_key "$ENV_FILE" DB_USER       "$DB_USER"
  if [[ -n "$DB_PASS" ]]; then
    set_key "$ENV_FILE" DB_PASSWORD "$DB_PASS"
  fi

  # Секреты
  if env_has_secret "$ENV_FILE" JWT_SECRET "change_this_secret_key_to_something_secure"; then
    set_key "$ENV_FILE" JWT_SECRET "$(gen_secret 32)"
    ok "JWT_SECRET сгенерирован заново"
  fi
  if env_has_secret "$ENV_FILE" ENCRYPTION_KEY "mail-encryption-key-2024-change-this"; then
    set_key "$ENV_FILE" ENCRYPTION_KEY "$(gen_secret 16)"
    ok "ENCRYPTION_KEY сгенерирован заново"
  fi
  ok "backend/env настроен (порт $BACKEND_PORT, БД $DB_NAME на $DB_HOST:$DB_PORT)"

  # --- frontend/.env ---
  if [[ ! -f "$FE_ENV" ]]; then
    [[ -f "$FRONTEND_DIR/.env.example" ]] || die "Шаблон $FRONTEND_DIR/.env.example не найден"
    cp "$FRONTEND_DIR/.env.example" "$FE_ENV"
    ok "frontend/.env создан из .env.example"
  elif [[ "$YES_MODE" -eq 1 ]] || confirm "Пересоздать frontend/.env (адреса API)?"; then
    cp "$FE_ENV" "$FE_ENV.bak.$(date +%Y%m%d%H%M%S)"
    cp "$FRONTEND_DIR/.env.example" "$FE_ENV"
    ok "frontend/.env пересоздан"
  else
    info "frontend/.env оставлен как есть"
  fi
  set_key "$FE_ENV" VITE_API_URL        "http://localhost:$BACKEND_PORT/api"
  set_key "$FE_ENV" VITE_API_BACKEND_URL "http://localhost:$BACKEND_PORT"
  ok "frontend/.env настроен (API: http://localhost:$BACKEND_PORT/api)"
}

# ----------------------------- Создание БД ----------------------------------
db_command() { # вывод: psql с параметрами, если доступен
  command -v psql >/dev/null 2>&1 || return 1
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -w "$@"
}

create_database() {
  [[ "$SKIP_DB" -eq 1 ]] && { info "Шаг пропущен (--skip-db)"; return; }
  step "База данных PostgreSQL"

  command -v psql >/dev/null 2>&1 || {
    warn "psql не найден — создание БД пропущено"
    warn "Создайте БД вручную: CREATE DATABASE \"$DB_NAME\"; (владелец: $DB_USER)"
    return
  }

  if db_command -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
    local exists
    exists="$(db_command -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")"
    if [[ "$exists" == "1" ]]; then
      ok "База данных '$DB_NAME' уже существует"
    else
      if db_command -d postgres -c "CREATE DATABASE \"$DB_NAME\"" >/dev/null 2>&1; then
        ok "База данных '$DB_NAME' создана"
      else
        warn "Не удалось создать БД (нет прав?) — создайте вручную: CREATE DATABASE \"$DB_NAME\";"
      fi
    fi
    # pgcrypto (миграции попробуют сами — здесь только если есть права)
    if db_command -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto" >/dev/null 2>&1; then
      ok "Расширение pgcrypto доступно"
    else
      warn "pgcrypto не включён (прав нет?) — migrate.js попробует сам"
    fi
  else
    warn "Нет доступа к серверу PostgreSQL ($DB_HOST:$DB_PORT, пользователь $DB_USER)"
    if db_command -d "$DB_NAME" -tAc "SELECT 1" >/dev/null 2>&1; then
      ok "БД '$DB_NAME' доступна — продолжаем"
    else
      warn "Подключиться не удалось. Запустите PostgreSQL и создайте БД вручную."
      warn "Проверьте параметры в backend/env (создан на предыдущем шаге)."
    fi
  fi
}

# ----------------------------- Установка зависимостей ------------------------
install_deps() {
  [[ "$SKIP_DEPS" -eq 1 ]] && { info "Шаг пропущен (--skip-deps)"; return; }
  step "Установка npm-зависимостей"

  local dirs=( "$ROOT" "$BACKEND_DIR" "$FRONTEND_DIR" )
  local names=( "ROOT" "BACKEND" "FRONTEND" )
  local i=0
  for dir in "${dirs[@]}"; do
    local name="${names[$i]}"
    if [[ ! -f "$dir/package.json" ]]; then
      warn "[$name] package.json не найден — пропуск"
      i=$((i+1)); continue
    fi
    printf "${C_YELLOW}[$name]${C_NC} npm install в ${C_BOLD}$dir${C_NC}...\n"
    if ( cd "$dir" && npm install ); then
      ok "[$name] зависимости установлены"
    else
      err "[$name] не удалось установить зависимости"
    fi
    i=$((i+1))
  done
}

# ----------------------------- Миграции -------------------------------------
run_migrations() {
  [[ "$SKIP_MIGRATE" -eq 1 ]] && { info "Шаг пропущен (--skip-migrate)"; return; }
  step "Применение миграций базы данных"
  info "Запуск: node backend/migrate.js ..."
  if ( cd "$BACKEND_DIR" && node migrate.js ); then
    ok "Миграции применены успешно"
  else
    err "Миграции завершились с ошибкой. Проверьте backend/env и доступ к БД."
    exit 1
  fi
}

# ----------------------------- Создание администратора ----------------------
create_admin() {
  [[ "$SKIP_USERS" -eq 1 ]] && { info "Шаг пропущен (--skip-users)"; return; }

  local name="" email="" pass="" role="$DO_ADMIN_ROLE"

  if [[ "$YES_MODE" -eq 1 ]]; then
    email="$DO_ADMIN_EMAIL"; pass="$DO_ADMIN_PASS"; name="${DO_ADMIN_NAME:-Администратор}"
    if [[ -z "$email" || -z "$pass" ]]; then
      info "Пропуск создания администратора (укажите --admin-email и --admin-pass)"
      return
    fi
  else
    step "Учётная запись администратора"
    confirm "Создать учётную запись администратора?" || { info "Пропущено"; return; }
    ask "Имя (отображаемое)" "Администратор"; name="${ANSWER:-Администратор}"
    ask "E-mail (логин)" "$DO_ADMIN_EMAIL";   email="$ANSWER"
    [[ -n "$email" ]] || die "E-mail обязателен для создания администратора"
    while :; do
      ask_secret "Пароль (мин. 6 символов)" ""; pass="$ANSWER"
      [[ ${#pass} -ge 6 ]] && break
      err "Пароль слишком короткий"
    done
    ask_secret "Пароль ещё раз" ""; [[ "$ANSWER" == "$pass" ]] || die "Пароли не совпадают"
  fi

  command -v psql >/dev/null 2>&1 || {
    warn "psql не найден — администратор не создан. Создайте его позже в интерфейсе."
    return
  }
  db_command -d "$DB_NAME" -tAc "SELECT 1" >/dev/null 2>&1 || {
    warn "БД недоступна — администратор не создан."
    return
  }

  step "Создание администратора ($email)"
  local hash id escaped_name escaped_email now
  hash="$(cd "$BACKEND_DIR" && node -e "process.stdout.write(require('bcrypt').hashSync(process.argv[1], 10))" "$pass")"
  [[ -n "$hash" ]] || die "Не удалось сгенерировать хеш пароля (bcrypt)"
  id="$(node -e "process.stdout.write(require('crypto').randomUUID())")"
  now="$(date '+%Y-%m-%d %H:%M:%S')"
  escaped_name="${name//\'/\'\'}"
  escaped_email="${email//\'/\'\'}"

  local existing
  existing="$(db_command -d "$DB_NAME" -tAc "SELECT id FROM users WHERE email='$escaped_email' LIMIT 1")"
  if [[ -n "$existing" ]]; then
    db_command -d "$DB_NAME" -c "UPDATE users SET name='$escaped_name', role='$role', status='active', password_hash='$hash', updated_at='$now' WHERE email='$escaped_email'" >/dev/null
    ok "Пользователь '$email' обновлён (пароль/роль заданы заново)"
  else
    db_command -d "$DB_NAME" -c "INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at) VALUES ('$id', '$escaped_name', '$escaped_email', '$hash', '$role', 'active', '$now', '$now')" >/dev/null
    ok "Администратор создан: $email (роль: $role)"
  fi
  ADMIN_EMAIL="$email"; ADMIN_NAME="$name"; ADMIN_ROLE="$role"; ADMIN_PASS="$pass"
}

# ----------------------------- Финал ----------------------------------------
summary() {
  printf "\n"
  banner "╔══════════════════════════════════════════════════════════════╗"
  banner "║     ${C_GREEN}TITAN CRM установлен и настроен!${C_BLUE}                                  ║"
  banner "╚══════════════════════════════════════════════════════════════╝"
  printf "\n"
  info "Backend:   ${C_BOLD}cd backend && npm run dev${C_NC}   → http://localhost:${BACKEND_PORT}/api"
  info "Frontend:  ${C_BOLD}cd frontend && npm run dev${C_NC}  → ${FRONTEND_URL}"
  info "Миграции:  ${C_BOLD}cd backend && npm run migrate${C_NC} (при необходимости)"
  printf "\n${C_YELLOW}Для входа используйте созданную учётную запись администратора.${C_NC}\n"
}

# ----------------------------- Файл-инструкция ------------------------------
# write_receipt — сохраняет INSTALL-INFO.txt: доступы, пароли, правила запуска
write_receipt() {
  local info_file="$ROOT/INSTALL-INFO.txt"
  {
    echo "══════════════════════════════════════════════════════════"
    echo " TITAN CRM — параметры установки (сохранено автоматически)"
    echo "══════════════════════════════════════════════════════════"
    echo "Дата установки:   $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    echo "Адреса:"
    echo "  Frontend:   $FRONTEND_URL"
    echo "  Backend:    http://localhost:${BACKEND_PORT}/api"
    echo "  Каталог:    $ROOT"
    echo
    echo "База данных:"
    echo "  Хост:  $DB_HOST   Порт: $DB_PORT"
    echo "  Имя:   $DB_NAME   Пользователь: $DB_USER"
    echo "  Пароль: $DB_PASS"
    echo
    if [[ "$SKIP_USERS" -eq 1 ]]; then
      echo "Администратор: не создавался (--skip-users)"
    elif [[ -n "$ADMIN_EMAIL" ]]; then
      echo "Администратор:"
      echo "  Имя:    $ADMIN_NAME"
      echo "  E-mail: $ADMIN_EMAIL"
      echo "  Роль:   $ADMIN_ROLE"
      [[ -n "$ADMIN_PASS" ]] && echo "  Пароль: $ADMIN_PASS"
    else
      echo "Администратор: не создан (пропущено или создан позже в интерфейсе)"
    fi
    echo
    echo "Правила запуска (из каталога $ROOT):"
    echo "  Backend:   cd backend && npm run dev     → http://localhost:${BACKEND_PORT}/api"
    echo "  Frontend:  cd frontend && npm run dev    → $FRONTEND_URL"
    echo "  Миграции:  cd backend && npm run migrate"
    echo
    echo " !!! Файл содержит пароли — храните в надёжном месте и не коммитьте в git."
    echo "══════════════════════════════════════════════════════════"
  } > "$info_file"
  chmod 600 "$info_file"
  ok "Сохранена инструкция с доступами: ${C_BOLD}$info_file${C_NC}"
  printf "  ${C_YELLOW}Правила запуска, пароли и доступы — в этом файле.${C_NC}\n"
}

# ============================================================================
#  Главный сценарий
# ============================================================================
parse_args "$@"

banner "╔══════════════════════════════════════════════════════════════╗"
banner "║  ${C_CYAN}TITAN CRM${C_BLUE} — мастер установки и настройки системы                 ║"
banner "╚══════════════════════════════════════════════════════════════╝"
[[ "$YES_MODE" -eq 1 ]] && info "Режим: автоматическая установка (--yes)"

check_environment
collect_params
configure_env
create_database
install_deps
run_migrations
create_admin
summary
write_receipt