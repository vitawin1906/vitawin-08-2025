#!/usr/bin/env node

// Упрощенная версия CLI для запуска на хосте (не в контейнере)
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSQL(query) {
  try {
    const { stdout } = await execAsync(
      `docker exec -i vitawin_postgres psql -U vitawin_user -d vitawin -c "${query}"`
    );
    return stdout;
  } catch (error) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

async function checkAdmins() {
  console.log('\n🔍 Проверка админских данных...\n');
  
  try {
    // Получаем базовые данные
    const basicData = await runSQL(
      'SELECT id, email, created_at, last_login FROM admin_users ORDER BY id;'
    );
    console.log('📊 Базовые данные админов:');
    console.log(basicData);

    // Получаем пароли (зашифрованные)
    const passwordData = await runSQL(
      'SELECT id, email, password_hash FROM admin_users ORDER BY id;'
    );
    console.log('🔐 Хешированные пароли:');
    console.log(passwordData);

    console.log('\n📝 Известные пароли:');
    console.log('admin@vitawins.ru: VitawinAdmin2025!');
    console.log('dorosh21@gmail.com: admin123 (НЕ зашифрован!)');
    
    console.log('\n⚠️  ВНИМАНИЕ: Пароли в БД хранятся как plain text!');
    console.log('   Рекомендуется обновить их до bcrypt хешей.');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

async function showMenu() {
  console.log('\n🔧 VitaWin Admin CLI (Упрощенная версия)');
  console.log('==========================================\n');
  console.log('1. Проверить админские данные');
  console.log('2. Показать статус контейнеров');
  console.log('3. Показать логи PostgreSQL');
  console.log('4. Обновить пароли до bcrypt');
  console.log('0. Выход\n');
}

async function showContainerStatus() {
  try {
    const { stdout } = await execAsync('docker ps --filter "name=vitawin" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    console.log('\n🐳 Статус контейнеров VitaWin:');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Ошибка получения статуса:', error.message);
  }
}

async function showLogs() {
  try {
    const { stdout } = await execAsync('docker logs --tail 20 vitawin_postgres');
    console.log('\n📜 Последние 20 строк логов PostgreSQL:');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Ошибка получения логов:', error.message);
  }
}

async function updatePasswords() {
  console.log('\n🔐 Обновление паролей до bcrypt хешей...\n');
  
  try {
    // Генерируем bcrypt хеши используя команду Docker
    console.log('🔑 Генерация bcrypt хешей...');
    
    // Используем Node.js в контейнере для создания хешей
    const { stdout: adminHashResult } = await execAsync(
      `docker exec vitawin_app node -e "const bcrypt = require('bcrypt'); bcrypt.hash('VitawinAdmin2025!', 12).then(h => console.log(h))"`
    );
    const adminHash = adminHashResult.trim();
    
    const { stdout: doroshHashResult } = await execAsync(
      `docker exec vitawin_app node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 12).then(h => console.log(h))"`
    );
    const doroshHash = doroshHashResult.trim();
    
    console.log(`admin@vitawins.ru: ${adminHash.substring(0, 30)}...`);
    console.log(`dorosh21@gmail.com: ${doroshHash.substring(0, 30)}...`);
    
    // Обновляем в базе данных
    await runSQL(`UPDATE admin_users SET password_hash = '${adminHash}' WHERE email = 'admin@vitawins.ru';`);
    await runSQL(`UPDATE admin_users SET password_hash = '${doroshHash}' WHERE email = 'dorosh21@gmail.com';`);
    
    console.log('\n✅ Пароли успешно обновлены до bcrypt хешей!');
    console.log('\n📝 Теперь в админке можно входить:');
    console.log('admin@vitawins.ru: VitawinAdmin2025!');
    console.log('dorosh21@gmail.com: admin123');
    
  } catch (error) {
    console.error('❌ Ошибка обновления паролей:', error.message);
    console.log('\n💡 Альтернатива: обновите пароли вручную через админ-панель');
  }
}

// Если запущен напрямую через аргументы командной строки
const args = process.argv.slice(2);
if (args.length > 0) {
  switch (args[0]) {
    case 'check':
      await checkAdmins();
      process.exit(0);
    case 'status':
      await showContainerStatus();
      process.exit(0);
    case 'logs':
      await showLogs();
      process.exit(0);
    case 'update-passwords':
      await updatePasswords();
      process.exit(0);
    default:
      console.log('Доступные команды: check, status, logs, update-passwords');
      process.exit(1);
  }
}

// Интерактивный режим
async function main() {
  const readline = (await import('readline')).default;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  while (true) {
    await showMenu();
    const choice = await question('Выберите действие: ');

    switch (choice) {
      case '1':
        await checkAdmins();
        break;
      case '2':
        await showContainerStatus();
        break;
      case '3':
        await showLogs();
        break;
      case '4':
        await updatePasswords();
        break;
      case '0':
        console.log('\n👋 До свидания!');
        rl.close();
        return;
      default:
        console.log('❌ Неверный выбор');
    }

    await question('\nНажмите Enter для продолжения...');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;