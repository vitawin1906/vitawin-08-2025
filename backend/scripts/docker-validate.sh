#!/bin/bash

echo "🐳 === ВАЛИДАЦИЯ DOCKER КОНФИГУРАЦИИ === 🐳"
echo ""

# Проверяем Dockerfile
echo "📋 Проверка Dockerfile..."
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile найден"
    
    # Проверяем базовый образ
    base_image=$(grep "^FROM" Dockerfile | head -1)
    echo "📦 Базовый образ: $base_image"
    
    # Проверяем COPY команды
    echo "📁 COPY команды:"
    grep "^COPY" Dockerfile | while read line; do
        echo "   $line"
    done
    
    # Проверяем RUN команды
    echo "🔧 RUN команды:"
    grep "^RUN" Dockerfile | while read line; do
        echo "   $line"
    done
    
    # Проверяем CMD
    cmd=$(grep "^CMD" Dockerfile)
    echo "🚀 Команда запуска: $cmd"
    
else
    echo "❌ Dockerfile не найден"
fi

echo ""

# Проверяем .dockerignore
echo "🚫 Проверка .dockerignore..."
if [ -f ".dockerignore" ]; then
    echo "✅ .dockerignore найден"
    echo "Исключенные файлы:"
    cat .dockerignore | head -10
else
    echo "⚠️ .dockerignore не найден - рекомендуется создать"
fi

echo ""

# Проверяем файлы для копирования
echo "📂 Проверка файлов проекта..."
required_files=(
    "package.json"
    "vite.config.ts"
    "tailwind.config.ts"
    "postcss.config.js"
    "drizzle.config.ts"
    "components.json"
    "index.html"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file отсутствует"
    fi
done

echo ""

# Проверяем директории
echo "📁 Проверка директорий..."
required_dirs=(
    "client"
    "server"
    "shared"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ ($(find $dir -name "*.ts" -o -name "*.tsx" | wc -l) файлов)"
    else
        echo "❌ $dir/ отсутствует"
    fi
done

echo ""

# Проверяем package.json скрипты
echo "📦 Проверка npm скриптов..."
if [ -f "package.json" ]; then
    echo "Доступные скрипты:"
    node -e "
        const pkg = require('./package.json');
        Object.keys(pkg.scripts || {}).forEach(script => {
            console.log('   ' + script + ': ' + pkg.scripts[script]);
        });
    "
fi

echo ""

# Симуляция Docker build этапов
echo "🔄 Симуляция этапов Docker build..."

echo "Этап 1: COPY файлов конфигурации..."
missing_config=0
for file in package.json vite.config.ts tailwind.config.ts; do
    if [ ! -f "$file" ]; then
        echo "❌ Отсутствует $file"
        missing_config=1
    fi
done
if [ $missing_config -eq 0 ]; then
    echo "✅ Все конфигурационные файлы на месте"
fi

echo "Этап 2: npm ci (симуляция)..."
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json найден"
else
    echo "⚠️ package-lock.json отсутствует"
fi

echo "Этап 3: COPY исходного кода..."
source_dirs=0
for dir in client server shared; do
    if [ -d "$dir" ]; then
        source_dirs=$((source_dirs + 1))
    fi
done
echo "✅ Исходный код: $source_dirs/3 директорий"

echo "Этап 4: npm run build (проверка команды)..."
build_cmd=$(node -e "console.log(require('./package.json').scripts.build || 'отсутствует')")
echo "   Команда сборки: $build_cmd"

echo ""
echo "🎯 === РЕЗУЛЬТАТ ВАЛИДАЦИИ === 🎯"

# Финальная оценка
issues=0

if [ ! -f "Dockerfile" ]; then issues=$((issues + 1)); fi
if [ ! -f "package.json" ]; then issues=$((issues + 1)); fi
if [ ! -f "vite.config.ts" ]; then issues=$((issues + 1)); fi
if [ ! -d "client" ]; then issues=$((issues + 1)); fi
if [ ! -d "server" ]; then issues=$((issues + 1)); fi

if [ $issues -eq 0 ]; then
    echo "✅ Docker конфигурация ГОТОВА к сборке"
    echo "Рекомендация: docker build -t vitawin ."
else
    echo "❌ Найдено $issues проблем для исправления"
fi

echo ""
echo "📝 Команды для тестирования Docker:"
echo "   docker build -t vitawin ."
echo "   docker run -p 5000:5000 -e DATABASE_URL=your_db_url vitawin"