#!/bin/bash

# Docker Setup Script для VitaWin
# Безопасный запуск приложения с базой данных

set -e

echo "🐳 Настройка Docker окружения для VitaWin..."

# Проверка Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен."
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p nginx/ssl
mkdir -p uploads
mkdir -p logs
mkdir -p database/backups

# Генерация самоподписанного SSL сертификата (для разработки)
if [ ! -f nginx/ssl/cert.pem ]; then
    echo "🔐 Генерация SSL сертификата для разработки..."
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=VitaWin/OU=IT/CN=localhost"
fi

# Копирование конфигурации окружения
if [ ! -f .env.local ]; then
    echo "⚙️ Создание конфигурации окружения..."
    cp .env.docker .env.local
    echo "✏️ Не забудьте отредактировать .env.local с вашими реальными API ключами!"
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose down --remove-orphans

# Сборка образов
echo "🔨 Сборка образов..."
docker-compose build --no-cache

# Запуск сервисов
echo "🚀 Запуск сервисов..."
docker-compose up -d postgres redis

# Ожидание готовности базы данных
echo "⏳ Ожидание готовности PostgreSQL..."
until docker-compose exec postgres pg_isready -U vitawin_user -d vitawin; do
    echo "Ожидание PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL готов!"

# Запуск миграций
echo "🔄 Выполнение миграций..."
docker-compose run --rm app node migrate-mlm-volume-fields.mjs

# Запуск приложения
echo "🚀 Запуск приложения..."
docker-compose up -d app

# Запуск Nginx
echo "🌐 Запуск Nginx..."
docker-compose up -d nginx

echo ""
echo "✅ VitaWin успешно запущен!"
echo ""
echo "📊 Доступные сервисы:"
echo "   🌐 Приложение: https://localhost (HTTP перенаправляется на HTTPS)"
echo "   🗄️ PostgreSQL: localhost:5432"
echo "   🗃️ Redis: localhost:6379"
echo ""
echo "📋 Полезные команды:"
echo "   docker-compose logs app      # Логи приложения"
echo "   docker-compose logs postgres # Логи базы данных"
echo "   docker-compose down          # Остановка всех сервисов"
echo "   docker-compose restart app   # Перезапуск приложения"
echo ""
echo "🔧 Настройка:"
echo "   Отредактируйте .env.local для добавления ваших API ключей"
echo "   Для продакшна замените самоподписанный SSL сертификат на реальный"