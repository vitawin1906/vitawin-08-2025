import { Request, Response } from 'express';
import { storage } from '../storage';

// Получить групповой объем сети пользователя
export async function getNetworkVolume(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const period = req.query.period as string;
    
    // Получаем групповой объем пользователя
    const networkData = await calculateNetworkVolume(userId, period);
    
    res.json({
      success: true,
      data: networkData
    });
  } catch (error) {
    console.error('Error getting network volume:', error);
    res.status(500).json({ 
      error: 'Ошибка получения группового объема',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Функция расчета группового объема сети
async function calculateNetworkVolume(userId: number, period?: string) {
  try {
    // Получаем пользователя
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Получаем всех пользователей для построения сети
    const allUsers = await storage.getUsers();
    
    // Получаем все заказы
    const allOrders = await storage.getAllOrders();
    
    // Строим дерево рефералов (исключая самого пользователя)
    const networkUserIds = buildNetworkUserIds(userId, allUsers);
    
    // Рассчитываем групповой объем на основе реальных заказов
    const volumeStats = calculateGroupVolumeFromOrders(networkUserIds, allOrders, period);
    
    // PV конвертация: 1 PV = 200₽ для покупок, 100₽ для бонусов
    const pvFromRubles = (rubles: number) => Math.floor(rubles / 200);
    const rublesFromPV = (pv: number) => pv * 100; // для бонусов
    
    return {
      personalVolume: user.total_pv || 0, // ЛО не включается в ГО
      groupVolume: pvFromRubles(volumeStats.totalGroupVolumeRubles), // ГО в PV
      groupVolumeRubles: volumeStats.totalGroupVolumeRubles,
      networkParticipants: volumeStats.activeParticipants,
      userBonus: rublesFromPV(pvFromRubles(volumeStats.totalGroupVolumeRubles) * 0.1), // 10% бонус
      levelBreakdown: volumeStats.levelBreakdown,
      lastUpdated: new Date().toISOString(),
      period: period || 'all_time'
    };
  } catch (error) {
    console.error('Error calculating network volume:', error);
    throw error;
  }
}

// Построение списка ID пользователей в сети (исключая корневого)
function buildNetworkUserIds(rootUserId: number, allUsers: any[]): Set<number> {
  const networkUserIds = new Set<number>();
  const userMap = new Map();
  
  // Создаем карту пользователей
  allUsers.forEach(user => {
    userMap.set(user.id, user);
  });
  
  // Рекурсивно собираем всех пользователей сети до 16 уровня
  function collectNetworkUsers(userId: number, level: number = 0, visited: Set<number> = new Set()) {
    if (visited.has(userId) || level > 16) {
      return;
    }
    
    visited.add(userId);
    
    // Находим прямых рефералов
    const directReferrals = allUsers.filter(u => u.referrer_id === userId);
    
    directReferrals.forEach(referral => {
      networkUserIds.add(referral.id); // Добавляем в сеть (исключая корневого)
      collectNetworkUsers(referral.id, level + 1, new Set(visited));
    });
  }
  
  collectNetworkUsers(rootUserId);
  return networkUserIds;
}

// Расчет группового объема на основе заказов
function calculateGroupVolumeFromOrders(networkUserIds: Set<number>, allOrders: any[], period?: string) {
  // Фильтруем заказы по периоду
  let filteredOrders = allOrders.filter(order => 
    networkUserIds.has(order.user_id) && 
    order.payment_status === 'paid'
  );
  
  if (period && period !== 'all_time') {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Все время
    }
    
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.created_at) >= startDate
    );
  }
  
  // Рассчитываем общий объем в рублях
  const totalGroupVolumeRubles = filteredOrders.reduce((sum, order) => 
    sum + parseFloat(order.total || '0'), 0
  );
  
  // Подсчитываем активных участников (кто сделал покупки)
  const activeParticipants = new Set(
    filteredOrders.map(order => order.user_id)
  ).size;
  
  // Группируем по уровням (потребуется дополнительная логика для определения уровня)
  const levelBreakdown: { [key: number]: { count: number; volume: number } } = {};
  
  return {
    totalGroupVolumeRubles,
    activeParticipants,
    levelBreakdown,
    orderCount: filteredOrders.length
  };
}

// Расчет объемов на основе реальных заказов
async function calculateOrderVolumes(userId: number, allUsers: any[]) {
  try {
    // Получаем все заказы
    const allOrders = await storage.getAllOrders();
    
    // Находим всех пользователей в сети
    const networkUserIds = new Set<number>();
    
    function collectNetworkUsers(currentUserId: number, visited: Set<number> = new Set()) {
      if (visited.has(currentUserId)) return;
      visited.add(currentUserId);
      
      const directReferrals = allUsers.filter(u => u.referrer_id === currentUserId);
      directReferrals.forEach(referral => {
        networkUserIds.add(referral.id);
        collectNetworkUsers(referral.id, visited);
      });
    }
    
    collectNetworkUsers(userId);
    
    // Фильтруем заказы сети
    const networkOrders = allOrders.filter(order => 
      networkUserIds.has(order.user_id) && order.payment_status === 'paid'
    );
    
    // Рассчитываем статистику
    const totalOrderValue = networkOrders.reduce((sum, order) => 
      sum + parseFloat(order.total || '0'), 0
    );
    
    const orderCount = networkOrders.length;
    const avgOrderValue = orderCount > 0 ? totalOrderValue / orderCount : 0;
    
    return {
      totalOrderValue,
      orderCount,
      avgOrderValue,
      networkUserIds: Array.from(networkUserIds)
    };
  } catch (error) {
    console.error('Error calculating order volumes:', error);
    return {
      totalOrderValue: 0,
      orderCount: 0,
      avgOrderValue: 0,
      networkUserIds: []
    };
  }
}