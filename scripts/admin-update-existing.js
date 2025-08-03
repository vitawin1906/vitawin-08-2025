#!/usr/bin/env node

// Обновление существующих админов без удаления
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateExistingAdmins() {
  console.log('\n🔄 ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ АДМИНОВ\n');
  
  try {
    // 1. Показываем текущих админов
    console.log('📊 1. Текущие админы:');
    const { stdout: currentAdmins } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, LEFT(password_hash, 25) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(currentAdmins);

    // 2. Генерируем новые правильные хеши
    console.log('\n🔑 2. Генерация новых bcrypt хешей...');
    const { stdout: hashGeneration } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        
        async function generateHashes() {
          try {
            // Генерируем хеши с 10 раундами
            const hash1 = await bcrypt.hash('VitawinAdmin2025!', 10);
            const hash2 = await bcrypt.hash('admin123', 10);
            
            console.log('ADMIN_HASH=' + hash1);
            console.log('DOROSH_HASH=' + hash2);
            
            // Тестируем
            const test1 = await bcrypt.compare('VitawinAdmin2025!', hash1);
            const test2 = await bcrypt.compare('admin123', hash2);
            
            console.log('ADMIN_TEST=' + test1);
            console.log('DOROSH_TEST=' + test2);
            
          } catch (error) {
            console.error('Error:', error.message);
          }
        }
        
        generateHashes();
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
      throw new Error('Хеши не прошли валидацию!');
    }

    // 3. Обновляем существующих админов
    console.log('\n💾 3. Обновление паролей существующих админов...');
    
    // Обновляем admin@vitawins.ru
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        UPDATE admin_users 
        SET password_hash = '${adminHash}', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE email = 'admin@vitawins.ru';
      "`
    );

    // Обновляем dorosh21@gmail.com
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        UPDATE admin_users 
        SET password_hash = '${doroshHash}', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE email = 'dorosh21@gmail.com';
      "`
    );

    // 4. Проверяем обновление
    console.log('\n✅ 4. Проверка обновленных админов:');
    const { stdout: updatedAdmins } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, updated_at, LEFT(password_hash, 25) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(updatedAdmins);

    // 5. Финальный тест авторизации
    console.log('\n🧪 5. Финальный тест авторизации...');
    const { stdout: authTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function testAuth() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            console.log('Тестирование admin@vitawins.ru...');
            const result1 = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['admin@vitawins.ru']);
            
            if (result1.rows.length > 0) {
              const admin = result1.rows[0];
              const isValid = await bcrypt.compare('VitawinAdmin2025!', admin.password_hash);
              console.log('admin@vitawins.ru + VitawinAdmin2025!: ' + (isValid ? 'SUCCESS ✅' : 'FAILED ❌'));
            } else {
              console.log('admin@vitawins.ru: NOT FOUND ❌');
            }
            
            console.log('\\nТестирование dorosh21@gmail.com...');
            const result2 = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['dorosh21@gmail.com']);
            
            if (result2.rows.length > 0) {
              const admin2 = result2.rows[0];
              const isValid2 = await bcrypt.compare('admin123', admin2.password_hash);
              console.log('dorosh21@gmail.com + admin123: ' + (isValid2 ? 'SUCCESS ✅' : 'FAILED ❌'));
            } else {
              console.log('dorosh21@gmail.com: NOT FOUND ❌');
            }
            
          } catch (error) {
            console.error('Ошибка теста:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        testAuth();
      "`
    );

    console.log(authTest);

    console.log('\n🎯 ОБНОВЛЕНИЕ ЗАВЕРШЕНО!');
    console.log('\n📋 Данные для входа в админку:');
    console.log('• Email: admin@vitawins.ru');
    console.log('• Пароль: VitawinAdmin2025!');
    console.log('');
    console.log('• Email: dorosh21@gmail.com');
    console.log('• Пароль: admin123');
    console.log('\n🌐 URL админки: https://vitawins.ru/admin');
    
  } catch (error) {
    console.error('❌ Ошибка обновления:', error.message);
  }
}

updateExistingAdmins();