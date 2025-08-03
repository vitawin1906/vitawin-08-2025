import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        email: string;
      };
    }
  }
}

export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log('Admin auth middleware called for:', req.method, req.path);
  try {
    const adminToken = req.cookies.adminToken || req.headers.authorization?.replace('Bearer ', '');
    const authToken = req.cookies.authToken;
    console.log('Admin auth middleware - AdminToken received:', adminToken ? 'Yes' : 'No');
    console.log('Admin auth middleware - AuthToken received:', authToken ? 'Yes' : 'No');
    console.log('Admin auth middleware - All cookies:', req.cookies);
    console.log('Admin auth middleware - Authorization header:', req.headers.authorization ? 'Yes' : 'No');
    
    // Try admin token first
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
        console.log('Admin auth middleware - AdminToken decoded:', { adminId: decoded.adminId, type: decoded.type });
        
        if (decoded.type === 'admin') {
          const adminUser = await storage.getAdminUser(decoded.adminId);
          console.log('Admin auth middleware - Admin user found via adminToken:', adminUser ? 'Yes' : 'No');
          
          if (adminUser) {
            req.admin = {
              id: adminUser.id,
              email: adminUser.email
            };
            console.log('Admin auth middleware - Success via adminToken, admin:', req.admin.email);
            return next();
          }
        }
      } catch (error) {
        console.log('Admin auth middleware - AdminToken verification failed:', error.message);
      }
    }
    
    // Try auth token (for Telegram users with admin privileges)
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET) as any;
        console.log('Admin auth middleware - AuthToken decoded:', { userId: decoded.userId, telegramId: decoded.telegramId });
        
        // Check if this Telegram user has admin privileges (ID 131632979)
        if (decoded.telegramId === 131632979) {
          const adminUser = await storage.getAdminUserByEmail('dorosh21@gmail.com');
          console.log('Admin auth middleware - Admin user found via telegramId:', adminUser ? 'Yes' : 'No');
          
          if (adminUser) {
            req.admin = {
              id: adminUser.id,
              email: adminUser.email
            };
            console.log('Admin auth middleware - Success via telegramId, admin:', req.admin.email);
            return next();
          }
        }
      } catch (error) {
        console.log('Admin auth middleware - AuthToken verification failed:', error.message);
      }
    }

    console.log('Admin auth middleware - No valid admin authentication found');
    return res.status(401).json({ error: 'Admin authentication required' });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}