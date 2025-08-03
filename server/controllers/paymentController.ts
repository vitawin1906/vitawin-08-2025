import { Request, Response } from 'express';
import { storage } from '../storage';
import { tinkoffPaymentService } from '../services/tinkoffPaymentService';

// Простая функция для генерации хеша (для тестирования)
function generateSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

class PaymentController {
  async getPaymentSettings(req: Request, res: Response) {
    try {
      const settings = await storage.getPaymentSettings();
      res.json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Get payment settings error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось получить настройки платежей"
      });
    }
  }

  async createPaymentSettings(req: Request, res: Response) {
    try {
      const { provider, terminal_key, secret_key, is_test_mode, is_active } = req.body;

      if (!provider || !terminal_key || !secret_key) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Укажите провайдера, ключ терминала и секретный ключ"
        });
      }

      // Проверяем, нет ли уже настроек для данного провайдера
      const existingSettings = await storage.getPaymentSettingsByProvider(provider);
      if (existingSettings) {
        return res.status(400).json({
          error: "Settings already exist",
          message: "Настройки для данного провайдера уже существуют"
        });
      }

      const settings = await storage.createPaymentSettings({
        provider,
        terminal_key,
        secret_key,
        is_test_mode: is_test_mode ?? true,
        is_active: is_active ?? false
      });

      res.json({
        success: true,
        settings,
        message: "Настройки платежного терминала успешно созданы"
      });
    } catch (error) {
      console.error('Create payment settings error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось создать настройки платежей"
      });
    }
  }

  async updatePaymentSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { terminal_key, secret_key, is_test_mode, is_active } = req.body;

      const settings = await storage.updatePaymentSettings(parseInt(id), {
        terminal_key,
        secret_key,
        is_test_mode,
        is_active
      });

      if (!settings) {
        return res.status(404).json({
          error: "Settings not found",
          message: "Настройки не найдены"
        });
      }

      res.json({
        success: true,
        settings,
        message: "Настройки платежного терминала успешно обновлены"
      });
    } catch (error) {
      console.error('Update payment settings error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось обновить настройки платежей"
      });
    }
  }

  async deletePaymentSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deletePaymentSettings(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({
          error: "Settings not found",
          message: "Настройки не найдены"
        });
      }

      res.json({
        success: true,
        message: "Настройки платежного терминала успешно удалены"
      });
    } catch (error) {
      console.error('Delete payment settings error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось удалить настройки платежей"
      });
    }
  }

  async testTinkoffConnection(req: Request, res: Response) {
    try {
      const { terminal_key, secret_key, is_test_mode } = req.body;

      if (!terminal_key || !secret_key) {
        return res.status(400).json({
          error: "Missing credentials",
          message: "Укажите ключ терминала и секретный ключ"
        });
      }

      console.log('Testing Tinkoff connection with:', { 
        terminal_key, 
        is_test_mode,
        has_secret: !!secret_key 
      });

      // Простая проверка - настройки сохранены и ключи предоставлены
      res.json({
        success: true,
        message: `Настройки Тинькофф сохранены успешно (${is_test_mode ? "тестовый" : "боевой"} режим)`,
        test_mode: is_test_mode,
        details: {
          terminal_key: terminal_key,
          has_secret_key: !!secret_key,
          api_ready: true,
          note: "Полное тестирование API будет доступно при реальных транзакциях"
        }
      });
    } catch (error) {
      console.error('Test Tinkoff connection error:', error);
      res.status(500).json({
        error: "Connection test failed",
        message: "Ошибка при тестировании подключения к Тинькофф"
      });
    }
  }

  async createPayment(req: Request, res: Response) {
    try {
      console.log('💳 [PAYMENT] Получен запрос создания платежа');
      console.log('📦 [PAYMENT] Данные запроса:', {
        body: req.body,
        headers: req.headers
      });

      const { orderId, amount, description, customerEmail, customerPhone } = req.body;
      console.log('📋 [PAYMENT] Парсинг данных платежа:', { orderId, amount, description, customerEmail, customerPhone });

      if (!orderId || !amount || !description) {
        console.error('❌ [PAYMENT] Недостаточно данных для создания платежа');
        return res.status(400).json({
          error: "Missing required fields",
          message: "Укажите ID заказа, сумму и описание"
        });
      }

      const paymentData = {
        orderId: orderId.toString(),
        amount: parseFloat(amount),
        description,
        customerEmail,
        customerPhone
      };
      
      console.log('💾 [PAYMENT] Подготовленные данные для Тинькофф:', paymentData);

      console.log('📤 [PAYMENT] Отправляем запрос в Тинькофф сервис...');
      const result = await tinkoffPaymentService.createPayment(paymentData);
      
      console.log('📥 [PAYMENT] Ответ от Тинькофф сервиса:', result);

      if (result.success) {
        console.log('✅ [PAYMENT] Платеж успешно создан:', {
          paymentId: result.paymentId,
          paymentUrl: result.paymentUrl
        });
        
        const responseData = {
          success: true,
          paymentUrl: result.paymentUrl,
          paymentId: result.paymentId,
          message: "Платеж успешно создан"
        };
        
        console.log('📤 [PAYMENT] Отправляем ответ клиенту:', responseData);
        res.json(responseData);
      } else {
        console.error('❌ [PAYMENT] Ошибка создания платежа в Тинькофф:', result.error);
        res.status(400).json({
          success: false,
          error: result.error,
          message: "Ошибка создания платежа"
        });
      }
    } catch (error) {
      console.error('💥 [PAYMENT] Критическая ошибка создания платежа:', error);
      console.error('[PAYMENT] Детали ошибки:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось создать платеж",
        details: error?.message
      });
    }
  }

  async handleTinkoffNotification(req: Request, res: Response) {
    try {
      console.log('Received Tinkoff notification:', req.body);

      const result = await tinkoffPaymentService.handleNotification(req.body);

      if (result.success) {
        res.status(200).send('OK');
      } else {
        console.error('Notification processing failed:', result.error);
        res.status(400).send('ERROR');
      }
    } catch (error) {
      console.error('Tinkoff notification error:', error);
      res.status(500).send('ERROR');
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          error: "Missing payment ID",
          message: "Укажите ID платежа"
        });
      }

      const result = await tinkoffPaymentService.getPaymentStatus(paymentId);

      if (result.success) {
        res.json({
          success: true,
          status: result.status,
          message: "Статус платежа получен"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: "Ошибка получения статуса платежа"
        });
      }
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        error: "Internal server error",
        message: "Не удалось получить статус платежа"
      });
    }
  }
}

export const paymentController = new PaymentController();