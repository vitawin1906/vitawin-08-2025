import { Request, Response } from "express";
import { imageService } from "../services/imageService";
import path from "path";

export class ImageController {
  /**
   * Загрузка изображения через API
   */
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Файл не предоставлен" });
      }

      const { product_id, is_primary, display_order } = req.body;

      const filename = await imageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        product_id ? parseInt(product_id) : undefined,
        is_primary === 'true',
        display_order ? parseInt(display_order) : 0
      );

      res.json({
        success: true,
        filename,
        url: `/api/uploads/${filename}`,
        imageUrl: `/api/uploads/${filename}`,
        product_id: product_id ? parseInt(product_id) : null
      });
    } catch (error) {
      console.error("Ошибка загрузки изображения:", error);
      res.status(500).json({ error: "Ошибка загрузки изображения" });
    }
  }

  /**
   * Получение изображения по имени файла
   */
  async getImage(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const image = await imageService.getImage(filename);

      if (!image) {
        return res.status(404).json({ error: "Изображение не найдено" });
      }

      res.set({
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=31536000', // Кэш на год
      });

      res.send(image.buffer);
    } catch (error) {
      console.error("Ошибка получения изображения:", error);
      res.status(500).json({ error: "Ошибка получения изображения" });
    }
  }

  /**
   * Удаление изображения
   */
  async deleteImage(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const deleted = await imageService.deleteImage(filename);

      if (!deleted) {
        return res.status(404).json({ error: "Изображение не найдено" });
      }

      res.json({ success: true, message: "Изображение удалено" });
    } catch (error) {
      console.error("Ошибка удаления изображения:", error);
      res.status(500).json({ error: "Ошибка удаления изображения" });
    }
  }

  /**
   * Получение всех изображений товара
   */
  async getProductImages(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Некорректный ID товара" });
      }

      const images = await imageService.getProductImages(productId);
      res.json({
        success: true,
        images: images.map(img => ({
          filename: img.filename,
          url: `/api/images/${img.filename}`,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder
        }))
      });
    } catch (error) {
      console.error("Ошибка получения изображений товара:", error);
      res.status(500).json({ error: "Ошибка получения изображений товара" });
    }
  }

  /**
   * Получение основного изображения товара
   */
  async getPrimaryProductImage(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Некорректный ID товара" });
      }

      const filename = await imageService.getPrimaryProductImage(productId);
      if (!filename) {
        return res.status(404).json({ error: "Основное изображение не найдено" });
      }

      res.json({
        success: true,
        filename,
        url: `/api/images/${filename}`
      });
    } catch (error) {
      console.error("Ошибка получения основного изображения:", error);
      res.status(500).json({ error: "Ошибка получения основного изображения" });
    }
  }

  /**
   * Получение списка всех изображений
   */
  async getAllImages(req: Request, res: Response) {
    try {
      const images = await imageService.getAllImages();
      res.json({ success: true, images });
    } catch (error) {
      console.error("Ошибка получения списка изображений:", error);
      res.status(500).json({ error: "Ошибка получения списка изображений" });
    }
  }

  /**
   * Миграция изображений из файловой системы в базу данных
   */
  async migrateImages(req: Request, res: Response) {
    try {
      const uploadsDir = path.join(process.cwd(), "server/uploads");
      const result = await imageService.migrateFromFileSystem(uploadsDir);

      res.json({
        success: true,
        migrated: result.migrated,
        errors: result.errors,
        message: `Мигрировано ${result.migrated} изображений${result.errors.length > 0 ? `, ошибок: ${result.errors.length}` : ''}`
      });
    } catch (error) {
      console.error("Ошибка миграции изображений:", error);
      res.status(500).json({ error: "Ошибка миграции изображений" });
    }
  }
}

export const imageController = new ImageController();