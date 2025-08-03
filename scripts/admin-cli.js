#!/usr/bin/env node

import { exec } from 'child_process';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import readline from 'readline';

// Конфигурация для Docker
const DOCKER_CONFIG = {
  container: 'vitawin_postgres',
  database: 'vitawin',
  user: 'vitawin_user',
  password: 'vitawin_secure_password_2025'
};

// Настройки шифрования
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16
};

class AdminCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Генерация ключа шифрования
  generateEncryptionKey() {
    return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength).toString('hex');
  }

  // Шифрование пароля
  encryptPassword(password, key) {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Дешифрование пароля
  decryptPassword(encryptedData, key) {
    try {
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_CONFIG.algorithm, 
        Buffer.from(key, 'hex'), 
        Buffer.from(encryptedData.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Ошибка дешифрования: неверный ключ или поврежденные данные');
    }
  }

  // Выполнение SQL запроса через Docker
  async executeSQL(query) {
    return new Promise((resolve, reject) => {
      const dockerCommand = `docker exec -i ${DOCKER_CONFIG.container} psql -U ${DOCKER_CONFIG.user} -d ${DOCKER_CONFIG.database} -c "${query}"`;
      
      exec(dockerCommand, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Ошибка выполнения SQL: ${error.message}`));
          return;
        }
        if (stderr && !stderr.includes('NOTICE')) {
          reject(new Error(`SQL ошибка: ${stderr}`));
          return;
        }
        resolve(stdout);
      });
    });
  }

  // Проверка существования админских данных
  async checkAdminExists() {
    try {
      const result = await this.executeSQL("SELECT COUNT(*) FROM admin_users;");
      const count = parseInt(result.split('\n')[2].trim());
      return count > 0;
    } catch (error) {
      throw new Error(`Ошибка проверки админских данных: ${error.message}`);
    }
  }

  // Получение админских данных
  async getAdminData() {
    try {
      const result = await this.executeSQL("SELECT id, email, password_hash, created_at, last_login FROM admin_users ORDER BY id LIMIT 1;");
      const lines = result.split('\n');
      
      if (lines.length < 4) {
        return null;
      }
      
      const dataLine = lines[2].trim();
      if (!dataLine || dataLine === '(0 rows)') {
        return null;
      }
      
      const parts = dataLine.split('|').map(p => p.trim());
      return {
        id: parts[0],
        email: parts[1],
        password_hash: parts[2],
        created_at: parts[3],
        last_login: parts[4] || 'Никогда'
      };
    } catch (error) {
      throw new Error(`Ошибка получения админских данных: ${error.message}`);
    }
  }

  // Создание админских данных
  async createAdminUser(email, password) {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const query = `INSERT INTO admin_users (email, password_hash, created_at) VALUES ('${email}', '${passwordHash}', NOW());`;
      await this.executeSQL(query);
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка создания админа: ${error.message}`);
    }
  }

  // Сброс и пересоздание всей базы данных
  async resetDatabase() {
    try {
      console.log('🔄 Сброс базы данных...');
      
      // Удаление всех таблиц
      const dropTablesQuery = `
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO ${DOCKER_CONFIG.user};
        GRANT ALL ON SCHEMA public TO public;
      `;
      
      await this.executeSQL(dropTablesQuery);
      
      // Создание таблиц заново
      const createTablesQuery = `
        -- Admin users table
        CREATE TABLE admin_users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          last_login TIMESTAMP
        );
        
        -- Users table  
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT NOT NULL UNIQUE,
          first_name TEXT NOT NULL,
          username TEXT,
          referral_code TEXT NOT NULL UNIQUE,
          referrer_id INTEGER,
          applied_referral_code TEXT,
          balance DECIMAL(10,2) DEFAULT 0.00,
          bonus_coins DECIMAL(10,2) DEFAULT 0.00,
          referral_rewards DECIMAL(10,2) DEFAULT 0.00,
          total_pv INTEGER DEFAULT 0,
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          last_login TIMESTAMP
        );
        
        -- Products table
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          original_price DECIMAL(10,2),
          category TEXT,
          images TEXT[],
          is_active BOOLEAN DEFAULT true,
          stock INTEGER DEFAULT 0,
          slug TEXT UNIQUE,
          pv INTEGER DEFAULT 0,
          custom_pv INTEGER,
          custom_cashback DECIMAL(5,2),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        -- Admin sessions table
        CREATE TABLE admin_sessions (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL REFERENCES admin_users(id),
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        -- Foreign keys
        ALTER TABLE users ADD CONSTRAINT users_referrer_id_fkey 
          FOREIGN KEY (referrer_id) REFERENCES users(id);
      `;
      
      await this.executeSQL(createTablesQuery);
      console.log('✅ База данных успешно пересоздана');
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка сброса БД: ${error.message}`);
    }
  }

  // Вопрос пользователю
  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  // Главное меню
  async showMenu() {
    console.log('\n🔧 VitaWin Admin CLI');
    console.log('==================');
    console.log('1. Проверить админские данные');
    console.log('2. Создать нового админа');
    console.log('3. Показать зашифрованный пароль');
    console.log('4. Расшифровать пароль');
    console.log('5. Сбросить базу данных');
    console.log('6. Выход');
    console.log('==================');
  }

  // Запуск CLI
  async run() {
    try {
      console.log('🚀 Запуск VitaWin Admin CLI...');
      
      while (true) {
        await this.showMenu();
        const choice = await this.ask('Выберите действие (1-6): ');
        
        switch (choice.trim()) {
          case '1':
            await this.handleCheckAdmin();
            break;
          case '2':
            await this.handleCreateAdmin();
            break;
          case '3':
            await this.handleShowEncrypted();
            break;
          case '4':
            await this.handleDecryptPassword();
            break;
          case '5':
            await this.handleResetDatabase();
            break;
          case '6':
            console.log('👋 До свидания!');
            this.rl.close();
            return;
          default:
            console.log('❌ Неверный выбор. Попробуйте снова.');
        }
      }
    } catch (error) {
      console.error('💥 Критическая ошибка:', error.message);
      this.rl.close();
    }
  }

  // Обработчик проверки админа
  async handleCheckAdmin() {
    try {
      const adminExists = await this.checkAdminExists();
      
      if (adminExists) {
        const adminData = await this.getAdminData();
        console.log('\n✅ Админские данные найдены:');
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Password Hash: ${adminData.password_hash.substring(0, 20)}...`);
        console.log(`📅 Создан: ${adminData.created_at}`);
        console.log(`🕒 Последний вход: ${adminData.last_login}`);
      } else {
        console.log('\n❌ Админские данные не найдены');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }

  // Обработчик создания админа
  async handleCreateAdmin() {
    try {
      const adminExists = await this.checkAdminExists();
      
      if (adminExists) {
        const overwrite = await this.ask('⚠️  Админ уже существует. Перезаписать? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
          console.log('🚫 Операция отменена');
          return;
        }
        
        await this.executeSQL('DELETE FROM admin_sessions;');
        await this.executeSQL('DELETE FROM admin_users;');
      }
      
      const email = await this.ask('📧 Введите email админа: ');
      const password = await this.ask('🔑 Введите пароль: ');
      
      await this.createAdminUser(email, password);
      
      console.log('\n✅ Админ успешно создан!');
      console.log(`📧 Email: ${email}`);
      console.log('🔑 Пароль зашифрован и сохранен в БД');
      
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }

  // Обработчик показа зашифрованного пароля
  async handleShowEncrypted() {
    try {
      const password = await this.ask('🔑 Введите пароль для шифрования: ');
      const key = await this.ask('🔐 Введите ключ шифрования (или нажмите Enter для генерации): ');
      
      const encryptionKey = key.trim() || this.generateEncryptionKey();
      const encrypted = this.encryptPassword(password, encryptionKey);
      
      console.log('\n🔐 Зашифрованные данные:');
      console.log(`🔑 Ключ: ${encryptionKey}`);
      console.log(`📦 Зашифрованный пароль: ${encrypted.encrypted}`);
      console.log(`🎯 IV: ${encrypted.iv}`);
      console.log(`🏷️  Auth Tag: ${encrypted.authTag}`);
      
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }

  // Обработчик расшифровки пароля
  async handleDecryptPassword() {
    try {
      const encrypted = await this.ask('📦 Введите зашифрованный пароль: ');
      const iv = await this.ask('🎯 Введите IV: ');
      const authTag = await this.ask('🏷️  Введите Auth Tag: ');
      const key = await this.ask('🔑 Введите ключ шифрования: ');
      
      const encryptedData = {
        encrypted: encrypted,
        iv: iv,
        authTag: authTag
      };
      
      const decrypted = this.decryptPassword(encryptedData, key);
      
      console.log('\n🔓 Расшифрованный пароль:', decrypted);
      
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }

  // Обработчик сброса БД
  async handleResetDatabase() {
    try {
      console.log('\n⚠️  ВНИМАНИЕ: Это действие удалит ВСЕ данные из базы!');
      const confirm1 = await this.ask('Вы уверены? Введите "RESET" для подтверждения: ');
      
      if (confirm1 !== 'RESET') {
        console.log('🚫 Операция отменена');
        return;
      }
      
      const confirm2 = await this.ask('🔥 Последнее предупреждение! Введите "YES" для продолжения: ');
      
      if (confirm2 !== 'YES') {
        console.log('🚫 Операция отменена');
        return;
      }
      
      await this.resetDatabase();
      
      console.log('\n🔄 База данных успешно сброшена и пересоздана');
      console.log('💡 Теперь можете создать нового админа');
      
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
  }
}

// Запуск CLI при прямом вызове
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new AdminCLI();
  cli.run().catch(console.error);
}

export default AdminCLI;