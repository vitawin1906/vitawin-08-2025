import { Request, Response } from 'express';
import { mlmNetworkService, NetworkCalculationOptions } from '../services/mlmNetworkService';
import { mlmNetworkServiceSimple } from '../services/mlmNetworkServiceSimple';
import { z } from 'zod';

// Схемы валидации
const networkStatsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeInactive: z.coerce.boolean().default(false),
  maxDepth: z.coerce.number().min(1).max(16).default(16)
});

const userIdParamSchema = z.object({
  userId: z.coerce.number().min(1)
});

export class MLMNetworkController {
  
  /**
   * Получить статистику сети текущего пользователя
   */
  async getUserNetworkStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Валидируем параметры запроса
      const validationResult = networkStatsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        });
      }

      const options: NetworkCalculationOptions = {
        dateFrom: validationResult.data.dateFrom ? new Date(validationResult.data.dateFrom) : undefined,
        dateTo: validationResult.data.dateTo ? new Date(validationResult.data.dateTo) : undefined,
        includeInactive: validationResult.data.includeInactive,
        maxDepth: validationResult.data.maxDepth
      };

      const stats = await mlmNetworkService.getUserNetworkStats(userId, options);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting user network stats:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get network statistics'
      });
    }
  }

  /**
   * Получить статистику сети конкретного пользователя (для админки)
   */
  async getSpecificUserNetworkStats(req: Request, res: Response) {
    try {
      // Проверяем права администратора
      if (!req.user?.is_admin && !(req as any).admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      // Валидируем параметры
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({
          error: 'Invalid user ID',
          details: paramValidation.error.errors
        });
      }

      const queryValidation = networkStatsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.errors
        });
      }

      const userId = paramValidation.data.userId;
      const options: NetworkCalculationOptions = {
        dateFrom: queryValidation.data.dateFrom ? new Date(queryValidation.data.dateFrom) : undefined,
        dateTo: queryValidation.data.dateTo ? new Date(queryValidation.data.dateTo) : undefined,
        includeInactive: queryValidation.data.includeInactive,
        maxDepth: queryValidation.data.maxDepth
      };

      const stats = await mlmNetworkService.getUserNetworkStats(userId, options);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting specific user network stats:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get user network statistics'
      });
    }
  }

  /**
   * Получить статистику сети для всех пользователей (админка)
   */
  async getAllUsersNetworkStats(req: Request, res: Response) {
    try {
      // Проверяем права администратора
      if (!req.user?.is_admin && !(req as any).admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      // Валидируем параметры запроса
      const validationResult = networkStatsQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        });
      }

      const options: NetworkCalculationOptions = {
        dateFrom: validationResult.data.dateFrom ? new Date(validationResult.data.dateFrom) : undefined,
        dateTo: validationResult.data.dateTo ? new Date(validationResult.data.dateTo) : undefined,
        includeInactive: validationResult.data.includeInactive,
        maxDepth: validationResult.data.maxDepth
      };

      // Используем упрощенную версию для начала
      const allStats = await mlmNetworkServiceSimple.getAllUsersNetworkStats();

      // Сортируем по общему объему сети (убывание)
      const sortedStats = allStats.sort((a, b) => {
        const aTotal = a.personalVolume.totalAmount + a.groupVolume.totalAmount;
        const bTotal = b.personalVolume.totalAmount + b.groupVolume.totalAmount;
        return bTotal - aTotal;
      });

      res.json({
        success: true,
        data: sortedStats,
        summary: {
          totalUsers: sortedStats.length,
          totalPersonalVolume: sortedStats.reduce((sum, user) => sum + user.personalVolume.totalAmount, 0),
          totalGroupVolume: sortedStats.reduce((sum, user) => sum + user.groupVolume.totalAmount, 0),
          totalReferrals: sortedStats.reduce((sum, user) => sum + user.network.totalReferrals, 0),
          totalEarnings: sortedStats.reduce((sum, user) => sum + user.earnings.totalEarned, 0)
        }
      });

    } catch (error) {
      console.error('Error getting all users network stats:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get network statistics for all users'
      });
    }
  }

  /**
   * Получить детальную структуру сети пользователя
   */
  async getUserNetworkTree(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const maxDepth = parseInt(req.query.maxDepth as string) || 3;
      
      // Получаем все рефералы с их данными
      const referrals = await mlmNetworkService.getAllNetworkReferrals(userId, maxDepth);
      
      // Формируем дерево структуры
      const tree = this.buildNetworkTree(referrals);

      res.json({
        success: true,
        data: {
          rootUserId: userId,
          maxDepth,
          totalReferrals: referrals.length,
          tree
        }
      });

    } catch (error) {
      console.error('Error getting user network tree:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to get network tree'
      });
    }
  }

  /**
   * Построить дерево сети из массива рефералов
   */
  private buildNetworkTree(referrals: Array<{userId: number, level: number, referrerId: number}>) {
    const tree: Record<number, Array<{userId: number, level: number, children: any[]}>> = {};
    
    // Группируем по уровням
    referrals.forEach(ref => {
      if (!tree[ref.level]) {
        tree[ref.level] = [];
      }
      tree[ref.level].push({
        userId: ref.userId,
        level: ref.level,
        children: []
      });
    });

    return tree;
  }

  /**
   * Пересчитать статистику для всех пользователей (админская функция)
   */
  async recalculateAllNetworkStats(req: Request, res: Response) {
    try {
      // Проверяем права администратора
      if (!req.user?.is_admin && !(req as any).admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      // Запускаем пересчет в фоне
      setTimeout(async () => {
        try {
          console.log('🔄 Начинаю пересчет MLM статистики для всех пользователей...');
          const allStats = await mlmNetworkService.getAllUsersNetworkStats();
          console.log(`✅ Пересчет завершен для ${allStats.length} пользователей`);
        } catch (error) {
          console.error('❌ Ошибка пересчета MLM статистики:', error);
        }
      }, 1000);

      res.json({
        success: true,
        message: 'Network statistics recalculation started in background'
      });

    } catch (error) {
      console.error('Error starting network stats recalculation:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to start recalculation'
      });
    }
  }
}

export const mlmNetworkController = new MLMNetworkController();