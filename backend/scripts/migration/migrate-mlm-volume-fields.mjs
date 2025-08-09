#!/usr/bin/env node

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client);

async function migrateMLMVolumeFields() {
  try {
    console.log('🚀 Начинаем миграцию полей объема для MLM уровней...');
    
    // Проверяем, существуют ли уже поля
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mlm_levels' 
      AND column_name IN ('required_personal_volume', 'required_group_volume')
    `);
    
    if (checkResult.length >= 2) {
      console.log('✅ Поля уже существуют, миграция не требуется');
      return;
    }
    
    console.log('📝 Добавляем поля required_personal_volume и required_group_volume...');
    
    // Добавляем поля для личного и группового объема
    await db.execute(sql`
      ALTER TABLE mlm_levels 
      ADD COLUMN IF NOT EXISTS required_personal_volume INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS required_group_volume INTEGER DEFAULT 0
    `);
    
    console.log('✅ Поля успешно добавлены');
    
    // Опционально: обновляем данные с реальными значениями объемов
    console.log('📊 Обновляем значения объемов для уровней...');
    
    // Примерные значения - замените на реальные
    const volumeUpdates = [
      { level: 1, personal: 0, group: 0 },
      { level: 2, personal: 100, group: 0 },
      { level: 3, personal: 200, group: 500 },
      { level: 4, personal: 300, group: 1000 },
      { level: 5, personal: 500, group: 2500 },
      { level: 6, personal: 800, group: 5000 },
      { level: 7, personal: 1200, group: 10000 },
      { level: 8, personal: 1800, group: 20000 },
      { level: 9, personal: 2500, group: 40000 },
      { level: 10, personal: 3500, group: 80000 },
      { level: 11, personal: 5000, group: 150000 },
      { level: 12, personal: 7000, group: 300000 },
      { level: 13, personal: 10000, group: 600000 },
      { level: 14, personal: 15000, group: 1200000 },
      { level: 15, personal: 22000, group: 2500000 },
      { level: 16, personal: 30000, group: 5000000 }
    ];
    
    for (const update of volumeUpdates) {
      await db.execute(sql`
        UPDATE mlm_levels 
        SET required_personal_volume = ${update.personal},
            required_group_volume = ${update.group}
        WHERE level = ${update.level}
      `);
    }
    
    console.log('✅ Миграция завершена успешно!');
    console.log('📊 Все MLM уровни обновлены с требованиями по объему');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    throw error;
  }
}

// Запускаем миграцию
migrateMLMVolumeFields()
  .then(() => {
    console.log('🎉 Миграция завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Миграция не удалась:', error);
    process.exit(1);
  });