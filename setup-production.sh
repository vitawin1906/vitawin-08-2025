#!/bin/bash

# VitaWin Production Setup Script
# Автоматическая установка и развертывание VitaWin на VPS

set -e

echo "🚀 VitaWin Production Setup Script"
echo "=================================="

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Запустите скрипт с правами root: sudo $0"
  exit 1
fi

# Функция логирования
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Проверка системы
log "Проверка системы..."
if ! command -v curl &> /dev/null; then
  log "Установка curl..."
  apt update && apt install -y curl
fi

# Установка Docker
if ! command -v docker &> /dev/null; then
  log "Установка Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  usermod -aG docker $USER
  rm get-docker.sh
else
  log "✅ Docker уже установлен"
fi

# Установка Docker Compose
if ! command -v docker-compose &> /dev/null; then
  log "Установка Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  log "✅ Docker Compose уже установлен"
fi

# Создание рабочей директории
INSTALL_DIR="/opt/vitawin"
log "Создание директории $INSTALL_DIR..."
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Клонирование проекта (или создание из архива)
if [ ! -d ".git" ]; then
  log "⬇️ Загрузка проекта VitaWin..."
  
  # Если есть локальная копия (например, загруженная через SCP)
  if [ -f "/tmp/vitawin.tar.gz" ]; then
    log "Распаковка локального архива..."
    tar -xzf /tmp/vitawin.tar.gz --strip-components=1
  else
    # Клонирование с GitHub (когда проект будет загружен)
    log "Клонирование с GitHub..."
    if command -v git &> /dev/null; then
      git clone https://github.com/YOUR_USERNAME/vitawin.git .
    else
      apt install -y git
      git clone https://github.com/YOUR_USERNAME/vitawin.git .
    fi
  fi
else
  log "✅ Проект уже загружен"
fi

# Проверка SSL сертификатов
log "🔐 Проверка SSL сертификатов..."
mkdir -p nginx/ssl
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
  log "⚠️  SSL сертификаты не найдены в nginx/ssl/"
  log "📋 Поместите ваши SSL сертификаты:"
  log "   - nginx/ssl/fullchain.pem (полная цепочка)"
  log "   - nginx/ssl/privkey.pem (приватный ключ)"
  log "   Или скрипт создаст временные самоподписанные для тестирования"
  
  read -p "Создать временные самоподписанные сертификаты? (y/N): " create_temp
  if [[ $create_temp =~ ^[Yy]$ ]]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout nginx/ssl/privkey.pem \
      -out nginx/ssl/fullchain.pem \
      -subj "/C=RU/ST=Moscow/L=Moscow/O=VitaWin/CN=vitawins.ru"
    log "✅ Временные SSL сертификаты созданы"
  else
    log "❌ Поместите SSL сертификаты в nginx/ssl/ и перезапустите скрипт"
    exit 1
  fi
else
  log "✅ SSL сертификаты найдены"
fi

# Создание необходимых директорий
log "📁 Создание рабочих директорий..."
mkdir -p uploads/images logs/nginx database/data

# Установка правильных прав доступа
chown -R 1001:1001 uploads logs
chmod -R 755 uploads logs

# Проверка Docker Compose конфигурации
log "🔍 Проверка Docker Compose конфигурации..."
if ! docker-compose config &> /dev/null; then
  log "❌ Ошибка в docker-compose.yml"
  exit 1
fi

# Запуск контейнеров
log "🐳 Запуск Docker контейнеров..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# Ожидание запуска сервисов
log "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверка статуса контейнеров
log "📊 Проверка статуса сервисов..."
docker-compose ps

# Инициализация базы данных
log "🗄️ Инициализация базы данных..."
if docker-compose exec -T app npm run db:push; then
  log "✅ База данных инициализирована"
else
  log "⚠️ Ошибка инициализации базы данных (может быть нормально при первом запуске)"
fi

# Проверка работоспособности
log "🔍 Проверка работоспособности..."

# Health check
if curl -f http://localhost/health &> /dev/null; then
  log "✅ Health check прошел успешно"
else
  log "❌ Health check не прошел"
fi

# API проверка
if curl -f http://localhost/api/products?limit=1 &> /dev/null; then
  log "✅ API работает корректно"
else
  log "❌ API не отвечает"
fi

# Вывод результатов
echo ""
echo "🎉 Установка VitaWin завершена!"
echo "==============================="
echo "📍 Сайт доступен по адресу: http://$(hostname -I | awk '{print $1}')"
echo "🌐 Домен (если настроен): https://vitawins.ru"
echo ""
echo "📊 Управление сервисом:"
echo "  docker-compose ps              # Статус контейнеров"
echo "  docker-compose logs -f app     # Логи приложения"
echo "  docker-compose restart         # Перезапуск"
echo "  docker-compose down            # Остановка"
echo ""
echo "🔧 Конфигурация:"
echo "  Файлы: $INSTALL_DIR"
echo "  Логи: $INSTALL_DIR/logs"
echo "  Uploads: $INSTALL_DIR/uploads"
echo ""

# Настройка автозапуска
log "⚙️ Настройка автозапуска при перезагрузке..."
cat > /etc/systemd/system/vitawin.service << EOF
[Unit]
Description=VitaWin Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable vitawin.service
log "✅ Автозапуск настроен"

echo "✨ VitaWin готов к работе!"