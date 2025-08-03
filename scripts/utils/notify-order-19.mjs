import fetch from 'node-fetch';

async function sendOrder19Notifications() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN не найден');
      return;
    }
    
    console.log('Отправляем уведомления для заказа 19 (2500₽ от Алексея)...');
    
    // Максим получает 500₽ как реферал 1-го уровня
    const message1 = `💰 Начислен реферальный бонус!

👤 От: Алексей (реферал 1-го уровня)
💵 Сумма: 500.00 руб.
📈 Уровень: 1

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

    const response1 = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 463070436, // Максим
        text: message1,
        parse_mode: 'HTML'
      }),
    });

    const result1 = await response1.json();
    
    if (result1.ok) {
      console.log('✅ Уведомление отправлено Максиму о бонусе 500₽');
    } else {
      console.log('❌ Ошибка отправки Максиму:', result1);
    }

    // Eugene получает 125₽ как реферал 2-го уровня
    const message2 = `💰 Начислен реферальный бонус!

👤 От: Алексей (реферал 2-го уровня)
💵 Сумма: 125.00 руб.
📈 Уровень: 2

💡 Бонус будет зачислен на ваш баланс после обработки
📊 Посмотреть все бонусы: /bonuses`;

    const response2 = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 131632979, // Eugene
        text: message2,
        parse_mode: 'HTML'
      }),
    });

    const result2 = await response2.json();
    
    if (result2.ok) {
      console.log('✅ Уведомление отправлено Eugene о бонусе 125₽');
    } else {
      console.log('❌ Ошибка отправки Eugene:', result2);
    }
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

sendOrder19Notifications();