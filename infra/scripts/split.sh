#!/usr/bin/env bash
set -euo pipefail

# DRY_RUN=1 ./split.sh  — сначала прогон без реальных перемещений
DRY_RUN="${DRY_RUN:-0}"

mkdir -p backend client

move() {
  local src="$1" dst="$2"
  [ -e "$src" ] || return 0
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY] mv $src -> $dst/"
  else
    mkdir -p "$dst"
    git mv -k "$src" "$dst/" 2>/dev/null || mv "$src" "$dst/"
    echo "mv $src -> $dst/"
  fi
}

# === Backend candidates ===
for p in \
  server api backend src/server src/api \
  db database drizzle migrations prisma cache redis uploads \
  scripts; do
  move "$p" backend
done

# Backend-специфичные файлы в корне
for f in \
  drizzle.config.ts drizzle.config.mjs drizzle.config.cjs \
  nodemon.json tsconfig.server.json \
  docker-compose.yml docker-compose.yaml \
  knexfile.* ormconfig.* \
  routes.ts app.ts server.ts index.ts; do
  [ -f "$f" ] && grep -Eq "express|drizzle|pg|ioredis|jsonwebtoken" "$f" 2>/dev/null && move "$f" backend
done

# Корневой package.json: если есть express/pg — это backend
if [ -f package.json ] && grep -q '"express"\|"pg"\|"drizzle-orm"\|"ioredis"\|"jsonwebtoken"' package.json; then
  move package.json backend
  [ -f package-lock.json ] && move package-lock.json backend
  [ -f yarn.lock ] && move yarn.lock backend
  [ -f pnpm-lock.yaml ] && move pnpm-lock.yaml backend
fi

# .env c секретами — к бэкенду
if [ -f .env ]; then
  if grep -Eq 'DATABASE_URL|REDIS|JWT|TELEGRAM|CLOUDINARY|STRIPE' .env; then
    move .env backend
  fi
fi
[ -f .env.production ] && move .env.production backend
[ -f .env.development ] && move .env.development backend

# === Frontend candidates ===
for p in \
  client frontend src public assets styles; do
  # Только если внутри src есть .tsx — это фронтовая src
  if [ "$p" = "src" ] && ! ls src/*.tsx >/dev/null 2>&1; then
    :
  else
    move "$p" client
  fi
done

# Фронтовые конфиги
[ -f vite.config.ts ] && move vite.config.ts client
[ -f vite.config.js ] && move vite.config.js client
[ -f index.html ] && move index.html client

# Фронтовый tsconfig: содержит jsx/dom
if [ -f tsconfig.json ] && grep -q '"jsx"\|"dom"' tsconfig.json; then
  move tsconfig.json client
fi

# Фронтовый package.json: react/vite внутри
if [ -f package.json ] && grep -q '"react"\|"vite"\|"@vitejs/plugin-react"' package.json; then
  move package.json client
  [ -f package-lock.json ] && move package-lock.json client
  [ -f yarn.lock ] && move yarn.lock client
  [ -f pnpm-lock.yaml ] && move pnpm-lock.yaml client
fi

echo "----"
echo "Готово. Проверь структуру и запусти:"
echo "Backend:  (cd backend && npm i && npm run dev)"
echo "Frontend: (cd client  && npm i && npm run dev)"
