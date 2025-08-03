# 🚀 Установка VitaWin на VDS

## Быстрая установка (1 команд)

```bash
# Скачать и запустить единый скрипт
wget https://raw.githubusercontent.com/yourusername/vitawin/main/scripts/deployment/deploy-vitawin-vds.sh
sudo bash deploy-vitawin-vds.sh
```

## Что делает скрипт:

1. **Обновляет систему** и устанавливает Docker
2. **Создает Docker Compose** конфигурацию  
3. **Запускает PostgreSQL** в контейнере
4. **Запускает приложение** VitaWin
5. **Настраивает Nginx** реверс-прокси
6. **Загружает данные** (8 товаров, админ, тестовые данные)

## После установки:

- **Сайт**: `http://ваш-ip`
- **API**: `http://ваш-ip:5050` 
- **Админка**: `http://ваш-ip/admin`

## Доступы:

- **Админ**: admin@vitawin.ru / admin123
- **База**: vitawin_user / strong_password_123

## Управление:

```bash
cd /var/vitawin

# Просмотр логов
docker compose logs -f app

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Обновление
docker compose pull && docker compose up -d
```

## Проверка товаров:

```bash
# Подключение к базе
docker exec -it vitawin_postgres psql -U vitawin_user -d vitawin

# Проверка товаров
SELECT COUNT(*) FROM products;
SELECT name, price FROM products LIMIT 3;
```

После выполнения скрипта на VDS будет 8 товаров вместо 0!