#!/bin/bash

# Скрипт для исправления проблемы с загрузкой статических файлов на VDS
echo "🔧 Исправление загрузки статических файлов CSS/JS..."

# Останавливаем и удаляем контейнеры
echo "⏹️ Остановка контейнеров..."
docker-compose down

# Удаляем старые образы приложения для принудительной пересборки
echo "🗑️ Удаление старых образов..."
docker rmi $(docker images -q --filter "reference=*vitawin*") 2>/dev/null || true

# Очищаем volume с собранными файлами
echo "🧹 Очистка volume с собранными файлами..."
docker volume rm vitawin_vitawin_dist || true

# Пересоздаем контейнеры с новой конфигурацией
echo "🚀 Пересборка и запуск с исправленной конфигурацией..."
docker-compose up -d --build

# Проверяем статус
echo "📊 Проверка статуса контейнеров..."
sleep 10
docker-compose ps

echo "✅ Исправление завершено!"
echo "🌐 Проверьте сайт: https://vitawins.ru"
echo "📋 Логи: docker-compose logs -f app"