#!/usr/bin/env node

// Детальная диагностика проблемы с хешами
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function detailedDebug() {
  console.log('\n🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА ХЕШЕЙ\n');
  
  try {
    // 1. Показываем полные хеши из БД
    console.log('📊 1. Полные хеши из базы данных:');
    const { stdout: fullHashes } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "SELECT email, password_hash FROM admin_users ORDER BY id;"`
    );
    console.log(fullHashes);

    // 2. Детальное тестирование каждого хеша
    console.log('\n🧪 2. Детальное тестирование хешей...');
    const { stdout: detailedTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function detailedTest() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            const result = await pool.query('SELECT email, password_hash FROM admin_users ORDER BY id');
            
            for (const admin of result.rows) {
              console.log('\\n=== ТЕСТИРОВАНИЕ:', admin.email, '===');
              console.log('Хеш из БД:', admin.password_hash);
              console.log('Длина хеша:', admin.password_hash.length);
              console.log('Начинается с:', admin.password_hash.substring(0, 10));
              
              // Определяем пароль для тестирования
              const testPassword = admin.email === 'admin@vitawins.ru' ? 'VitawinAdmin2025!' : 'admin123';
              console.log('Тестируем пароль:', testPassword);
              
              try {
                const isValid = await bcrypt.compare(testPassword, admin.password_hash);
                console.log('Результат bcrypt.compare:', isValid);
                
                // Дополнительная проверка - создаем новый хеш и сравниваем
                const newHash = await bcrypt.hash(testPassword, 10);
                console.log('Новый хеш для сравнения:', newHash.substring(0, 30) + '...');
                const newTest = await bcrypt.compare(testPassword, newHash);
                console.log('Тест нового хеша:', newTest);
                
              } catch (error) {
                console.log('ОШИБКА при сравнении:', error.message);
              }
            }
            
          } catch (error) {
            console.error('Ошибка запроса:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        detailedTest();
      "`
    );
    console.log(detailedTest);

    // 3. Проверяем точность сохранения хешей
    console.log('\n💾 3. Проверка точности сохранения хешей...');
    
    // Генерируем новый тестовый хеш
    const { stdout: testHash } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        
        async function generateTestHash() {
          const testPassword = 'testpass123';
          const hash = await bcrypt.hash(testPassword, 10);
          console.log('TEST_PASSWORD=' + testPassword);
          console.log('TEST_HASH=' + hash);
          
          const validation = await bcrypt.compare(testPassword, hash);
          console.log('TEST_VALIDATION=' + validation);
        }
        
        generateTestHash();
      "`
    );
    console.log(testHash);

    const lines = testHash.split('\n').filter(line => line.trim());
    const testPassword = lines.find(line => line.startsWith('TEST_PASSWORD=')).replace('TEST_PASSWORD=', '');
    const testHashValue = lines.find(line => line.startsWith('TEST_HASH=')).replace('TEST_HASH=', '');

    // Сохраняем тестовый хеш в БД
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "
        INSERT INTO admin_users (email, password_hash, is_active, created_at, updated_at) 
        VALUES ('test@example.com', '${testHashValue}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      "`
    );

    // Извлекаем и тестируем
    const { stdout: retrievalTest } = await execAsync(
      `docker exec vitawin_app node -e "
        const bcrypt = require('bcrypt');
        const { Pool } = require('pg');
        
        async function testRetrieval() {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL
          });
          
          try {
            const result = await pool.query('SELECT password_hash FROM admin_users WHERE email = \\$1', ['test@example.com']);
            
            if (result.rows.length > 0) {
              const retrievedHash = result.rows[0].password_hash;
              console.log('Извлеченный хеш:', retrievedHash);
              console.log('Оригинальный хеш:', '${testHashValue}');
              console.log('Хеши идентичны:', retrievedHash === '${testHashValue}');
              
              const validation = await bcrypt.compare('${testPassword}', retrievedHash);
              console.log('Валидация извлеченного хеша:', validation);
            }
            
          } catch (error) {
            console.error('Ошибка извлечения:', error.message);
          } finally {
            await pool.end();
          }
        }
        
        testRetrieval();
      "`
    );
    console.log(retrievalTest);

    // Удаляем тестового админа
    await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "DELETE FROM admin_users WHERE email = 'test@example.com';"`
    );

    console.log('\n💡 АНАЛИЗ:');
    console.log('Если хеши сохраняются и извлекаются корректно, но валидация FAILED,');
    console.log('то проблема может быть в:');
    console.log('1. Кодировке символов в пароле');
    console.log('2. Несоответствии версий bcrypt');
    console.log('3. Проблеме с экранированием в SQL запросах');
    
  } catch (error) {
    console.error('❌ Ошибка детальной диагностики:', error.message);
  }
}

detailedDebug();