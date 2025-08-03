import { Request, Response } from 'express';
import { imageService } from '../services/imageService';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

class UploadController {
  async uploadImage(req: MulterRequest, res: Response) {
    console.log('Upload request received, file size:', req.file?.size || 'no file');
    
    try {
      if (!req.file) {
        console.log('Upload error: No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      console.log(`Uploading file: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`);
      
      // Проверяем размер файла
      if (file.size > 10 * 1024 * 1024) {
        console.log('Upload error: File too large');
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB' });
      }
      
      // Используем imageService для сохранения файла на диск
      const fileName = await imageService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      console.log(`File uploaded successfully: ${fileName}`);

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
      if (error.message?.includes('timeout')) {
        res.status(408).json({ error: 'Upload timeout. Please try again with a smaller file.' });
      } else if (error.message?.includes('ENOSPC')) {
        res.status(507).json({ error: 'Insufficient storage space' });
      } else {
        res.status(500).json({ error: 'Server error during upload' });
      }
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