import { Request, Response } from "express";
import * as productImagesStorage from "../storage/productsStorage.ts";
import { z } from "zod";

const uploadImageSchema = z.object({
  is_primary: z.coerce.boolean().optional(),
  display_order: z.coerce.number().optional(),
  alt_text: z.string().optional(),
});

const productIdSchema = z.object({ productId: z.coerce.number() });
const imageIdSchema = z.object({ imageId: z.coerce.number() });

export class ProductImagesController {
  async uploadImage(req: Request, res: Response) {
    try {
      const productId = Number(req.params.productId);
      if (isNaN(productId)) return res.status(400).json({ error: "Некорректный ID товара" });
      if (!req.file || !(req.file as any).path || !(req.file as any).filename) {
        return res.status(400).json({ error: "Файл не загружен" });
      }
      const validation = uploadImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Некорректные параметры", details: validation.error.errors });
      }

      // req.file.path — CDN url, req.file.filename — cloudinary public_id
      const { path: url, filename: cloudinary_public_id } = req.file as any;
      const { is_primary = false, display_order = 0, alt_text } = validation.data;

      const image = await productImagesStorage.addProductImage(productId, {
        url,
        is_primary,
        alt_text,
        cloudinary_public_id, // сохраняем для удаления!
      });

      res.json({ success: true, image });
    } catch (error) {
      res.status(500).json({ error: "Ошибка загрузки изображения" });
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const parsed = imageIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Некорректный ID изображения" });

      // Найти картинку в базе, чтобы удалить из Cloudinary
      const image = await productImagesStorage.getProductImageById(parsed.data.imageId);
      if (!image) return res.status(404).json({ error: "Изображение не найдено" });

      // Удаляем из Cloudinary, если есть public_id
      if (image.cloudinary_public_id) {
        const { cloudinary } = await import("../config/cloudinary");
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      }

      const deleted = await productImagesStorage.deleteProductImage(parsed.data.imageId);
      if (!deleted) return res.status(404).json({ error: "Изображение не найдено" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления изображения" });
    }
  }

  async getProductImages(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Некорректный ID товара" });
      const images = await productImagesStorage.getProductImages(parsed.data.productId);
      res.json({ success: true, images });
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения изображений товара" });
    }
  }

  async getPrimaryProductImage(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Некорректный ID товара" });
      const image = await productImagesStorage.getPrimaryProductImage(parsed.data.productId);
      if (!image) return res.status(404).json({ error: "Основное изображение не найдено" });
      res.json({ success: true, image });
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения основного изображения" });
    }
  }
}

export const productImagesController = new ProductImagesController();
