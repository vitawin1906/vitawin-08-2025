import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Подключение к базе данных
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client);

async function migrateImagesToDatabase() {
  console.log('Начинаем миграцию изображений в базу данных...');
  
  const uploadsDir = path.join(__dirname, 'client/public/uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('Папка uploads не найдена');
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  const imageFiles = files.filter(file => 
    file.match(/\.(png|jpg|jpeg|gif|svg)$/i)
  );
  
  console.log(`Найдено ${imageFiles.length} изображений для миграции`);
  
  for (const file of imageFiles) {
    try {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      const base64Data = buffer.toString('base64');
      
      // Определяем MIME тип
      const ext = path.extname(file).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      if (ext === '.gif') mimeType = 'image/gif';
      if (ext === '.svg') mimeType = 'image/svg+xml';
      
      // Вставляем в базу данных
      const query = `
        INSERT INTO uploaded_images (filename, original_filename, mime_type, file_size, image_data)
        VALUES ('${file}', '${file}', '${mimeType}', ${stats.size}, '${base64Data}')
        ON CONFLICT (filename) DO NOTHING
      `;
      await client(query);
      
      console.log(`✓ Перенесено: ${file} (${Math.round(stats.size/1024)}KB)`);
    } catch (error) {
      console.error(`✗ Ошибка при переносе ${file}:`, error.message);
    }
  }
  
  console.log('Миграция завершена!');
}

migrateImagesToDatabase().catch(console.error);