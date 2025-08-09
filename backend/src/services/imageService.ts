import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { uploaded_images } from "@shared/schema";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

const client = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(client);

export class ImageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly imagesDir = path.join(this.uploadsDir, 'images');

  constructor() {
    // Создаем папки если их нет
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      if (!fs.existsSync(this.uploadsDir)) {
        await mkdir(this.uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(this.imagesDir)) {
        await mkdir(this.imagesDir, { recursive: true });
      }
    } catch (error) {
      console.error('Ошибка создания директорий:', error);
    }
  }

  /**
   * Загружает изображение в файловую систему с записью метаданных в БД
   */
  async uploadImage(
    buffer: Buffer, 
    originalFilename: string, 
    mimeType: string, 
    productId?: number,
    isPrimary: boolean = false,
    displayOrder: number = 0
  ): Promise<string> {
    const filename = this.generateUniqueFilename(originalFilename);
    const filePath = path.join(this.imagesDir, filename);

    // Убеждаемся что директории существуют перед сохранением
    await this.ensureDirectories();

    try {
      await writeFile(filePath, buffer);
      console.log(`Файл сохранен: ${filePath}, размер: ${buffer.length} байт`);
    } catch (error) {
      console.error(`Ошибка сохранения файла ${filePath}:`, error);
      throw error;
    }

    // Если это основное изображение, сбрасываем флаг у других изображений товара
    if (isPrimary && productId) {
      await db
        .update(uploaded_images)
        .set({ is_primary: false })
        .where(eq(uploaded_images.product_id, productId));
    }

    // Записываем метаданные в БД (БЕЗ image_data)
    await db.insert(uploaded_images).values({
      filename,
      original_filename: originalFilename,
      mime_type: mimeType,
      file_size: buffer.length,
      product_id: productId,
      is_primary: isPrimary,
      display_order: displayOrder,
    });

    return filename;
  }

  /**
   * Получает изображение из файловой системы
   */
  async getImage(filename: string): Promise<{ buffer: Buffer; mimeType: string | null } | null> {
    const result = await db
      .select()
      .from(uploaded_images)
      .where(eq(uploaded_images.filename, filename))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const image = result[0];
    const filePath = path.join(this.imagesDir, filename);

    try {
      const buffer = await readFile(filePath);
      return {
        buffer,
        mimeType: image.mime_type,
      };
    } catch (error) {
      console.error(`Ошибка чтения файла ${filename}:`, error);
      return null;
    }
  }

  /**
   * Удаляет изображение из файловой системы и БД
   */
  async deleteImage(filename: string): Promise<boolean | undefined> {
    const filePath = path.join(this.imagesDir, filename);

    try {
      // Удаляем файл из файловой системы
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }

      // Удаляем запись из БД
      const result = await db
        .delete(uploaded_images)
        .where(eq(uploaded_images.filename, filename));
      if(result && result.rowCount){
        return result.rowCount > 0;
      }
    } catch (error) {
      console.error(`Ошибка удаления файла ${filename}:`, error);
      return false;
    }
  }

  /**
   * Получает изображения товара, отсортированные по порядку отображения
   */
  async getProductImages(productId: number): Promise<Array<{ filename: string; isPrimary: boolean; displayOrder: number }>> {
    const result = await db
      .select({
        filename: uploaded_images.filename,
        isPrimary: uploaded_images.is_primary,
        displayOrder: uploaded_images.display_order,
      })
      .from(uploaded_images)
      .where(eq(uploaded_images.product_id, productId));

    return result.map(item => ({
      filename: item.filename,
      isPrimary: item.isPrimary || false,
      displayOrder: item.displayOrder || 0,
    }));
  }

  /**
   * Получает основное изображение товара
   */
  async getPrimaryProductImage(productId: number): Promise<string | null> {
    const result = await db
      .select({ filename: uploaded_images.filename })
      .from(uploaded_images)
      .where(
        and(
          eq(uploaded_images.product_id, productId),
          eq(uploaded_images.is_primary, true)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0].filename : null;
  }

  /**
   * Получает список всех изображений
   */
  async getAllImages(): Promise<Array<{ filename: string; originalFilename: string | null; mimeType: string | null; fileSize: number| null; productId: number | null; createdAt: Date | null }>> {
    const result = await db
      .select({
        filename: uploaded_images.filename,
        originalFilename: uploaded_images.original_filename,
        mimeType: uploaded_images.mime_type,
        fileSize: uploaded_images.file_size,
        productId: uploaded_images.product_id,
        createdAt: uploaded_images.created_at,
      })
      .from(uploaded_images);

    return result;
  }

  /**
   * Миграция записей из БД для соответствия файлам в файловой системе
   */
  async syncWithFileSystem(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Получаем все записи из БД
      const dbImages = await db
        .select()
        .from(uploaded_images);

      for (const dbImage of dbImages) {
        const filePath = path.join(this.imagesDir, dbImage.filename);
        
        // Если файл не существует в файловой системе, удаляем запись из БД
        if (!fs.existsSync(filePath)) {
          await db
            .delete(uploaded_images)
            .where(eq(uploaded_images.filename, dbImage.filename));
          errors.push(`Удалена запись для отсутствующего файла: ${dbImage.filename}`);
        } else {
          synced++;
        }
      }

      // Теперь проверяем файлы в файловой системе без записей в БД
      if (fs.existsSync(this.imagesDir)) {
        const files = fs.readdirSync(this.imagesDir);
        const imageFiles = files.filter(file => 
          file.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)
        );

        for (const file of imageFiles) {
          const existing = await db
            .select()
            .from(uploaded_images)
            .where(eq(uploaded_images.filename, file))
            .limit(1);

          if (existing.length === 0) {
            // Создаем запись для файла без метаданных в БД
            const filePath = path.join(this.imagesDir, file);
            const stats = fs.statSync(filePath);
            
            const ext = path.extname(file).toLowerCase();
            let mimeType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            if (ext === '.gif') mimeType = 'image/gif';
            if (ext === '.svg') mimeType = 'image/svg+xml';
            if (ext === '.webp') mimeType = 'image/webp';

            await db.insert(uploaded_images).values({
              filename: file,
              original_filename: file,
              mime_type: mimeType,
              file_size: stats.size,
            });

            synced++;
          }
        }
      }

      return { synced, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      return { synced, errors: [errorMessage] };
    }
  }

  /**
   * Генерирует уникальное имя файла
   */
  private generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const name = path.basename(originalFilename, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${name}_${timestamp}_${random}${ext}`;
  }
}

export const imageService = new ImageService();