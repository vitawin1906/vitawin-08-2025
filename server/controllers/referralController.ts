import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { REFERRAL_CONSTANTS, validateReferralCode, calculateReferralDiscount } from "@shared/referral-constants";
import { notifyNewReferral } from "./advancedAIController";

// Validation schemas
const applyReferralSchema = z.object({
  referral_code: z.string().min(1, "Referral code is required").max(20),
});

const validateReferralSchema = z.object({
  referralCode: z.string().min(1, "Referral code is required").max(20),
});

class ReferralController {
  async getStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to view referral statistics",
        });
      }

      const stats = await storage.getReferralStats(req.user.id);

      res.json({
        success: true,
        referral_stats: {
          referral_code: stats.referral_code,
          total_referrals: stats.total_referrals,
          total_earnings: stats.total_earnings,
          pending_rewards: stats.pending_rewards,
          recent_referrals: stats.recent_referrals.map(referral => ({
            id: referral.id,
            user_id: referral.user_id,
            reward_earned: referral.reward_earned,
            order_id: referral.order_id,
            created_at: referral.created_at,
          })),
        },
      });

    } catch (error) {
      console.error("Get referral stats error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch referral statistics. Please try again.",
      });
    }
  }

  async applyReferralCode(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to apply a referral code",
        });
      }

      // Validate request body
      console.log('Request body:', req.body);
      
      // Support both referralCode and referral_code for compatibility
      const referralCode = req.body.referralCode || req.body.referral_code;
      
      if (!referralCode || typeof referralCode !== 'string' || referralCode.trim().length === 0) {
        return res.status(400).json({
          error: "Invalid request data",
          message: "Please provide a valid referral code",
        });
      }

      const referral_code = referralCode.trim();

      console.log('Applying referral code:', referral_code);

      // Реферальный код = Telegram ID, поэтому ищем пользователя по referral_code
      const referrer = await storage.getUserByReferralCode(referral_code);
      
      console.log('Found referrer:', referrer ? `User ID ${referrer.id}` : 'Not found');
      
      if (!referrer) {
        return res.status(404).json({
          error: "Invalid referral code",
          message: "Referral code not found. Please check and try again.",
        });
      }

      // Проверяем, что пользователь не применяет свой собственный код
      if (referrer.id === req.user.id) {
        return res.status(400).json({
          error: "Invalid operation",
          message: "You cannot use your own referral code",
        });
      }

      // Check if user already has an applied referral code
      if (req.user.applied_referral_code) {
        return res.status(400).json({
          error: "Referral code already applied",
          message: "You have already applied a referral code and cannot change it",
        });
      }



      // Update user with referrer ID and applied referral code
      const updatedUser = await storage.updateUser(req.user.id, {
        referrer_id: referrer.id,
        applied_referral_code: referral_code,
      } as any);

      if (!updatedUser) {
        return res.status(500).json({
          error: "Update failed",
          message: "Failed to apply referral code. Please try again.",
        });
      }

      // Отправляем уведомления всей цепочке рефереров о новом реферале
      try {
        await notifyNewReferral(updatedUser);
        console.log(`✅ Уведомления о новом реферале ${updatedUser.name} отправлены`);
      } catch (error) {
        console.error('Ошибка отправки уведомлений о реферале:', error);
        // Не прерываем выполнение, если уведомления не отправились
      }

      res.json({
        success: true,
        message: "Referral code applied successfully! You now get 10% discount on all purchases.",
        discount_percentage: 10,
        referrer: {
          first_name: referrer.first_name,
          username: referrer.username,
        },
      });

    } catch (error) {
      console.error("Apply referral code error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to apply referral code. Please try again.",
      });
    }
  }

  async getReferralHistory(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to view referral history",
        });
      }

      const referrals = await storage.getReferralsByUser(req.user.id);

      // Get user details for each referral
      const referralHistory = await Promise.all(
        referrals.map(async (referral) => {
          const referredUser = await storage.getUser(referral.user_id);
          const order = referral.order_id ? await storage.getOrder(referral.order_id) : null;

          return {
            id: referral.id,
            referred_user: referredUser ? {
              first_name: referredUser.first_name,
              username: referredUser.username,
            } : null,
            reward_earned: referral.reward_earned,
            order_total: order ? order.total : null,
            created_at: referral.created_at,
          };
        })
      );

      res.json({
        success: true,
        referral_history: referralHistory,
        summary: {
          total_referrals: referrals.length,
          total_rewards: referrals.reduce((sum, r) => sum + parseFloat(r.reward_earned || '0'), 0).toFixed(2),
        },
      });

    } catch (error) {
      console.error("Get referral history error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch referral history. Please try again.",
      });
    }
  }

  async generateNewReferralCode(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to generate a new referral code",
        });
      }

      // Generate new unique referral code
      let newCode: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        newCode = generateReferralCode();
        const existingUser = await storage.getUserByReferralCode(newCode);
        if (!existingUser) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        return res.status(500).json({
          error: "Code generation failed",
          message: "Failed to generate a unique referral code. Please try again.",
        });
      }

      // Update user with new referral code
      const updatedUser = await storage.updateUser(req.user.id, {
        referral_code: newCode
      } as any);

      if (!updatedUser) {
        return res.status(500).json({
          error: "Update failed",
          message: "Failed to update referral code. Please try again.",
        });
      }

      res.json({
        success: true,
        message: "New referral code generated successfully",
        referral_code: newCode,
      });

    } catch (error) {
      console.error("Generate referral code error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to generate new referral code. Please try again.",
      });
    }
  }

  async validateReferralCode(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to validate referral code",
        });
      }

      const validation = validateReferralSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input",
          message: validation.error.errors[0]?.message || "Invalid referral code format",
        });
      }

      const { referralCode } = validation.data;

      // Проверяем существование реферального кода
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(400).json({
          error: "invalid_code",
          message: "Промокод не найден или недействителен",
        });
      }

      // Проверяем, не пытается ли пользователь использовать свой собственный код
      if (referrer.id === req.user.id) {
        return res.status(400).json({
          error: "own_code",
          message: "Нельзя использовать свой промокод, используйте промокод того кто вас пригласил",
        });
      }

      // Код валиден
      res.json({
        success: true,
        message: "Промокод действителен",
        referrer_name: referrer.first_name,
      });

    } catch (error) {
      console.error("Validate referral code error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Ошибка проверки промокода. Попробуйте еще раз.",
      });
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

export const referralController = new ReferralController();
