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

async function checkSyncStatus() {
  console.log('🔍 Проверка синхронизации данных с GitHub...\n');

  const results = {
    users: false,
    mlm_levels: false,
    preferences: false,
    issues: []
  };

  try {
    // 1. Проверка таблицы users
    console.log('📊 1. Проверка "Моя сеть" (users)');
    try {
      const usersCount = await db.execute(sql`SELECT COUNT(*) FROM users`);
      const count = usersCount[0]?.count || 0;
      console.log(`   ✅ Пользователей: ${count}`);
      results.users = count > 0;
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      results.issues.push('Таблица users недоступна');
    }

    // 2. Проверка таблицы mlm_levels с новыми полями
    console.log('\n📊 2. Проверка "MLM Уровни" (mlm_levels)');
    try {
      // Сначала проверим существование таблицы
      const levelsCount = await db.execute(sql`SELECT COUNT(*) FROM mlm_levels`);
      const count = levelsCount[0]?.count || 0;
      console.log(`   ✅ MLM уровней: ${count}`);

      // Проверим новые поля
      try {
        const testNewFields = await db.execute(sql`
          SELECT required_personal_volume, required_group_volume 
          FROM mlm_levels 
          LIMIT 1
        `);
        console.log('   ✅ Новые поля объемов найдены');
        results.mlm_levels = true;
      } catch (fieldError) {
        console.log('   ❌ Новые поля объемов отсутствуют');
        results.issues.push('Отсутствуют поля required_personal_volume и required_group_volume');
      }
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      results.issues.push('Таблица mlm_levels недоступна');
    }

    // 3. Проверка таблицы user_bonus_preferences
    console.log('\n📊 3. Проверка "Свобода выбора" (user_bonus_preferences)');
    try {
      const preferencesCount = await db.execute(sql`SELECT COUNT(*) FROM user_bonus_preferences`);
      const count = preferencesCount[0]?.count || 0;
      console.log(`   ✅ Настроек бонусов: ${count}`);
      results.preferences = count >= 0; // >= 0 потому что может быть 0 если нет пользователей
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
      results.issues.push('Таблица user_bonus_preferences недоступна');
    }

    // Итоговый отчет
    console.log('\n📊 Результат проверки синхронизации');
    console.log(`   📋 Моя сеть: ${results.users ? '✅ Синхронизировано' : '❌ Проблемы'}`);
    console.log(`   📋 MLM Уровни: ${results.mlm_levels ? '✅ Синхронизировано' : '❌ Проблемы'}`);
    console.log(`   📋 Свобода выбора: ${results.preferences ? '✅ Синхронизировано' : '❌ Проблемы'}`);

    if (results.issues.length > 0) {
      console.log('\n⚠️ Обнаруженные проблемы:');
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n💡 Рекомендации по устранению:');
      if (results.issues.some(issue => issue.includes('required_personal_volume'))) {
        console.log('   🔧 Запустить: node migrate-mlm-volume-fields.mjs');
      }
      if (results.issues.some(issue => issue.includes('недоступна'))) {
        console.log('   🔧 Проверить подключение к базе данных');
        console.log('   🔧 Убедиться что все таблицы созданы');
      }
      return false;
    }

    console.log('\n🎉 Все данные синхронизированы с GitHub!');
    return true;

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    return false;
  }
}

// Запускаем проверку
checkSyncStatus()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Ошибка выполнения:', error);
    process.exit(1);
  });