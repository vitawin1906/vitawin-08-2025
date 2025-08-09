#!/bin/bash

# Скрипт тестирования Telegram ботов
# Проверяет все endpoints и функциональность ботов

set -e

echo "🧪 Тестирование Telegram ботов..."

# Загружаем переменные окружения
if [ -f .env ]; then
    source .env
fi

APP_URL=${APP_URL:-http://localhost:5000}

# Функция для тестирования HTTP endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local description=$3
    
    echo -n "🔍 Тестируем $description: "
    
    if [ "$method" = "GET" ]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    fi
    
    if [ "$response_code" = "200" ]; then
        echo "✅ OK (${response_code})"
        return 0
    else
        echo "❌ Fail (${response_code})"
        return 1
    fi
}

# Функция для отправки тестового webhook
test_webhook() {
    local url=$1
    local bot_name=$2
    
    echo "📡 Тестируем webhook $bot_name..."
    
    # Создаем тестовое сообщение
    test_update='{
        "update_id": 123456789,
        "message": {
            "message_id": 1,
            "from": {
                "id": 999999999,
                "is_bot": false,
                "first_name": "Тест",
                "username": "test_user"
            },
            "chat": {
                "id": 999999999,
                "type": "private"
            },
            "date": 1640995200,
            "text": "/start"
        }
    }'
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$test_update" \
        -w "\nHTTP_CODE:%{http_code}")
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Webhook $bot_name работает (${http_code})"
        return 0
    else
        echo "❌ Webhook $bot_name не работает (${http_code})"
        echo "Response: $response_body"
        return 1
    fi
}

echo ""
echo "🔍 Проверяем доступность API endpoints..."

# Тестируем основные endpoints
test_endpoint "$APP_URL/health" "GET" "Health check"
test_endpoint "$APP_URL/api/products" "GET" "Products API"

# Тестируем Telegram endpoints
if test_endpoint "$APP_URL/api/telegram/webhook" "POST" "Main bot webhook"; then
    MAIN_WEBHOOK_OK=true
else
    MAIN_WEBHOOK_OK=false
fi

if test_endpoint "$APP_URL/api/telegram/support/webhook" "POST" "Support bot webhook"; then
    SUPPORT_WEBHOOK_OK=true
else
    SUPPORT_WEBHOOK_OK=false
fi

echo ""
echo "📡 Тестируем webhook'и с реальными данными..."

if [ "$MAIN_WEBHOOK_OK" = true ]; then
    test_webhook "$APP_URL/api/telegram/webhook" "основного бота"
fi

if [ "$SUPPORT_WEBHOOK_OK" = true ]; then
    test_webhook "$APP_URL/api/telegram/support/webhook" "бота поддержки"
fi

echo ""
echo "🐳 Проверяем Docker контейнеры ботов..."

# Проверяем, запущены ли контейнеры ботов
if docker ps --format "table {{.Names}}" | grep -q "vitawin_main_bot"; then
    echo "✅ Контейнер основного бота запущен"
    
    # Проверяем логи
    echo "📋 Последние логи основного бота:"
    docker logs --tail 5 vitawin_main_bot 2>/dev/null || echo "   Нет логов"
else
    echo "⚠️  Контейнер основного бота не запущен"
fi

if docker ps --format "table {{.Names}}" | grep -q "vitawin_support_bot"; then
    echo "✅ Контейнер бота поддержки запущен"
    
    # Проверяем логи
    echo "📋 Последние логи бота поддержки:"
    docker logs --tail 5 vitawin_support_bot 2>/dev/null || echo "   Нет логов"
else
    echo "⚠️  Контейнер бота поддержки не запущен"
fi

echo ""
echo "🔧 Проверяем конфигурацию..."

# Проверяем переменные окружения
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo "✅ TELEGRAM_BOT_TOKEN установлен"
else
    echo "❌ TELEGRAM_BOT_TOKEN не установлен"
fi

if [ -n "$TELEGRAM_SUPPORT_BOT_TOKEN" ]; then
    echo "✅ TELEGRAM_SUPPORT_BOT_TOKEN установлен"
else
    echo "❌ TELEGRAM_SUPPORT_BOT_TOKEN не установлен"
fi

if [ -n "$APP_URL" ]; then
    echo "✅ APP_URL установлен: $APP_URL"
else
    echo "❌ APP_URL не установлен"
fi

echo ""
echo "📊 Результаты тестирования:"
echo "   🌐 API доступен: $([ "$?" = "0" ] && echo "✅" || echo "❌")"
echo "   📡 Webhook основного бота: $([ "$MAIN_WEBHOOK_OK" = true ] && echo "✅" || echo "❌")"
echo "   📡 Webhook бота поддержки: $([ "$SUPPORT_WEBHOOK_OK" = true ] && echo "✅" || echo "❌")"
echo ""
echo "✅ Тестирование завершено!"
echo ""
echo "💡 Советы по отладке:"
echo "   - Проверьте логи приложения: docker-compose logs app"
echo "   - Проверьте логи ботов: docker-compose logs main-bot support-bot"
echo "   - Убедитесь, что токены ботов корректны"
echo "   - В продакшене используйте HTTPS URL для webhook'ов"