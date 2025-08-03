# Multi-stage Dockerfile for VitaWin production
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости для сборки
RUN npm ci

# Копируем весь исходный код
COPY . .

# Билдим приложение
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Создаем пользователя vitawin для безопасности
RUN addgroup -g 1001 -S vitawin && \
    adduser -S vitawin -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем curl для health checks
RUN apk add --no-cache curl

# Копируем только необходимые файлы из builder
COPY --from=builder --chown=vitawin:vitawin /app/dist ./dist
COPY --from=builder --chown=vitawin:vitawin /app/package*.json ./
COPY --from=builder --chown=vitawin:vitawin /app/node_modules ./node_modules

# Создаем необходимые директории с правильными правами
RUN mkdir -p uploads/images logs && \
    chown -R vitawin:vitawin uploads logs

# Переключаемся на непривилегированного пользователя
USER vitawin

# Экспонируем порт
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/api/health || exit 1

# Запускаем приложение
CMD ["node", "dist/index.js"]