import fetch from 'node-fetch';

async function testOrder18Bonuses() {
  try {
    console.log('Тестируем автоматические уведомления для заказа 18...');
    
    // Прямой вызов функции расчета бонусов
    const response = await fetch('http://localhost:5050/api/ai-agent/calculate-bonuses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 18
      })
    });

    const result = await response.json();
    console.log('Результат расчета бонусов:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

testOrder18Bonuses();