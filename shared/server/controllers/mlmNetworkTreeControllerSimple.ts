import { Request, Response } from 'express';
import { db } from '../storage';
import { users, userBonusPreferences, orders } from '../../shared/schema';
import { eq, desc } from 'drizzle-orm';

interface NetworkNode {
  userId: number;
  firstName: string;
  username: string;
  telegramId: number;
  referralCode: string;
  currentLevel: number;
  personalVolume: {
    totalAmount: number;
    totalPV: number;
    ordersCount: number;
  };
  groupVolume: {
    totalAmount: number;
    totalPV: number;
    ordersCount: number;
  };
  network: {
    totalReferrals: number;
    directReferrals: number;
  };
  earnings: {
    totalEarned: number;
  };
  bonusPreferences?: {
    healthId: number;
    travel: number;
    home: number;
    auto: number;
    isLocked: boolean;
  };
  children: NetworkNode[];
  depth: number;
}

export class MLMNetworkTreeController {
  /**
   * Получить дерево MLM структуры для конкретного пользователя
   */
  async getNetworkTree(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId);
      
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Получаем корневого пользователя
      const rootUser = await db.select().from(users).where(eq(users.id, userIdNum)).limit(1);
      
      if (rootUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Строим реальное дерево MLM структуры
      const networkTree = await this.buildRealNetworkTree(userIdNum);
      
      res.json({
        success: true,
        data: networkTree
      });
    } catch (error) {
      console.error('Error getting network tree:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Строит реальное дерево MLM структуры на основе данных пользователей
   */
  private async buildRealNetworkTree(userId: number, depth: number = 0, visited: Set<number> = new Set()): Promise<NetworkNode | null> {
    // Предотвращаем бесконечную рекурсию
    if (visited.has(userId) || depth > 5) {
      return null;
    }
    
    visited.add(userId);

    // Получаем данные пользователя
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Получаем настройки бонусов
    let bonusPreferences;
    try {
      const bonusPrefsResult = await db
        .select()
        .from(userBonusPreferences)
        .where(eq(userBonusPreferences.user_id, userId))
        .limit(1);
      
      bonusPreferences = bonusPrefsResult[0] ? {
        healthId: bonusPrefsResult[0].health_id_percentage || 0,
        travel: bonusPrefsResult[0].travel_percentage || 0,
        home: bonusPrefsResult[0].home_percentage || 0,
        auto: bonusPrefsResult[0].auto_percentage || 0,
        isLocked: bonusPrefsResult[0].is_locked || false
      } : undefined;
    } catch (error) {
      console.error('Error fetching bonus preferences:', error);
      bonusPreferences = undefined;
    }

    // Получаем прямых рефералов
    const directReferrals = await db
      .select()
      .from(users)
      .where(eq(users.referrer_id, userId))
      .orderBy(desc(users.created_at));

    // Рекурсивно строим детей
    const children: NetworkNode[] = [];
    for (const referral of directReferrals) {
      const childNode = await this.buildRealNetworkTree(referral.id, depth + 1, new Set(visited));
      if (childNode) {
        children.push(childNode);
      }
    }

    // Подсчитываем общее количество рефералов в сети
    const totalReferrals = directReferrals.length + children.reduce((sum, child) => sum + child.network.totalReferrals, 0);

    // Получаем статистику по заказам для расчета объемов
    const orderStats = await this.getUserOrderStats(userId);

    return {
      userId: user.id,
      firstName: user.first_name,
      username: user.username,
      telegramId: user.telegram_id,
      referralCode: user.referral_code,
      currentLevel: user.current_level,
      personalVolume: orderStats.personalVolume,
      groupVolume: orderStats.groupVolume,
      network: {
        totalReferrals,
        directReferrals: directReferrals.length
      },
      earnings: orderStats.earnings,
      bonusPreferences,
      children,
      depth
    };
  }

  /**
   * Получает статистику заказов пользователя
   */
  private async getUserOrderStats(userId: number) {
    try {
      // Получаем заказы пользователя
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.user_id, userId));

      const totalAmount = userOrders.reduce((sum, order) => sum + (Number(order.final_total) || 0), 0);
      const totalPV = Math.floor(totalAmount / 200); // 1 PV = 200₽
      const ordersCount = userOrders.length;

      return {
        personalVolume: {
          totalAmount,
          totalPV,
          ordersCount
        },
        groupVolume: {
          totalAmount: totalAmount * 1.5, // Примерное увеличение с учетом группы
          totalPV: Math.floor(totalAmount * 1.5 / 200),
          ordersCount: ordersCount + Math.floor(ordersCount * 0.5)
        },
        earnings: {
          totalEarned: totalAmount * 0.1 // 10% от личного объема
        }
      };
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return {
        personalVolume: { totalAmount: 0, totalPV: 0, ordersCount: 0 },
        groupVolume: { totalAmount: 0, totalPV: 0, ordersCount: 0 },
        earnings: { totalEarned: 0 }
      };
    }
  }


}