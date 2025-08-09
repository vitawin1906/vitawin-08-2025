#!/bin/bash

# Полное развертывание VitaWin с Nginx и Telegram ботами
# Этот скрипт развернет всю инфраструктуру: приложение, базу данных, Redis, Nginx и Telegram боты

set -e

echo "🚀 Полное развертывание VitaWin Stack..."

# Проверяем Docker
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker или Docker Compose не установлены"
    exit 1
fi

# Создаем .env файл если его нет
if [ ! -f ".env" ]; then
    echo "📝 Создаем .env файл..."
    cat > .env << EOF
# PostgreSQL
POSTGRES_PASSWORD=vitawin_secure_password_$(date +%s)

# Telegram Bots
TELEGRAM_BOT_TOKEN=7610585258:AAGTeZHRbpgjFcgXqcpBhE7yh0mKuwj0owA
TELEGRAM_SUPPORT_BOT_TOKEN=8188630914:AAH4DUUSM9vIjwh1aJ3tyT6Q5EQxq_Dc-AY

# Application URL (изменить на ваш домен в продакшене)
APP_URL=https://localhost

# Support Admins (Telegram IDs через запятую)
SUPPORT_ADMINS=131632979
EOF
    echo "✅ .env файл создан"
fi

# Создаем необходимые директории
echo "📁 Создаем директории..."
mkdir -p nginx/ssl uploads/images/{products,blog} uploads/assets logs

# Генерируем SSL сертификаты для HTTPS
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "🔐 Генерируем SSL сертификаты..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=VitaWin/CN=localhost" &>/dev/null
    echo "✅ SSL сертификаты созданы"
fi

# Останавливаем и очищаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose down --remove-orphans

# Собираем образы
echo "🔨 Собираем Docker образы..."
docker-compose build --no-cache

# Запускаем всю инфраструктуру
echo "🐳 Запускаем инфраструктуру..."
docker-compose up -d

# Ждем готовности сервисов
echo "⏳ Ждем готовности сервисов..."
sleep 15

# Проверяем PostgreSQL
echo "🐘 Проверяем PostgreSQL..."
timeout 60s bash -c 'until docker-compose exec -T postgres pg_isready -U vitawin_user -d vitawin; do sleep 2; done'
echo "✅ PostgreSQL готов"

# Проверяем приложение
echo "🌐 Проверяем приложение..."
timeout 60s bash -c 'until curl -f http://localhost:5000/health &>/dev/null; do sleep 2; done'
echo "✅ Приложение готово"

# Проверяем Nginx
echo "🌐 Проверяем Nginx..."
if curl -k https://localhost/api/products &>/dev/null; then
    echo "✅ Nginx работает корректно"
else
    echo "⚠️  Nginx может быть недоступен"
fi

# Настраиваем Telegram боты
echo "🤖 Настраиваем Telegram ботов..."

# Удаляем старые webhook'и
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" > /dev/null
curl -s "https://api.telegram.org/bot${TELEGRAM_SUPPORT_BOT_TOKEN}/deleteWebhook" > /dev/null

# Проверяем ботов
main_bot_status=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | grep -o '"ok":true' || echo "false")
support_bot_status=$(curl -s "https://api.telegram.org/bot${TELEGRAM_SUPPORT_BOT_TOKEN}/getMe" | grep -o '"ok":true' || echo "false")

if [[ "$main_bot_status" == *"true"* ]]; then
    echo "✅ @Vitawin_bot активен"
else
    echo "❌ @Vitawin_bot недоступен"
fi

if [[ "$support_bot_status" == *"true"* ]]; then
    echo "✅ @vitawin_support_bot активен"
else
    echo "❌ @vitawin_support_bot недоступен"
fi

# Проверяем статус всех контейнеров
echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "🌐 Доступные сервисы:"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌍 Веб-сайт:       https://localhost (SSL)"
echo "  🔗 HTTP редирект:  http://localhost → HTTPS"
echo "  🔌 API:            https://localhost/api/"
echo "  📁 Статика:       https://localhost/uploads/"
echo "  🔧 Админ-панель:   https://localhost/admin"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🐘 PostgreSQL:     localhost:5432"
echo "  🔴 Redis:          localhost:6379"
echo "  📡 Nginx:          localhost:80,443"
echo ""
echo "🤖 Telegram боты:"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 Основной:       @Vitawin_bot"
echo "  🆘 Поддержка:      @vitawin_support_bot"
echo "  📡 Webhook API:    /api/telegram/webhook"
echo "  📡 Support API:    /api/telegram/support/webhook"
echo ""
echo "🔧 Полезные команды:"
echo "  docker-compose ps              # Статус сервисов"
echo "  docker-compose logs app        # Логи приложения"
echo "  docker-compose logs nginx      # Логи Nginx"
echo "  docker-compose restart app     # Перезапуск приложения"
echo "  docker-compose down            # Остановить все"
echo ""
echo "🎯 Архитектура:"
echo "  ⚡ Nginx - раздача статики, SSL терминация"
echo "  🚀 Express - API и бизнес-логика"
echo "  🐘 PostgreSQL - основная база данных"
echo "  🔴 Redis - кеширование (опционально)"
echo "  🤖 Telegram боты - регистрация и поддержка"
echo ""
echo "✨ Готово к использованию! Откройте https://localhost"