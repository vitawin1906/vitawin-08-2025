#!/bin/bash

echo "🚀 === ПРОИЗВОДСТВЕННОЕ ТЕСТИРОВАНИЕ DOCKER === 🚀"
echo ""

echo "🔧 Создание production .env файла..."
cat > .env.production.test << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/vitawin_test
TELEGRAM_BOT_TOKEN=test_token
TELEGRAM_SUPPORT_BOT_TOKEN=test_support_token
EOF

echo "✅ .env.production.test создан"
echo ""

echo "📦 Тестирование Docker Compose конфигурации..."

# Проверяем docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml найден"
    
    echo "🔍 Проверка сервисов в docker-compose:"
    grep -E "^  [a-z]" docker-compose.yml | sed 's/:$//' | while read service; do
        echo "   - $service"
    done
    
    echo ""
    echo "🔍 Проверка портов:"
    grep -A 3 "ports:" docker-compose.yml | grep -E "^\s*-" | while read port; do
        echo "   $port"
    done
    
    echo ""
    echo "🔍 Проверка volumes:"
    grep -A 10 "volumes:" docker-compose.yml | grep -E "^\s*-" | head -5 | while read volume; do
        echo "   $volume"
    done
    
else
    echo "⚠️ docker-compose.yml не найден"
fi

echo ""
echo "🐘 Тестирование PostgreSQL конфигурации..."

# Проверяем настройки БД
echo "Проверка Drizzle конфигурации:"
if [ -f "drizzle.config.ts" ]; then
    grep -E "(dialect|schema|out)" drizzle.config.ts | while read line; do
        echo "   $line"
    done
fi

echo ""
echo "🔧 Симуляция production сборки..."

# Симулируем команды из Dockerfile
echo "Этап 1: Установка зависимостей..."
echo "   npm ci (пропущено для скорости)"

echo "Этап 2: Сборка приложения..."
echo "   npm run build:"
echo "   - Frontend: vite build → dist/public/"
echo "   - Backend: esbuild → dist/index.js"

echo "Этап 3: Production зависимости..."
echo "   npm ci --only=production"

echo "Этап 4: Создание пользователя и директорий..."
echo "   adduser vitawin"
echo "   mkdir uploads logs"

echo ""
echo "🔍 Проверка безопасности..."

# Проверяем что нет секретов в коде
echo "Поиск потенциальных секретов в коде:"
secrets_found=0

if grep -r "password.*=" client/ server/ 2>/dev/null | grep -v ".env" | head -3; then
    secrets_found=1
fi

if grep -r "token.*=" client/ server/ 2>/dev/null | grep -v ".env" | head -3; then
    secrets_found=1
fi

if [ $secrets_found -eq 0 ]; then
    echo "✅ Явных секретов в коде не найдено"
else
    echo "⚠️ Найдены потенциальные секреты - проверьте использование переменных окружения"
fi

echo ""
echo "📊 Анализ размера проекта..."
echo "Исходный код:"
if [ -d "client" ]; then
    echo "   Frontend: $(du -sh client/ 2>/dev/null | cut -f1)"
fi
if [ -d "server" ]; then
    echo "   Backend: $(du -sh server/ 2>/dev/null | cut -f1)"
fi
if [ -d "shared" ]; then
    echo "   Shared: $(du -sh shared/ 2>/dev/null | cut -f1)"
fi

echo "   node_modules: $(du -sh node_modules/ 2>/dev/null | cut -f1 || echo 'не установлен')"

echo ""
echo "🎯 === РЕКОМЕНДАЦИИ ДЛЯ PRODUCTION === 🎯"
echo ""
echo "1. 🔒 Переменные окружения:"
echo "   DATABASE_URL - строка подключения к PostgreSQL"
echo "   TELEGRAM_BOT_TOKEN - токен основного бота"
echo "   TELEGRAM_SUPPORT_BOT_TOKEN - токен бота поддержки"
echo ""
echo "2. 🐳 Команды Docker:"
echo "   docker build -t vitawin:latest ."
echo "   docker run -p 5000:5000 --env-file .env.production vitawin:latest"
echo ""
echo "3. 🚀 Docker Compose:"
echo "   docker-compose up -d"
echo "   docker-compose logs -f app"
echo ""
echo "4. 🔧 Проверка здоровья:"
echo "   curl http://localhost:5000/health"
echo "   docker ps"
echo ""

# Очистка
rm -f .env.production.test

echo "✅ Производственное тестирование завершено"