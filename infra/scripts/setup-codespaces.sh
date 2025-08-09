#!/bin/bash
echo "🚀 Запуск VitaWin в GitHub Codespaces (dev mode)"
echo "==============================================="

# Останавливаем старые процессы на 5050
echo "🛑 Проверка занятых портов..."
kill -9 $(lsof -t -i:5050) 2>/dev/null || true

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Переменные окружения
echo "🌍 Настройка окружения..."
export NODE_ENV=development
export PORT=5050
export DATABASE_URL="postgresql://neondb_owner:npg_iOdB2j1aJWeG@ep-damp-field-ab1az6n6-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Запуск сервера
echo "▶️ Запуск сервера (npm run dev)..."
npm run dev
