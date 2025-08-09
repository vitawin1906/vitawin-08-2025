import fetch from 'node-fetch';

async function sendDirectBonusNotifications() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN не найден');
      return;
    }
    
    console.log('Отправляем уведомления для заказа 18 (3600₽)...');
    
    // Рассчитываем бонусы: 3600 * 20% = 720₽, 3600 * 5% = 180₽
    const notifications = [
      {
        telegramId: 131632979,
        name: 'Eugene',
        amount: 720.00,
        level: 1
      },
      {
        telegramId: 6023849545,
        name: 'Evgeniy', 
        amount: 180.00,
        level: 2
      }
    ];
    
    for (const notification of notifications) {
      const levelText = notification.level === 1 ? '1-го уровня' : '2-го уровня';
      
      const message = `💰 Начислен реферальный бонус!

👤 От: Максим (реферал ${levelText})
💵 Сумма: ${notification.amount.toFixed(2)} руб.
📈 Уровень: ${notification.level}

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: notification.telegramId,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log(`✅ Уведомление отправлено ${notification.name} о бонусе ${notification.amount}₽`);
      } else {
        console.log(`❌ Ошибка отправки ${notification.name}:`, result);
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

sendDirectBonusNotifications();