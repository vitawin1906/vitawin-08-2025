import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { User } from "@shared/schema";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

export interface JWTPayload {
  userId: number;
  telegramId: number;
  iat?: number;
  exp?: number;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    
    // Проверяем Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
    
    // Если токена нет в header, проверяем cookies
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({ 
        error: "Session expired", 
        message: "Your session has expired. Please log in again." 
      });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      if (!payload.userId) {
        return res.status(401).json({ 
          error: "Invalid token", 
          message: "Token does not contain valid user information" 
        });
      }

      // Get user from database to ensure they still exist and are active
      const user = await storage.getUser(payload.userId);
      
      if (!user) {
        return res.status(401).json({ 
          error: "User not found", 
          message: "The user associated with this token no longer exists" 
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          error: "Token expired", 
          message: "Your authentication token has expired. Please log in again" 
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          error: "Invalid token", 
          message: "The provided authentication token is invalid" 
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      error: "Authentication error", 
      message: "An error occurred while verifying your authentication. Please try again" 
    });
  }
}

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated (should be ensured by authMiddleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "You must be logged in to access this resource" 
      });
    }

    // Check if user has admin privileges
    if (!req.user.is_admin) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "You do not have administrator privileges to access this resource" 
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ 
      error: "Authorization error", 
      message: "An error occurred while verifying your permissions. Please try again" 
    });
  }
}

export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: "7d" // Token expires in 7 days
  });
}

export function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// Опциональный middleware для корзины - не блокирует запрос при отсутствии токена
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    
    // Проверяем Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // Если токена нет в header, проверяем cookies
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        if (payload.userId) {
          // Get user from database
          const user = await storage.getUser(payload.userId);
          if (user) {
            req.user = user;
          }
        }
      } catch (jwtError) {
        // Игнорируем ошибки JWT для опционального middleware
        console.log('Optional auth middleware: Invalid token, proceeding without user');
      }
    }

    // Всегда продолжаем выполнение независимо от наличия пользователя
    next();

  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Продолжаем выполнение даже при ошибках
    next();
  }
}

// Combined middleware that handles both admin tokens and regular auth tokens
export async function optionalAdminOrUserAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // First try admin token
    const adminToken = req.cookies?.adminToken;
    
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
        
        if (decoded.adminId) {
          const admin = await storage.getAdminUser(decoded.adminId);
          
          if (admin) {
            (req as any).admin = admin;
            req.user = { id: admin.id, is_admin: true } as any;
            return next();
          }
        }
      } catch (adminError) {
        // Continue to try regular auth token
      }
    }

    // Then try regular auth token
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
        
        if (payload.userId) {
          const user = await storage.getUser(payload.userId);
          if (user) {
            req.user = user;
          }
        }
      } catch (jwtError) {
        // Continue without user info
      }
    }

    next();
  } catch (error) {
    console.error("Combined auth middleware error:", error);
    next();
  }
}
