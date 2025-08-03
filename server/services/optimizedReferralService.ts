import { db } from '../storage';
import { users, userCashbacks, orders } from '@shared/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export class OptimizedReferralService {
  
  /**
   * Получение реферальной сети без N+1 запросов
   */
  async getReferralNetworkOptimized() {
    // Единый запрос для получения всех пользователей с их рефералами
    const allUsersWithReferrals = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        telegramId: users.telegram_id,
        referralCode: users.referral_code,
        appliedReferralCode: users.applied_referral_code,
        referrerId: users.referrer_id,
        createdAt: users.created_at
      })
      .from(users);

    // Группируем пользователей по уровням реферальной сети
    const networkMap = new Map();
    const userMap = new Map();
    
    // Создаем индекс пользователей
    allUsersWithReferrals.forEach(user => {
      userMap.set(user.id, user);
      networkMap.set(user.id, {
        ...user,
        children: [],
        level: 0,
        totalNetwork: 0
      });
    });

    // Строим связи родитель-ребенок за один проход
    allUsersWithReferrals.forEach(user => {
      if (user.referrerId && networkMap.has(user.referrerId)) {
        const parent = networkMap.get(user.referrerId);
        const child = networkMap.get(user.id);
        parent.children.push(child);
        child.level = parent.level + 1;
      }
    });

    return this.calculateNetworkMetrics(networkMap);
  }

  /**
   * Пакетная проверка целостности рефералов
   */
  async validateReferralIntegrityBatch() {
    const issues: string[] = [];
    
    // Получаем всех пользователей с реферальными кодами
    const allUsers = await db.select().from(users);
    const telegramIdSet = new Set(allUsers.map(u => u.telegram_id?.toString()));

    // Проверяем целостность рефералов
    allUsers.forEach(user => {
      if (user.applied_referral_code && !telegramIdSet.has(user.applied_referral_code)) {
        issues.push(`Пользователь ${user.first_name} ссылается на несуществующего реферера ${user.applied_referral_code}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      checkedCount: allUsers.length
    };
  }

  /**
   * Оптимизированный расчет бонусов с транзакциями
   */
  async calculateBonusesWithTransaction(orderId: number) {
    return await db.transaction(async (tx) => {
      try {
        // Получаем заказ
        const orderResult = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (orderResult.length === 0) {
          return { success: false, reason: 'Order not found' };
        }
        
        const order = orderResult[0];
        
        // Получаем пользователя
        const userResult = await tx.select().from(users).where(eq(users.id, order.user_id)).limit(1);
        if (userResult.length === 0 || !userResult[0].referrer_id) {
          return { success: false, reason: 'No referrer found' };
        }

        const user = userResult[0];

        // Получаем всю цепочку рефералов за один запрос
        const referralChain = await this.getReferralChain(tx, user.referrer_id);
        
        const bonuses = [];
        const orderAmount = parseFloat(order.total);

        // Рассчитываем бонусы для каждого уровня
        for (let level = 1; level <= Math.min(3, referralChain.length); level++) {
          const referrer = referralChain[level - 1];
          const bonusRate = this.getBonusRate(level);
          const bonusAmount = orderAmount * bonusRate;

          // Создаем запись о бонусе
          const bonus = await tx.insert(userCashbacks).values({
            user_id: referrer.id,
            amount: bonusAmount.toString(),
            type: 'referral_bonus',
            status: 'pending',
            source_order_id: orderId,
            source_user_id: referrer.id,
            referral_level: level
          }).returning();

          bonuses.push({
            level,
            referrer: referrer.first_name,
            amount: bonusAmount,
            bonusId: bonus[0].id
          });
        }

        return { success: true, bonuses };
        
      } catch (error) {
        // Транзакция автоматически откатится
        throw error;
      }
    });
  }

  private async getReferralChain(tx: any, referrerId: number): Promise<any[]> {
    const chain = [];
    let currentReferrerId = referrerId;

    // Получаем до 3 уровней рефералов
    for (let level = 0; level < 3 && currentReferrerId; level++) {
      const referrer = await tx.query.users.findFirst({
        where: eq(users.id, currentReferrerId)
      });

      if (!referrer) break;

      chain.push(referrer);
      currentReferrerId = referrer.referrer_id;
    }

    return chain;
  }

  private getBonusRate(level: number): number {
    const rates: Record<number, number> = { 1: 0.10, 2: 0.05, 3: 0.025 }; // 10%, 5%, 2.5%
    return rates[level] || 0;
  }

  private calculateNetworkMetrics(networkMap: Map<number, any>) {
    const metrics = {
      totalUsers: networkMap.size,
      maxDepth: 0,
      activeUsers: 0,
      levelDistribution: { 1: 0, 2: 0, 3: 0 }
    };

    networkMap.forEach(node => {
      metrics.maxDepth = Math.max(metrics.maxDepth, node.level);
      
      if (node.level >= 1 && node.level <= 3) {
        const level = node.level as 1 | 2 | 3;
        metrics.levelDistribution[level]++;
      }
      
      // Подсчитываем размер сети для каждого узла
      node.totalNetwork = this.countNetworkSize(node);
    });

    return { networkMap, metrics };
  }

  private countNetworkSize(node: any): number {
    let count = node.children?.length || 0;
    if (node.children) {
      node.children.forEach((child: any) => {
        count += this.countNetworkSize(child);
      });
    }
    return count;
  }
}

export const optimizedReferralService = new OptimizedReferralService();