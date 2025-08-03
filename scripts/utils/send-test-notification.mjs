import fetch from 'node-fetch';

async function sendTestNotification() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return;
    }
    
    console.log('Отправляем тестовое уведомление Eugene (ID: 131632979)...');
    
    const message = `💰 Начислен реферальный бонус!

👤 От: Максим (реферал 1-го уровня)
💵 Сумма: 600.00 руб.
📈 Уровень: 1

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 131632979,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Уведомление успешно отправлено Eugene');
    } else {
      console.log('❌ Ошибка отправки:', result);
    }

    // Отправляем уведомление Evgeniy
    console.log('Отправляем уведомление Evgeniy (ID: 6023849545)...');
    
    const message2 = `💰 Начислен реферальный бонус!

👤 От: Максим (реферал 2-го уровня)
💵 Сумма: 150.00 руб.
📈 Уровень: 2

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

    const response2 = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 6023849545,
        text: message2,
        parse_mode: 'HTML'
      }),
    });

    const result2 = await response2.json();
    
    if (result2.ok) {
      console.log('✅ Уведомление успешно отправлено Evgeniy');
    } else {
      console.log('❌ Ошибка отправки:', result2);
    }

  } catch (error) {
    console.error('Ошибка:', error);
  }
}

sendTestNotification();