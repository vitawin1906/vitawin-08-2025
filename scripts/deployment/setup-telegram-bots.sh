#!/bin/bash

# Скрипт настройки Telegram ботов для VitaWin
# Этот скрипт настроит webhook'и и проверит работу ботов

set -e

echo "🤖 Настройка Telegram ботов для VitaWin..."

# Проверяем переменные окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN не установлен"
    echo "Установите токен основного бота в .env файле"
    exit 1
fi

if [ -z "$TELEGRAM_SUPPORT_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_SUPPORT_BOT_TOKEN не установлен"
    echo "Установите токен бота поддержки в .env файле"
    exit 1
fi

APP_URL=${APP_URL:-https://vitawins.ru}
echo "🌐 Используется APP_URL: $APP_URL"

# Функция для установки webhook
setup_webhook() {
    local token=$1
    local webhook_url=$2
    local bot_name=$3
    
    echo "📡 Настройка webhook для $bot_name..."
    
    # Удаляем существующий webhook
    curl -s "https://api.telegram.org/bot$token/deleteWebhook" > /dev/null
    
    # Устанавливаем новый webhook
    response=$(curl -s -X POST "https://api.telegram.org/bot$token/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$webhook_url\"}")
    
    if echo "$response" | grep -q '"ok":true'; then
        echo "✅ Webhook для $bot_name установлен: $webhook_url"
    else
        echo "❌ Ошибка установки webhook для $bot_name:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Функция для проверки статуса бота
check_bot_status() {
    local token=$1
    local bot_name=$2
    
    echo "🔍 Проверка статуса $bot_name..."
    
    response=$(curl -s "https://api.telegram.org/bot$token/getMe")
    
    if echo "$response" | grep -q '"ok":true'; then
        bot_username=$(echo "$response" | jq -r '.result.username' 2>/dev/null || echo "unknown")
        echo "✅ $bot_name активен: @$bot_username"
        return 0
    else
        echo "❌ $bot_name недоступен:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi
}

# Функция для получения информации о webhook
get_webhook_info() {
    local token=$1
    local bot_name=$2
    
    echo "📊 Информация о webhook для $bot_name:"
    
    response=$(curl -s "https://api.telegram.org/bot$token/getWebhookInfo")
    
    if echo "$response" | grep -q '"ok":true'; then
        echo "$response" | jq '.result' 2>/dev/null || echo "$response"
    else
        echo "❌ Ошибка получения информации:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
    echo ""
}

echo ""
echo "🔍 Проверяем статус ботов..."

# Проверяем основной бот
if check_bot_status "$TELEGRAM_BOT_TOKEN" "Основной бот"; then
    MAIN_BOT_OK=true
else
    MAIN_BOT_OK=false
fi

# Проверяем бот поддержки
if check_bot_status "$TELEGRAM_SUPPORT_BOT_TOKEN" "Бот поддержки"; then
    SUPPORT_BOT_OK=true
else
    SUPPORT_BOT_OK=false
fi

echo ""

# Если используем webhook (в продакшене)
if [[ "$APP_URL" == https://* ]]; then
    echo "🌐 Режим webhook (продакшен)"
    
    if [ "$MAIN_BOT_OK" = true ]; then
        setup_webhook "$TELEGRAM_BOT_TOKEN" "$APP_URL/api/telegram/webhook" "Основной бот"
        get_webhook_info "$TELEGRAM_BOT_TOKEN" "Основной бот"
    fi
    
    if [ "$SUPPORT_BOT_OK" = true ]; then
        setup_webhook "$TELEGRAM_SUPPORT_BOT_TOKEN" "$APP_URL/api/telegram/support/webhook" "Бот поддержки"
        get_webhook_info "$TELEGRAM_SUPPORT_BOT_TOKEN" "Бот поддержки"
    fi
    
    echo "⚠️  Внимание: В режиме webhook боты не запускаются как отдельные процессы."
    echo "   Они работают через webhook'и в основном приложении."
    echo "   Docker контейнеры ботов не нужны в этом режиме."
    
else
    echo "🖥️  Режим polling (разработка/локальный)"
    echo "   В Docker Compose боты запускаются как отдельные контейнеры"
    
    if [ "$MAIN_BOT_OK" = true ]; then
        # Удаляем webhook для polling режима
        curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook" > /dev/null
        echo "✅ Webhook удален для основного бота (polling режим)"
    fi
    
    if [ "$SUPPORT_BOT_OK" = true ]; then
        # Удаляем webhook для polling режима
        curl -s "https://api.telegram.org/bot$TELEGRAM_SUPPORT_BOT_TOKEN/deleteWebhook" > /dev/null
        echo "✅ Webhook удален для бота поддержки (polling режим)"
    fi
fi

echo ""
echo "📋 Полезная информация:"
echo ""
echo "🤖 Основной бот (@vitawin_bot):"
echo "   - Регистрация пользователей"
echo "   - Реферальные ссылки"
echo "   - Уведомления о заказах и бонусах"
echo ""
echo "🆘 Бот поддержки (@vitawin_support_bot):"
echo "   - Техническая поддержка"
echo "   - Ответы на вопросы"
echo "   - Связь с менеджерами"
echo ""
echo "🔧 Режимы работы:"
echo "   - Webhook (продакшен): боты работают через API endpoints в приложении"
echo "   - Polling (разработка): боты работают как отдельные Docker контейнеры"
echo ""

if [ "$MAIN_BOT_OK" = true ] && [ "$SUPPORT_BOT_OK" = true ]; then
    echo "✅ Все боты настроены и готовы к работе!"
    exit 0
else
    echo "⚠️  Некоторые боты недоступны. Проверьте токены и попробуйте снова."
    exit 1
fi