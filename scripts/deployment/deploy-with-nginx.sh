#!/bin/bash

# Скрипт развертывания VitaWin с Nginx в Docker
# Этот скрипт настроит полную продакшн среду с раздачей статики через Nginx

set -e

echo "🚀 Начинаем развертывание VitaWin с Nginx..."

# Проверяем, что мы в корне проекта
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Ошибка: docker-compose.yml не найден. Запустите скрипт из корня проекта."
    exit 1
fi

# Проверяем Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Создаем директории для SSL сертификатов, если их нет
mkdir -p nginx/ssl
mkdir -p uploads/images/products
mkdir -p uploads/images/blog
mkdir -p uploads/assets
mkdir -p logs

# Генерируем самоподписанные SSL сертификаты для тестирования
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "🔐 Генерируем самоподписанные SSL сертификаты..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=VitaWin/CN=localhost"
    echo "✅ SSL сертификаты созданы"
fi

# Создаем .env файл, если его нет
if [ ! -f ".env" ]; then
    echo "📝 Создаем .env файл..."
    cat > .env << EOF
# PostgreSQL
POSTGRES_PASSWORD=vitawin_secure_password_$(date +%s)

# Telegram Bots
TELEGRAM_BOT_TOKEN=7610585258:AAGTeZHRbpgjFcgXqcpBhE7yh0mKuwj0owA
TELEGRAM_SUPPORT_BOT_TOKEN=8188630914:AAH4DUUSM9vIjwh1aJ3tyT6Q5EQxq_Dc-AY

# Application URL
APP_URL=https://localhost

# Support Admins (comma separated Telegram IDs)
SUPPORT_ADMINS=131632979
EOF
    echo "✅ .env файл создан"
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down --remove-orphans

# Собираем образы
echo "🔨 Собираем Docker образы..."
docker-compose build --no-cache

# Запускаем все сервисы
echo "🐳 Запускаем все сервисы..."
docker-compose up -d

# Ждем, пока сервисы запустятся
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус сервисов
echo "📊 Проверяем статус сервисов..."
docker-compose ps

# Ждем готовности базы данных и приложения
echo "⏳ Ждем готовности базы данных..."
timeout 60s bash -c 'until docker-compose exec -T postgres pg_isready -U vitawin_user -d vitawin; do sleep 2; done'

echo "⏳ Ждем готовности приложения..."
timeout 60s bash -c 'until curl -f http://localhost:5000/health &>/dev/null; do sleep 2; done'

# Проверяем Nginx
echo "🌐 Проверяем Nginx..."
if curl -k https://localhost/api/products &>/dev/null; then
    echo "✅ Nginx корректно проксирует API запросы"
else
    echo "⚠️  Nginx может не работать корректно"
fi

# Тестируем раздачу статики через Nginx
echo "📁 Проверяем раздачу статики через Nginx..."
if curl -k https://localhost/uploads/assets/test.txt &>/dev/null; then
    echo "✅ Nginx корректно раздает статические файлы"
else
    echo "ℹ️  Статические файлы будут раздаваться после их создания"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📋 Информация о сервисах:"
echo "  🌐 Веб-сайт: https://localhost (с SSL)"
echo "  🌐 HTTP редирект: http://localhost -> https://localhost"
echo "  🔌 API: https://localhost/api/"
echo "  📁 Статика: https://localhost/uploads/"
echo "  🐘 PostgreSQL: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo ""
echo "📊 Полезные команды:"
echo "  docker-compose ps                 # Статус сервисов"
echo "  docker-compose logs app           # Логи приложения"
echo "  docker-compose logs nginx         # Логи Nginx"
echo "  docker-compose down               # Остановить все"
echo "  docker-compose up -d              # Запустить все"
echo ""
echo "🔧 Преимущества этой архитектуры:"
echo "  ⚡ Nginx раздает статику напрямую (быстрее Express)"
echo "  🛡️  SSL терминация в Nginx"
echo "  📈 Лучшее кеширование статических файлов"
echo "  🔒 Rate limiting и security headers"
echo "  🔄 Автоматический HTTP -> HTTPS редирект"
echo ""
echo "✅ Готово к использованию!"