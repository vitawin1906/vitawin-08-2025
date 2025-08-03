#!/usr/bin/env node

/**
 * Скрипт для тестирования админ логина
 * Использование: node scripts/test-admin-login.cjs <email> <password>
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Настройки базы данных
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  return {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'vitawin',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    ssl: false
  };
};

async function testAdminLogin(email, password) {
  const pool = new Pool(getDatabaseConfig());
  
  try {
    if (!email || !password) {
      console.error('❌ Использование: node scripts/test-admin-login.cjs <email> <password>');
      process.exit(1);
    }

    console.log('🔍 Тестирование админ логина...');
    console.log('📧 Email:', email);

    // Проверяем структуру таблицы
    console.log('\n📋 Структура таблицы admin_users:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users' 
      ORDER BY ordinal_position;
    `);
    
    if (tableInfo.rows.length === 0) {
      console.log('❌ Таблица admin_users не найдена!');
      console.log('💡 Создайте таблицу:');
      console.log(`
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP
);`);
      return;
    }

    console.table(tableInfo.rows);

    // Проверяем всех админов
    console.log('\n👥 Все админы в системе:');
    const allAdmins = await pool.query('SELECT id, email, created_at, last_login FROM admin_users ORDER BY created_at;');
    if (allAdmins.rows.length === 0) {
      console.log('❌ Нет админов в системе!');
    } else {
      console.table(allAdmins.rows);
    }

    // Ищем конкретного админа
    console.log(`\n🔍 Поиск админа: ${email}`);
    const adminResult = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Админ не найден!');
      console.log('💡 Создайте админа с помощью scripts/create-admin.cjs');
      return;
    }

    const admin = adminResult.rows[0];
    console.log('✅ Админ найден:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Создан:', admin.created_at);
    console.log('   Последний вход:', admin.last_login || 'никогда');

    // Проверяем пароль
    console.log('\n🔒 Проверка пароля...');
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Пароль корректный!');
      console.log('🎯 Логин должен работать с данными:');
      console.log('   URL: /admin');
      console.log('   Email:', email);
      console.log('   Пароль:', password);
    } else {
      console.log('❌ Неверный пароль!');
      console.log('🔄 Сгенерируйте новый хеш пароля с помощью scripts/create-admin.cjs');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Проверьте подключение к базе данных');
      console.log('   DATABASE_URL или PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD');
    }
  } finally {
    await pool.end();
  }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

// Запускаем тест
testAdminLogin(email, password);