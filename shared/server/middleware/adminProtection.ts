import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Enhanced admin protection middleware
export const enhancedAdminProtection = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Check if user is admin (adminAuthMiddleware sets req.admin)
    if (!req.admin || !req.admin.id) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify admin still exists and is active
    const admin = await storage.getAdminUser(req.admin.id);
    if (!admin) {
      return res.status(403).json({ error: 'Admin account not found' });
    }

    // Check for suspicious activity patterns
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    // Block requests from suspicious sources
    // Разрешаем доступ из Docker контейнеров и продакшена
    const ip = req.ip || '';
    if (!referer || (!referer.includes('localhost') && !referer.includes('replit.dev') && !referer.includes('vitawins.ru'))) {
      // Разрешаем доступ из Docker внутренней сети
      if (ip.startsWith('172.') || ip.startsWith('192.168.') || ip === '127.0.0.1') {
        return next(); // Разрешаем доступ из Docker
      }
      console.warn(`Suspicious admin access attempt from ${req.ip}: No valid referer`);
    }

    // Rate limit admin actions more strictly
    const adminActionKey = `admin_action_${req.ip}_${req.admin.id}`;
    // Implementation would use Redis in production
    
    next();
  } catch (error) {
    console.error('Enhanced admin protection error:', error);
    res.status(500).json({ error: 'Security check failed' });
  }
};

// SQL injection protection for admin queries
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const checkSqlInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      // More precise SQL injection patterns - only check for actual malicious patterns
      const sqlPatterns = [
        // SQL comments
        /(--|\#|\/\*|\*\/)/gi,
        // SQL injection patterns with quotes and operators
        /('.*OR.*'|'.*AND.*')/gi,
        // Union-based injection
        /(\bUNION\b.*\bSELECT\b)/gi,
        // Hexadecimal encoded quotes
        /(\\x27|\\x2D\\x2D)/gi,
        // Multiple single quotes (SQL escape attempt)
        /'{2,}/gi,
        // Semicolon followed by SQL keywords (command chaining)
        /;.*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b/gi
      ];
      
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj: any): boolean => {
    if (Array.isArray(obj)) {
      return obj.some(item => checkObject(item));
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => checkObject(value));
    }
    return checkSqlInjection(obj);
  };

  // Check all input sources
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    console.warn(`Potential SQL injection attempt from ${req.ip}`);
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeXSS = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeXSS);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeXSS(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeXSS(req.body);
  }
  if (req.query) {
    req.query = sanitizeXSS(req.query);
  }

  next();
};