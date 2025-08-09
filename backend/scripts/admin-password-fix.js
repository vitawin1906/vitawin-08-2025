#!/usr/bin/env node

import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Загрузка переменных из .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixAdminPasswords() {
  console.log("\n🔧 Исправление паролей админов в Neon...\n");

  try {
    // Генерация хешей
    const adminHash = await bcrypt.hash("VitawinAdmin2025!", 10);
    const doroshHash = await bcrypt.hash("admin123", 10);

    console.log("🔑 Хеши успешно сгенерированы");

    // Удаление старых админов
    await pool.query("DELETE FROM admin_users");

    // Вставка с новыми хешами
    await pool.query(`
      INSERT INTO admin_users (email, password, is_active, created_at, updated_at, name) VALUES
      ($1, $2, true, NOW(), NOW(), 'Админ'),
      ($3, $4, true, NOW(), NOW(), 'Дорош Александр')
    `, [
      "admin@vitawins.ru", adminHash,
      "dorosh21@gmail.com", doroshHash,
    ]);

    console.log("✅ Админы успешно добавлены");

    // Проверка логики
    const res = await pool.query("SELECT email, password FROM admin_users ORDER BY id");
    for (const admin of res.rows) {
      const testPass = admin.email === "admin@vitawins.ru"
          ? "VitawinAdmin2025!"
          : "admin123";

      const valid = await bcrypt.compare(testPass, admin.password);
      console.log(`🧪 Проверка ${admin.email}: ${valid ? "✅ VALID" : "❌ INVALID"}`);
    }

    console.log("\n🎯 Пароли обновлены. Готово к входу в админку:");
    console.log("• https://vitawins.ru/admin");
    console.log("• admin@vitawins.ru / VitawinAdmin2025!");
    console.log("• dorosh21@gmail.com / admin123");

    await pool.end();

  } catch (err) {
    console.error("❌ Ошибка:", err.message);
    process.exit(1);
  }
}

fixAdminPasswords();
