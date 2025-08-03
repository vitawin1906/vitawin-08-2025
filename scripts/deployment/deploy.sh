#!/bin/bash

# Скрипт автоматического развертывания VitaWin
# Использование: ./deploy.sh

echo "🚀 Запуск развертывания VitaWin..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Устанавливаем..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не найден. Устанавливаем..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 не найден. Устанавливаем..."
    sudo npm install -g pm2
fi

# Проверка Nginx
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx не найден. Устанавливаем..."
    sudo apt install -y nginx
fi

echo "✅ Все зависимости установлены"

# Установка зависимостей проекта
echo "📦 Устанавливаем зависимости проекта..."
npm install

# Проверка файла .env
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Создаем шаблон..."
    cat > .env << EOL
# ОБЯЗАТЕЛЬНО ЗАПОЛНИТЕ ЭТИ ПЕРЕМЕННЫЕ!
DATABASE_URL=postgresql://vitawin_user:your_password@localhost:5432/vitawin_db
JWT_SECRET=your_very_secure_jwt_secret_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TINKOFF_TERMINAL_KEY=your_tinkoff_terminal_key
TINKOFF_SECRET_KEY=your_tinkoff_secret_key
OPENAI_API_KEY=your_openai_api_key
CDEK_API_ACCOUNT=your_cdek_account
CDEK_API_SECRET=your_cdek_secret
RUSSIANPOST_API_KEY=your_russianpost_key
YANDEX_DELIVERY_API_KEY=your_yandex_delivery_key
PORT=5050
NODE_ENV=production
EOL
    echo "❗ ВАЖНО: Отредактируйте файл .env перед продолжением!"
    echo "❗ Затем запустите: ./deploy.sh"
    exit 1
fi

# Сборка проекта
echo "🔨 Собираем проект..."
npm run build

# Проверка базы данных
echo "🗄️  Применяем миграции базы данных..."
npm run db:push

# Создание папки для логов
mkdir -p logs

# Запуск через PM2
echo "🚀 Запускаем приложение через PM2..."
pm2 start ecosystem.config.js

# Настройка автозапуска
pm2 startup
pm2 save

echo "✅ Развертывание завершено!"
echo "📋 Статус приложения:"
pm2 status

echo ""
echo "🌐 Следующие шаги:"
echo "1. Настройте домен в DNS"
echo "2. Настройте SSL сертификат: sudo certbot --nginx -d your-domain.com"
echo "3. Проверьте работу приложения: http://ваш-ip:5050"
echo ""
echo "📚 Подробная инструкция в файле DEPLOYMENT_GUIDE.md"