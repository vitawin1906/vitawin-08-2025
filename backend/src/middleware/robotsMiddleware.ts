import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const robotsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if the request is for an admin route
  const isAdminRoute = req.path.startsWith('/admin') || 
                      req.path.startsWith('/checkout') ||
                      req.path.startsWith('/order-success') ||
                      req.path.startsWith('/checkout-success') ||
                      req.path.startsWith('/checkout-fail');

  // Only handle GET requests for HTML pages
  if (req.method !== 'GET' || req.path.includes('/api/')) {
    return next();
  }

  // If it's an admin route, we need to modify the HTML response
  if (isAdminRoute) {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      if (typeof body === 'string' && body.includes('<html')) {
        // Replace the robots meta tag with noindex for admin pages
        body = body.replace(
          /<meta name="robots" content="[^"]*"/,
          '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet"'
        );
      }
      return originalSend.call(this, body);
    };
  }

  next();
};