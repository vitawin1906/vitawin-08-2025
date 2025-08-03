import { db, storage } from '../storage';
import { users, orders, referrals, userCashbacks } from '@shared/schema';
import { eq, sql, and, gte, lte, inArray } from 'drizzle-orm';

export interface UserNetworkStats {
  userId: number;
  firstName: string;
  username: string;
  telegramId: number;
  referralCode: string;
  currentLevel: number;
  
  // Личный объем (ЛО) - собственные покупки
  personalVolume: {
    totalAmount: number;    // Общая сумма заказов
    totalPV: number;        // Общее количество PV
    ordersCount: number;    // Количество заказов
  };
  
  // Групповой объем (ГО) - объемы всех рефералов
  groupVolume: {
    totalAmount: number;    // Общая сумма от всех рефералов
    totalPV: number;        // Общее количество PV от рефералов
    ordersCount: number;    // Количество заказов рефералов
  };
  
  // Структура сети
  network: {
    totalReferrals: number;           // Общее количество рефералов
    directReferrals: number;          // Прямые рефералы (1 уровень)
    levelBreakdown: Record<number, number>; // Количество по уровням 1-16
    maxDepth: number;                 // Максимальная глубина сети
  };
  
  // Заработанные бонусы
  earnings: {
    totalEarned: number;              // Общий заработок
    referralBonuses: number;          // Реферальные бонусы
    levelBonuses: number;             // Бонусы по уровням MLM
  };
}

export interface NetworkCalculationOptions {
  dateFrom?: Date;
  dateTo?: Date;
  includeInactive?: boolean;
  maxDepth?: number;
}

export class MLMNetworkService {
  
  /**
   * Получить полную статистику сети пользователя
   */
  async getUserNetworkStats(userId: number, options: NetworkCalculationOptions = {}): Promise<UserNetworkStats> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }
    
    const userData = user[0];
    
    // Получаем личный объем (ЛО)
    const personalVolume = await this.calculatePersonalVolume(userId, options);
    
    // Получаем всех рефералов в сети
    const networkReferrals = await this.getAllNetworkReferrals(userId, options.maxDepth || 16);
    
    // Считаем групповой объем (ГО)
    const groupVolume = await this.calculateGroupVolume(networkReferrals, options);
    
    // Считаем структуру сети
    const network = this.calculateNetworkStructure(networkReferrals);
    
    // Считаем заработок
    const earnings = await this.calculateUserEarnings(userId, options);
    
    // Определяем текущий уровень MLM
    const currentLevel = await this.calculateUserMlmLevel(userId, network.totalReferrals);
    
    return {
      userId,
      firstName: userData.first_name,
      username: userData.username || '',
      telegramId: userData.telegram_id,
      referralCode: userData.referral_code,
      currentLevel,
      personalVolume,
      groupVolume,
      network,
      earnings
    };
  }
  
  /**
   * Получить статистику по всем пользователям для админки
   */
  async getAllUsersNetworkStats(options: NetworkCalculationOptions = {}): Promise<UserNetworkStats[]> {
    const allUsers = await db.select({
      id: users.id,
      first_name: users.first_name,
      username: users.username,
      telegram_id: users.telegram_id,
      referral_code: users.referral_code
    }).from(users);
    
    const results: UserNetworkStats[] = [];
    
    // Обрабатываем пользователей порциями для производительности
    const batchSize = 20;
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      const batchPromises = batch.map(user => 
        this.getUserNetworkStats(user.id, options)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Найти всех рефералов в сети пользователя до указанной глубины
   */
  async getAllNetworkReferrals(userId: number, maxDepth: number = 16): Promise<Array<{userId: number, level: number, referrerId: number}>> {
    const referrals: Array<{userId: number, level: number, referrerId: number}> = [];
    
    // Используем рекурсивную функцию для построения дерева рефералов
    const findReferrals = async (parentId: number, currentLevel: number): Promise<void> => {
      if (currentLevel > maxDepth) return;
      
      // Найти прямых рефералов
      const directReferrals = await db.select({
        id: users.id,
        referrer_id: users.referrer_id
      }).from(users).where(eq(users.referrer_id, parentId));
      
      // Обработать каждого реферала
      for (const ref of directReferrals) {
        referrals.push({
          userId: ref.id,
          level: currentLevel,
          referrerId: parentId
        });
        
        // Рекурсивно найти рефералов следующего уровня
        await findReferrals(ref.id, currentLevel + 1);
      }
    };
    
    // Начинаем с уровня 1
    await findReferrals(userId, 1);
    
    return referrals;
  }
  
  /**
   * Рассчитать личный объем пользователя (ЛО)
   */
  async calculatePersonalVolume(userId: number, options: NetworkCalculationOptions = {}) {
    let whereConditions = and(
      eq(orders.user_id, userId),
      eq(orders.payment_status, 'paid')
    );
    
    if (options.dateFrom) {
      whereConditions = and(whereConditions, gte(orders.created_at, options.dateFrom));
    }
    if (options.dateTo) {
      whereConditions = and(whereConditions, lte(orders.created_at, options.dateTo));
    }
    
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      totalPv: sql<number>`COALESCE(SUM(${orders.pv_earned}), 0)`,
      count: sql<number>`COUNT(*)`
    }).from(orders).where(whereConditions);
    
    const data = result[0];
    
    return {
      totalAmount: Number(data.total) || 0,
      totalPV: Number(data.totalPv) || 0,
      ordersCount: Number(data.count) || 0
    };
  }
  
  /**
   * Рассчитать групповой объем (ГО) от всех рефералов
   */
  async calculateGroupVolume(networkReferrals: Array<{userId: number, level: number}>, options: NetworkCalculationOptions = {}) {
    if (networkReferrals.length === 0) {
      return {
        totalAmount: 0,
        totalPV: 0,
        ordersCount: 0
      };
    }
    
    const referralIds = networkReferrals.map(ref => ref.userId);
    
    let whereConditions = and(
      inArray(orders.user_id, referralIds),
      eq(orders.payment_status, 'paid')
    );
    
    if (options.dateFrom) {
      whereConditions = and(whereConditions, gte(orders.created_at, options.dateFrom));
    }
    if (options.dateTo) {
      whereConditions = and(whereConditions, lte(orders.created_at, options.dateTo));
    }
    
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      totalPv: sql<number>`COALESCE(SUM(${orders.pv_earned}), 0)`,
      count: sql<number>`COUNT(*)`
    }).from(orders).where(whereConditions);
    
    const data = result[0];
    
    return {
      totalAmount: Number(data.total) || 0,
      totalPV: Number(data.totalPv) || 0,
      ordersCount: Number(data.count) || 0
    };
  }
  
  /**
   * Проанализировать структуру сети
   */
  calculateNetworkStructure(networkReferrals: Array<{userId: number, level: number}>) {
    const levelBreakdown: Record<number, number> = {};
    let maxDepth = 0;
    
    // Инициализируем все уровни от 1 до 16
    for (let i = 1; i <= 16; i++) {
      levelBreakdown[i] = 0;
    }
    
    // Подсчитываем рефералов по уровням
    networkReferrals.forEach(ref => {
      if (ref.level >= 1 && ref.level <= 16) {
        levelBreakdown[ref.level]++;
        maxDepth = Math.max(maxDepth, ref.level);
      }
    });
    
    return {
      totalReferrals: networkReferrals.length,
      directReferrals: levelBreakdown[1],
      levelBreakdown,
      maxDepth
    };
  }
  
  /**
   * Рассчитать заработок пользователя
   */
  async calculateUserEarnings(userId: number, options: NetworkCalculationOptions = {}) {
    let whereConditions = and(
      eq(userCashbacks.user_id, userId),
      eq(userCashbacks.status, 'completed')
    );
    
    if (options.dateFrom) {
      whereConditions = and(whereConditions, gte(userCashbacks.created_at, options.dateFrom));
    }
    if (options.dateTo) {
      whereConditions = and(whereConditions, lte(userCashbacks.created_at, options.dateTo));
    }
    
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${userCashbacks.amount} AS DECIMAL)), 0)`,
      referralBonuses: sql<number>`COALESCE(SUM(CASE WHEN ${userCashbacks.type} = 'referral_bonus' THEN CAST(${userCashbacks.amount} AS DECIMAL) ELSE 0 END), 0)`,
      levelBonuses: sql<number>`COALESCE(SUM(CASE WHEN ${userCashbacks.type} = 'level_bonus' THEN CAST(${userCashbacks.amount} AS DECIMAL) ELSE 0 END), 0)`
    }).from(userCashbacks).where(whereConditions);
    
    const data = result[0];
    
    return {
      totalEarned: Number(data.total) || 0,
      referralBonuses: Number(data.referralBonuses) || 0,
      levelBonuses: Number(data.levelBonuses) || 0
    };
  }
  
  /**
   * Определить MLM уровень пользователя по количеству рефералов
   */
  async calculateUserMlmLevel(userId: number, totalReferrals: number): Promise<number> {
    // Используем существующую логику из storage
    const levelData = await storage.calculateUserLevel(userId);
    return levelData.currentLevel;
  }
}

export const mlmNetworkService = new MLMNetworkService();