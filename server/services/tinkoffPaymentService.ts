import crypto from 'crypto';
import { storage } from '../storage';

interface TinkoffInitRequest {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description: string;
  CustomerKey?: string;
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
  Token: string;
}

interface TinkoffInitResponse {
  Success: boolean;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
  TerminalKey?: string;
  Status?: string;
  PaymentId?: string;
  OrderId?: string;
  Amount?: number;
  PaymentURL?: string;
}

export class TinkoffPaymentService {
  private async getActiveSettings() {
    const settings = await storage.getPaymentSettingsByProvider('tinkoff');
    if (!settings || !settings.is_active) {
      throw new Error('Тинькофф терминал не настроен или отключен');
    }
    return settings;
  }

  private generateToken(params: Record<string, any>, secretKey: string): string {
    // Удаляем поля, которые не участвуют в формировании токена
    const tokenParams = { ...params };
    delete tokenParams.Token;
    delete tokenParams.DATA;
    delete tokenParams.Receipt;

    // Добавляем Password (секретный ключ)
    tokenParams.Password = secretKey;

    // Сортируем параметры по ключу
    const sortedKeys = Object.keys(tokenParams).sort();
    
    // Формируем строку для хеширования
    const values = sortedKeys.map(key => tokenParams[key]).join('');
    
    // Возвращаем SHA256 хеш
    return crypto.createHash('sha256').update(values).digest('hex');
  }

  private getApiUrl(isTestMode: boolean): string {
    return isTestMode 
      ? 'https://rest-api-test.tinkoff.ru/v2/'
      : 'https://securepay.tinkoff.ru/v2/';
  }

  async createPayment(data: {
    orderId: string;
    amount: number;
    description: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<{ success: boolean; paymentUrl?: string; paymentId?: string; error?: string }> {
    try {
      const settings = await this.getActiveSettings();
      const apiUrl = this.getApiUrl(settings.is_test_mode || false);

      // Конвертируем сумму в копейки
      const amountInKopecks = Math.round(data.amount * 100);

      // Формируем параметры для запроса
      const params: any = {
        TerminalKey: settings.terminal_key,
        Amount: amountInKopecks,
        OrderId: data.orderId,
        Description: data.description,
        NotificationURL: `https://vitawins.ru/api/payment/webhook`,
        SuccessURL: `https://vitawins.ru/checkout/success`,
        FailURL: `https://vitawins.ru/checkout/fail`,
      };

      // Добавляем информацию о клиенте, если есть
      if (data.customerEmail) {
        params.CustomerKey = data.customerEmail;
      }

      // Генерируем токен
      params.Token = this.generateToken(params, settings.secret_key);

      console.log('Создание платежа Тинькофф:', {
        orderId: data.orderId,
        amount: data.amount,
        amountInKopecks,
        isTestMode: settings.is_test_mode
      });

      // Отправляем запрос к API Тинькофф
      const response = await fetch(`${apiUrl}Init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result: TinkoffInitResponse = await response.json();

      console.log('Ответ Тинькофф API:', result);

      if (result.Success && result.PaymentURL && result.PaymentId) {
        // Сохраняем информацию о платеже в базу данных
        await storage.createPaymentTransaction({
          payment_id: result.PaymentId,
          order_id: data.orderId,
          amount: data.amount.toString(),
          currency: 'RUB',
          status: 'pending',
          provider: 'tinkoff',
          metadata: JSON.stringify({
            terminal_key: settings.terminal_key,
            is_test_mode: settings.is_test_mode,
            description: data.description,
            provider_payment_id: result.PaymentId
          })
        });

        return {
          success: true,
          paymentUrl: result.PaymentURL,
          paymentId: result.PaymentId
        };
      } else {
        console.error('Ошибка создания платежа:', result);
        return {
          success: false,
          error: result.Message || result.Details || 'Ошибка при создании платежа'
        };
      }
    } catch (error) {
      console.error('Ошибка при работе с Тинькофф API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  async handleNotification(notificationData: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Получено уведомление от Тинькофф:', notificationData);

      const { TerminalKey, OrderId, Success, Status, PaymentId, ErrorCode, Amount } = notificationData;

      // Проверяем подпись уведомления
      const settings = await this.getActiveSettings();
      if (TerminalKey !== settings.terminal_key) {
        console.error('Неверный TerminalKey в уведомлении');
        return { success: false, error: 'Invalid terminal key' };
      }

      // Проверяем токен уведомления
      const expectedToken = this.generateToken(notificationData, settings.secret_key);
      if (notificationData.Token !== expectedToken) {
        console.error('Неверная подпись уведомления');
        return { success: false, error: 'Invalid signature' };
      }

      // Обновляем статус платежа в базе данных
      const paymentStatus = Success === 'true' && Status === 'CONFIRMED' ? 'paid' : 'failed';
      
      await storage.updatePaymentTransactionStatus(PaymentId, paymentStatus);

      // Если платеж успешен, обновляем статус заказа
      if (paymentStatus === 'paid') {
        const orderId = parseInt(OrderId);
        await storage.updateOrderStatus(orderId, 'paid');

        console.log(`✅ Платеж подтвержден для заказа ${OrderId}, сумма: ${Amount / 100} руб.`);

        // Импортируем и запускаем обработку реферальных бонусов
        const { paymentProcessor } = await import('./paymentProcessor');
        await paymentProcessor.processPaymentConfirmation(orderId);
      } else {
        console.log(`❌ Платеж отклонен для заказа ${OrderId}, код ошибки: ${ErrorCode}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка обработки уведомления Тинькофф:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const settings = await this.getActiveSettings();
      const apiUrl = this.getApiUrl(settings.is_test_mode || false);

      const params = {
        TerminalKey: settings.terminal_key,
        PaymentId: paymentId,
      };

      const token = this.generateToken(params, settings.secret_key);

      const response = await fetch(`${apiUrl}GetState`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          Token: token,
        }),
      });

      const result = await response.json();

      if (result.Success) {
        return {
          success: true,
          status: result.Status
        };
      } else {
        return {
          success: false,
          error: result.Message || 'Ошибка получения статуса платежа'
        };
      }
    } catch (error) {
      console.error('Ошибка получения статуса платежа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const tinkoffPaymentService = new TinkoffPaymentService();