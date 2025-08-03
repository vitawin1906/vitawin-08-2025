import { Express } from 'express';
import path from 'path';

export function addSimpleImageRoute(app: Express) {
  // Простой роут для прямого доступа к изображениям (без кодирования)
  app.get("/api/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log(`[DIRECT IMG] Request for: ${filename}`);
      
      // Простая проверка расширения
      if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
        return res.status(400).json({ error: 'Invalid file type' });
      }
      
      // Прямое чтение файла без декодирования
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (require('fs').existsSync(filePath)) {
        const buffer = await require('fs').promises.readFile(filePath);
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
          'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
          'bmp': 'image/bmp', 'tiff': 'image/tiff'
        };
        
        res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Length', buffer.length);
        console.log(`[DIRECT IMG] Served: ${filename}, size: ${buffer.length} bytes`);
        return res.send(buffer);
      }
      
      console.log(`[DIRECT IMG] File not found: ${filename}`);
      return res.status(404).json({ error: 'Image not found' });
    } catch (error) {
      console.error(`[DIRECT IMG] Error serving ${req.params.filename}:`, error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
}