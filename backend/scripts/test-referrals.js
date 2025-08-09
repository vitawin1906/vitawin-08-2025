// Тестирование реферальной системы
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Создание тестовых пользователей с реферальной цепочкой
async function setupTestUsers() {
  console.log('🔄 Создание тестовых пользователей...');
  
  const users = [
    {
      telegram_id: 1001,
      first_name: 'Пользователь 1 (Уровень 0)',
      username: 'user1',
      referral_code: '1001', // Telegram ID как реферальный код
      balance: '10000.00'
    },
    {
      telegram_id: 1002,
      first_name: 'Пользователь 2 (Уровень 1)',
      username: 'user2',
      referral_code: '1002',
      referrer_id: null, // Установим после создания первого пользователя
      balance: '10000.00'
    },
    {
      telegram_id: 1003,
      first_name: 'Пользователь 3 (Уровень 2)',
      username: 'user3', 
      referral_code: '1003',
      referrer_id: null, // Установим после создания второго пользователя
      balance: '10000.00'
    },
    {
      telegram_id: 1004,
      first_name: 'Пользователь 4 (Покупатель)',
      username: 'user4',
      referral_code: '1004',
      referrer_id: null, // Установим после создания третьего пользователя
      balance: '10000.00'
    }
  ];

  const createdUsers = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    try {
      // Создаем пользователя
      const response = await axios.post(`${BASE_URL}/test/create-user`, user);
      createdUsers.push(response.data.user);
      console.log(`✅ Создан пользователь: ${user.first_name} (ID: ${response.data.user.id})`);
      
      // Устанавливаем реферальные связи (каждый следующий ссылается на предыдущего)
      if (i > 0) {
        const referrerId = createdUsers[i - 1].id;
        await axios.patch(`${BASE_URL}/test/update-user/${response.data.user.id}`, {
          referrer_id: referrerId
        });
        console.log(`🔗 Пользователь ${user.first_name} теперь реферал пользователя ${createdUsers[i - 1].first_name}`);
      }
      
    } catch (error) {
      console.error(`❌ Ошибка создания пользователя ${user.first_name}:`, error.response?.data || error.message);
    }
  }

  return createdUsers;
}

// Тест покупки с реферальными бонусами
async function testReferralPurchase(buyerId, referralCode) {
  console.log(`\n🛒 Тестирование покупки пользователем ID: ${buyerId} с реферальным кодом: ${referralCode}`);
  
  try {
    // Имитируем оформление заказа
    const orderData = {
      items: [
        {
          product_id: 1, // Предполагаем, что есть товар с ID 1
          quantity: 2
        }
      ],
      payment_method: 'balance',
      delivery_address: 'Тестовый адрес доставки',
      delivery_option: 'pickup',
      referral_code: referralCode
    };

    // Создаем заказ от имени покупателя
    const response = await axios.post(`${BASE_URL}/test/create-order`, {
      user_id: buyerId,
      ...orderData
    });

    console.log(`✅ Заказ создан:`, {
      order_id: response.data.order.id,
      total: response.data.order.total,
      referral_code_used: response.data.order.referral_code_used
    });

    return response.data.order;
  } catch (error) {
    console.error('❌ Ошибка создания заказа:', error.response?.data || error.message);
    return null;
  }
}

// Проверка реферальных комиссий
async function checkReferralCommissions() {
  console.log('\n📊 Проверка реферальных комиссий...');
  
  try {
    const response = await axios.get(`${BASE_URL}/test/referrals`);
    const referrals = response.data.referrals;
    
    console.log(`\n📈 Найдено ${referrals.length} реферальных записей:`);
    
    referrals.forEach(referral => {
      console.log(`
🔸 Реферал ID: ${referral.id}
   Покупатель: ID ${referral.user_id}
   Реферер: ID ${referral.referrer_id}
   Уровень: ${referral.referral_level}
   Комиссия: ${referral.commission_rate}%
   Заработано: ${referral.reward_earned} ₽
   Заказ: #${referral.order_id}
   Дата: ${new Date(referral.created_at).toLocaleString()}
      `);
    });

    return referrals;
  } catch (error) {
    console.error('❌ Ошибка получения реферальных данных:', error.response?.data || error.message);
    return [];
  }
}

// Проверка статистики пользователей
async function checkUserStats(userIds) {
  console.log('\n👥 Проверка статистики пользователей...');
  
  for (const userId of userIds) {
    try {
      const response = await axios.get(`${BASE_URL}/test/user-stats/${userId}`);
      const stats = response.data.stats;
      
      console.log(`
👤 Пользователь ID: ${userId}
   Имя: ${stats.user.first_name}
   Реферальный код: ${stats.user.referral_code}
   Всего рефералов: ${stats.total_referrals}
   Всего заработано: ${stats.total_earnings} ₽
   Баланс: ${stats.user.balance} ₽
      `);
    } catch (error) {
      console.error(`❌ Ошибка получения статистики для пользователя ${userId}:`, error.response?.data || error.message);
    }
  }
}

// Основная функция тестирования
async function runReferralTest() {
  console.log('🚀 Запуск тестирования реферальной системы\n');
  
  try {
    // 1. Создаем тестовых пользователей
    const users = await setupTestUsers();
    
    if (users.length < 4) {
      console.error('❌ Недостаточно пользователей для тестирования');
      return;
    }

    // 2. Покупатель (последний пользователь) делает заказ с реферальным кодом третьего пользователя
    const buyer = users[3]; // Пользователь 4
    const referralCode = users[2].referral_code; // Код пользователя 3
    
    const order = await testReferralPurchase(buyer.id, referralCode);
    
    if (!order) {
      console.error('❌ Не удалось создать тестовый заказ');
      return;
    }

    // 3. Ждем немного для обработки
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Проверяем созданные реферальные комиссии
    const referrals = await checkReferralCommissions();

    // 5. Проверяем статистику всех пользователей
    await checkUserStats(users.map(u => u.id));

    // 6. Анализ результатов
    console.log('\n📋 АНАЛИЗ РЕЗУЛЬТАТОВ:');
    
    const expectedCommissions = [
      { level: 1, rate: 20, referrer_id: users[2].id }, // Пользователь 3 -> 20%
      { level: 2, rate: 5, referrer_id: users[1].id },  // Пользователь 2 -> 5%
      { level: 3, rate: 1, referrer_id: users[0].id }   // Пользователь 1 -> 1%
    ];

    expectedCommissions.forEach(expected => {
      const actual = referrals.find(r => 
        r.referrer_id === expected.referrer_id && 
        r.referral_level === expected.level
      );
      
      if (actual) {
        console.log(`✅ Уровень ${expected.level}: Комиссия ${expected.rate}% для пользователя ${expected.referrer_id} - КОРРЕКТНО`);
      } else {
        console.log(`❌ Уровень ${expected.level}: Комиссия ${expected.rate}% для пользователя ${expected.referrer_id} - НЕ НАЙДЕНА`);
      }
    });

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск тестов
if (require.main === module) {
  runReferralTest().then(() => {
    console.log('\n✨ Тестирование завершено');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  });
}

module.exports = {
  setupTestUsers,
  testReferralPurchase,
  checkReferralCommissions,
  checkUserStats,
  runReferralTest
};