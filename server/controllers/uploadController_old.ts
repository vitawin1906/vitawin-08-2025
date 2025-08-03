import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { eq } from 'drizzle-orm';
import { db } from '../storage';
import { uploadedImages } from '@shared/schema';
import { imageService } from '../services/imageService';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

class UploadController {
  async uploadImage(req: MulterRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      
      // Конвертируем файл в base64
      const imageData = file.buffer.toString('base64');

      // Сохраняем в базу данных
      const [savedImage] = await db.insert(uploadedImages).values({
        filename: fileName,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
      }).returning();

      // Возвращаем URL для API endpoint
      const publicUrl = `/api/uploads/${fileName}`;

      res.json({
        success: true,
        imageUrl: publicUrl,
        url: publicUrl,
        path: fileName,
        id: savedImage.id
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Server error during upload' });
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: 'Image path is required' });
      }

      // Удаляем из базы данных
      await db.delete(uploadedImages).where(eq(uploadedImages.filename, path));

      res.json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Server error during deletion' });
    }
  }
}

export const uploadController = new UploadController();