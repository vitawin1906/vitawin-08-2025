import { Request, Response } from 'express';
import { db } from '../storage';
import { users, orders, userBonusPreferences } from '../../shared/schema';
import { eq, and, sum, count, desc, sql } from 'drizzle-orm';

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

      // Строим дерево структуры
      const networkTree = await this.buildNetworkTree(userIdNum, 0, new Set());
      
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
   * Рекурсивное построение дерева MLM структуры
   */
  private async buildNetworkTree(userId: number, depth: number, visited: Set<number>): Promise<NetworkNode | null> {
    // Предотвращаем бесконечную рекурсию
    if (visited.has(userId) || depth > 10) {
      return null;
    }
    
    // Создаем копию visited для этого узла
    const newVisited = new Set(visited);
    newVisited.add(userId);

    // Получаем данные пользователя
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Получаем статистику личного объема
    const personalVolumeResult = await db
      .select({
        totalAmount: sql`COALESCE(SUM(${orders.total}), 0)`.as('totalAmount'),
        totalPV: sql`COALESCE(SUM(${orders.total} / 200), 0)`.as('totalPV'),
        ordersCount: sql`COUNT(${orders.id})`.as('ordersCount')
      })
      .from(orders)
      .where(
        and(
          eq(orders.user_id, userId),
          eq(orders.status, 'completed')
        )
      );

    const personalVolume = personalVolumeResult[0] || {
      totalAmount: 0,
      totalPV: 0,
      ordersCount: 0
    };

    // Получаем прямых рефералов
    const directReferrals = await db
      .select()
      .from(users)
      .where(eq(users.referrer_id, userId))
      .orderBy(desc(users.created_at));

    // Получаем настройки бонусов
    const bonusPrefsResult = await db
      .select()
      .from(userBonusPreferences)
      .where(eq(userBonusPreferences.user_id, userId))
      .limit(1);

    const bonusPreferences = bonusPrefsResult[0] ? {
      healthId: bonusPrefsResult[0].health_id_percentage || 0,
      travel: bonusPrefsResult[0].travel_percentage || 0,
      home: bonusPrefsResult[0].home_percentage || 0,
      auto: bonusPrefsResult[0].auto_percentage || 0,
      isLocked: bonusPrefsResult[0].is_locked || false
    } : undefined;

    // Рекурсивно строим детей (ограничиваем глубину и количество)
    const children: NetworkNode[] = [];
    const maxChildren = depth === 0 ? 50 : 20; // Ограничиваем количество детей
    
    for (let i = 0; i < Math.min(directReferrals.length, maxChildren); i++) {
      const childNode = await this.buildNetworkTree(directReferrals[i].id, depth + 1, newVisited);
      if (childNode) {
        children.push(childNode);
      }
    }

    // Подсчитываем групповой объем (сумма всех потомков)
    const groupVolume = await this.calculateGroupVolume(userId, newVisited);

    // Подсчитываем общее количество рефералов в сети
    const totalReferrals = await this.countTotalReferrals(userId, newVisited);

    // Подсчитываем заработок (упрощенно)
    const earnings = {
      totalEarned: (Number(personalVolume.totalAmount) || 0) * 0.1 + (Number(groupVolume.totalAmount) || 0) * 0.05
    };

    return {
      userId: user.id,
      firstName: user.first_name,
      username: user.username,
      telegramId: user.telegram_id,
      referralCode: user.referral_code,
      currentLevel: user.current_level,
      personalVolume: {
        totalAmount: Number(personalVolume.totalAmount),
        totalPV: Number(personalVolume.totalPV),
        ordersCount: Number(personalVolume.ordersCount)
      },
      groupVolume: {
        totalAmount: groupVolume.totalAmount,
        totalPV: groupVolume.totalPV,
        ordersCount: groupVolume.ordersCount
      },
      network: {
        totalReferrals,
        directReferrals: directReferrals.length
      },
      earnings,
      bonusPreferences,
      children,
      depth
    };
  }

  /**
   * Подсчет группового объема
   */
  private async calculateGroupVolume(userId: number, visited: Set<number>): Promise<{
    totalAmount: number;
    totalPV: number;
    ordersCount: number;
  }> {
    // Получаем всех потомков пользователя
    const descendants = await this.getAllDescendants(userId, visited);
    
    if (descendants.length === 0) {
      return { totalAmount: 0, totalPV: 0, ordersCount: 0 };
    }

    // Подсчитываем объем всех потомков
    const groupVolumeResult = await db
      .select({
        totalAmount: sql`COALESCE(SUM(${orders.total}), 0)`.as('totalAmount'),
        totalPV: sql`COALESCE(SUM(${orders.total} / 200), 0)`.as('totalPV'),
        ordersCount: sql`COUNT(${orders.id})`.as('ordersCount')
      })
      .from(orders)
      .where(
        and(
          sql`${orders.user_id} IN (${descendants.map(d => d.toString()).join(',')})`,
          eq(orders.status, 'completed')
        )
      );

    const result = groupVolumeResult[0] || { totalAmount: 0, totalPV: 0, ordersCount: 0 };

    return {
      totalAmount: Number(result.totalAmount),
      totalPV: Number(result.totalPV),
      ordersCount: Number(result.ordersCount)
    };
  }

  /**
   * Получить всех потомков пользователя
   */
  private async getAllDescendants(userId: number, visited: Set<number>): Promise<number[]> {
    const descendants: number[] = [];
    
    const directReferrals = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referrer_id, userId));

    for (const referral of directReferrals) {
      if (!visited.has(referral.id)) {
        const newVisited = new Set(visited);
        newVisited.add(referral.id);
        descendants.push(referral.id);
        const childDescendants = await this.getAllDescendants(referral.id, newVisited);
        descendants.push(...childDescendants);
      }
    }

    return descendants;
  }

  /**
   * Подсчет общего количества рефералов
   */
  private async countTotalReferrals(userId: number, visited: Set<number>): Promise<number> {
    const descendants = await this.getAllDescendants(userId, visited);
    return descendants.length;
  }
}