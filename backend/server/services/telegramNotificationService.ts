import { storage } from '../storage/storage/storage';
import { User } from '../../shared/schema';

interface TelegramNotificationService {
  sendReferralNotification(referrerId: number, newReferral: User, level: number): Promise<void>;
  sendBonusNotification(userId: number, amount: number, sourceUserName: string, level: number): Promise<void>;
}

class TelegramNotificationServiceImpl implements TelegramNotificationService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendReferralNotification(referrerId: number, newReferral: User, level: number): Promise<void> {
    try {
      const referrer = await storage.getUser(referrerId);
      if (!referrer || !referrer.telegram_id) {
        console.log(`Не удалось найти телеграм ID для пользователя ${referrerId}`);
        return;
      }

      const levelText = level === 1 ? '1-го уровня' : level === 2 ? '2-го уровня' : '3-го уровня';
      const bonusPercentage = level === 1 ? '20%' : level === 2 ? '5%' : '1%';

      const message = `🎉 Новый реферал ${levelText}!

👤 ${newReferral.name} зарегистрировался по вашей ссылке
💰 Вы будете получать ${bonusPercentage} с каждой его покупки
🔗 Уровень: ${level}

💡 Ваш реферальный код: ${referrer.telegram_id}
📊 Посмотреть статистику: /stats`;

      await this.sendMessage(referrer.telegram_id, message);
      
      console.log(`✅ Уведомление о реферале отправлено пользователю ${referrer.name} (ID: ${referrer.telegram_id})`);
    } catch (error) {
      console.error('Ошибка отправки уведомления о реферале:', error);
    }
  }

  async sendBonusNotification(userId: number, amount: number, sourceUserName: string, level: number): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.telegram_id) {
        console.log(`Не удалось найти телеграм ID для пользователя ${userId}`);
        return;
      }

      const levelText = level === 1 ? '1-го уровня' : level === 2 ? '2-го уровня' : '3-го уровня';
      const formattedAmount = amount.toFixed(2);

      const message = `💰 Начислен реферальный бонус!

👤 От: ${sourceUserName} (реферал ${levelText})
💵 Сумма: ${formattedAmount} руб.
📈 Уровень: ${level}

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

      await this.sendMessage(user.telegram_id, message);
      
      console.log(`✅ Уведомление о бонусе отправлено пользователю ${user.name} (ID: ${user.telegram_id})`);
    } catch (error) {
      console.error('Ошибка отправки уведомления о бонусе:', error);
    }
  }

  private async sendMessage(telegramId: number, text: string): Promise<void> {
    if (!this.botToken) {
      console.log('Telegram бот не настроен - отсутствует TELEGRAM_BOT_TOKEN');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Ошибка Telegram API для пользователя ${telegramId}:`, errorData);
        
        // Специальные сообщения для разных типов ошибок
        if (errorData.error_code === 400 && errorData.description.includes('chat not found')) {
          console.log(`Пользователь ${telegramId} не начал диалог с ботом. Уведомление не доставлено.`);
        } else if (errorData.error_code === 403) {
          console.log(`Пользователь ${telegramId} заблокировал бота. Уведомление не доставлено.`);
        }
      } else {
        console.log(`✅ Уведомление успешно отправлено пользователю ${telegramId}`);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения в Telegram:', error);
    }
  }
}

export const telegramNotificationService = new TelegramNotificationServiceImpl();