import { Request, Response } from 'express';
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
      
      // Используем imageService для сохранения файла на диск
      const fileName = await imageService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Возвращаем URL для API endpoint
      const publicUrl = `/api/uploads/${fileName}`;

      res.json({
        success: true,
        imageUrl: publicUrl,
        url: publicUrl,
        path: fileName,
        filename: fileName
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

      // Используем imageService для удаления
      const success = await imageService.deleteImage(path);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Image not found or could not be deleted' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Server error during deletion' });
    }
  }
}

export const uploadController = new UploadController();