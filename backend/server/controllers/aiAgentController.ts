import { Request, Response } from "express";
import { storage } from "../storage/storage/storage";

// ЗАГЛУШКА вместо OpenAI
export const aiAgentControllerStub = (req, res) => {
  res.status(501).json({ error: 'AI functionality is disabled (no OpenAI key)' });
};

interface ReferralNetworkNode {
  userId: number;
  telegramId: number;
  firstName: string;
  username?: string;
  level: number;
  directReferrals: ReferralNetworkNode[];
  totalEarnings: number;
  ordersCount: number;
  lastActivity: Date;
}

interface SystemError {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  stack?: string;
  context: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class AIAgentController {
  private errors: SystemError[] = [];

  // Построение полной реферальной сети
  async buildReferralNetwork(req: Request, res: Response) {
    try {
      const allUsers = await storage.getAllUsers({ limit: 1000, offset: 0 });
      const networkMap = new Map<number, ReferralNetworkNode>();

      // Создаем базовые узлы для всех пользователей
      for (const user of allUsers.users) {
        const orders = await storage.getOrders(user.id);
        const referrals = await storage.getReferralsByUser(user.id);
        const totalEarnings = referrals.reduce((sum, r) => sum + parseFloat(r.reward_earned || "0"), 0);

        networkMap.set(user.id, {
          userId: user.id,
          telegramId: user.telegram_id,
          firstName: user.first_name,
          username: user.username || undefined,
          level: 0,
          directReferrals: [],
          totalEarnings,
          ordersCount: orders.length,
          lastActivity: user.created_at,
        });
      }

      // Строим связи между пользователями
      const rootNodes: ReferralNetworkNode[] = [];
      
      for (const user of allUsers.users) {
        const node = networkMap.get(user.id)!;
        
        if (user.referrer_id) {
          const parent = networkMap.get(user.referrer_id);
          if (parent) {
            parent.directReferrals.push(node);
            node.level = this.calculateUserLevel(user.id, networkMap, new Set());
          }
        } else {
          rootNodes.push(node);
        }
      }

      // Анализ сети с помощью ИИ
      const networkAnalysis = await this.analyzeNetworkWithAI(rootNodes);

      res.json({
        success: true,
        network: {
          totalUsers: allUsers.total,
          rootNodes: rootNodes.length,
          maxDepth: this.getMaxDepth(rootNodes),
          analysis: networkAnalysis,
          fullNetwork: rootNodes,
        },
      });

    } catch (error) {
      console.error('Network analysis error:', error);
      res.status(500).json({
        error: "Failed to build referral network",
        message: "Ошибка при построении реферальной сети",
      });
    }
  }

  // Расчет уровня пользователя в сети
  private calculateUserLevel(userId: number, networkMap: Map<number, ReferralNetworkNode>, visited: Set<number>): number {
    if (visited.has(userId)) return 0; // Избегаем циклов
    visited.add(userId);

    const node = networkMap.get(userId);
    if (!node) return 0;

    let maxChildLevel = 0;
    for (const child of node.directReferrals) {
      const childLevel = this.calculateUserLevel(child.userId, networkMap, new Set(visited));
      maxChildLevel = Math.max(maxChildLevel, childLevel);
    }

    return maxChildLevel + 1;
  }

  // Получение максимальной глубины сети
  private getMaxDepth(nodes: ReferralNetworkNode[]): number {
    let maxDepth = 0;
    
    const traverse = (node: ReferralNetworkNode, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const child of node.directReferrals) {
        traverse(child, depth + 1);
      }
    };

    nodes.forEach(node => traverse(node, 1));
    return maxDepth;
  }

  // Анализ сети с помощью ИИ
  private async analyzeNetworkWithAI(network: ReferralNetworkNode[]): Promise<any> {
    try {
      const networkSummary = {
        totalNodes: this.countTotalNodes(network),
        maxDepth: this.getMaxDepth(network),
        topEarners: this.getTopEarners(network, 5),
        activeUsers: this.getActiveUsers(network),
        potentialIssues: this.detectNetworkIssues(network),
      };

      const prompt = `
Проанализируй следующую реферальную сеть интернет-магазина:

Общая статистика:
- Всего пользователей: ${networkSummary.totalNodes}
- Максимальная глубина: ${networkSummary.maxDepth}
- Активных пользователей: ${networkSummary.activeUsers}

Топ по заработку:
${networkSummary.topEarners.map(user => `- ${user.firstName}: ${user.totalEarnings} руб. (${user.directReferrals.length} рефералов)`).join('\n')}

Потенциальные проблемы:
${networkSummary.potentialIssues.join('\n')}

Дай рекомендации по:
1. Оптимизации структуры комиссий
2. Выявлению неактивных узлов
3. Стимулированию роста сети
4. Предотвращению мошенничества

Ответ в формате JSON с полями: recommendations, insights, warnings, actionItems.
`;

      // ЗАГЛУШКА вместо OpenAI
      return {
        recommendations: ["AI analysis is disabled (no OpenAI key)"],
        insights: ["AI analysis is disabled (no OpenAI key)"],
        warnings: ["AI analysis is disabled (no OpenAI key)"],
        actionItems: ["AI analysis is disabled (no OpenAI key)"],
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      return {
        recommendations: ["Не удалось получить рекомендации ИИ"],
        insights: ["Анализ временно недоступен"],
        warnings: [],
        actionItems: [],
      };
    }
  }

  // Подсчет общего количества узлов
  private countTotalNodes(nodes: ReferralNetworkNode[]): number {
    let count = 0;
    const traverse = (node: ReferralNetworkNode) => {
      count++;
      node.directReferrals.forEach(traverse);
    };
    nodes.forEach(traverse);
    return count;
  }

  // Получение топ пользователей по заработку
  private getTopEarners(nodes: ReferralNetworkNode[], limit: number): ReferralNetworkNode[] {
    const allNodes: ReferralNetworkNode[] = [];
    const traverse = (node: ReferralNetworkNode) => {
      allNodes.push(node);
      node.directReferrals.forEach(traverse);
    };
    nodes.forEach(traverse);

    return allNodes
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);
  }

  // Получение количества активных пользователей
  private getActiveUsers(nodes: ReferralNetworkNode[]): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let activeCount = 0;
    const traverse = (node: ReferralNetworkNode) => {
      if (node.lastActivity > oneMonthAgo || node.ordersCount > 0) {
        activeCount++;
      }
      node.directReferrals.forEach(traverse);
    };
    nodes.forEach(traverse);

    return activeCount;
  }

  // Выявление проблем в сети
  private detectNetworkIssues(nodes: ReferralNetworkNode[]): string[] {
    const issues: string[] = [];
    
    const traverse = (node: ReferralNetworkNode, depth: number) => {
      // Слишком глубокая вложенность
      if (depth > 5) {
        issues.push(`Пользователь ${node.firstName} находится на уровне ${depth} (возможно, неэффективная структура)`);
      }

      // Пользователь с множественными рефералами, но без заработка
      if (node.directReferrals.length > 5 && node.totalEarnings === 0) {
        issues.push(`Пользователь ${node.firstName} имеет ${node.directReferrals.length} рефералов, но не получает комиссии`);
      }

      // Неактивные узлы с рефералами
      if (node.ordersCount === 0 && node.directReferrals.length > 0) {
        issues.push(`Пользователь ${node.firstName} привлек рефералов, но сам не делал покупок`);
      }

      node.directReferrals.forEach(child => traverse(child, depth + 1));
    };

    nodes.forEach(node => traverse(node, 1));
    return issues;
  }

  // Автоматический расчет и начисление бонусов
  async calculateReferralBonuses(req: Request, res: Response) {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({
          error: "Order ID required",
          message: "Укажите ID заказа для расчета бонусов",
        });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          message: "Заказ не найден",
        });
      }

      const buyer = await storage.getUser(order.user_id);
      if (!buyer || !buyer.referrer_id) {
        return res.json({
          success: true,
          message: "No referrer for this user",
          bonuses: [],
        });
      }

      // Получаем актуальные настройки реферальной программы из БД
      const referralSettings = await storage.getReferralSettings();
      if (!referralSettings) {
        return res.status(500).json({
          error: "Referral settings not found",
          message: "Настройки реферальной программы не найдены",
        });
      }

      const orderTotal = parseFloat(order.total);
      const commissionRates = [
        { level: 1, rate: parseFloat(referralSettings.level1_commission) / 100 },
        { level: 2, rate: parseFloat(referralSettings.level2_commission) / 100 },
        { level: 3, rate: parseFloat(referralSettings.level3_commission) / 100 },
      ];

      const bonuses = [];
      let currentReferrerId = buyer.referrer_id;

      for (const { level, rate } of commissionRates) {
        if (!currentReferrerId) break;

        const referrer = await storage.getUser(currentReferrerId);
        if (!referrer) break;

        const bonus = orderTotal * rate;

        // Создаем запись о бонусе
        const referral = await storage.createReferral({
          user_id: buyer.id,
          referrer_id: currentReferrerId,
          order_id: orderId,
          referral_level: level,
          commission_rate: (rate * 100).toFixed(2),
          reward_earned: bonus.toFixed(2),
        });

        bonuses.push({
          level,
          referrer: {
            id: referrer.id,
            name: referrer.first_name,
            telegramId: referrer.telegram_id,
          },
          bonus: bonus.toFixed(2),
          rate: `${(rate * 100)}%`,
        });

        // Отправляем уведомление о бонусе в Telegram
        try {
          const { telegramNotificationService } = await import('../services/telegramNotificationService');
          await telegramNotificationService.sendBonusNotification(
            referrer.id,
            bonus,
            buyer.first_name || 'Неизвестный пользователь',
            level
          );
          console.log(`✅ Уведомление отправлено ${referrer.first_name} (ID: ${referrer.telegram_id}) о бонусе ${bonus.toFixed(2)}₽`);
        } catch (notificationError) {
          console.error(`❌ Ошибка отправки уведомления ${referrer.first_name}:`, notificationError);
        }

        // Переходим к следующему уровню
        currentReferrerId = referrer.referrer_id;
      }

      // Анализ с помощью ИИ
      const analysis = await this.analyzeBonusDistribution(bonuses, orderTotal);

      res.json({
        success: true,
        orderId,
        orderTotal: orderTotal.toFixed(2),
        bonuses,
        totalDistributed: bonuses.reduce((sum, b) => sum + parseFloat(b.bonus), 0).toFixed(2),
        analysis,
      });

    } catch (error) {
      console.error('Bonus calculation error:', error);
      res.status(500).json({
        error: "Failed to calculate bonuses",
        message: "Ошибка при расчете бонусов",
      });
    }
  }

  // Анализ распределения бонусов с помощью ИИ
  private async analyzeBonusDistribution(bonuses: any[], orderTotal: number): Promise<any> {
    try {
      const totalDistributed = bonuses.reduce((sum, b) => sum + parseFloat(b.bonus), 0);
      const distributionPercentage = ((totalDistributed / orderTotal) * 100).toFixed(2);

      const prompt = `
Проанализируй распределение реферальных бонусов:

Заказ на сумму: ${orderTotal} руб.
Всего распределено: ${totalDistributed.toFixed(2)} руб. (${distributionPercentage}%)

Распределение по уровням:
${bonuses.map(b => `Уровень ${b.level}: ${b.bonus} руб. (${b.rate})`).join('\n')}

Оцени:
1. Справедливость распределения
2. Эффективность мотивации
3. Риски для прибыльности
4. Рекомендации по оптимизации

Ответ в JSON с полями: fairness_score (1-10), efficiency_score (1-10), risk_level, recommendations.
`;

      // ЗАГЛУШКА вместо OpenAI
      return {
        fairness_score: 7,
        efficiency_score: 7,
        risk_level: "medium",
        recommendations: ["AI analysis is disabled (no OpenAI key)"],
      };
    } catch (error) {
      return {
        fairness_score: 7,
        efficiency_score: 7,
        risk_level: "medium",
        recommendations: ["Анализ ИИ временно недоступен"],
      };
    }
  }

  // Логирование ошибок
  private async logError(type: string, error: Error, context: any = {}) {
    const errorLog: SystemError = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message: error.message,
      stack: error.stack,
      context,
      severity: this.determineSeverity(error, type),
      resolved: false,
    };

    this.errors.push(errorLog);

    // Ограничиваем размер лога
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-500);
    }

    console.error(`[AI Agent Error Log] ${type}:`, errorLog);

    // Отправляем критические ошибки в ИИ для анализа
    if (errorLog.severity === 'critical') {
      await this.analyzeAndReportCriticalError(errorLog);
    }
  }

  // Определение серьезности ошибки
  private determineSeverity(error: Error, type: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes = ['database', 'payment', 'auth'];
    const criticalKeywords = ['connection', 'timeout', 'unauthorized', 'payment_failed'];

    if (criticalTypes.includes(type)) return 'critical';
    
    const errorText = (error.message + error.stack).toLowerCase();
    if (criticalKeywords.some(keyword => errorText.includes(keyword))) {
      return 'critical';
    }

    if (type.includes('network') || type.includes('api')) return 'high';
    if (type.includes('validation') || type.includes('user')) return 'medium';
    
    return 'low';
  }

  // Анализ критических ошибок с помощью ИИ
  private async analyzeAndReportCriticalError(errorLog: SystemError) {
    try {
      const prompt = `
КРИТИЧЕСКАЯ ОШИБКА СИСТЕМЫ:

Тип: ${errorLog.type}
Время: ${errorLog.timestamp.toISOString()}
Сообщение: ${errorLog.message}
Контекст: ${JSON.stringify(errorLog.context, null, 2)}

Проанализируй ошибку и предложи:
1. Возможные причины
2. Срочные действия для исправления
3. Меры предотвращения повторения
4. Приоритет решения (1-5)

Ответ в JSON с полями: causes, immediate_actions, prevention_measures, priority, estimated_impact.
`;

      // ЗАГЛУШКА вместо OpenAI
      console.error(`[AI CRITICAL ERROR ANALYSIS]`, {
        errorId: errorLog.id,
        analysis: {
          causes: ["AI analysis is disabled (no OpenAI key)"],
          immediate_actions: ["AI analysis is disabled (no OpenAI key)"],
          prevention_measures: ["AI analysis is disabled (no OpenAI key)"],
          priority: "low",
          estimated_impact: "low",
        },
      });

      // В реальной системе здесь можно отправить уведомление администраторам
      
    } catch (analysisError) {
      console.error("Failed to analyze critical error:", analysisError);
    }
  }

  // Получение логов ошибок
  async getErrorLogs(req: Request, res: Response) {
    try {
      const { severity, limit = 50, offset = 0 } = req.query;
      
      let filteredErrors = this.errors;
      if (severity) {
        filteredErrors = this.errors.filter(e => e.severity === severity);
      }

      const paginatedErrors = filteredErrors
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(Number(offset), Number(offset) + Number(limit));

      const summary = {
        total: filteredErrors.length,
        by_severity: {
          critical: this.errors.filter(e => e.severity === 'critical').length,
          high: this.errors.filter(e => e.severity === 'high').length,
          medium: this.errors.filter(e => e.severity === 'medium').length,
          low: this.errors.filter(e => e.severity === 'low').length,
        },
        unresolved: this.errors.filter(e => !e.resolved).length,
      };

      res.json({
        success: true,
        errors: paginatedErrors,
        summary,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: filteredErrors.length,
        },
      });

    } catch (error) {
      res.status(500).json({
        error: "Failed to get error logs",
        message: "Ошибка при получении логов",
      });
    }
  }

  // Анализ общего состояния системы
  async getSystemHealthReport(req: Request, res: Response) {
    try {
      // Сбор статистики
      const users = await storage.getAllUsers({ limit: 1000, offset: 0 });
      const orders = await storage.getAllOrders({ limit: 1000, offset: 0 });
      
      const recentErrors = this.errors.filter(e => {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return e.timestamp > oneDayAgo;
      });

      const healthMetrics = {
        users: {
          total: users.total,
          new_today: users.users.filter(u => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return new Date(u.created_at) >= today;
          }).length,
        },
        orders: {
          total: orders.total,
          today: orders.orders.filter(o => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return new Date(o.created_at) >= today;
          }).length,
        },
        errors: {
          total_24h: recentErrors.length,
          critical_24h: recentErrors.filter(e => e.severity === 'critical').length,
          unresolved: this.errors.filter(e => !e.resolved).length,
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
      };

      // ИИ анализ состояния системы
      const aiHealthAnalysis = await this.analyzeSystemHealthWithAI(healthMetrics);

      res.json({
        success: true,
        health_score: aiHealthAnalysis.health_score || 85,
        metrics: healthMetrics,
        analysis: aiHealthAnalysis,
        recommendations: aiHealthAnalysis.recommendations || [],
        alerts: aiHealthAnalysis.alerts || [],
      });

    } catch (error) {
      console.error('Health report error:', error);
      res.status(500).json({
        error: "Failed to generate health report",
        message: "Ошибка при создании отчета о состоянии системы",
      });
    }
  }

  // ИИ анализ состояния системы
  private async analyzeSystemHealthWithAI(metrics: any): Promise<any> {
    try {
      const prompt = `
Проанализируй состояние системы интернет-магазина:

МЕТРИКИ:
Пользователи: ${metrics.users.total} (новых сегодня: ${metrics.users.new_today})
Заказы: ${metrics.orders.total} (сегодня: ${metrics.orders.today})
Ошибки за 24ч: ${metrics.errors.total_24h} (критических: ${metrics.errors.critical_24h})
Нерешенных ошибок: ${metrics.errors.unresolved}
Время работы: ${Math.round(metrics.system.uptime / 3600)} часов

Оцени здоровье системы по шкале 1-100 и дай рекомендации.

Ответ в JSON: health_score, status, recommendations, alerts, action_priority.
`;

      // ЗАГЛУШКА вместо OpenAI
      return {
        health_score: 85,
        status: "healthy",
        recommendations: ["AI analysis is disabled (no OpenAI key)"],
        alerts: [],
        action_priority: "low",
      };
    } catch (error) {
      return {
        health_score: 85,
        status: "healthy",
        recommendations: ["ИИ анализ временно недоступен"],
        alerts: [],
        action_priority: "low",
      };
    }
  }
}

export const aiAgentController = new AIAgentController();