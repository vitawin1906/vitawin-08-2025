#!/bin/bash

# 🚀 УСТАНОВКА VITAWIN НА VDS - ЕДИНЫЙ СКРИПТ
# Запустить ОДИН РАЗ на чистом сервере

set -e  # Остановка при ошибке

echo "🚀 Начинаем установку VitaWin на VDS..."

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите скрипт от root: sudo bash deploy-vitawin-vds.sh"
    exit 1
fi

echo "📦 Обновление системы..."
apt update && apt upgrade -y

echo "🐳 Установка Docker и Docker Compose..."
# Удаление старых версий
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Установка зависимостей
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление официального ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запуск Docker
systemctl enable docker
systemctl start docker

echo "📁 Создание рабочей директории..."
mkdir -p /var/vitawin
cd /var/vitawin

echo "⚙️ Создание docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vitawin_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: vitawin
      POSTGRES_USER: vitawin_user
      POSTGRES_PASSWORD: strong_password_123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - vitawin_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vitawin_user -d vitawin"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: vitawin/app:latest
    container_name: vitawin_app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://neondb_owner:пароль@ep-хост.neon.tech/neondb?sslmode=require

      PORT: 5050
    ports:
      - "5050:5050"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - vitawin_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5050/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: vitawin_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    networks:
      - vitawin_network

volumes:
  postgres_data:

networks:
  vitawin_network:
    driver: bridge
EOF

echo "🌐 Создание конфигурации Nginx..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5050;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 100M;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

echo "📊 Создание SQL скрипта с данными..."
cat > setup-data.sql << 'EOF'
-- Товары
INSERT INTO products (name, title, description, price, original_price, category, badge, stock, status, slug, composition) VALUES 
('Витамин D3', 'Витамин D3 премиум качества', 'Высококачественный витамин D3 для поддержки иммунитета', 990.00, 1890.00, 'Поддержка иммунитета', 'Популярный', 490, 'active', 'vitamin-d3', 'Витамин D3'),
('Омега-3', 'Рыбий жир в капсулах', 'Натуральные омега-3 жирные кислоты для здоровья сердца', 1389.86, 3390.00, 'Общее здоровье', 'Рекомендовано врачами', 238, 'active', 'omega-3', 'EPA и DHA'),
('Берберин', 'Берберин экстракт 98%', 'Экстракт берберина для поддержания здорового уровня сахара', 1890.00, 3490.00, 'Поддержка иммунитета', 'Бестселлер', 1429, 'active', 'berberine', 'Berberine HCl 98%'),
('Ежовик Гребенчатый', 'Ежовик Гребенчатый мицелий', 'Натуральная добавка для поддержки памяти', 2190.00, 4390.00, 'Сон и расслабление', 'Ограниченная серия', 1112, 'active', 'ezhovik-grebenchatiy', 'Ежовик экстракт'),
('Кордицепс военный', 'Кордицепс двойной экстракт', 'Двойной экстракт кордицепса для энергии', 1990.00, 3890.00, 'Фитнес и спорт', 'Премиум', 5203, 'active', 'cordyceps-militaris', 'Cordyceps Militaris'),
('Магний Глицинат', 'Магний легкоусвояемый', 'Высокобиодоступная форма магния для расслабления', 1290.00, 2490.00, 'Сон и расслабление', 'Новинка', 356, 'active', 'magnesium-glycinate', 'Магний бисглицинат'),
('Цинк Пиколинат', 'Цинк Пиколинат 30мг', 'Легкоусвояемый цинк для иммунитета', 890.00, 1590.00, 'Поддержка иммунитета', 'Выгодно', 724, 'active', 'zinc-picolinate', 'Цинк пиколинат'),
('Коэнзим Q10', 'Коэнзим Q10 убихинол', 'Активная форма CoQ10 для энергии', 2890.00, 4990.00, 'Общее здоровье', 'Премиум', 189, 'active', 'coenzyme-q10', 'Убихинол');

-- Очистка админов
TRUNCATE TABLE admin_users RESTART IDENTITY CASCADE;

-- Администратор (пароль: admin123)
INSERT INTO admin_users (email, password) VALUES 
('admin@vitawin.ru', 'admin123');

-- Тестовый пользователь
INSERT INTO users (telegram_id, username, first_name, referral_code, balance) VALUES 
(123456789, 'test_user', 'Тестовый пользователь', '123456789', 0.00);

SELECT 'Данные загружены. Товары:', COUNT(*) FROM products;
EOF

echo "🐳 Запуск Docker контейнеров..."
docker compose up -d

echo "⏳ Ожидание готовности PostgreSQL..."
sleep 30

echo "📊 Загрузка начальных данных..."
docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin < setup-data.sql

echo "🧪 Проверка работоспособности..."
sleep 10

# Проверка API
if curl -f http://localhost:5050/health > /dev/null 2>&1; then
    echo "✅ API работает!"
else
    echo "⚠️ API пока не отвечает, проверьте логи: docker compose logs app"
fi

# Проверка товаров
PRODUCTS_COUNT=$(docker exec vitawin_postgres psql -U vitawin_user -d vitawin -t -c "SELECT COUNT(*) FROM products;" | tr -d ' ')
echo "📦 Товаров в базе: $PRODUCTS_COUNT"

echo ""
echo "🎉 УСТАНОВКА ЗАВЕРШЕНА!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Сайт доступен: http://$(curl -s ifconfig.me)"
echo "🔧 API: http://$(curl -s ifconfig.me):5050"
echo "📊 Админка: http://$(curl -s ifconfig.me)/admin"
echo ""
echo "📋 Полезные команды:"
echo "  Просмотр логов:    docker compose logs -f app"
echo "  Перезапуск:        docker compose restart"
echo "  Остановка:         docker compose down"
echo "  Обновление:        docker compose pull && docker compose up -d"
echo ""
echo "🔐 Доступы:"
echo "  Админ: admin@vitawin.ru / admin123"
echo "  База: vitawin_user / strong_password_123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"