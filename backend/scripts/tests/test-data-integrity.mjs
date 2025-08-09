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

async function testDataIntegrity() {
  console.log('🔍 Проверка целостности данных для разделов...\n');

  try {
    // 1. Проверка "Моя сеть" - таблица users
    console.log('📊 1. Проверка "Моя сеть" (users)');
    const usersResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN applied_referral_code IS NOT NULL THEN 1 END) as users_with_referrals,
        COUNT(CASE WHEN referrer_id IS NOT NULL THEN 1 END) as users_with_referrer_id
      FROM users
    `);
    
    const usersData = usersResult.rows?.[0] || usersResult[0];
    console.log(`   ✅ Всего пользователей: ${usersData.total_users}`);
    console.log(`   ✅ С реферальными кодами: ${usersData.users_with_referrals}`);
    console.log(`   ✅ С referrer_id: ${usersData.users_with_referrer_id}`);

    // 2. Проверка "MLM Уровни" - таблица mlm_levels
    console.log('\n📊 2. Проверка "MLM Уровни" (mlm_levels)');
    
    // Проверяем существование новых полей
    const mlmFieldsCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mlm_levels' 
      AND column_name IN ('required_personal_volume', 'required_group_volume')
    `);
    
    if (mlmFieldsCheck.length < 2) {
      console.log('   ❌ Отсутствуют новые поля объемов!');
      console.log('   💡 Необходимо запустить: node migrate-mlm-volume-fields.mjs');
      return false;
    }
    
    const mlmLevelsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_levels,
        COUNT(CASE WHEN required_personal_volume > 0 THEN 1 END) as levels_with_personal_volume,
        COUNT(CASE WHEN required_group_volume > 0 THEN 1 END) as levels_with_group_volume
      FROM mlm_levels
    `);
    
    const mlmData = mlmLevelsResult.rows?.[0] || mlmLevelsResult[0];
    console.log(`   ✅ Всего уровней: ${mlmData.total_levels}`);
    console.log(`   ✅ С личным объемом: ${mlmData.levels_with_personal_volume}`);
    console.log(`   ✅ С групповым объемом: ${mlmData.levels_with_group_volume}`);

    // Проверяем данные первых 3 уровней
    const mlmSampleResult = await db.execute(sql`
      SELECT level, name, required_personal_volume, required_group_volume
      FROM mlm_levels
      ORDER BY level
      LIMIT 3
    `);
    
    console.log('   📋 Примеры данных:');
    mlmSampleResult.forEach(level => {
      console.log(`      Уровень ${level.level}: LO=${level.required_personal_volume}, GO=${level.required_group_volume}`);
    });

    // 3. Проверка "Свобода выбора" - таблица user_bonus_preferences
    console.log('\n📊 3. Проверка "Свобода выбора" (user_bonus_preferences)');
    
    const preferencesResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_preferences,
        COUNT(CASE WHEN is_locked = true THEN 1 END) as locked_preferences,
        AVG(health_id_percentage + travel_percentage + home_percentage + auto_percentage) as avg_total_percentage
      FROM user_bonus_preferences
    `);
    
    const preferencesData = preferencesResult[0];
    console.log(`   ✅ Всего настроек: ${preferencesData.total_preferences}`);
    console.log(`   ✅ Заблокированных: ${preferencesData.locked_preferences}`);
    console.log(`   ✅ Средняя сумма %: ${Math.round(preferencesData.avg_total_percentage)}`);

    // Проверяем целостность процентов
    const invalidPercentages = await db.execute(sql`
      SELECT user_id, (health_id_percentage + travel_percentage + home_percentage + auto_percentage) as total_percentage
      FROM user_bonus_preferences
      WHERE (health_id_percentage + travel_percentage + home_percentage + auto_percentage) != 100
    `);
    
    if (invalidPercentages.length > 0) {
      console.log(`   ⚠️ Некорректные проценты у ${invalidPercentages.length} пользователей`);
      invalidPercentages.forEach(pref => {
        console.log(`      User ${pref.user_id}: ${pref.total_percentage}%`);
      });
    } else {
      console.log('   ✅ Все проценты корректны (сумма = 100%)');
    }

    // 4. Проверка связей между таблицами
    console.log('\n📊 4. Проверка связей между таблицами');
    
    const connectionsResult = await db.execute(sql`
      SELECT 
        u.id as user_id,
        u.first_name,
        (CASE WHEN ubp.user_id IS NOT NULL THEN 1 ELSE 0 END) as has_preferences,
        (CASE WHEN o.user_id IS NOT NULL THEN 1 ELSE 0 END) as has_orders
      FROM users u
      LEFT JOIN user_bonus_preferences ubp ON u.id = ubp.user_id
      LEFT JOIN orders o ON u.id = o.user_id
      ORDER BY u.id
    `);
    
    const usersWithPreferences = connectionsResult.filter(u => u.has_preferences).length;
    const usersWithOrders = connectionsResult.filter(u => u.has_orders).length;
    
    console.log(`   ✅ Пользователей с настройками: ${usersWithPreferences}/${connectionsResult.length}`);
    console.log(`   ✅ Пользователей с заказами: ${usersWithOrders}/${connectionsResult.length}`);

    // 5. Проверка API эндпойнтов
    console.log('\n📊 5. Результат проверки');
    
    const allChecks = [
      usersData.total_users > 0,
      mlmData.total_levels === 16,
      mlmFieldsCheck.length === 2,
      preferencesData.total_preferences > 0,
      invalidPercentages.length === 0
    ];
    
    const passedChecks = allChecks.filter(check => check).length;
    console.log(`   📈 Пройдено проверок: ${passedChecks}/${allChecks.length}`);
    
    if (passedChecks === allChecks.length) {
      console.log('\n🎉 Все данные синхронизированы и готовы к работе!');
      return true;
    } else {
      console.log('\n⚠️ Обнаружены проблемы с данными');
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
    return false;
  }
}

// Запускаем проверку
testDataIntegrity()
  .then((success) => {
    if (success) {
      console.log('\n✅ Проверка завершена успешно');
      process.exit(0);
    } else {
      console.log('\n❌ Проверка выявила проблемы');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });