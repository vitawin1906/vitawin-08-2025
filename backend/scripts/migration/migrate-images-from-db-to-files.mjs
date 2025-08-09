#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection using built-in pg
import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL не найден в переменных окружения');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString
});

// Create uploads directory structure
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const productsDir = path.join(imagesDir, 'products');
const blogDir = path.join(imagesDir, 'blog');

console.log('📁 Создаю директории...');
[uploadsDir, imagesDir, productsDir, blogDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Создана: ${dir}`);
  }
});

async function migrateImages() {
  try {
    console.log('🔍 Подключаюсь к базе данных...');
    await client.connect();
    
    console.log('🔍 Получаю изображения из базы данных...');
    
    // Get all images from database
    const result = await client.query(`
      SELECT 
        id,
        filename,
        original_filename,
        mime_type,
        file_size,
        image_data,
        product_id,
        is_primary,
        display_order,
        created_at
      FROM uploaded_images 
      ORDER BY id
    `);
    
    const images = result.rows;

    console.log(`📊 Найдено изображений: ${images.length}`);
    
    if (images.length === 0) {
      console.log('✅ Нет изображений для миграции');
      return;
    }

    const migrationLog = [];
    let successCount = 0;
    let errorCount = 0;

    for (const image of images) {
      try {
        console.log(`📸 Обрабатываю: ${image.filename} (ID: ${image.id})`);
        
        // Decode base64 image data
        const imageBuffer = Buffer.from(image.image_data, 'base64');
        
        // Determine file extension from mime type
        let extension = '.jpg';
        switch (image.mime_type) {
          case 'image/png': extension = '.png'; break;
          case 'image/jpeg': extension = '.jpg'; break;
          case 'image/webp': extension = '.webp'; break;
          case 'image/gif': extension = '.gif'; break;
          default: extension = '.jpg';
        }
        
        // Generate clean filename
        const cleanFilename = image.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalFilename = cleanFilename.endsWith(extension) 
          ? cleanFilename 
          : cleanFilename + extension;
        
        // Determine target directory
        const targetDir = image.product_id ? productsDir : blogDir;
        const filePath = path.join(targetDir, finalFilename);
        
        // Write file
        fs.writeFileSync(filePath, imageBuffer);
        
        // Verify file was written correctly
        const stats = fs.statSync(filePath);
        
        migrationLog.push({
          id: image.id,
          original_filename: image.original_filename,
          db_filename: image.filename,
          new_filename: finalFilename,
          file_path: path.relative(__dirname, filePath),
          file_size_db: image.file_size,
          file_size_disk: stats.size,
          mime_type: image.mime_type,
          product_id: image.product_id,
          is_primary: image.is_primary,
          created_at: image.created_at,
          status: 'success'
        });
        
        successCount++;
        console.log(`✅ Сохранен: ${filePath} (${stats.size} байт)`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Ошибка при обработке ${image.filename}:`, error.message);
        
        migrationLog.push({
          id: image.id,
          original_filename: image.original_filename,
          db_filename: image.filename,
          error: error.message,
          status: 'error'
        });
      }
    }

    // Save migration log
    const logPath = path.join(__dirname, 'image-migration-log.json');
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2), 'utf8');
    
    console.log('\n📋 РЕЗУЛЬТАТЫ МИГРАЦИИ:');
    console.log(`✅ Успешно мигрировано: ${successCount}`);
    console.log(`❌ Ошибки: ${errorCount}`);
    console.log(`📁 Файлы сохранены в: ${uploadsDir}`);
    console.log(`📄 Лог миграции: ${logPath}`);
    
    // Show file structure
    console.log('\n📂 СТРУКТУРА ФАЙЛОВ:');
    console.log(`${uploadsDir}/`);
    console.log(`├── images/`);
    console.log(`│   ├── products/ (${fs.readdirSync(productsDir).length} файлов)`);
    console.log(`│   └── blog/ (${fs.readdirSync(blogDir).length} файлов)`);
    
    // Calculate total size
    const calculateDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        size += stats.size;
      }
      return size;
    };
    
    const productsSize = calculateDirSize(productsDir);
    const blogSize = calculateDirSize(blogDir);
    const totalSize = productsSize + blogSize;
    
    console.log(`\n💾 РАЗМЕРЫ:`);
    console.log(`Products: ${(productsSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Blog: ${(blogSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Общий размер: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Create .gitignore for uploads
    const gitignorePath = path.join(uploadsDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Ignore uploaded files in git\n*\n!.gitignore\n');
      console.log(`✅ Создан .gitignore в uploads/`);
    }
    
    console.log('\n🎉 МИГРАЦИЯ ЗАВЕРШЕНА!');
    console.log('\n💡 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Скачай папку uploads/ из проекта');
    console.log('2. Обнови API для работы с файлами вместо БД');
    console.log('3. Удали поле image_data из схемы БД');
    console.log('4. Добавь поле file_path в схему');
    
  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
migrateImages();