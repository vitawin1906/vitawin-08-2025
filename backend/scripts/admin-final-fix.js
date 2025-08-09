#!/usr/bin/env node

// Финальное исправление структуры таблицы и админов
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function finalAdminFix() {
  console.log('\n🔧 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ АДМИНОВ\n');
  
  try {
    // 1. Добавляем недостающие колонки
    console.log('📊 1. Добавление недостающих колонок...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      "`
    );

    // 2. Проверяем обновленную структуру
    console.log('📋 2. Проверка структуры таблицы:');
    const { stdout: structure } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "\\d admin_users"`
    );
    console.log(structure);

    // 3. Показываем текущих админов
    console.log('\n📊 3. Текущие админы:');
    const { stdout: currentAdmins } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, created_at, LEFT(password_hash, 20) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(currentAdmins);

    // 4. Удаляем всех существующих админов с учетом внешних ключей
    console.log('🗑️ 4. Удаление существующих админов...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        DELETE FROM admin_activity_log;
        DELETE FROM admin_sessions;
        DELETE FROM admin_users;
      "`
    );

    // 5. Генерируем правильные bcrypt хеши
    console.log('🔑 5. Генерация bcrypt хешей в контейнере приложения...');
    const { stdout: hashGeneration } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        
        async function generateAndTestHashes() {
          try {
            console.log('Генерация хешей...');
            
            // Генерируем хеши с 10 раундами (как в adminAuthController)
            const hash1 = await bcrypt.hash('VitawinAdmin2025!', 10);
            const hash2 = await bcrypt.hash('admin123', 10);
            
            console.log('Generated hashes:');
            console.log('ADMIN_HASH=' + hash1);
            console.log('DOROSH_HASH=' + hash2);
            
            // Немедленно тестируем
            const test1 = await bcrypt.compare('VitawinAdmin2025!', hash1);
            const test2 = await bcrypt.compare('admin123', hash2);
            
            console.log('Validation tests:');
            console.log('ADMIN_TEST=' + test1);
            console.log('DOROSH_TEST=' + test2);
            
            if (!test1 || !test2) {
              throw new Error('Hash validation failed!');
            }
            
            console.log('All hashes validated successfully!');
            
          } catch (error) {
            console.error('Hash generation error:', error.message);
            process.exit(1);
          }
        }
        
        generateAndTestHashes();
      "`
    );

    console.log(hashGeneration);

    // Извлекаем хеши
    const lines = hashGeneration.split('\n').filter(line => line.trim());
    const adminHash = lines.find(line => line.startsWith('ADMIN_HASH=')).replace('ADMIN_HASH=', '');
    const doroshHash = lines.find(line => line.startsWith('DOROSH_HASH=')).replace('DOROSH_HASH=', '');
    const adminTest = lines.find(line => line.startsWith('ADMIN_TEST=')).replace('ADMIN_TEST=', '');
    const doroshTest = lines.find(line => line.startsWith('DOROSH_TEST=')).replace('DOROSH_TEST=', '');

    if (adminTest !== 'true' || doroshTest !== 'true') {
      throw new Error('Хеши не прошли предварительную валидацию!');
    }

    // 6. Создаем админов с правильными хешами
    console.log('\n👤 6. Создание новых админов...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        INSERT INTO admin_users (email, password_hash, is_active, created_at, updated_at, last_login) VALUES 
        ('admin@vitawins.ru', '${adminHash}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
        ('dorosh21@gmail.com', '${doroshHash}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      "`
    );

    // 7. Проверяем созданных админов
    console.log('\n✅ 7. Проверка созданных админов:');
    const { stdout: newAdmins } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, created_at, LEFT(password_hash, 25) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(newAdmins);

    // 8. Финальный тест авторизации через базу данных
    console.log('\n🧪 8. Финальный тест авторизации через БД...');
    const { stdout: authTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function testAuth() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            console.log('Testing admin@vitawins.ru...');
            const result1 = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['admin@vitawins.ru']);
            
            if (result1.rows.length === 0) {
              console.log('ERROR: admin@vitawins.ru not found!');
            } else {
              const admin = result1.rows[0];
              console.log('Found admin:', admin.email);
              console.log('Hash starts with:', admin.password_hash.substring(0, 15));
              
              const isValid = await bcrypt.compare('VitawinAdmin2025!', admin.password_hash);
              console.log('Password validation: ' + (isValid ? 'SUCCESS ✅' : 'FAILED ❌'));
            }
            
            console.log('\\nTesting dorosh21@gmail.com...');
            const result2 = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['dorosh21@gmail.com']);
            
            if (result2.rows.length === 0) {
              console.log('ERROR: dorosh21@gmail.com not found!');
            } else {
              const admin2 = result2.rows[0];
              console.log('Found admin:', admin2.email);
              console.log('Hash starts with:', admin2.password_hash.substring(0, 15));
              
              const isValid2 = await bcrypt.compare('admin123', admin2.password_hash);
              console.log('Password validation: ' + (isValid2 ? 'SUCCESS ✅' : 'FAILED ❌'));
            }
            
          } catch (error) {
            console.error('Auth test error:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        testAuth();
      "`
    );

    console.log(authTest);

    console.log('\n🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
    console.log('\n📋 Данные для входа в админку:');
    console.log('• Email: admin@vitawins.ru');
    console.log('• Пароль: VitawinAdmin2025!');
    console.log('');
    console.log('• Email: dorosh21@gmail.com');
    console.log('• Пароль: admin123');
    console.log('\n🌐 URL админки: https://vitawins.ru/admin');
    console.log('\n✅ Если тесты показали SUCCESS, то вход должен работать!');
    
  } catch (error) {
    console.error('❌ Ошибка финального исправления:', error.message);
  }
}

finalAdminFix();