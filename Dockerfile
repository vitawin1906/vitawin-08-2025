# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

# ---- production ----
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S vitawin && adduser -S vitawin -u 1001
ENV NODE_ENV=production
COPY --chown=vitawin:vitawin backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder --chown=vitawin:vitawin /app/dist ./dist
RUN mkdir -p uploads/images logs && chown -R vitawin:vitawin uploads logs
USER vitawin
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "dist/index.js"]
