import { Request, Response } from "express";
import * as uploadedImagesStorage from "../storage/storage/storage/uploadedImagesStorage";
import { z } from "zod";

const uploadSchema = z.object({
  alt_text: z.string().optional(),
});

const imageIdSchema = z.object({ id: z.coerce.number() });

export class UploadedImagesController {
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file || !(req.file as any).path || !(req.file as any).filename) {
        return res.status(400).json({ error: "Файл не загружен" });
      }
      const valid = uploadSchema.safeParse(req.body);
      if (!valid.success) return res.status(400).json({ error: "Некорректные параметры", details: valid.error.errors });

      const { path: url, filename: cloudinary_public_id } = req.file as any;
      const { alt_text } = valid.data;

      const image = await uploadedImagesStorage.addUploadedImage({
        url,
        alt_text,
        cloudinary_public_id,
      });

      res.json({ success: true, image });
    } catch (error) {
      res.status(500).json({ error: "Ошибка загрузки изображения" });
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const valid = imageIdSchema.safeParse(req.params);
      if (!valid.success) return res.status(400).json({ error: "Некорректный ID" });

      // Получаем инфо об изображении
      const image = await uploadedImagesStorage.getUploadedImageById(valid.data.id);
      if (!image) return res.status(404).json({ error: "Изображение не найдено" });

      // Удаляем из Cloudinary (если public_id есть)
      if (image.cloudinary_public_id) {
        const { cloudinary } = await import("../config/cloudinary");
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      }

      const deleted = await uploadedImagesStorage.deleteUploadedImage(valid.data.id);
      if (!deleted) return res.status(404).json({ error: "Изображение не найдено" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления изображения" });
    }
  }

  async getAllImages(req: Request, res: Response) {
    try {
      const images = await uploadedImagesStorage.getAllUploadedImages();
      res.json({ success: true, images });
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения изображений" });
    }
  }
}

export const uploadedImagesController = new UploadedImagesController();
