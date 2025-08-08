import { Request, Response } from "express";
import { imageService } from "../services/imageService";
import { z } from "zod";

// Валидация для загрузки изображения
const uploadImageSchema = z.object({
  product_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  is_primary: z.string().optional().transform(val => val === 'true'),
  display_order: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

// Валидация ID продукта
const productIdSchema = z.object({
  productId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid product ID");
    return num;
  })
});

// Валидация имени файла
const filenameSchema = z.object({
  filename: z.string().min(1)
});

export class ImageController {
  /**
   * Загрузка изображения через API
   */
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Файл не предоставлен" });
      }

      const validationResult = uploadImageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Некорректные параметры",
          details: validationResult.error.errors
        });
      }

      const { product_id, is_primary, display_order } = validationResult.data;

      const filename = await imageService.uploadImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          product_id,
          is_primary || false,
          display_order || 0
      );

      res.json({
        success: true,
        filename,
        url: `/api/uploads/${filename}`,
        imageUrl: `/api/uploads/${filename}`,
        product_id: product_id || null
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
      const validationResult = filenameSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Некорректное имя файла",
          details: validationResult.error.errors
        });
      }

      const { filename } = validationResult.data;
      const image = await imageService.getImage(filename);

      if (!image) {
        return res.status(404).json({ error: "Изображение не найдено" });
      }

      res.set({
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=31536000', // Кэш на год
        'Content-Length': image.buffer.length.toString()
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
      const validationResult = filenameSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Некорректное имя файла",
          details: validationResult.error.errors
        });
      }

      const { filename } = validationResult.data;
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
      const validationResult = productIdSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Некорректный ID товара",
          details: validationResult.error.errors
        });
      }

      const { productId } = validationResult.data;
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
      const validationResult = productIdSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Некорректный ID товара",
          details: validationResult.error.errors
        });
      }

      const { productId } = validationResult.data;
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
   * Синхронизация изображений между файловой системой и БД
   */
  async syncImages(req: Request, res: Response) {
    try {
      const result = await imageService.syncWithFileSystem();

      res.json({
        success: true,
        synced: result.synced,
        errors: result.errors,
        message: `Синхронизировано ${result.synced} изображений${result.errors.length > 0 ? `, ошибок: ${result.errors.length}` : ''}`
      });
    } catch (error) {
      console.error("Ошибка синхронизации изображений:", error);
      res.status(500).json({ error: "Ошибка синхронизации изображений" });
    }
  }
}

export const imageController = new ImageController();