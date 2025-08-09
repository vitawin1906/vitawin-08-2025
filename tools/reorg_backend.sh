#!/bin/bash
set -e

echo "🚀 Запуск автоматической реорганизации backend..."

# 1. Создание целевой структуры
mkdir -p backend/{server/{config,controllers,infra,middleware,routes,schemas,services,storage,utils},database,logs,public,scripts,tools,uploads}

# 2. Перенос по категориям
# Контроллеры
mv backend/server/*Controller.ts backend/server/controllers/ 2>/dev/null || true
mv backend/server/controllers/*.ts backend/server/controllers/ 2>/dev/null || true

# Роуты
mv backend/server/*Router.ts backend/server/routes/ 2>/dev/null || true
mv backend/server/routes/*.ts backend/server/routes/ 2>/dev/null || true

# Мидлвары
mv backend/server/*middleware*.ts backend/server/middleware/ 2>/dev/null || true

# Сервисы
mv backend/server/*Service.ts backend/server/services/ 2>/dev/null || true

# Утилиты
mv backend/server/queryCache.ts backend/server/utils/ 2>/dev/null || true
mv backend/server/utils/*.ts backend/server/utils/ 2>/dev/null || true

# Хранилище
mv backend/server/storage.ts backend/server/storage/ 2>/dev/null || true

# Конфиги
mv backend/server/config*.ts backend/server/config/ 2>/dev/null || true

# Инфраструктура
mv backend/nginx backend/server/infra/ 2>/dev/null || true
mv backend/Dockerfile* backend/server/infra/ 2>/dev/null || true

# База данных
mv backend/*.sql backend/database/ 2>/dev/null || true
mv backend/drizzle.config.* backend/database/ 2>/dev/null || true
mv backend/database/*.ts backend/database/ 2>/dev/null || true

# Скрипты
mv backend/*.sh backend/scripts/ 2>/dev/null || true
mv backend/server/*.js backend/scripts/ 2>/dev/null || true

# Загрузки и логи
mv backend/*log* backend/logs/ 2>/dev/null || true
mv backend/uploads backend/uploads/ 2>/dev/null || true

# 3. Чистка мусора и пустых папок
find backend -type f -name "*.log" -delete
find backend -type d -empty -delete

# 4. Обновление импортов
find backend/server -type f -name "*.ts" -exec sed -i '' \
  -e 's#\.\./queryCache#../utils/queryCache#g' \
  -e 's#\./queryCache#./utils/queryCache#g' \
  -e 's#\.\./storage#../storage/storage#g' \
  -e 's#\./storage#./storage/storage#g' \
  -e 's#\./routes\.ts#./routes/index.ts#g' \
  -e 's#\.\./routes\.ts#../routes/index.ts#g' \
  {} \;

# 5. Коммит в Git
cd backend
git add -A
git commit -m "chore(backend): auto reorg, tidy structure, cleanup"
cd ..

echo "✅ Реорганизация backend завершена!"
