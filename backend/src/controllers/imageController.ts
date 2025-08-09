// controllers/imageController.ts
import { Request, Response } from "express";
import { z } from "zod";
import {
  addProductImage,
  getProductImageById,
  getProductImages,
  deleteProductImage,
} from "../storage/productsStorage.js";

const uploadImageSchema = z.object({
  is_primary: z.coerce.boolean().optional(),
  display_order: z.coerce.number().int().min(1).max(4).optional(), // -> position
  alt_text: z.string().optional(),
});

const productIdSchema = z.object({ productId: z.coerce.number().int().positive() });
const imageIdSchema = z.object({ imageId: z.coerce.number().int().positive() });

export class ProductImagesController {
  // POST /api/products/:productId/images
  async uploadImage(req: Request, res: Response) {
    try {
      const parsedId = productIdSchema.safeParse(req.params);
      if (!parsedId.success) return res.status(400).json({ error: "Некорректный ID товара" });

      const file = req.file as Express.Multer.File | undefined;
      if (!file?.path || !file?.filename) {
        return res.status(400).json({ error: "Файл не загружен" });
      }

      const parsedBody = uploadImageSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: "Некорректные параметры", details: parsedBody.error.format() });
      }

      const { path: url, filename: cloudinary_public_id } = file as any;
      const { is_primary = false, display_order, alt_text } = parsedBody.data;
      const position = display_order ?? 1; // position обязателен в схеме 1..4

      const image = await addProductImage(parsedId.data.productId, {
        url,
        alt_text,
        cloudinary_public_id,
        is_primary,
        position,
      });

      res.json({ success: true, image });
    } catch {
      res.status(500).json({ error: "Ошибка загрузки изображения" });
    }
  }

  // DELETE /api/products/images/:imageId
  async deleteImage(req: Request, res: Response) {
    try {
      const parsed = imageIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Некорректный ID изображения" });

      const image = await getProductImageById(parsed.data.imageId);
      if (!image) return res.status(404).json({ error: "Изображение не найдено" });

      if (image.cloudinary_public_id) {
        const { cloudinary } = await import("../../config/cloudinary.js");
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      }

      const deleted = await deleteProductImage(parsed.data.imageId);
      if (!deleted) return res.status(404).json({ error: "Изображение не найдено" });

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Ошибка удаления изображения" });
    }
  }

  // GET /api/products/:productId/images
  async getProductImages(req: Request, res: Response) {
    try {
      const parsed = productIdSchema.safeParse(req.params);
      if (!parsed.success) return res.status(400).json({ error: "Некорректный ID товара" });

      const images = await getProductImages(parsed.data.productId);
      res.json({ success: true, images });
    } catch {
      res.status(500).json({ error: "Ошибка получения изображений товара" });
    }
  }
}

export const productImagesController = new ProductImagesController();
