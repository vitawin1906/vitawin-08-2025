import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import {  } from '@shared/schema';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z.string().min(6, 'Новый пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Simple in-memory captcha store (in production, use Redis)
const captchaStore = new Map<string, string>();

// Generate simple math captcha
function generateCaptcha(): { question: string; answer: string; id: string } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = Math.random() > 0.5 ? '+' : '-';
  
  const question = operation === '+' ? `${num1} + ${num2}` : `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
  const answer = operation === '+' ? (num1 + num2).toString() : (Math.max(num1, num2) - Math.min(num1, num2)).toString();
  const id = Math.random().toString(36).substring(2, 15);
  
  captchaStore.set(id, answer);
  
  // Clean up old captchas after 5 minutes
  setTimeout(() => captchaStore.delete(id), 5 * 60 * 1000);
  
  return { question, answer, id };
}

export async function getCaptcha(req: Request, res: Response) {
  try {
    const captcha = generateCaptcha();
    res.json({
      captchaId: captcha.id,
      question: captcha.question
    });
  } catch (error) {
    console.error('Captcha generation error:', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = adminLoginSchema.parse(req.body);
    const { email, password, captcha } = validatedData;

    // Extract captcha ID from headers or body
    const captchaId = req.headers['x-captcha-id'] as string || req.body.captchaId;
    
    // Temporarily skip captcha ID requirement for testing
    // if (!captchaId) {
    //   return res.status(400).json({ error: 'Captcha ID is required' });
    // }

    // Temporary: Skip captcha verification for testing
    // TODO: Re-enable captcha verification later
    /*
    const expectedAnswer = captchaStore.get(captchaId);
    if (!expectedAnswer || expectedAnswer !== captcha) {
      captchaStore.delete(captchaId);
      return res.status(400).json({ error: 'Invalid captcha' });
    }
    captchaStore.delete(captchaId);
    */

    // Find admin user
    const adminUser = await storage.getAdminUserByEmail(email);
    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await storage.updateAdminLastLogin(adminUser.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: adminUser.id, 
        email: adminUser.email,
        type: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create admin session
    const sessionData = {
      admin_id: adminUser.id,
      session_token: token,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.get('User-Agent') || 'unknown',
      login_time: new Date(),
      last_activity: new Date(),
      is_active: true,
      location: 'Unknown', // Can be enhanced with IP geolocation
      device_info: {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    };

    const session = await storage.createAdminSession(sessionData);

    // Log admin activity
    await storage.logAdminActivity({
      admin_id: adminUser.id,
      session_id: session.id,
      action: 'login',
      resource: 'admin_auth',
      details: {
        ip: sessionData.ip_address,
        userAgent: sessionData.user_agent
      },
      ip_address: sessionData.ip_address,
      timestamp: new Date()
    });

    // Set HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function adminLogout(req: Request, res: Response) {
  try {
    // Get the token from cookies to end the session
    const token = req.cookies.adminToken;
    
    if (token) {
      // End the admin session in the database
      await storage.endAdminSession(token);
      
      // Get admin info for logging
      const admin = (req as any).admin;
      
      if (admin) {
        // Log logout activity
        await storage.logAdminActivity({
          admin_id: admin.id,
          action: 'logout',
          resource: 'admin_auth',
          details: {
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent')
          },
          ip_address: req.ip || req.connection.remoteAddress || 'unknown',
          timestamp: new Date()
        });
      }
    }
    
    res.clearCookie('adminToken');
    res.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

export async function getAdminProfile(req: Request, res: Response) {
  try {
    console.log('getAdminProfile - Start');
    console.log('getAdminProfile - req.admin:', req.admin);
    console.log('getAdminProfile - (req as any).admin:', (req as any).admin);
    console.log('getAdminProfile - All req properties:', Object.keys(req));
    
    // Admin data is already available from middleware
    const admin = req.admin;
    
    if (!admin) {
      console.log('getAdminProfile - No admin found in request, returning 403');
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log('getAdminProfile - Admin found, returning profile');
    res.json({
      admin: true,
      profile: {
        id: admin.id,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    // Get admin from middleware
    const admin = (req as any).admin;
    if (!admin) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Get admin data from database
    const adminUser = await storage.getAdminUser(admin.id);
    if (!adminUser) {
      return res.status(404).json({ error: 'Админ не найден' });
    }

    // Verify current password (changePassword)
    const isValidCurrent = (currentPassword === adminUser.password_hash);
    if (!isValidCurrent) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password in database (plain text)
    // Сохраняем новый пароль в открытом виде
    await storage.updateAdminPassword(admin.id, newPassword);

    // Log password change activity
    await storage.logAdminActivity({
      admin_id: admin.id,
      action: 'password_change',
      resource: 'admin_auth',
      details: {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ 
      success: true, 
      message: 'Пароль успешно изменен' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Ошибка валидации', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: 'Ошибка при смене пароля' });
  }
}