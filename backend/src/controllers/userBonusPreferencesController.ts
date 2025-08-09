import { Request, Response } from 'express';
import { db } from '../storage/storage/storage';
import { userBonusPreferences, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Схемы валидации
const bonusPreferencesSchema = z.object({
  health_id_percentage: z.number().min(0).max(100),
  travel_percentage: z.number().min(0).max(100),
  home_percentage: z.number().min(0).max(100),
  auto_percentage: z.number().min(0).max(100),
}).refine((data) => {
  const total = data.health_id_percentage + data.travel_percentage + data.home_percentage + data.auto_percentage;
  return total === 100;
}, {
  message: "Сумма всех процентов должна равняться 100%"
});

export class UserBonusPreferencesController {
  /**
   * Получить текущие настройки пользователя
   */
  async getUserPreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Проверяем существуют ли уже настройки
      let preferences = await db.select()
        .from(userBonusPreferences)
        .where(eq(userBonusPreferences.user_id, userId))
        .limit(1);

      if (preferences.length === 0) {
        // Создаем настройки по умолчанию
        const defaultPreferences = await db.insert(userBonusPreferences)
          .values({
            user_id: userId,
            health_id_percentage: 25,
            travel_percentage: 25,
            home_percentage: 25,
            auto_percentage: 25,
            is_locked: false
          })
          .returning();
        
        preferences = defaultPreferences;
      }

      res.json({
        success: true,
        data: preferences[0]
      });

    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get user preferences'
      });
    }
  }

  /**
   * Обновить настройки пользователя
   */
  async updateUserPreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Валидируем данные
      const validationResult = bonusPreferencesSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid data',
          details: validationResult.error.errors
        });
      }

      const { health_id_percentage, travel_percentage, home_percentage, auto_percentage } = validationResult.data;

      // Проверяем заблокированы ли настройки
      const existingPreferences = await db.select()
        .from(userBonusPreferences)
        .where(eq(userBonusPreferences.user_id, userId))
        .limit(1);

      if (existingPreferences.length > 0 && existingPreferences[0].is_locked) {
        return res.status(403).json({
          error: 'Preferences locked',
          message: 'Настройки заблокированы и не могут быть изменены'
        });
      }

      // Обновляем или создаем настройки
      let updatedPreferences;
      if (existingPreferences.length > 0) {
        updatedPreferences = await db.update(userBonusPreferences)
          .set({
            health_id_percentage,
            travel_percentage,
            home_percentage,
            auto_percentage,
            updated_at: new Date()
          })
          .where(eq(userBonusPreferences.user_id, userId))
          .returning();
      } else {
        updatedPreferences = await db.insert(userBonusPreferences)
          .values({
            user_id: userId,
            health_id_percentage,
            travel_percentage,
            home_percentage,
            auto_percentage
          })
          .returning();
      }

      res.json({
        success: true,
        message: 'Настройки успешно обновлены',
        data: updatedPreferences[0]
      });

    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to update user preferences'
      });
    }
  }

  /**
   * Заблокировать настройки пользователя (админская функция)
   */
  async lockUserPreferences(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { is_locked } = req.body;

      if (!userId || typeof is_locked !== 'boolean') {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'userId and is_locked are required'
        });
      }

      const updatedPreferences = await db.update(userBonusPreferences)
        .set({
          is_locked,
          updated_at: new Date()
        })
        .where(eq(userBonusPreferences.user_id, parseInt(userId)))
        .returning();

      if (updatedPreferences.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User preferences not found'
        });
      }

      res.json({
        success: true,
        message: `Настройки пользователя ${is_locked ? 'заблокированы' : 'разблокированы'}`,
        data: updatedPreferences[0]
      });

    } catch (error) {
      console.error('Error locking user preferences:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to lock user preferences'
      });
    }
  }

  /**
   * Получить настройки всех пользователей (для админки)
   */
  async getAllUsersPreferences(req: Request, res: Response) {
    try {
      const allPreferences = await db.select({
        id: userBonusPreferences.id,
        user_id: userBonusPreferences.user_id,
        health_id_percentage: userBonusPreferences.health_id_percentage,
        travel_percentage: userBonusPreferences.travel_percentage,
        home_percentage: userBonusPreferences.home_percentage,
        auto_percentage: userBonusPreferences.auto_percentage,
        is_locked: userBonusPreferences.is_locked,
        created_at: userBonusPreferences.created_at,
        updated_at: userBonusPreferences.updated_at,
        first_name: users.first_name,
        username: users.username,
        telegram_id: users.telegram_id
      })
      .from(userBonusPreferences)
      .leftJoin(users, eq(userBonusPreferences.user_id, users.id));

      res.json({
        success: true,
        data: allPreferences
      });

    } catch (error) {
      console.error('Error getting all users preferences:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get all users preferences'
      });
    }
  }
}

export const userBonusPreferencesController = new UserBonusPreferencesController();