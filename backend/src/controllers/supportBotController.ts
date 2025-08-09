import { Request, Response } from 'express';
import { storage } from '../storage/storage/storage';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

// Функция для отправки сообщения через бота поддержки
async function sendSupportMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_SUPPORT_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (!result.ok) {
      console.error('Support Bot API error:', result);
    }
    return result;
  } catch (error) {
    console.error('Error sending support message:', error);
    return { ok: false, error };
  }
}

// Функция для создания клавиатуры поддержки
function createSupportKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "📞 Связаться с менеджером",
          callback_data: "contact_manager"
        }
      ],
      [
        {
          text: "❓ Часто задаваемые вопросы",
          callback_data: "faq"
        },
        {
          text: "📋 Инструкции",
          callback_data: "instructions"
        }
      ],
      [
        {
          text: "🛒 Перейти в магазин",
          url: "https://vitawins.ru"
        }
      ],
      [
        {
          text: "👤 Основной бот",
          url: "https://t.me/Vitawin_bot"
        }
      ]
    ]
  };
}

class SupportBotController {
  // Webhook для бота поддержки
  async webhook(req: Request, res: Response) {
    try {
      console.log('Support Bot webhook received:', JSON.stringify(req.body, null, 2));
      
      const update: TelegramUpdate = req.body;
      
      // Обработка callback запросов
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const user = callbackQuery.from;
        const data = callbackQuery.data;
        const chatId = callbackQuery.message?.chat.id;

        if (!chatId) {
          res.status(200).json({ ok: true });
          return;
        }

        console.log(`Processing callback query from user ${user.id}: ${data}`);

        switch (data) {
          case 'contact_manager':
            await sendSupportMessage(chatId, `🎯 Для связи с менеджером:

📱 Телефон: +7 (999) 123-45-67
📧 Email: support@vitawins.ru
💬 Telegram: @vitawin_manager

⏰ Время работы: ПН-ПТ 9:00-18:00 (МСК)

🔔 Мы ответим в течение 2-4 часов в рабочее время.`);
            break;

          case 'faq':
            await sendSupportMessage(chatId, `❓ Часто задаваемые вопросы:

🛒 <b>Как сделать заказ?</b>
Перейдите в магазин через @Vitawin_bot и выберите товары

💳 <b>Какие способы оплаты?</b>
Банковские карты, электронные кошельки

🚚 <b>Сроки доставки?</b>
3-7 рабочих дней по России

💰 <b>Как работает реферальная программа?</b>
Получайте 20% с первого уровня, 5% со второго уровня

📞 Для других вопросов нажмите "Связаться с менеджером"`);
            break;

          case 'instructions':
            await sendSupportMessage(chatId, `📋 Пошаговые инструкции:

1️⃣ <b>Регистрация</b>
Напишите /start в @Vitawin_bot

2️⃣ <b>Получение реферального кода</b>
Ваш код = ваш Telegram ID

3️⃣ <b>Приглашение друзей</b>
Поделитесь своим кодом

4️⃣ <b>Получение бонусов</b>
Автоматически после покупки рефералов

5️⃣ <b>Вывод средств</b>
Через личный кабинет на сайте

💡 Нужна помощь? Свяжитесь с менеджером!`);
            break;

          default:
            await sendSupportMessage(chatId, '❌ Неизвестная команда');
        }

        res.status(200).json({ ok: true });
        return;
      }

      // Обработка текстовых сообщений
      if (!update.message || !update.message.text) {
        console.log('No message or text in support bot update, skipping');
        res.status(200).json({ ok: true });
        return;
      }

      const message = update.message;
      const user = message.from;
      const text = message.text?.trim();

      if (!user) {
        console.log('No user data in support bot message, skipping');
        res.status(200).json({ ok: true });
        return;
      }

      console.log(`Processing support message from user ${user.id}: ${text}`);

      // Обработка команды /start
      if (text && (text === '/start' || text.startsWith('/start '))) {
        const welcomeMessage = `🤝 Добро пожаловать в службу поддержки VitaWin!

Я помогу вам с:
• Вопросами по заказам
• Реферальной программе  
• Техническими проблемами
• Связью с менеджером

Выберите нужную опцию:`;

        const keyboard = createSupportKeyboard();
        await sendSupportMessage(message.chat.id, welcomeMessage, keyboard);
      }
      // Обработка команды /help
      else if (text === '/help') {
        const helpMessage = `📖 Доступные команды:

/start - Главное меню поддержки
/help - Справка по командам
/contact - Контакты службы поддержки

💬 Также вы можете просто написать ваш вопрос, и мы ответим!`;

        await sendSupportMessage(message.chat.id, helpMessage);
      }
      // Обработка команды /contact
      else if (text === '/contact') {
        await sendSupportMessage(message.chat.id, `📞 Контакты службы поддержки VitaWin:

📱 Телефон: +7 (999) 123-45-67
📧 Email: support@vitawins.ru
💬 Telegram: @vitawin_manager

⏰ Время работы: ПН-ПТ 9:00-18:00 (МСК)

🔔 Средний срок ответа: 2-4 часа`);
      }
      // Обработка произвольных сообщений
      else {
        const autoReplyMessage = `👋 Спасибо за ваше сообщение!

📝 Ваш вопрос: "${text}"

🔄 Мы получили ваше обращение и ответим в ближайшее время.

⚡ Для быстрого решения популярных вопросов используйте кнопки ниже:`;

        const keyboard = createSupportKeyboard();
        await sendSupportMessage(message.chat.id, autoReplyMessage, keyboard);
      }

      console.log('Support webhook processed successfully');
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing support webhook:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  }

  // Настройка webhook для бота поддержки
  async setWebhook(req: Request, res: Response) {
    try {
      const webhookUrl = `https://vitawins.ru/api/telegram/support/webhook`;
      
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_SUPPORT_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        })
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('Support bot webhook set successfully:', webhookUrl);
        res.json({ 
          success: true, 
          message: 'Support bot webhook установлен успешно',
          webhook_url: webhookUrl
        });
      } else {
        console.error('Failed to set support bot webhook:', result);
        res.status(400).json({ 
          success: false, 
          error: result.description || 'Не удалось установить webhook для бота поддержки'
        });
      }
    } catch (error) {
      console.error('Error setting support bot webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при установке webhook'
      });
    }
  }

  // Получение информации о webhook
  async getWebhookInfo(req: Request, res: Response) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_SUPPORT_BOT_TOKEN}/getWebhookInfo`);
      const result = await response.json();

      res.json(result);
    } catch (error) {
      console.error('Error getting support bot webhook info:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении информации о webhook'
      });
    }
  }

  // Удаление webhook
  async deleteWebhook(req: Request, res: Response) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_SUPPORT_BOT_TOKEN}/deleteWebhook`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.ok) {
        res.json({ 
          success: true, 
          message: 'Support bot webhook удален успешно' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.description || 'Не удалось удалить webhook' 
        });
      }
    } catch (error) {
      console.error('Error deleting support bot webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }
}

export const supportBotController = new SupportBotController();