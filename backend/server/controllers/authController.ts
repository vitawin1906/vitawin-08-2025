import { Request, Response } from "express";
import { storage } from "../storage/storage/storage";
import { verifyTelegramAuth } from "../utils/telegram";
import { generateJWT } from "../middleware/auth";
import { TelegramAuthData } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { telegramNotificationService } from "../services/telegramNotificationService";
import { notifyNewReferral } from "./advancedAIController";

// Validation schemas
const telegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

class AuthController {
  // Новый endpoint для генерации токена авторизации через бота
  async telegramBotLogin(req: Request, res: Response) {
    try {
      const { telegram_id, first_name, username } = req.body;

      if (!telegram_id || !first_name) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: telegram_id and first_name"
        });
      }

      // Найти или создать пользователя
      let user = await storage.getUserByTelegramId(telegram_id);
      
      if (!user) {
        // Создать нового пользователя
        user = await storage.createUser({
          telegram_id: telegram_id,
          first_name: first_name,
          username: username,
          referral_code: telegram_id.toString(),
          is_admin: false,
          last_login: new Date() // Устанавливаем время первого входа
        });
      } else {
        // Обновить данные существующего пользователя
        user = await storage.updateUser(user.id, {
          first_name: first_name,
          username: username,
          referral_code: telegram_id.toString()
        });
      }

      if (!user) {
        return res.status(500).json({
          success: false,
          error: "Failed to create or update user"
        });
      }

      // Генерируем JWT токен
      const authToken = jwt.sign(
        { userId: user.id, telegramId: user.telegram_id },
        process.env.JWT_SECRET || "vitawin_jwt_secret_key_production_2025_secure",
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        authToken: authToken,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code,
          balance: parseFloat(user.balance || '0'),
          is_admin: user.is_admin
        }
      });

    } catch (error) {
      console.error('Telegram bot login error:', error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  async telegramAutoAuth(req: Request, res: Response) {
    try {
      const { id, first_name, username } = req.body;

      if (!id || !first_name) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "id and first_name are required"
        });
      }

      // Найти или создать пользователя
      let user = await storage.getUserByTelegramId(id);
      
      if (!user) {
        // Создать нового пользователя с правилом: referral_code = telegram_id
        user = await storage.createUser({
          telegram_id: id,
          first_name: first_name,
          username: username,
          referral_code: id.toString(), // Реферальный код = Telegram ID
          is_admin: false,
          last_login: new Date() // Устанавливаем время первого входа
        });
      } else {
        // Обновить данные существующего пользователя
        // Убедиться, что referral_code = telegram_id
        user = await storage.updateUser(user.id, {
          first_name: first_name,
          username: username,
          referral_code: id.toString(), // Обеспечиваем соответствие правилу
          last_login: new Date() // Обновляем время последнего входа
        });
      }

      if (!user) {
        return res.status(500).json({
          error: "User creation failed",
          message: "Failed to create or update user"
        });
      }

      // Создать сессию
      const sessionToken = jwt.sign(
        { userId: user.id, telegramId: user.telegram_id },
        process.env.JWT_SECRET || "vitawin_jwt_secret_key_production_2025_secure",
        { expiresIn: '30d' }
      );

      // Устанавливаем cookie для совместимости с middleware
      res.cookie('authToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
      });

      res.json({
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          name: user.first_name,
          username: user.username,
          telegramId: user.telegram_id,
          referralCode: user.referral_code,
          role: user.is_admin ? 'admin' : 'user',
          balance: parseFloat(user.balance || '0')
        }
      });

    } catch (error) {
      console.error('Auto auth error:', error);
      res.status(500).json({
        error: "Authentication failed",
        message: "Internal server error during authentication"
      });
    }
  }

  async telegramAuth(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult = telegramAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          message: "Please provide valid Telegram authentication data",
          details: validationResult.error.errors,
        });
      }

      const telegramData: TelegramAuthData = validationResult.data;

      // Verify Telegram authentication signature
      const isValid = await verifyTelegramAuth(telegramData);
      if (!isValid) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid Telegram authentication signature",
        });
      }

      // Check if user already exists
      let user = await storage.getUserByTelegramId(telegramData.id);

      if (!user) {
        // Реферальный код = Telegram ID пользователя
        const referralCode = telegramData.id.toString();
        
        // Create new user
        user = await storage.createUser({
          telegram_id: telegramData.id,
          first_name: telegramData.first_name,
          username: telegramData.username || null,
          referral_code: referralCode,
          referrer_id: null,
          is_admin: false,
          last_login: new Date() // Устанавливаем время первого входа,
        });
      } else {
        // Update existing user with latest Telegram data
        user = await storage.updateUser(user.id, {
          first_name: telegramData.first_name,
          username: telegramData.username || user.username,
        }) || user;
      }

      // Generate JWT token
      const token = generateJWT({
        userId: user.id,
        telegramId: user.telegram_id,
      });

      // Create session record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await storage.createSession({
        user_id: user.id,
        session_token: token,
        telegram_data: telegramData,
        expires_at: expiresAt,
      });

      // Return success response
      res.json({
        success: true,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code,
          is_admin: user.is_admin,
          balance: parseFloat(user.balance || '0'),
        },
        token,
      });

    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({
        error: "Authentication error",
        message: "An error occurred during authentication. Please try again.",
      });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Not authenticated",
          message: "User information not available",
        });
      }

      // Get referral statistics
      const referralStats = await storage.getReferralStats(req.user.id);

      res.json({
        id: req.user.id,
        telegram_id: req.user.telegram_id,
        first_name: req.user.first_name,
        username: req.user.username,
        referral_code: req.user.referral_code,
        applied_referral_code: req.user.applied_referral_code,
        is_admin: req.user.is_admin,
        created_at: req.user.created_at,
        balance: parseFloat(req.user.balance || '0'),
        referral_stats: referralStats,
      });

    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch user information. Please try again.",
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        await storage.deleteSession(token);
      }

      res.json({
        success: true,
        message: "Successfully logged out",
      });

    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "Logout error",
        message: "An error occurred during logout. Please try again.",
      });
    }
  }

  async applyReferralCode(req: Request, res: Response) {
    try {
      const { referralCode } = req.body;
      const userId = (req as any).user.userId;

      if (!referralCode) {
        return res.status(400).json({
          error: "Referral code is required",
          message: "Укажите реферальный код"
        });
      }

      // Получить текущего пользователя
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({
          error: "User not found",
          message: "Пользователь не найден"
        });
      }

      // Проверка 1: Пользователь уже применил реферальный код
      if (currentUser.applied_referral_code) {
        return res.status(400).json({
          error: "Referral code already applied",
          message: "Вы уже применили реферальный код ранее",
          appliedCode: currentUser.applied_referral_code
        });
      }

      // Проверка 2: Пользователь пытается применить свой собственный код (антифрод)
      if (referralCode === currentUser.referral_code) {
        return res.status(400).json({
          error: "Self-referral not allowed",
          message: "Нельзя применить свой собственный реферальный код"
        });
      }

      // Найти пользователя с таким реферальным кодом
      const referrerUser = await storage.getUserByReferralCode(referralCode);
      if (!referrerUser) {
        return res.status(404).json({
          error: "Invalid referral code",
          message: "Реферальный код не найден"
        });
      }

      // Применить реферальный код (сохранить навсегда)
      const updatedUser = await storage.updateUser(userId, {
        applied_referral_code: referralCode,
        referrer_id: referrerUser.id
      });

      if (!updatedUser) {
        return res.status(500).json({
          error: "Failed to apply referral code",
          message: "Не удалось применить реферальный код"
        });
      }

      res.json({
        success: true,
        message: "Реферальный код успешно применен! Теперь вы получите скидку 10% на первую покупку",
        appliedCode: referralCode,
        discount: "10%"
      });

    } catch (error) {
      console.error('Apply referral code error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Произошла ошибка при применении реферального кода"
      });
    }
  }

  async telegramAutoLogin(req: Request, res: Response) {
    try {
      const { token } = req.params;
      
      // Проверяем токен в базе данных
      const session = await storage.getSession(token);
      if (!session || session.expires_at < new Date()) {
        return res.redirect('/login?error=invalid_token');
      }

      // Получаем пользователя
      const user = await storage.getUser(session.user_id);
      if (!user) {
        return res.redirect('/login?error=user_not_found');
      }

      // Генерируем JWT токен для сессии
      const jwtToken = generateJWT({ userId: user.id });
      
      // Устанавливаем cookie
      res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
      });

      // Удаляем одноразовый токен
      await storage.deleteSession(token);

      // Перенаправляем в личный кабинет
      res.redirect('/account');
    } catch (error) {
      console.error('Auto login error:', error);
      res.redirect('/login?error=auth_failed');
    }
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const authController = new AuthController();
