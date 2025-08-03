#!/usr/bin/env node

// Принудительное пересоздание админов с нуля
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function forceResetAdmins() {
  console.log('\n🔥 ПРИНУДИТЕЛЬНОЕ ПЕРЕСОЗДАНИЕ АДМИНОВ\n');
  
  try {
    // 1. Удаляем всех админов
    console.log('🗑️ 1. Удаление всех существующих админов...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "DELETE FROM admin_users;"`
    );

    // 2. Сбрасываем sequence
    console.log('🔄 2. Сброс последовательности ID...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "ALTER SEQUENCE admin_users_id_seq RESTART WITH 1;"`
    );

    // 3. Создаем хеши в контейнере приложения
    console.log('🔑 3. Генерация новых bcrypt хешей...');
    const { stdout: hashData } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        
        async function generateHashes() {
          const hash1 = await bcrypt.hash('VitawinAdmin2025!', 12);
          const hash2 = await bcrypt.hash('admin123', 12);
          
          console.log('HASH1=' + hash1);
          console.log('HASH2=' + hash2);
          
          // Тестируем валидацию сразу
          const test1 = await bcrypt.compare('VitawinAdmin2025!', hash1);
          const test2 = await bcrypt.compare('admin123', hash2);
          
          console.log('TEST1=' + test1);
          console.log('TEST2=' + test2);
        }
        
        generateHashes().catch(console.error);
      "`
    );

    const lines = hashData.split('\n').filter(line => line.trim());
    const hash1 = lines.find(line => line.startsWith('HASH1=')).replace('HASH1=', '');
    const hash2 = lines.find(line => line.startsWith('HASH2=')).replace('HASH2=', '');
    const test1 = lines.find(line => line.startsWith('TEST1=')).replace('TEST1=', '');
    const test2 = lines.find(line => line.startsWith('TEST2=')).replace('TEST2=', '');

    console.log('Admin hash validation:', test1);
    console.log('Dorosh hash validation:', test2);

    if (test1 !== 'true' || test2 !== 'true') {
      throw new Error('Хеши не прошли валидацию!');
    }

    // 4. Создаем новых админов
    console.log('\n👤 4. Создание новых админов...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        INSERT INTO admin_users (email, password_hash, is_active, created_at, updated_at, last_login) VALUES 
        ('admin@vitawins.ru', '${hash1}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
        ('dorosh21@gmail.com', '${hash2}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      "`
    );

    // 5. Проверяем результат
    console.log('\n✅ 5. Проверка созданных админов:');
    const { stdout: finalCheck } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, created_at, LEFT(password_hash, 25) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(finalCheck);

    // 6. Финальный тест авторизации
    console.log('\n🧪 6. Финальный тест авторизации...');
    const { stdout: finalTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function finalAuthTest() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            // Тест admin@vitawins.ru
            const result1 = await pool.query('SELECT password_hash FROM admin_users WHERE email = \\$1', ['admin@vitawins.ru']);
            if (result1.rows.length > 0) {
              const isValid1 = await bcrypt.compare('VitawinAdmin2025!', result1.rows[0].password_hash);
              console.log('admin@vitawins.ru авторизация:', isValid1 ? 'SUCCESS ✅' : 'FAILED ❌');
            }
            
            // Тест dorosh21@gmail.com  
            const result2 = await pool.query('SELECT password_hash FROM admin_users WHERE email = \\$1', ['dorosh21@gmail.com']);
            if (result2.rows.length > 0) {
              const isValid2 = await bcrypt.compare('admin123', result2.rows[0].password_hash);
              console.log('dorosh21@gmail.com авторизация:', isValid2 ? 'SUCCESS ✅' : 'FAILED ❌');
            }
            
          } catch (error) {
            console.error('Ошибка финального теста:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        finalAuthTest();
      "`
    );
    console.log(finalTest);

    console.log('\n🎯 ПРИНУДИТЕЛЬНОЕ ПЕРЕСОЗДАНИЕ ЗАВЕРШЕНО!');
    console.log('\n📋 Данные для входа:');
    console.log('• admin@vitawins.ru: VitawinAdmin2025!');
    console.log('• dorosh21@gmail.com: admin123');
    console.log('\n🌐 URL: https://vitawins.ru/admin');
    
  } catch (error) {
    console.error('❌ Ошибка принудительного пересоздания:', error.message);
  }
}

forceResetAdmins();