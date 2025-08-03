import { db } from '../storage';
import { storage } from '../storage';
import { orders, users, referrals, referralTransactionLog, orderProcessingLog } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { telegramNotificationService } from './telegramNotificationService';

export class ReferralTransactionService {
  
  // Основная функция обработки оплаченного заказа
  async processOrderPayment(orderId: number): Promise<void> {
    const transactionId = `tx_${nanoid(12)}`;
    
    try {
      // Логируем начало обработки
      await this.logOrderProcessing(orderId, 'payment_confirmed', 'started', {
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      });

      // Получаем заказ
      const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order.length) {
        throw new Error(`Order ${orderId} not found`);
      }

      const orderData = order[0];
      
      // Проверяем статус оплаты - обрабатываем только оплаченные заказы
      if (orderData.payment_status !== 'paid') {
        await this.logOrderProcessing(orderId, 'payment_check', 'skipped', {
          reason: 'Order not paid',
          payment_status: orderData.payment_status
        });
        return;
      }

      // Получаем покупателя
      const buyer = await db.select().from(users).where(eq(users.id, orderData.user_id)).limit(1);
      if (!buyer.length || !buyer[0].referrer_id) {
        await this.logOrderProcessing(orderId, 'referrer_check', 'no_referrer', {
          buyer_id: orderData.user_id,
          has_referrer: false
        });
        return;
      }

      const buyerData = buyer[0];

      // Получаем настройки реферальной программы
      const referralSettings = await storage.getReferralSettings();
      if (!referralSettings) {
        throw new Error('Referral settings not configured');
      }

      // Рассчитываем и создаем бонусы для многоуровневой цепочки
      await this.calculateAndDistributeReferralBonuses(
        transactionId,
        orderData,
        buyerData,
        referralSettings
      );

      // Логируем успешное завершение
      await this.logOrderProcessing(orderId, 'bonus_distribution', 'completed', {
        transaction_id: transactionId,
        total_amount: orderData.total
      });

    } catch (error) {
      // Логируем ошибку
      await this.logOrderProcessing(orderId, 'error', 'failed', {
        transaction_id: transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`❌ Error processing order ${orderId}:`, error);
      throw error;
    }
  }

  // Расчет и распределение реферальных бонусов
  private async calculateAndDistributeReferralBonuses(
    transactionId: string,
    orderData: any,
    buyerData: any,
    referralSettings: any
  ): Promise<void> {
    const orderTotal = parseFloat(orderData.total);
    const commissionRates = [
      { level: 1, rate: parseFloat(referralSettings.level1_commission) / 100 },
      { level: 2, rate: parseFloat(referralSettings.level2_commission) / 100 },
      { level: 3, rate: parseFloat(referralSettings.level3_commission) / 100 },
    ];

    let currentReferrerId = buyerData.referrer_id;

    for (const { level, rate } of commissionRates) {
      if (!currentReferrerId) break;

      const referrer = await db.select().from(users).where(eq(users.id, currentReferrerId)).limit(1);
      if (!referrer.length) break;

      const referrerData = referrer[0];
      const bonusAmount = orderTotal * rate;

      // Создаем детальный лог транзакции
      const logId = await this.logReferralTransaction({
        transaction_id: `${transactionId}_L${level}`,
        order_id: orderData.id,
        buyer_id: buyerData.id,
        referrer_id: currentReferrerId,
        referral_level: level,
        commission_rate: (rate * 100).toFixed(2),
        order_amount: orderTotal.toFixed(2),
        bonus_amount: bonusAmount.toFixed(2),
        status: 'processing',
        metadata: {
          buyer_name: buyerData.first_name,
          referrer_name: referrerData.first_name,
          referrer_telegram_id: referrerData.telegram_id,
          commission_percentage: rate * 100
        }
      });

      try {
        // Создаем запись о реферальном бонусе
        await db.insert(referrals).values({
          user_id: buyerData.id,
          referrer_id: currentReferrerId,
          order_id: orderData.id,
          referral_level: level,
          commission_rate: (rate * 100).toFixed(2),
          reward_earned: bonusAmount.toFixed(2),
        });

        // Отправляем уведомление в Telegram
        try {
          await telegramNotificationService.sendBonusNotification(
            currentReferrerId,
            bonusAmount,
            buyerData.first_name || 'Неизвестный пользователь',
            level
          );

          // Обновляем лог - уведомление отправлено
          await this.updateTransactionLog(logId, {
            telegram_notification_sent: true,
            status: 'completed',
            processed_at: new Date()
          });

          console.log(`✅ Bonus ${bonusAmount.toFixed(2)}₽ processed for ${referrerData.first_name} (Level ${level})`);

        } catch (notificationError) {
          // Обновляем лог - ошибка уведомления
          await this.updateTransactionLog(logId, {
            telegram_notification_sent: false,
            telegram_notification_error: notificationError instanceof Error ? notificationError.message : 'Unknown notification error',
            status: 'notification_failed',
            processed_at: new Date()
          });

          console.error(`❌ Notification failed for ${referrerData.first_name}:`, notificationError);
        }

      } catch (bonusError) {
        // Обновляем лог - ошибка создания бонуса
        await this.updateTransactionLog(logId, {
          status: 'failed',
          processed_at: new Date(),
          metadata: {
            ...logId,
            error: bonusError instanceof Error ? bonusError.message : 'Unknown bonus error'
          }
        });

        console.error(`❌ Bonus creation failed for ${referrerData.first_name}:`, bonusError);
      }

      // Переходим к следующему уровню
      currentReferrerId = referrerData.referrer_id;
    }
  }

  // Логирование транзакции
  private async logReferralTransaction(data: any): Promise<number> {
    const result = await db.insert(referralTransactionLog).values(data).returning({ id: referralTransactionLog.id });
    return result[0].id;
  }

  // Обновление лога транзакции
  private async updateTransactionLog(id: number, updates: any): Promise<void> {
    await db.update(referralTransactionLog)
      .set(updates)
      .where(eq(referralTransactionLog.id, id));
  }

  // Логирование этапов обработки заказа
  private async logOrderProcessing(orderId: number, stage: string, status: string, details: any = {}): Promise<void> {
    await db.insert(orderProcessingLog).values({
      order_id: orderId,
      processing_stage: stage,
      status: status,
      details: details
    });
  }

  // Восстановление неудачных транзакций
  async recoverFailedTransactions(orderId?: number): Promise<void> {
    try {
      const failedTransactions = await db.select()
        .from(referralTransactionLog)
        .where(
          and(
            eq(referralTransactionLog.status, 'failed'),
            orderId ? eq(referralTransactionLog.order_id, orderId) : undefined
          )
        );

      console.log(`🔄 Found ${failedTransactions.length} failed transactions to recover`);

      for (const transaction of failedTransactions) {
        try {
          // Повторно обрабатываем транзакцию
          if (transaction.order_id) {
            await this.processOrderPayment(transaction.order_id);
          }
        } catch (error) {
          console.error(`❌ Failed to recover transaction ${transaction.transaction_id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in recovery process:', error);
    }
  }

  // Получение статистики по логам
  async getTransactionStats(): Promise<any> {
    const stats = await db.select()
      .from(referralTransactionLog);

    const summary = {
      total: stats.length,
      completed: stats.filter(t => t.status === 'completed').length,
      failed: stats.filter(t => t.status === 'failed').length,
      notification_failed: stats.filter(t => t.status === 'notification_failed').length,
      pending: stats.filter(t => t.status === 'pending' || t.status === 'processing').length,
    };

    return {
      summary,
      recent_transactions: stats.slice(-10)
    };
  }
}

export const referralTransactionService = new ReferralTransactionService();