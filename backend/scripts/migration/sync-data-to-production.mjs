#!/usr/bin/env node

/**
 * Скрипт синхронизации данных из Neon (разработка) в Docker PostgreSQL (продакшен)
 * Переносит товары, пользователей и другие критически важные данные
 */

import { createConnection } from 'mysql2/promise';
import pkg from 'pg';
const { Client } = pkg;

// Конфигурация баз данных
const NEON_CONFIG = {
  connectionString: process.env.DATABASE_URL, // Neon (разработка)
  ssl: { rejectUnauthorized: false }
};

const DOCKER_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'vitawin',
  user: 'vitawin_user',
  password: process.env.POSTGRES_PASSWORD || 'strong_password_123'
};

async function syncData() {
  let neonClient, dockerClient;
  
  try {
    console.log('🔄 Начинаем синхронизацию данных...');
    
    // Подключение к базам
    neonClient = new Client(NEON_CONFIG);
    await neonClient.connect();
    console.log('✅ Подключение к Neon (источник)');
    
    dockerClient = new Client(DOCKER_CONFIG);
    await dockerClient.connect();
    console.log('✅ Подключение к Docker PostgreSQL (назначение)');
    
    // Синхронизация товаров
    console.log('\n📦 Синхронизация товаров...');
    const productsResult = await neonClient.query('SELECT * FROM products ORDER BY id');
    const products = productsResult.rows;
    
    if (products.length > 0) {
      // Очищаем существующие товары
      await dockerClient.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
      
      // Вставляем товары
      for (const product of products) {
        const insertQuery = `
          INSERT INTO products (
            id, name, title, description, price, original_price, 
            category, badge, image, images, stock, status, slug,
            benefits, key_benefits, quality_guarantee, composition,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19
          )
        `;
        
        await dockerClient.query(insertQuery, [
          product.id, product.name, product.title, product.description,
          product.price, product.original_price, product.category, product.badge,
          product.image, product.images, product.stock, product.status, product.slug,
          product.benefits, product.key_benefits, product.quality_guarantee,
          product.composition, product.created_at, product.updated_at
        ]);
      }
      
      console.log(`✅ Синхронизировано ${products.length} товаров`);
    }
    
    // Синхронизация пользователей
    console.log('\n👥 Синхронизация пользователей...');
    const usersResult = await neonClient.query('SELECT * FROM users ORDER BY id');
    const users = usersResult.rows;
    
    if (users.length > 0) {
      // Очищаем существующих пользователей (осторожно!)
      await dockerClient.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
      
      // Вставляем пользователей
      for (const user of users) {
        const insertQuery = `
          INSERT INTO users (
            id, telegram_id, username, first_name, last_name, 
            referral_code, referred_by, balance, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await dockerClient.query(insertQuery, [
          user.id, user.telegram_id, user.username, user.first_name,
          user.last_name, user.referral_code, user.referred_by,
          user.balance, user.created_at, user.updated_at
        ]);
      }
      
      console.log(`✅ Синхронизировано ${users.length} пользователей`);
    }
    
    console.log('\n🎉 Синхронизация завершена успешно!');
    console.log(`📊 Статистика:
    - Товары: ${products.length}
    - Пользователи: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
    process.exit(1);
  } finally {
    if (neonClient) await neonClient.end();
    if (dockerClient) await dockerClient.end();
  }
}

// Запуск скрипта
if (import.meta.url === `file://${process.argv[1]}`) {
  syncData();
}

export { syncData };