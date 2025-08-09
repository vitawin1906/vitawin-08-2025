import { Request, Response } from 'express';
import { storage } from '../storage/storage/storage';
import { db } from '../storage/storage/storage';
import { users, orders, aiTasks, userCashbacks, networkConnections, aiLogs } from '../../shared/schema';
import { eq, desc, and, isNull, sum, count, sql } from 'drizzle-orm';
// import OpenAI from 'openai'; // Удалено, так как OpenAI не используется
import { telegramNotificationService } from '../services/telegramNotificationService';

// ЗАГЛУШКА вместо OpenAI
export const advancedAIControllerStub = (req, res) => {
  res.status(501).json({ error: 'AI functionality is disabled (no OpenAI key)' });
};

// ИИ Агент: Основной класс для управления реферальной сетью
export class AIReferralAgent {
  
  // 1. Анализ и построение карты реферальной сети
  async analyzeReferralNetwork() {
    try {
      console.log('🤖 ИИ Агент: Начинаю анализ реферальной сети...');
      
      // Получаем всех пользователей с их рефералами
      const allUsers = await db.select().from(users);
      
      // Строим карту связей
      const networkMap = new Map();
      const levels = new Map(); // user_id -> level
      
      // Находим корневых пользователей (без реферера)
      const rootUsers = allUsers.filter(user => !user.referral_code_used);
      rootUsers.forEach(user => {
        levels.set(user.id, 0);
        networkMap.set(user.id, { 
          user, 
          level: 0, 
          children: [], 
          referrals: [] 
        });
      });
      
      // Строим дерево до 3 уровней
      for (let level = 1; level <= 3; level++) {
        const currentLevelUsers = allUsers.filter(user => {
          if (!user.referral_code_used) return false;
          
          // Находим реферера по коду
          const referrer = allUsers.find(ref => 
            ref.telegram_id?.toString() === user.referral_code_used
          );
          
          if (!referrer) return false;
          
          const referrerLevel = levels.get(referrer.id);
          return referrerLevel === level - 1;
        });
        
        currentLevelUsers.forEach(user => {
          const referrer = allUsers.find(ref => 
            ref.telegram_id?.toString() === user.referral_code_used
          );
          
          if (referrer && networkMap.has(referrer.id)) {
            levels.set(user.id, level);
            
            const userNode = {
              user,
              level,
              children: [],
              referrals: []
            };
            
            networkMap.set(user.id, userNode);
            networkMap.get(referrer.id).children.push(userNode);
            networkMap.get(referrer.id).referrals.push(user);
          }
        });
      }
      
      // Сохраняем связи в базу данных
      await this.saveNetworkConnections(networkMap, levels);
      
      // Генерируем отчет ИИ
      const analysis = await this.generateNetworkAnalysis(networkMap, allUsers);
      
      console.log('✅ ИИ Агент: Анализ сети завершен');
      
      return {
        totalUsers: allUsers.length,
        maxDepth: Math.max(...Array.from(levels.values())),
        rootNodes: rootUsers.length,
        networkStructure: this.formatNetworkForDisplay(networkMap),
        analysis
      };
      
    } catch (error) {
      console.error('❌ ИИ Агент: Ошибка анализа сети:', error);
      await this.createErrorTask('network_analysis_error', error);
      throw error;
    }
  }
  
  // 1.5. Уведомления о новых рефералах
  async notifyReferralChain(newUser: any) {
    try {
      console.log(`🤖 ИИ Агент: Отправляю уведомления о новом реферале ${newUser.name}...`);
      
      if (!newUser.referrer_id && !newUser.applied_referral_code) {
        console.log('У пользователя нет реферера - уведомления не отправляются');
        return;
      }
      
      // Находим цепочку рефереров
      const referralChain = await this.buildReferralChain(newUser);
      
      // Отправляем уведомления всем рефереам в цепочке (до 3 уровней)
      for (let i = 0; i < Math.min(referralChain.length, 3); i++) {
        const referrer = referralChain[i];
        
        await telegramNotificationService.sendReferralNotification(
          referrer.user.id,
          newUser,
          i + 1
        );
        
        console.log(`📱 Уведомление отправлено ${referrer.user.name} (уровень ${i + 1})`);
      }
      
      console.log('✅ Все уведомления о новом реферале отправлены');
      
    } catch (error) {
      console.error('❌ ИИ Агент: Ошибка отправки уведомлений о реферале:', error);
    }
  }

  // 2. Расчет и начисление бонусов
  async calculateAndDistributeBonuses(orderId: number) {
    console.log(`=== НАЧИНАЕМ РАСЧЕТ БОНУСОВ ДЛЯ ЗАКАЗА ${orderId} ===`);
    try {
      console.log(`🤖 ИИ Агент: Рассчитываю бонусы для заказа ${orderId}...`);
      console.log('🔍 Выполняем запрос к базе данных...');
      
      // Получаем заказ прямым запросом к базе данных
      const orderDirect = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      console.log('📄 Результат запроса заказа:', orderDirect);
      
      const order = orderDirect[0];
      console.log('📦 Данные заказа напрямую из БД:', order ? { id: order.id, user_id: order.user_id } : 'заказ не найден');
      
      if (!order) {
        console.log('❌ Заказ не найден, завершаем функцию');
        throw new Error(`Заказ ${orderId} не найден`);
      }
      
      console.log('✅ Заказ найден, продолжаем...');
      
      // Получаем данные покупателя напрямую из базы данных
      const buyerDirect = await db.select().from(users).where(eq(users.id, order.user_id)).limit(1);
      const buyer = buyerDirect[0];
      
      if (!buyer) {
        throw new Error(`Пользователь ${order.user_id} не найден`);
      }
      
      console.log('👤 Данные покупателя:', {
        id: buyer.id,
        name: buyer.first_name,
        referrer_id: buyer.referrer_id,
        applied_referral_code: buyer.applied_referral_code
      });
      
      // Если у покупателя нет реферера - бонусы не начисляем
      if (!buyer.referrer_id) {
        console.log('ℹ️ У пользователя нет реферера - бонусы не начисляются');
        return { bonusesCalculated: 0 };
      }
      
      // Находим цепочку рефереров до 3 уровней
      const referralChain = await this.buildReferralChain(buyer);
      console.log('🔗 Цепочка рефереров:', referralChain.map(r => `${r.user.name} (уровень ${r.level})`));
      
      // Рассчитываем бонусы по уровням: 20%, 5%, 1%
      const bonusRates = [0.20, 0.05, 0.01]; // Уровни 1, 2, 3
      const orderAmount = parseFloat(order.total);
      const bonuses = [];
      
      for (let i = 0; i < Math.min(referralChain.length, 3); i++) {
        const referrer = referralChain[i];
        const bonusAmount = orderAmount * bonusRates[i];
        
        // Создаем запись о бонусе
        const cashback = await db.insert(userCashbacks).values({
          user_id: referrer.user.id,
          type: 'referral_bonus',
          amount: bonusAmount.toFixed(2),
          source_order_id: orderId,
          source_user_id: buyer.id,
          referral_level: i + 1,
          status: 'pending'
        }).returning();
        
        bonuses.push({
          referrer: referrer.user,
          level: i + 1,
          amount: bonusAmount,
          percentage: bonusRates[i] * 100
        });
        
        console.log(`💰 Бонус ${bonusAmount.toFixed(2)} руб. (${bonusRates[i] * 100}%) начислен ${referrer.user.name}`);
        
        // Отправляем уведомление о бонусе в Telegram
        await telegramNotificationService.sendBonusNotification(
          referrer.user.id,
          bonusAmount,
          buyer.name || 'Неизвестный пользователь',
          i + 1
        );
      }
      
      // Логируем операцию
      await this.logOperation('info', 'Бонусы рассчитаны и начислены', {
        orderId,
        buyerId: buyer.id,
        totalBonuses: bonuses.reduce((sum, b) => sum + b.amount, 0),
        bonusCount: bonuses.length
      });
      
      console.log('✅ ИИ Агент: Бонусы успешно рассчитаны и начислены');
      
      return {
        bonusesCalculated: bonuses.length,
        totalAmount: bonuses.reduce((sum, b) => sum + b.amount, 0),
        bonuses
      };
      
    } catch (error) {
      console.error('❌ ИИ Агент: Ошибка расчета бонусов:', error);
      await this.createErrorTask('bonus_calculation_error', error, { orderId });
      throw error;
    }
  }
  
  // 3. Мониторинг системы и создание задач для устранения ошибок
  async monitorSystemHealth() {
    try {
      console.log('🤖 ИИ Агент: Проверяю здоровье системы...');
      
      const healthChecks = [];
      let overallScore = 100;
      
      // Проверка 1: Корректность реферальных связей
      const referralCheck = await this.checkReferralIntegrity();
      healthChecks.push(referralCheck);
      if (!referralCheck.passed) overallScore -= 20;
      
      // Проверка 2: Проблемы с бонусами
      const bonusCheck = await this.checkBonusIntegrity();
      healthChecks.push(bonusCheck);
      if (!bonusCheck.passed) overallScore -= 15;
      
      // Проверка 3: Системные ошибки
      const errorCheck = await this.checkSystemErrors();
      healthChecks.push(errorCheck);
      if (!errorCheck.passed) overallScore -= 10;
      
      // Проверка 4: Производительность базы данных
      const dbCheck = await this.checkDatabasePerformance();
      healthChecks.push(dbCheck);
      if (!dbCheck.passed) overallScore -= 15;
      
      // Генерируем рекомендации ИИ
      const recommendations = await this.generateHealthRecommendations(healthChecks);
      
      const healthReport = {
        score: Math.max(0, overallScore),
        status: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'warning' : 'critical',
        checks: healthChecks,
        recommendations,
        timestamp: new Date()
      };
      
      console.log(`📊 Здоровье системы: ${overallScore}% (${healthReport.status})`);
      
      return healthReport;
      
    } catch (error) {
      console.error('❌ ИИ Агент: Ошибка мониторинга:', error);
      await this.createErrorTask('health_monitoring_error', error);
      throw error;
    }
  }
  
  // Вспомогательные методы
  
  private async buildReferralChain(user: any, maxDepth = 3): Promise<any[]> {
    const chain = [];
    let currentUser = user;
    let level = 1;
    
    while (currentUser.referrer_id && level <= maxDepth) {
      // Находим реферера по ID
      const referrer = await db.select().from(users)
        .where(eq(users.id, currentUser.referrer_id))
        .limit(1);
      
      if (referrer.length === 0) break;
      
      chain.push({
        user: referrer[0],
        level
      });
      
      currentUser = referrer[0];
      level++;
    }
    
    return chain;
  }
  
  private async saveNetworkConnections(networkMap: Map<any, any>, levels: Map<any, any>) {
    // Очищаем старые записи
    await db.delete(networkConnections);
    
    // Сохраняем новые связи
    const userIds = Array.from(networkMap.keys());
    for (const userId of userIds) {
      const node = networkMap.get(userId);
      if (node && node.level > 0) {
        // Находим путь к корню
        const path = this.buildPathToRoot(userId, networkMap);
        
        await db.insert(networkConnections).values({
          user_id: userId,
          referrer_id: this.findDirectReferrer(userId, networkMap),
          level: node.level,
          path,
          is_active: true,
          verified_at: new Date()
        });
      }
    }
  }
  
  private buildPathToRoot(userId: number, networkMap: Map<any, any>): string {
    const path = [userId];
    let current = networkMap.get(userId);
    
    // Поднимаемся по дереву до корня
    while (current && current.level > 0) {
      const referrerId = this.findDirectReferrer(current.user.id, networkMap);
      if (referrerId) {
        path.unshift(referrerId);
        current = networkMap.get(referrerId);
      } else {
        break;
      }
    }
    
    return path.join('->');
  }
  
  private findDirectReferrer(userId: number, networkMap: Map<any, any>): number | null {
    const referrerIds = Array.from(networkMap.keys());
    for (const referrerId of referrerIds) {
      const node = networkMap.get(referrerId);
      if (node && node.children.some((child: any) => child.user.id === userId)) {
        return referrerId;
      }
    }
    return null;
  }
  
  private formatNetworkForDisplay(networkMap: Map<any, any>) {
    const result = [];
    const userIds = Array.from(networkMap.keys());
    
    for (const userId of userIds) {
      const node = networkMap.get(userId);
      if (node && node.level === 0) { // Корневые узлы
        result.push(this.formatNodeRecursive(node));
      }
    }
    
    return result;
  }
  
  private formatNodeRecursive(node: any): any {
    return {
      id: node.user.id,
      name: node.user.name,
      telegramId: node.user.telegram_id,
      level: node.level,
      children: node.children.map((child: any) => this.formatNodeRecursive(child)),
      stats: {
        directReferrals: node.children.length,
        totalNetwork: this.countTotalNetwork(node)
      }
    };
  }
  
  private countTotalNetwork(node: any): number {
    let count = node.children.length;
    for (const child of node.children) {
      count += this.countTotalNetwork(child);
    }
    return count;
  }
  
  private async generateNetworkAnalysis(networkMap: Map<any, any>, allUsers: any[]) {
    // Базовый анализ без использования внешних API
    const networkStats = {
      totalUsers: allUsers.length,
      rootUsers: Array.from(networkMap.values()).filter(n => n.level === 0).length,
      level1Users: Array.from(networkMap.values()).filter(n => n.level === 1).length,
      level2Users: Array.from(networkMap.values()).filter(n => n.level === 2).length,
      level3Users: Array.from(networkMap.values()).filter(n => n.level === 3).length
    };
    
    // Автоматический анализ на основе статистики
    let summary = '';
    const recommendations = [];
    
    if (networkStats.totalUsers === 0) {
      summary = 'Реферальная сеть пуста. Необходимо привлечь первых пользователей.';
      recommendations.push('Запустите маркетинговую кампанию для привлечения базовых пользователей');
    } else if (networkStats.rootUsers === networkStats.totalUsers) {
      summary = 'Все пользователи являются корневыми - реферальная программа не используется.';
      recommendations.push('Активируйте реферальную программу и мотивируйте пользователей приглашать друзей');
      recommendations.push('Увеличьте бонусы за приглашения');
    } else {
      const referralRate = ((networkStats.totalUsers - networkStats.rootUsers) / networkStats.totalUsers * 100).toFixed(1);
      summary = `Реферальная сеть активна: ${referralRate}% пользователей пришли по рефералам. Глубина сети: ${Math.max(
        networkStats.level1Users > 0 ? 1 : 0,
        networkStats.level2Users > 0 ? 2 : 0,
        networkStats.level3Users > 0 ? 3 : 0
      )} уровня.`;
      
      if (parseFloat(referralRate) < 30) {
        recommendations.push('Низкий процент рефералов - увеличьте мотивацию для приглашений');
      }
      if (networkStats.level2Users < networkStats.level1Users * 0.3) {
        recommendations.push('Мало пользователей 2-го уровня - работайте над удержанием рефералов');
      }
      if (networkStats.level3Users === 0) {
        recommendations.push('Отсутствуют пользователи 3-го уровня - развивайте глубину сети');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Реферальная сеть развивается хорошо, продолжайте текущую стратегию');
    }
    
    return {
      summary,
      recommendations
    };
  }
  
  private async checkReferralIntegrity() {
    // Проверяем корректность реферальных связей
    const issues = [];
    
    try {
      // Получаем всех пользователей с реферальными кодами
      const usersWithReferrals = await db
        .select({
          id: users.id,
          name: users.first_name,
          referralCodeUsed: users.applied_referral_code
        })
        .from(users);

      // Получаем все telegram_id для проверки
      const allTelegramIds = await db
        .select({ telegram_id: users.telegram_id })
        .from(users);
      
      const telegramIdSet = new Set(allTelegramIds.map(u => u.telegram_id?.toString()));

      // Проверяем каждого пользователя
      for (const user of usersWithReferrals) {
        if (user.referralCodeUsed && !telegramIdSet.has(user.referralCodeUsed)) {
          issues.push(`Пользователь ${user.name} ссылается на несуществующего реферера ${user.referralCodeUsed}`);
        }
      }
    } catch (error) {
      console.error('Ошибка проверки целостности рефералов:', error);
      issues.push('Ошибка доступа к базе данных при проверке рефералов');
    }
    
    return {
      name: 'Проверка реферальных связей',
      passed: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
    };
  }
  
  private async checkBonusIntegrity() {
    // Проверяем корректность начисления бонусов
    const issues = [];
    
    const pendingBonuses = await db.select().from(userCashbacks)
      .where(eq(userCashbacks.status, 'pending'));
    
    const oldPendingBonuses = pendingBonuses.filter(bonus => {
      const createdDate = new Date(bonus.created_at);
      const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7; // Бонусы висят больше недели
    });
    
    if (oldPendingBonuses.length > 0) {
      issues.push(`${oldPendingBonuses.length} бонусов ожидают обработки более 7 дней`);
    }
    
    return {
      name: 'Проверка системы бонусов',
      passed: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15)
    };
  }
  
  private async checkSystemErrors() {
    // Проверяем критические ошибки в логах
    const issues = [];
    
    const recentErrors = await db.select().from(aiLogs)
      .where(eq(aiLogs.level, 'error'))
      .orderBy(desc(aiLogs.created_at))
      .limit(10);
    
    if (recentErrors.length > 5) {
      issues.push(`Обнаружено ${recentErrors.length} ошибок за последнее время`);
    }
    
    return {
      name: 'Проверка системных ошибок',
      passed: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 10)
    };
  }
  
  private async checkDatabasePerformance() {
    // Простая проверка производительности БД
    const issues = [];
    const startTime = Date.now();
    
    try {
      await db.select().from(users).limit(1);
      const queryTime = Date.now() - startTime;
      
      if (queryTime > 1000) {
        issues.push(`Медленные запросы к базе данных: ${queryTime}мс`);
      }
    } catch (error) {
      issues.push('Ошибка подключения к базе данных');
    }
    
    return {
      name: 'Производительность базы данных',
      passed: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : 50
    };
  }
  
  private async generateHealthRecommendations(healthChecks: any[]) {
    const recommendations = [];
    
    healthChecks.forEach(check => {
      if (!check.passed) {
        switch (check.name) {
          case 'Проверка реферальных связей':
            recommendations.push('Исправить некорректные реферальные связи');
            break;
          case 'Проверка системы бонусов':
            recommendations.push('Обработать застрявшие бонусы');
            break;
          case 'Проверка системных ошибок':
            recommendations.push('Разобрать и исправить системные ошибки');
            break;
          case 'Производительность базы данных':
            recommendations.push('Оптимизировать запросы к базе данных');
            break;
        }
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Система работает стабильно, продолжайте мониторинг');
    }
    
    return recommendations;
  }
  
  private async createErrorTask(type: string, error: any, context?: any) {
    try {
      await db.insert(aiTasks).values({
        type: 'error_fix',
        title: `Ошибка: ${type}`,
        description: error.message || String(error),
        priority: 'high',
        status: 'pending',
        error_data: {
          error: error.message || String(error),
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        context: context || {},
        ai_analysis: {
          errorType: type,
          autoGenerated: true,
          needsAttention: true
        }
      });
      
      console.log(`📋 Создана задача для устранения ошибки: ${type}`);
    } catch (taskError) {
      console.error('Ошибка создания задачи:', taskError);
    }
  }
  
  private async logOperation(level: string, message: string, context?: any) {
    try {
      await db.insert(aiLogs).values({
        level,
        message,
        context: context || {}
      });
    } catch (logError) {
      console.error('Ошибка логирования:', logError);
    }
  }
}

// Создаем экземпляр ИИ агента
const aiAgent = new AIReferralAgent();

// Экспортируем функцию уведомлений для использования в других контроллерах
export const notifyNewReferral = async (newUser: any) => {
  return aiAgent.notifyReferralChain(newUser);
};

// Экспортируем функцию расчета бонусов для использования в других контроллерах
export const calculateBonusesInternal = async (orderId: number) => {
  return aiAgent.calculateAndDistributeBonuses(orderId);
};

// API контроллеры
export const buildReferralNetwork = async (req: Request, res: Response) => {
  try {
    const networkData = await aiAgent.analyzeReferralNetwork();
    
    res.json({
      success: true,
      network: networkData
    });
  } catch (error) {
    console.error('Network analysis error:', error);
    res.status(500).json({
      error: 'Failed to build referral network',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const calculateBonusesAPI = async (req: Request, res: Response) => {
  try {
    console.log('=== API ENDPOINT: calculateBonusesAPI вызван ===');
    const { orderId } = req.body;
    console.log('Получен orderId:', orderId);
    
    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required'
      });
    }
    
    console.log('Вызываем aiAgent.calculateAndDistributeBonuses с orderId:', orderId);
    const result = await aiAgent.calculateAndDistributeBonuses(orderId);
    console.log('Результат от aiAgent:', result);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Bonus calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate bonuses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSystemHealthReport = async (req: Request, res: Response) => {
  try {
    const healthReport = await aiAgent.monitorSystemHealth();
    
    res.json({
      success: true,
      health_score: healthReport.score,
      analysis: {
        status: healthReport.status,
        recommendations: healthReport.recommendations,
        checks: healthReport.checks
      },
      metrics: {
        score: healthReport.score,
        status: healthReport.status,
        checksCount: healthReport.checks.length,
        issuesCount: healthReport.checks.filter(c => !c.passed).length
      }
    });
  } catch (error) {
    console.error('Health report error:', error);
    res.status(500).json({
      error: 'Failed to generate health report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getErrorLogs = async (req: Request, res: Response) => {
  try {
    // Получаем последние ошибки и задачи
    const errorLogs = await db.select().from(aiLogs)
      .where(eq(aiLogs.level, 'error'))
      .orderBy(desc(aiLogs.created_at))
      .limit(20);
    
    const errorTasks = await db.select().from(aiTasks)
      .where(eq(aiTasks.type, 'error_fix'))
      .orderBy(desc(aiTasks.created_at))
      .limit(10);
    
    const formattedErrors = errorTasks.map(task => ({
      id: task.id,
      type: 'system_error',
      message: task.description,
      severity: task.priority === 'critical' ? 'critical' : 
                task.priority === 'high' ? 'high' : 
                task.priority === 'medium' ? 'medium' : 'low',
      resolved: task.status === 'completed',
      created_at: task.created_at
    }));
    
    res.json({
      success: true,
      errors: formattedErrors,
      analysis: {
        totalErrors: formattedErrors.length,
        resolvedErrors: formattedErrors.filter(e => e.resolved).length,
        criticalErrors: formattedErrors.filter(e => e.severity === 'critical').length
      }
    });
  } catch (error) {
    console.error('Error logs retrieval error:', error);
    res.status(500).json({
      error: 'Failed to get error logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};