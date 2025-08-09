const { storage } = require('./server/storage.ts');

async function sendNotificationsForOrder17() {
  try {
    console.log('Отправляем уведомления для заказа 17...');
    
    // Импортируем сервис уведомлений
    const { telegramNotificationService } = require('./server/services/telegramNotificationService.ts');
    
    // Данные заказа 17
    const orderId = 17;
    const buyerName = 'Максим';
    
    // Отправляем уведомления рефералам
    const notifications = [
      {
        userId: 2, // Eugene (ID: 131632979)
        amount: 600.00,
        level: 1
      },
      {
        userId: 3, // Evgeniy (ID: 6023849545) 
        amount: 150.00,
        level: 2
      }
    ];
    
    for (const notification of notifications) {
      await telegramNotificationService.sendBonusNotification(
        notification.userId,
        notification.amount,
        buyerName,
        notification.level
      );
      
      console.log(`✅ Уведомление отправлено пользователю ${notification.userId} о бонусе ${notification.amount}₽`);
    }
    
    console.log('Все уведомления отправлены!');
    
  } catch (error) {
    console.error('Ошибка отправки уведомлений:', error);
  }
}

sendNotificationsForOrder17().then(() => {
  console.log('Готово');
  process.exit(0);
});