import { storage } from '../storage';
import { telegramNotificationService } from './telegramNotificationService';

// Простая система обработки оплаченных заказов с логированием
export class PaymentProcessor {
  
  // Обработка подтверждения оплаты заказа
  async processPaymentConfirmation(orderId: number): Promise<void> {
    try {
      console.log(`🔄 Processing payment confirmation for order ${orderId}...`);
      
      // Получаем заказ
      const order = await storage.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Проверяем что заказ действительно оплачен
      if (order.payment_status !== 'paid') {
        console.log(`⚠️ Order ${orderId} is not paid, skipping bonus processing`);
        return;
      }

      // Получаем покупателя
      const buyer = await storage.getUser(order.user_id);
      if (!buyer || !buyer.referrer_id) {
        console.log(`ℹ️ Order ${orderId} has no referrer, skipping bonus processing`);
        return;
      }

      // Получаем настройки реферальной программы
      const referralSettings = await storage.getReferralSettings();
      if (!referralSettings) {
        console.log(`⚠️ Referral settings not configured, using defaults`);
        // Используем настройки по умолчанию
        await this.processReferralBonuses(orderId, order, buyer, {
          level1_commission: '20.00',
          level2_commission: '5.00',
          level3_commission: '1.00'
        });
      } else {
        await this.processReferralBonuses(orderId, order, buyer, referralSettings);
      }

      console.log(`✅ Payment processing completed for order ${orderId}`);

    } catch (error) {
      console.error(`❌ Error processing payment for order ${orderId}:`, error);
      
      // Логируем ошибку для последующего анализа
      await this.logError(orderId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Обработка реферальных бонусов для оплаченного заказа
  private async processReferralBonuses(orderId: number, order: any, buyer: any, settings: any): Promise<void> {
    const orderTotal = parseFloat(order.total);
    const commissionRates = [
      { level: 1, rate: parseFloat(settings.level1_commission) / 100 },
      { level: 2, rate: parseFloat(settings.level2_commission) / 100 },
      { level: 3, rate: parseFloat(settings.level3_commission) / 100 },
    ];

    let currentReferrerId = buyer.referrer_id;

    for (const { level, rate } of commissionRates) {
      if (!currentReferrerId) break;

      const referrer = await storage.getUser(currentReferrerId);
      if (!referrer) break;

      const bonusAmount = orderTotal * rate;

      try {
        // Создаем запись о реферальном бонусе
        await storage.createReferral({
          user_id: buyer.id,
          referrer_id: currentReferrerId,
          order_id: orderId,
          referral_level: level,
          commission_rate: (rate * 100).toFixed(2),
          reward_earned: bonusAmount.toFixed(2),
        });

        // Отправляем уведомление в Telegram
        await telegramNotificationService.sendBonusNotification(
          currentReferrerId,
          bonusAmount,
          buyer.first_name || 'Неизвестный пользователь',
          level
        );

        console.log(`💰 Bonus ${bonusAmount.toFixed(2)}₽ processed and notified for ${referrer.first_name} (Level ${level})`);

        // Логируем успешную транзакцию
        await this.logTransaction(orderId, currentReferrerId, level, bonusAmount, 'completed');

      } catch (error) {
        console.error(`❌ Failed to process bonus for ${referrer.first_name}:`, error);
        
        // Логируем неудачную транзакцию для последующего восстановления
        await this.logTransaction(orderId, currentReferrerId, level, bonusAmount, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }

      // Переходим к следующему уровню
      currentReferrerId = referrer.referrer_id;
    }
  }

  // Простое логирование транзакций
  private async logTransaction(orderId: number, referrerId: number, level: number, amount: number, status: string, error?: string): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      order_id: orderId,
      referrer_id: referrerId,
      level: level,
      amount: amount.toFixed(2),
      status: status,
      error: error || null
    };

    // Простое логирование в консоль и базу данных
    console.log('📝 Transaction Log:', JSON.stringify(logEntry));
    
    // Здесь можно добавить сохранение в отдельную таблицу логов при необходимости
  }

  // Логирование ошибок
  private async logError(orderId: number, error: string): Promise<void> {
    const errorLog = {
      timestamp: new Date().toISOString(),
      order_id: orderId,
      error: error,
      type: 'payment_processing_error'
    };

    console.log('🚨 Error Log:', JSON.stringify(errorLog));
  }

  // Восстановление неудачных транзакций для конкретного заказа
  async retryFailedOrder(orderId: number): Promise<void> {
    console.log(`🔄 Retrying failed transactions for order ${orderId}...`);
    
    try {
      // Проверяем статус оплаты и повторно обрабатываем
      const order = await storage.getOrder(orderId);
      if (order && order.payment_status === 'paid') {
        await this.processPaymentConfirmation(orderId);
      } else {
        console.log(`⚠️ Order ${orderId} is not paid, cannot retry`);
      }
    } catch (error) {
      console.error(`❌ Failed to retry order ${orderId}:`, error);
    }
  }
}

export const paymentProcessor = new PaymentProcessor();