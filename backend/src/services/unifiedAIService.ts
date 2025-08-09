import { db } from '../storage/storage/storage';
import { users, userCashbacks, orders } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { cacheService } from './cacheService';
import { errorMonitoringService } from './errorMonitoringService';

interface ReferralAnalysis {
  totalUsers: number;
  activeReferrals: number;
  networkDepth: number;
  healthScore: number;
  recommendations: string[];
}

export class UnifiedAIService {
  
  /**
   * Объединенный анализ реферальной сети
   */
  async analyzeReferralSystem(): Promise<ReferralAnalysis> {
    try {
      // Проверяем кэш
      const cacheKey = 'referral_analysis';
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Получаем всех пользователей одним запросом
      const allUsers = await db.select({
        id: users.id,
        firstName: users.first_name,
        telegramId: users.telegram_id,
        referrerId: users.referrer_id,
        appliedReferralCode: users.applied_referral_code,
        createdAt: users.created_at
      }).from(users);

      // Анализируем структуру сети
      const analysis = this.calculateNetworkMetrics(allUsers);
      
      // Кэшируем результат на 30 минут
      cacheService.set(cacheKey, analysis, 30);
      
      return analysis;
      
    } catch (error) {
      errorMonitoringService.logError('error', 'Unified AI analysis error', error as Error);
      throw error;
    }
  }

  /**
   * Расчет метрик сети
   */
  private calculateNetworkMetrics(users: any[]): ReferralAnalysis {
    const userMap = new Map();
    const referralCounts = new Map();
    
    // Создаем индекс пользователей
    users.forEach(user => {
      userMap.set(user.id, user);
      referralCounts.set(user.id, 0);
    });

    // Подсчитываем рефералов
    let maxDepth = 0;
    let activeReferrals = 0;
    
    users.forEach(user => {
      if (user.referrerId && userMap.has(user.referrerId)) {
        referralCounts.set(user.referrerId, referralCounts.get(user.referrerId) + 1);
        activeReferrals++;
        
        // Вычисляем глубину
        const depth = this.calculateUserDepth(user, userMap);
        maxDepth = Math.max(maxDepth, depth);
      }
    });

    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(users.length, activeReferrals, maxDepth);
    
    // Рассчитываем общий балл здоровья системы
    const healthScore = this.calculateHealthScore(users.length, activeReferrals, maxDepth);

    return {
      totalUsers: users.length,
      activeReferrals,
      networkDepth: maxDepth,
      healthScore,
      recommendations
    };
  }

  /**
   * Вычисление глубины пользователя в сети
   */
  private calculateUserDepth(user: any, userMap: Map<any, any>, visited = new Set()): number {
    if (visited.has(user.id) || !user.referrerId) {
      return 0;
    }

    visited.add(user.id);
    const referrer = userMap.get(user.referrerId);
    
    if (!referrer) {
      return 1;
    }

    return 1 + this.calculateUserDepth(referrer, userMap, visited);
  }

  /**
   * Генерация рекомендаций на основе метрик
   */
  private generateRecommendations(totalUsers: number, activeReferrals: number, maxDepth: number): string[] {
    const recommendations: string[] = [];
    
    if (totalUsers === 0) {
      recommendations.push('Система пуста - необходимо привлечь первых пользователей');
      return recommendations;
    }

    const referralRate = (activeReferrals / totalUsers) * 100;

    if (referralRate < 20) {
      recommendations.push('Низкий процент рефералов - увеличьте мотивацию для приглашений');
    }

    if (maxDepth < 2) {
      recommendations.push('Неглубокая сеть - работайте над долгосрочным удержанием пользователей');
    }

    if (maxDepth > 5) {
      recommendations.push('Слишком глубокая сеть - проверьте на возможные злоупотребления');
    }

    if (recommendations.length === 0) {
      recommendations.push('Реферальная система работает эффективно');
    }

    return recommendations;
  }

  /**
   * Расчет общего балла здоровья системы
   */
  private calculateHealthScore(totalUsers: number, activeReferrals: number, maxDepth: number): number {
    if (totalUsers === 0) return 0;

    let score = 50; // Базовый балл

    // Балл за активность рефералов
    const referralRate = (activeReferrals / totalUsers) * 100;
    if (referralRate > 30) score += 30;
    else if (referralRate > 15) score += 20;
    else if (referralRate > 5) score += 10;

    // Балл за глубину сети
    if (maxDepth >= 2 && maxDepth <= 4) score += 20;
    else if (maxDepth >= 1) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Проверка целостности системы бонусов
   */
  async validateBonusIntegrity(): Promise<{ valid: boolean; issues: string[]; fixedCount: number }> {
    try {
      const issues: string[] = [];
      let fixedCount = 0;

      // Проверяем зависшие бонусы
      const pendingBonuses = await db.select()
        .from(userCashbacks)
        .where(eq(userCashbacks.status, 'pending'))
        .orderBy(desc(userCashbacks.created_at))
        .limit(100);

      const oldBonuses = pendingBonuses.filter(bonus => {
        const daysDiff = (Date.now() - new Date(bonus.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7;
      });

      if (oldBonuses.length > 0) {
        issues.push(`${oldBonuses.length} бонусов ожидают обработки более 7 дней`);
      }

      // Автоматическое исправление простых проблем
      for (const bonus of oldBonuses.slice(0, 10)) { // Исправляем максимум 10 за раз
        try {
          await db.update(userCashbacks)
            .set({ status: 'expired' })
            .where(eq(userCashbacks.id, bonus.id));
          fixedCount++;
        } catch (error) {
          console.error('Failed to fix bonus:', error);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        fixedCount
      };

    } catch (error) {
      errorMonitoringService.logError('error', 'Bonus integrity check error', error as Error);
      throw error;
    }
  }

  /**
   * Получение сводки производительности системы
   */
  async getSystemPerformanceSummary() {
    try {
      const [referralAnalysis, bonusCheck] = await Promise.all([
        this.analyzeReferralSystem(),
        this.validateBonusIntegrity()
      ]);

      return {
        referrals: referralAnalysis,
        bonuses: bonusCheck,
        timestamp: new Date().toISOString(),
        overallHealth: this.calculateOverallHealth(referralAnalysis, bonusCheck)
      };

    } catch (error) {
      errorMonitoringService.logError('error', 'System performance summary error', error as Error);
      throw error;
    }
  }

  /**
   * Общая оценка здоровья системы
   */
  private calculateOverallHealth(referrals: ReferralAnalysis, bonuses: any): string {
    const referralScore = referrals.healthScore;
    const bonusScore = bonuses.valid ? 100 : Math.max(0, 100 - bonuses.issues.length * 20);
    
    const averageScore = (referralScore + bonusScore) / 2;

    if (averageScore >= 80) return 'excellent';
    if (averageScore >= 60) return 'good';
    if (averageScore >= 40) return 'fair';
    return 'poor';
  }
}

export const unifiedAIService = new UnifiedAIService();