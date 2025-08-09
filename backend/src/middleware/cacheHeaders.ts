import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для установки заголовков кеширования
 */
export const setCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // API endpoints кешируются на короткое время
  if (req.path.startsWith('/api/')) {
    if (req.path.includes('/products')) {
      // Товары кешируются на 5 минут
      res.setHeader('Cache-Control', 'public, max-age=300');
    } else if (req.path.includes('/blog')) {
      // Блог-посты кешируются на 10 минут
      res.setHeader('Cache-Control', 'public, max-age=600');
    } else if (req.path.includes('/stats') || req.path.includes('/admin')) {
      // Статистика и админ данные кешируются на 2 минуты
      res.setHeader('Cache-Control', 'public, max-age=120');
    } else {
      // Остальные API endpoints кешируются на 1 минуту
      res.setHeader('Cache-Control', 'public, max-age=60');
    }
  } else if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    // Статические ресурсы кешируются на год
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    // HTML страницы кешируются на 5 минут
    res.setHeader('Cache-Control', 'public, max-age=300');
  }

  next();
};

/**
 * Добавляет заголовки для предотвращения кеширования
 */
export const noCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
};

/**
 * Устанавливает ETag для условного кеширования
 */
export const setETag = (data: any) => {
  const content = JSON.stringify(data);
  const hash = require('crypto').createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
};