import { Request, Response, NextFunction } from 'express';

// Simple rate limiting implementation
const requestCounts = new Map<string, { count: number; lastReset: number }>();

export const adminRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 100;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 0, lastReset: now });
  }
  
  const record = requestCounts.get(ip)!;
  
  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }
  
  record.count++;
  
  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'Too many admin requests from this IP, please try again later.' });
  }
  
  next();
};

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  
  if (!requestCounts.has(ip + '_login')) {
    requestCounts.set(ip + '_login', { count: 0, lastReset: now });
  }
  
  const record = requestCounts.get(ip + '_login')!;
  
  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }
  
  record.count++;
  
  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'Too many login attempts from this IP, please try again later.' });
  }
  
  next();
};

// Security headers middleware - ОТКЛЮЧЕНО для совместимости с Telegram Web App
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Минимальные заголовки безопасности (без CSP)
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // res.setHeader('X-Content-Type-Options', 'nosniff');
  // res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  // if (req.secure) {
  //   res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // }
  
  // Content Security Policy ПОЛНОСТЬЮ ОТКЛЮЧЕН для Telegram Web App
  // res.setHeader('Content-Security-Policy', ...);
  
  next();
};

// Admin session validation
export const validateAdminSession = async (req: any, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  // Check if session is still valid
  const sessionAge = Date.now() - (req.session.loginTime || 0);
  const maxAge = 8 * 60 * 60 * 1000; // 8 hours
  
  if (sessionAge > maxAge) {
    req.session.destroy((err: any) => {
      if (err) console.error('Session destruction error:', err);
    });
    return res.status(401).json({ error: 'Session expired' });
  }
  
  next();
};

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// IP whitelist for admin access (if needed)
export const adminIPWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (allowedIPs.length === 0) {
      return next(); // Skip if no whitelist configured
    }
    
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!allowedIPs.includes(clientIP as string)) {
      return res.status(403).json({ error: 'Access denied from this IP' });
    }
    
    next();
  };
};