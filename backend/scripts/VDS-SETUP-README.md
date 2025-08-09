# 🚀 Инструкция по настройке VitaWin на VDS сервере

## Проблема
На VDS сервере база данных **пустая (0 записей)**, поэтому админка не работает.

## ✅ Решение - Полная инициализация базы данных

### 1️⃣ Создание структуры базы данных
```bash
# Выполните на VDS сервере
psql -U postgres -d vitawin -f scripts/init-vds-database.sql
```

### 2️⃣ Добавление товаров  
```bash
# Добавить все 8 товаров из разработки
psql -U postgres -d vitawin -f scripts/vds-products-data.sql
```

### 3️⃣ Проверка админ аккаунта
```bash
# Тестирование созданного админа
node scripts/test-admin-login.cjs manager@vitawins.ru mypassword123
```

## 📋 Что создается

### Таблицы базы данных:
- ✅ **admin_users** - админы системы
- ✅ **users** - пользователи Telegram
- ✅ **products** - товары (8 шт)
- ✅ **categories** - категории товаров
- ✅ **orders** - заказы
- ✅ **blog_posts** - статьи блога
- ✅ **mlm_levels** - 16-уровневая MLM структура
- ✅ **user_mlm_status** - статус пользователей в MLM
- ✅ **user_bonus_preferences** - настройки "Свобода выбора"
- ✅ **admin_sessions** - сессии админов
- ✅ **admin_activity_log** - логи активности

### Данные:
- ✅ **Админ**: manager@vitawins.ru / mypassword123
- ✅ **Товары**: 8 продуктов с изображениями
- ✅ **Категории**: Витамины, БАДы, Здоровье
- ✅ **MLM уровни**: 16-уровневая структура (Старт → Легенда)

## 🔑 Админ аккаунт для VDS
- **URL**: `/admin`
- **Email**: manager@vitawins.ru
- **Пароль**: mypassword123

## 📁 Файлы изображений
Скопируйте папку `uploads/images/` из разработки на VDS:
```bash
# С файлами изображений товаров:
- ezhovic-product.png
- ABmzCBoPIyCOXHKPIbYuG.png  
- hGrCqBXdfrcO3Rz5GXCbS.png
- 49w9Tm6zJYbU7L9UnwaWa.png
```

## 🛠️ Создание новых админов
```bash
# Генерация SQL для нового админа
node scripts/create-admin.cjs email@example.com password123

# Выполнить полученный SQL в базе данных
```

## 🔍 Диагностика проблем
```bash
# Проверка структуры базы
psql -U postgres -d vitawin -f scripts/vds-admin-check.sql

# Тестирование логина
node scripts/test-admin-login.cjs manager@vitawins.ru mypassword123
```

## ⚠️ Важно
- Replit (разработка): admin@vitawins.ru / admin123
- VDS (production): manager@vitawins.ru / mypassword123
- Две разные базы данных с разными данными

После выполнения всех шагов VDS будет полностью готов к работе!