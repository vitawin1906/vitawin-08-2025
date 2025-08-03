#!/bin/bash

# Скрипт развертывания VitaWin на продакшн сервер
# Включает синхронизацию данных из разработки

echo "🚀 Начинаем развертывание VitaWin на продакшн..."

# Проверка окружения
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Не установлен POSTGRES_PASSWORD"
    exit 1
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих сервисов..."
docker-compose down --remove-orphans

# Сборка и запуск контейнеров
echo "🏗️ Сборка и запуск контейнеров..."
docker-compose up -d --build

# Ожидание готовности сервисов
echo "⏳ Ожидание готовности сервисов..."
sleep 30

# Проверка здоровья сервисов
echo "🔍 Проверка здоровья сервисов..."
docker-compose ps

# Синхронизация данных из разработки
echo "📊 Синхронизация данных из Neon..."
node scripts/migration/sync-data-to-production.mjs

# Проверка API
echo "🧪 Тестирование API..."
curl -f http://localhost:5050/health || {
    echo "❌ API не отвечает"
    exit 1
}

echo "✅ Развертывание завершено успешно!"
echo "🌐 Приложение доступно на: http://localhost"
echo "📱 API доступно на: http://localhost:5050"