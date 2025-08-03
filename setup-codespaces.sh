#!/bin/bash
echo "🚀 Запуск VitaWin в GitHub Codespaces (dev mode)"
echo "==============================================="

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# 2. Переменные окружения (замени на реальные данные Neon)
echo "🌍 Настройка окружения..."
export NODE_ENV=development
export PORT=5050
export DATABASE_URL=postgresql://neondb_owner:npg_iOdB2j1aJWeG@ep-damp-field-ab1az6n6-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# 3. Открываем порт 5050 наружу
echo "🌐 Открытие порта 5050..."
gp ports visibility 5050:public

# 4. Запуск сервера
echo "▶️ Запуск сервера (npm run dev)..."
npm run dev
