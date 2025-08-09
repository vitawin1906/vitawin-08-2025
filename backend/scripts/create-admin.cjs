#!/usr/bin/env node

/**
 * Скрипт для генерации SQL запроса создания админ аккаунта
 * Использование: node scripts/create-admin.cjs <email> <password>
 */

const bcrypt = require('bcrypt');

async function generateAdminSQL(email, password) {
  try {
    // Проверяем, что email и пароль переданы
    if (!email || !password) {
      console.error('❌ Использование: node scripts/create-admin.cjs <email> <password>');
      console.error('   Пример: node scripts/create-admin.cjs manager@vitawins.ru mypassword123');
      process.exit(1);
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Неверный формат email');
      process.exit(1);
    }

    // Валидация пароля
    if (password.length < 6) {
      console.error('❌ Пароль должен содержать минимум 6 символов');
      process.exit(1);
    }

    console.log('🔐 Генерация SQL для админ аккаунта...');
    console.log('📧 Email:', email);

    // Хешируем пароль
    console.log('🔒 Хеширование пароля...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Выводим SQL запрос для ручного выполнения
    console.log('📋 SQL запрос для создания админ аккаунта:');
    console.log('');
    console.log(`INSERT INTO admin_users (email, password_hash) VALUES ('${email}', '${passwordHash}');`);
    console.log('');
    console.log('🔑 Данные для входа после выполнения SQL:');
    console.log('   URL: /admin');
    console.log('   Email:', email);
    console.log('   Пароль:', password);
    console.log('');
    console.log('⚠️  Сохраните эти данные в безопасном месте!');
    console.log('💡 Выполните SQL запрос выше в вашей базе данных для создания админа.');

  } catch (error) {
    console.error('❌ Ошибка при генерации SQL:', error.message);
    process.exit(1);
  }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

// Запускаем генерацию SQL
generateAdminSQL(email, password);