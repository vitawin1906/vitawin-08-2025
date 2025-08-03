#!/bin/bash

# VitaWin Admin CLI - Bash wrapper скрипт
# Использование: ./admin-cli.sh или docker exec -it vitawin_app node /app/scripts/admin-cli.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Проверка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен"
        exit 1
    fi
    
    if ! docker ps &> /dev/null; then
        error "Docker не запущен или нет прав доступа"
        exit 1
    fi
}

# Проверка контейнеров VitaWin
check_containers() {
    local postgres_status=$(docker ps --filter "name=vitawin_postgres" --format "{{.Status}}" | head -1)
    local app_status=$(docker ps --filter "name=vitawin_app" --format "{{.Status}}" | head -1)
    
    if [[ -z "$postgres_status" ]]; then
        error "Контейнер vitawin_postgres не найден или не запущен"
        echo "Запустите: docker-compose up -d postgres"
        exit 1
    fi
    
    if [[ -z "$app_status" ]]; then
        warn "Контейнер vitawin_app не найден, запуск CLI напрямую через PostgreSQL"
        USE_POSTGRES_DIRECT=true
    else
        log "Контейнеры готовы: PostgreSQL (${postgres_status:0:10}...), App (${app_status:0:10}...)"
    fi
}

# Запуск через контейнер приложения
run_via_app() {
    log "Попытка запуска через контейнер vitawin_app..."
    
    # Проверяем права на запись в контейнере
    if docker exec vitawin_app test -w /app; then
        # Создаем директорию и копируем скрипт если его нет
        if ! docker exec vitawin_app test -f /app/scripts/admin-cli.js; then
            log "Создание директории scripts и копирование скрипта..."
            docker exec vitawin_app mkdir -p /app/scripts 2>/dev/null || true
            docker cp "$SCRIPT_DIR/admin-cli.js" vitawin_app:/app/scripts/ 2>/dev/null || true
        fi
        
        docker exec -it vitawin_app node /app/scripts/admin-cli.js
    else
        log "Нет прав для записи в контейнер, используем упрощенную версию на хосте..."
        run_on_host_simple
    fi
}

# Запуск упрощенной версии на хосте
run_on_host_simple() {
    if [ -f "$SCRIPT_DIR/admin-cli-simple.js" ]; then
        node "$SCRIPT_DIR/admin-cli-simple.js"
    else
        log "❌ Файл admin-cli-simple.js не найден"
        exit 1
    fi
}

# Запуск через PostgreSQL контейнер (fallback)
run_via_postgres() {
    log "Запуск Admin CLI через прямое подключение к PostgreSQL..."
    
    # Проверяем наличие Node.js в PostgreSQL контейнере
    if ! docker exec vitawin_postgres which node &> /dev/null; then
        error "Node.js не найден в контейнере PostgreSQL"
        echo "Необходимо запустить через контейнер vitawin_app"
        exit 1
    fi
    
    # Копируем скрипт в контейнер PostgreSQL
    docker cp "$SCRIPT_DIR/admin-cli.js" vitawin_postgres:/tmp/admin-cli.js
    docker exec -it vitawin_postgres node /tmp/admin-cli.js
}

# SQL утилиты
run_sql() {
    local query="$1"
    log "Выполнение SQL: ${query:0:50}..."
    docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "$query"
}

# Быстрые команды
quick_commands() {
    case "$1" in
        "check")
            log "Проверка админских данных..."
            run_sql "SELECT COUNT(*) as admin_count FROM admin_users;"
            run_sql "SELECT id, email, created_at, last_login FROM admin_users ORDER BY id;"
            ;;
        "reset")
            warn "Сброс базы данных..."
            echo "Вы уверены? Введите 'YES' для подтверждения:"
            read -r confirmation
            if [[ "$confirmation" == "YES" ]]; then
                run_sql "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO vitawin_user; GRANT ALL ON SCHEMA public TO public;"
                log "База данных сброшена"
            else
                warn "Операция отменена"
            fi
            ;;
        "status")
            log "Статус контейнеров VitaWin:"
            docker ps --filter "name=vitawin" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            ;;
        "logs")
            log "Логи PostgreSQL:"
            docker logs vitawin_postgres --tail 20
            ;;
        *)
            echo "Использование: $0 [check|reset|status|logs]"
            echo "Или запустите без параметров для интерактивного CLI"
            ;;
    esac
}

# Главная функция
main() {
    echo -e "${BLUE}"
    echo "🔧 VitaWin Admin CLI"
    echo "===================="
    echo -e "${NC}"
    
    check_docker
    check_containers
    
    # Если передан параметр - выполняем быструю команду
    if [[ $# -gt 0 ]]; then
        quick_commands "$1"
        exit 0
    fi
    
    # Запуск интерактивного CLI
    if [[ "$USE_POSTGRES_DIRECT" == "true" ]]; then
        run_via_postgres
    else
        run_via_app
    fi
}

# Обработка сигналов
trap 'echo -e "\n${YELLOW}Прерывание пользователем${NC}"; exit 130' INT
trap 'echo -e "\n${RED}Получен сигнал завершения${NC}"; exit 143' TERM

# Запуск
main "$@"