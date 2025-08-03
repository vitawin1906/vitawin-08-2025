#!/usr/bin/env node

// Исправление схемы admin_users и создание правильных админов
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function fixAdminSchema() {
  console.log('\n🔧 ИСПРАВЛЕНИЕ СХЕМЫ ADMIN_USERS\n');
  
  try {
    // 1. Проверяем текущую схему
    console.log('📊 1. Текущая схема admin_users:');
    const { stdout: schemaInfo } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "\\d admin_users"`
    );
    console.log(schemaInfo);

    // 2. Добавляем недостающие колонки если их нет
    console.log('\n🔄 2. Добавление недостающих колонок...');
    
    try {
      await execAsync(
        `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
          ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
          ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;
        "`
      );
      console.log('✅ Колонки добавлены успешно');
    } catch (error) {
      console.log('⚠️ Колонки уже существуют или ошибка:', error.message);
    }

    // 3. Убеждаемся что password_hash имеет тип TEXT
    console.log('\n🔧 3. Проверка типа password_hash...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        ALTER TABLE admin_users ALTER COLUMN password_hash TYPE TEXT;
      "`
    );

    // 4. Удаляем старых админов
    console.log('\n🗑️ 4. Очистка старых админов...');
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        DELETE FROM admin_activity_log WHERE admin_id IN (SELECT id FROM admin_users);
        DELETE FROM admin_sessions WHERE admin_id IN (SELECT id FROM admin_users);
        DELETE FROM admin_users;
      "`
    );

    // 5. Создаем новых админов через Node.js с правильными хешами
    console.log('\n👥 5. Создание новых админов...');
    const { stdout: adminCreation } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function createAdmins() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            // Создаем хеши
            const adminHash = await bcrypt.hash('VitawinAdmin2025', 10);
            const doroshHash = await bcrypt.hash('admin123', 10);
            
            console.log('Generated admin hash length:', adminHash.length);
            console.log('Generated dorosh hash length:', doroshHash.length);
            
            // Вставляем админов
            const admin1 = await pool.query(
              'INSERT INTO admin_users (email, password_hash, is_active, created_at, updated_at) VALUES (\\$1, \\$2, \\$3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, email, LENGTH(password_hash) as hash_length',
              ['admin@vitawins.ru', adminHash, true]
            );
            
            const admin2 = await pool.query(
              'INSERT INTO admin_users (email, password_hash, is_active, created_at, updated_at) VALUES (\\$1, \\$2, \\$3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, email, LENGTH(password_hash) as hash_length',
              ['dorosh21@gmail.com', doroshHash, true]
            );
            
            console.log('Admin 1 created:', admin1.rows[0]);
            console.log('Admin 2 created:', admin2.rows[0]);
            
            // Тестируем созданных админов
            console.log('\\nТестирование созданных админов...');
            
            const test1Result = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['admin@vitawins.ru']);
            if (test1Result.rows.length > 0) {
              const admin = test1Result.rows[0];
              const isValid = await bcrypt.compare('VitawinAdmin2025', admin.password_hash);
              console.log('admin@vitawins.ru test:', isValid ? 'SUCCESS ✅' : 'FAILED ❌');
              console.log('Hash length in DB:', admin.password_hash.length);
            }
            
            const test2Result = await pool.query('SELECT email, password_hash FROM admin_users WHERE email = \\$1', ['dorosh21@gmail.com']);
            if (test2Result.rows.length > 0) {
              const admin = test2Result.rows[0];
              const isValid = await bcrypt.compare('admin123', admin.password_hash);
              console.log('dorosh21@gmail.com test:', isValid ? 'SUCCESS ✅' : 'FAILED ❌');
              console.log('Hash length in DB:', admin.password_hash.length);
            }
            
          } catch (error) {
            console.error('Admin creation error:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        createAdmins();
      "`
    );

    console.log(adminCreation);

    // 6. Финальная проверка
    console.log('\n📊 6. Финальная проверка админов:');
    const { stdout: finalCheck } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT id, email, is_active, LENGTH(password_hash) as hash_length, LEFT(password_hash, 10) || '...' as hash_preview FROM admin_users ORDER BY id;"`
    );
    console.log(finalCheck);

    console.log('\n🎯 ИСПРАВЛЕНИЕ СХЕМЫ ЗАВЕРШЕНО!');
    console.log('\n📋 Данные для входа в админку:');
    console.log('• Email: admin@vitawins.ru');
    console.log('• Пароль: VitawinAdmin2025 (без специальных символов)');
    console.log('');
    console.log('• Email: dorosh21@gmail.com');
    console.log('• Пароль: admin123');
    console.log('\n🌐 URL: https://vitawins.ru/admin');
    
  } catch (error) {
    console.error('❌ Ошибка исправления схемы:', error.message);
  }
}

fixAdminSchema();