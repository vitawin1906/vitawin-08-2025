import { db, storage } from '../storage';
import { users, orders, userCashbacks, userBonusPreferences } from '@shared/schema';
import { eq, sql, and, count, sum } from 'drizzle-orm';

export interface UserNetworkStats {
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
    maxDepth: number;
  };
  
  earnings: {
    totalEarned: number;
    referralBonuses: number;
    levelBonuses: number;
  };

  bonusPreferences?: {
    healthId: number;
    travel: number;
    home: number;
    auto: number;
    isLocked: boolean;
  };
}

export class MLMNetworkServiceSimple {
  /**
   * Получить статистику для всех пользователей (упрощенная версия)
   */
  async getAllUsersNetworkStats(): Promise<UserNetworkStats[]> {
    // Получаем всех пользователей
    const allUsers = await db.select({
      id: users.id,
      telegram_id: users.telegram_id,
      first_name: users.first_name,
      username: users.username,
      referral_code: users.referral_code,
      referrer_id: users.referrer_id
    }).from(users);
    
    const results: UserNetworkStats[] = [];
    
    for (const user of allUsers) {
      // Получаем личный объем (ЛО) пользователя
      const personalVolumeQuery = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        totalPV: sql<number>`COALESCE(SUM(${orders.pv_earned}), 0)`,
        ordersCount: sql<number>`COUNT(*)`
      }).from(orders).where(
        and(
          eq(orders.user_id, user.id),
          eq(orders.payment_status, 'paid')
        )
      );
      
      const personalVolume = personalVolumeQuery[0] || {
        totalAmount: 0,
        totalPV: 0,
        ordersCount: 0
      };
      
      // Получаем количество прямых рефералов
      const directReferrals = await db.select({
        count: count()
      }).from(users).where(eq(users.referrer_id, user.id));
      
      // Получаем заработок пользователя
      const earningsQuery = await db.select({
        totalEarned: sql<number>`COALESCE(SUM(CAST(${userCashbacks.amount} AS DECIMAL)), 0)`,
        referralBonuses: sql<number>`COALESCE(SUM(CASE WHEN ${userCashbacks.type} = 'referral_bonus' THEN CAST(${userCashbacks.amount} AS DECIMAL) ELSE 0 END), 0)`,
        levelBonuses: sql<number>`COALESCE(SUM(CASE WHEN ${userCashbacks.type} = 'level_bonus' THEN CAST(${userCashbacks.amount} AS DECIMAL) ELSE 0 END), 0)`
      }).from(userCashbacks).where(
        and(
          eq(userCashbacks.user_id, user.id),
          eq(userCashbacks.status, 'completed')
        )
      );
      
      const earnings = earningsQuery[0] || {
        totalEarned: 0,
        referralBonuses: 0,
        levelBonuses: 0
      };
      
      // Получаем MLM уровень пользователя
      const levelData = await storage.calculateUserLevel(user.id);
      
      // Получаем предпочтения бонусов пользователя
      const bonusPrefsQuery = await db.select()
        .from(userBonusPreferences)
        .where(eq(userBonusPreferences.user_id, user.id))
        .limit(1);
      
      const bonusPrefs = bonusPrefsQuery.length > 0 ? bonusPrefsQuery[0] : null;
      
      const userStats: UserNetworkStats = {
        userId: user.id,
        firstName: user.first_name,
        username: user.username || '',
        telegramId: user.telegram_id,
        referralCode: user.referral_code,
        currentLevel: levelData.currentLevel,
        
        personalVolume: {
          totalAmount: Number(personalVolume.totalAmount) || 0,
          totalPV: Number(personalVolume.totalPV) || 0,
          ordersCount: Number(personalVolume.ordersCount) || 0
        },
        
        // Пока что групповой объем оставляем пустым
        groupVolume: {
          totalAmount: 0,
          totalPV: 0,
          ordersCount: 0
        },
        
        network: {
          totalReferrals: 0, // Пока что оставляем 0
          directReferrals: directReferrals[0]?.count || 0,
          maxDepth: 0
        },
        
        earnings: {
          totalEarned: Number(earnings.totalEarned) || 0,
          referralBonuses: Number(earnings.referralBonuses) || 0,
          levelBonuses: Number(earnings.levelBonuses) || 0
        },

        bonusPreferences: bonusPrefs ? {
          healthId: Number(bonusPrefs.health_id_percentage) || 0,
          travel: Number(bonusPrefs.travel_percentage) || 0,
          home: Number(bonusPrefs.home_percentage) || 0,
          auto: Number(bonusPrefs.auto_percentage) || 0,
          isLocked: Boolean(bonusPrefs.is_locked)
        } : undefined
      };
      
      results.push(userStats);
    }
    
    return results;
  }
}

export const mlmNetworkServiceSimple = new MLMNetworkServiceSimple();