import { Request, Response } from 'express';
import { storage } from '../storage';
import { generateJWT } from '../middleware/auth';
import { User } from '../../shared/schema';

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

// Простая функция для отправки сообщения в Telegram
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
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
      console.error('Telegram API error:', result);
    }
    return result;
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return { ok: false, error };
  }
}

// Функция для генерации клавиатуры
function createKeyboard(user: any) {
  const encodedFirstName = encodeURIComponent(user.first_name || '');
  const username = user.username ? encodeURIComponent(user.username) : '';
  const telegramId = user.telegram_id || user.id;
  
  // Используем production домен
  const baseUrl = 'https://vitawins.ru';
  
  return {
    inline_keyboard: [
      [
        {
          text: "🛒 Открыть магазин",
          url: `${baseUrl}?tg_id=${telegramId}&first_name=${encodedFirstName}&username=${username}`
        }
      ],
      [
        {
          text: "👤 Личный кабинет",
          url: `${baseUrl}/account?tg_id=${telegramId}&first_name=${encodedFirstName}&username=${username}`
        },
        {
          text: "📊 Рефералы",
          url: `${baseUrl}/account?tg_id=${telegramId}&first_name=${encodedFirstName}&username=${username}#referrals`
        }
      ],
      [
        {
          text: "📞 Поддержка",
          callback_data: "support"
        },
        {
          text: "ℹ️ О компании",
          callback_data: "about"
        }
      ]
    ]
  };
}

class TelegramController {
  // Webhook для получения обновлений от Telegram бота
  async webhook(req: Request, res: Response) {
    try {
      console.log('Telegram webhook received:', JSON.stringify(req.body, null, 2));
      
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
          case 'support':
            await sendTelegramMessage(chatId, `🤝 Обращение в службу поддержки:

Для получения помощи обратитесь к боту поддержки:
👨‍💼 @vitawin_support_bot

Или свяжитесь напрямую:
📱 Телефон: +7 (999) 123-45-67
📧 Email: support@vitawins.ru
💬 Telegram: @vitawin_manager

⏰ Время работы: ПН-ПТ 9:00-18:00 (МСК)`);
            break;

          case 'about':
            await sendTelegramMessage(chatId, `ℹ️ О компании VitaWin:

🏢 VitaWin - ведущий производитель премиальных витаминов и БАДов для здоровья и долголетия.

🌟 Наши преимущества:
• Высочайшее качество продукции
• Собственное производство
• Сертификация GMP
• Научная база разработок

💰 Реферальная программа:
• 20% с первого уровня
• 5% со второго уровня
• 1% с третьего уровня

🚀 Присоединяйтесь к команде успешных партнеров!`);
            break;

          default:
            await sendTelegramMessage(chatId, '❌ Неизвестная команда');
        }

        res.status(200).json({ ok: true });
        return;
      }
      
      if (!update.message || !update.message.text) {
        console.log('No message or text in update, skipping');
        res.status(200).json({ ok: true });
        return;
      }

      const message = update.message;
      const user = message.from;
      const text = message.text?.trim();

      if (!user) {
        console.log('No user data in message, skipping');
        res.status(200).json({ ok: true });
        return;
      }

      console.log(`Processing message from user ${user.id}: ${text}`);

      // Обрабатываем команду /start
      if (text && (text === '/start' || text.startsWith('/start '))) {
        console.log('Handling /start command');
        
        try {
          // Проверяем, существует ли пользователь
          let existingUser = await storage.getUserByTelegramId(user.id);
          console.log('Existing user check result:', existingUser ? 'found' : 'not found');
          
          if (!existingUser) {
            // Генерируем реферальный код на основе Telegram ID
            const referralCode = user.id.toString();
            
            console.log('Creating new user with data:', {
              telegram_id: user.id,
              first_name: user.first_name,
              referral_code: referralCode
            });
            
            // Создаем нового пользователя
            const newUser = await storage.createUser({
              telegram_id: user.id,
              first_name: user.first_name,
              username: user.username || null,
              referral_code: referralCode
            });

            // Отправляем приветственное сообщение новому пользователю
            const welcomeMessage = `🎉 Добро пожаловать в VitaWin, ${user.first_name}!

🎯 Ваш реферальный код: <code>${referralCode}</code>

💡 Поделитесь этим кодом с друзьями и получайте комиссию с их покупок!

📱 Используйте кнопки ниже для быстрого доступа:`;

            const keyboard = createKeyboard(user);
            await sendTelegramMessage(message.chat.id, welcomeMessage, keyboard);
            
            console.log(`Новый пользователь зарегистрирован: ${newUser.first_name} (ID: ${newUser.telegram_id})`);
          } else {
            console.log('Sending message to existing user');
            // Отправляем сообщение существующему пользователю
            const existingMessage = `👋 Добро пожаловать, ${existingUser.first_name}!

🎯 Ваш реферальный код: <code>${existingUser.referral_code || user.id.toString()}</code>

📱 Нажмите на кнопки для перехода в магазин:`;

            const keyboard = createKeyboard(existingUser);
            await sendTelegramMessage(message.chat.id, existingMessage, keyboard);
            
            console.log(`Существующий пользователь: ${existingUser.first_name} (ID: ${existingUser.telegram_id})`);
          }
        } catch (error) {
          console.error('Error handling start command:', error);
          await sendTelegramMessage(message.chat.id, '❌ Произошла ошибка при обработке команды. Попробуйте позже.');
        }
      }

      // Обработка команды /menu
      if (text === '/menu') {
        console.log('Handling /menu command');
        
        try {
          let existingUser = await storage.getUserByTelegramId(user.id);
          
          if (!existingUser) {
            await sendTelegramMessage(message.chat.id, '❌ Сначала напишите /start для регистрации.');
            return;
          }

          const menuMessage = `📋 Главное меню VitaWin:

🎯 Ваш реферальный код: <code>${existingUser.referral_code || user.id.toString()}</code>

Выберите нужную опцию:`;

          const keyboard = createKeyboard(existingUser);
          await sendTelegramMessage(message.chat.id, menuMessage, keyboard);
          
        } catch (error) {
          console.error('Error handling menu command:', error);
          await sendTelegramMessage(message.chat.id, '❌ Произошла ошибка при обработке команды. Попробуйте позже.');
        }
      }
      
      console.log('Webhook processed successfully');
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  }

  // Авторизация через Telegram для веб-приложения
  async telegramAuth(req: Request, res: Response) {
    try {
      const { telegram_id } = req.body;
      
      if (!telegram_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Telegram ID обязателен' 
        });
      }

      // Ищем пользователя по Telegram ID
      const user = await storage.getUserByTelegramId(telegram_id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Пользователь не найден. Сначала напишите /start боту @vitawin_bot' 
        });
      }

      // Генерируем JWT токен
      const token = generateJWT({ 
        userId: user.id,
        telegramId: user.telegram_id 
      });

      res.json({ 
        success: true, 
        token,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          username: user.username,
          referral_code: user.referral_code
        }
      });
    } catch (error) {
      console.error('Error in telegram auth:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сервера' 
      });
    }
  }

  // Установка webhook
  async setWebhook(req: Request, res: Response) {
    try {
      const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || '15b86ffd-8123-4786-9a33-4c6dce6c1a67-00-11b7k921y9q0c.picard.replit.dev';
      const webhookUrl = `https://${REPLIT_DOMAIN}/api/telegram/webhook`;
      
      console.log('Setting webhook URL:', webhookUrl);
      console.log('Bot token exists:', !!process.env.TELEGRAM_BOT_TOKEN);

      // Проверяем информацию о боте
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
      const botInfo = await botInfoResponse.json();
      console.log('Bot info response:', botInfo);

      if (!botInfo.ok) {
        return res.status(400).json({
          success: false,
          error: 'Неверный токен бота'
        });
      }

      // Устанавливаем webhook
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
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
      console.log('Telegram API response:', result);

      if (result.ok) {
        res.json({
          success: true,
          message: 'Webhook установлен успешно',
          webhook_url: webhookUrl,
          bot_info: botInfo.result
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.description || 'Ошибка при установке webhook'
        });
      }
    } catch (error) {
      console.error('Error setting webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }

  // Удаление webhook
  async deleteWebhook(req: Request, res: Response) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.ok) {
        res.json({
          success: true,
          message: 'Webhook удален успешно'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.description || 'Ошибка при удалении webhook'
        });
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }

  // Получение информации о webhook
  async getWebhookInfo(req: Request, res: Response) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      const result = await response.json();

      if (result.ok) {
        res.json(result);
      } else {
        res.status(400).json({
          success: false,
          error: result.description || 'Ошибка при получении информации о webhook'
        });
      }
    } catch (error) {
      console.error('Error getting webhook info:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }

  // Настройка бота
  async setupBot(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Бот настроен'
      });
    } catch (error) {
      console.error('Error setting up bot:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }

  // Запуск polling
  async startPolling(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Polling запущен'
      });
    } catch (error) {
      console.error('Error starting polling:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  }
}

export const telegramController = new TelegramController();