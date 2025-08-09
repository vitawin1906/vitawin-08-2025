#!/usr/bin/env node

// Исправление проблемы с экранированием $ в SQL запросах
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fixSQLEscaping() {
  console.log('\n🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ЭКРАНИРОВАНИЕМ SQL\n');
  
  try {
    // 1. Генерируем хеши
    console.log('🔑 1. Генерация новых bcrypt хешей...');
    const { stdout: hashGeneration } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        
        async function generateHashes() {
          try {
            const hash1 = await bcrypt.hash('VitawinAdmin2025!', 10);
            const hash2 = await bcrypt.hash('admin123', 10);
            
            console.log('ADMIN_HASH=' + hash1);
            console.log('DOROSH_HASH=' + hash2);
            
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

    const lines = hashGeneration.split('\n').filter(line => line.trim());
    const adminHash = lines.find(line => line.startsWith('ADMIN_HASH=')).replace('ADMIN_HASH=', '');
    const doroshHash = lines.find(line => line.startsWith('DOROSH_HASH=')).replace('DOROSH_HASH=', '');

    console.log('Admin hash:', adminHash);
    console.log('Dorosh hash:', doroshHash);

    // 2. Обновляем используя параметризованные запросы через Node.js
    console.log('\n💾 2. Обновление через параметризованные запросы...');
    const { stdout: updateResult } = await execAsync(
      `docker exec vitawin_app node -e "
        const { Pool } = require('pg');
        
        async function updateHashes() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            // Обновляем admin@vitawins.ru
            const result1 = await pool.query(
              'UPDATE admin_users SET password_hash = \\$1, updated_at = CURRENT_TIMESTAMP WHERE email = \\$2',
              ['${adminHash}', 'admin@vitawins.ru']
            );
            console.log('Admin update result:', result1.rowCount, 'rows affected');
            
            // Обновляем dorosh21@gmail.com
            const result2 = await pool.query(
              'UPDATE admin_users SET password_hash = \\$1, updated_at = CURRENT_TIMESTAMP WHERE email = \\$2',
              ['${doroshHash}', 'dorosh21@gmail.com']
            );
            console.log('Dorosh update result:', result2.rowCount, 'rows affected');
            
          } catch (error) {
            console.error('Update error:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        updateHashes();
      "`
    );

    console.log(updateResult);

    // 3. Проверяем сохраненные хеши
    console.log('\n📊 3. Проверка сохраненных хешей:');
    const { stdout: savedHashes } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT email, LENGTH(password_hash) as hash_length, LEFT(password_hash, 10) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(savedHashes);

    // 4. Финальный тест авторизации
    console.log('\n🧪 4. Финальный тест авторизации...');
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
              console.log('Хеш длина:', admin.password_hash.length);
              console.log('Хеш начинается с:', admin.password_hash.substring(0, 10));
              
              const isValid = await bcrypt.compare('VitawinAdmin2025!', admin.password_hash);
              console.log('admin@vitawins.ru + VitawinAdmin2025!: ' + (isValid ? 'SUCCESS ✅' : 'FAILED ❌'));
            } else {
              console.log('admin@vitawins.ru: NOT FOUND ❌');
            }
            
            console.log('\\nТестирование dorosh21@gmail.com...');
            const result2 = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['dorosh21@gmail.com']);
            
            if (result2.rows.length > 0) {
              const admin2 = result2.rows[0];
              console.log('Хеш длина:', admin2.password_hash.length);
              console.log('Хеш начинается с:', admin2.password_hash.substring(0, 10));
              
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

    console.log('\n🎯 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
    console.log('\nПроблема была в том, что символы $ в bcrypt хешах интерпретировались как переменные в SQL.');
    console.log('Теперь используются параметризованные запросы для безопасного сохранения хешей.');
    console.log('\n📋 Данные для входа:');
    console.log('• admin@vitawins.ru: VitawinAdmin2025!');
    console.log('• dorosh21@gmail.com: admin123');
    
  } catch (error) {
    console.error('❌ Ошибка исправления:', error.message);
  }
}

fixSQLEscaping();