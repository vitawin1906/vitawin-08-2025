#!/usr/bin/env node

// Глубокая диагностика проблемы с авторизацией админов
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugAuth() {
  console.log('\n🔍 ГЛУБОКАЯ ДИАГНОСТИКА АВТОРИЗАЦИИ АДМИНОВ\n');
  
  try {
    // 1. Проверяем структуру таблицы admin_users
    console.log('📊 1. Структура таблицы admin_users:');
    const { stdout: structure } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "\\d admin_users"`
    );
    console.log(structure);

    // 2. Проверяем текущие данные
    console.log('\n📋 2. Текущие данные админов:');
    const { stdout: adminData } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, password_hash, is_active, created_at FROM admin_users ORDER BY id;"`
    );
    console.log(adminData);

    // 3. Тестируем bcrypt в контейнере приложения
    console.log('\n🧪 3. Тестирование bcrypt в контейнере приложения:');
    const { stdout: bcryptTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        console.log('bcrypt version:', require('bcrypt/package.json').version);
        
        // Создаем тестовый хеш
        const testPassword = 'test123';
        const testHash = bcrypt.hashSync(testPassword, 10);
        console.log('Test hash:', testHash);
        
        // Проверяем валидацию
        const isValid = bcrypt.compareSync(testPassword, testHash);
        console.log('Test validation:', isValid);
        
        // Тестируем с настоящими паролями
        const admin1Hash = bcrypt.hashSync('VitawinAdmin2025!', 10);
        const admin2Hash = bcrypt.hashSync('admin123', 10);
        
        console.log('\\nНовые хеши для обновления:');
        console.log('admin@vitawins.ru:', admin1Hash);
        console.log('dorosh21@gmail.com:', admin2Hash);
      "`
    );
    console.log(bcryptTest);

    // 4. Проверяем что именно происходит в adminAuthController
    console.log('\n🔎 4. Проверяем логику adminAuthController:');
    const { stdout: authLogic } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function testAuthLogic() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
            
            // Имитируем логику из adminAuthController
            const email = 'admin@vitawins.ru';
            const password = 'VitawinAdmin2025!';
            
            console.log('\\nПоиск админа по email:', email);
            const result = await pool.query('SELECT * FROM admin_users WHERE email = \\$1', [email]);
            
            if (result.rows.length === 0) {
              console.log('ОШИБКА: Админ не найден!');
              return;
            }
            
            const adminUser = result.rows[0];
            console.log('Найден админ:', {
              id: adminUser.id,
              email: adminUser.email,
              is_active: adminUser.is_active,
              hash_starts_with: adminUser.password_hash.substring(0, 10)
            });
            
            console.log('\\nСравнение пароля...');
            console.log('Введенный пароль:', password);
            console.log('Хеш из БД начинается с:', adminUser.password_hash.substring(0, 20));
            
            const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
            console.log('Результат bcrypt.compare:', isValidPassword);
            
          } catch (error) {
            console.error('Ошибка теста:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        testAuthLogic();
      "`
    );
    console.log(authLogic);

    console.log('\n💡 АНАЛИЗ И РЕКОМЕНДАЦИИ:');
    console.log('1. Проверьте структуру таблицы admin_users');
    console.log('2. Убедитесь что поле password_hash содержит правильные bcrypt хеши');
    console.log('3. Проверьте что bcrypt работает корректно в контейнере');
    console.log('4. Проанализируйте логику сравнения паролей');
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error.message);
  }
}

debugAuth();