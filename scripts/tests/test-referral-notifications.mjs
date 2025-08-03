import fetch from 'node-fetch';

async function sendReferralNotifications() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    return;
  }

  // Уведомление пользователю ID 2 (Eugene Aliev, telegram_id: 131632979) о награде 2-го уровня
  const message1 = `🎉 Поздравляем! Вы получили реферальную награду 2-го уровня!

💰 Сумма: 109.50 ₽
📦 За заказ: Ежовик Гребенчатый мицелий в капсулах 120 шт (2190 ₽)
👤 От пользователя: test_buyer
📊 Уровень: 2 (5%)

Награда зачислена на ваш баланс в VitaWin.`;

  // Уведомление пользователю ID 4 (shchepin_ms, telegram_id: 463070436) о награде 1-го уровня  
  const message2 = `🎉 Поздравляем! Вы получили реферальную награду 1-го уровня!

💰 Сумма: 438.00 ₽  
📦 За заказ: Ежовик Гребенчатый мицелий в капсулах 120 шт (2190 ₽)
👤 От пользователя: test_buyer
📊 Уровень: 1 (20%)

Награда зачислена на ваш баланс в VitaWin.`;

  try {
    // Отправка уведомления пользователю 131632979 (Eugene Aliev)
    const response1 = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 131632979,
        text: message1,
        parse_mode: 'HTML'
      })
    });

    const result1 = await response1.json();
    console.log('Уведомление Eugene Aliev (131632979):', result1.ok ? 'Отправлено' : result1.description);

    // Отправка уведомления пользователю 463070436 (shchepin_ms)
    const response2 = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: 463070436,
        text: message2,
        parse_mode: 'HTML'
      })
    });

    const result2 = await response2.json();
    console.log('Уведомление shchepin_ms (463070436):', result2.ok ? 'Отправлено' : result2.description);

  } catch (error) {
    console.error('Ошибка отправки уведомлений:', error);
  }
}

sendReferralNotifications();