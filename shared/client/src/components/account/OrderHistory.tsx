import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Eye, Truck, Clock, CheckCircle, AlertCircle, Calendar, Gift, ShoppingBag, CreditCard, Wallet } from "lucide-react";

interface OrderItem {
  product_id: number;
  quantity: number;
  price: string;
  title: string;
}

interface Order {
  id: number;
  user_id: number;
  items: OrderItem[];
  total: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  referral_code_used?: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Наличными курьеру',
  balance: 'С баланса',
  card: 'Банковская карта'
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  failed: 'Ошибка оплаты'
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);

  // Получаем Telegram ID из URL параметров
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tg_id');
    const tgFirstName = urlParams.get('first_name');
    const tgUsername = urlParams.get('username');

    if (tgId && tgFirstName) {
      setTelegramUser({
        id: parseInt(tgId),
        first_name: decodeURIComponent(tgFirstName),
        username: tgUsername || null
      });
    }
  }, []);

  const currentTelegramId = telegramUser?.id || 131632979;

  // Загружаем заказы пользователя по Telegram ID
  const { data: ordersData, isLoading } = useQuery({
    queryKey: [`/api/orders/telegram/${currentTelegramId}`],
    enabled: !!currentTelegramId,
  });

  const orders = (ordersData as any)?.orders || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getDeliveryServiceName = (order: Order) => {
    const deliveryService = (order as any).customer_info?.deliveryService;
    const serviceMap: Record<string, string> = {
      'sdek': 'СДЭК',
      'russianpost': 'Почта России', 
      'yandex': 'Яндекс Доставка',
      'cdek': 'СДЭК'
    };
    return serviceMap[deliveryService] || 'Не указано';
  };

  const getTotalSpent = () => {
    return orders.reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);
  };

  const getCompletedOrders = () => {
    return orders.filter((order: Order) => order.status === 'delivered').length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
          <CardDescription>
            Все ваши покупки в одном месте
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              У вас пока нет заказов
            </h3>
            <p className="text-gray-500 mb-4">
              Оформите свой первый заказ в нашем магазине
            </p>
            <Button onClick={() => window.location.href = '/store'}>
              Перейти к покупкам
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <ShoppingBag className="h-8 w-8 text-emerald-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm text-gray-600">Всего заказов</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{getCompletedOrders()}</div>
              <div className="text-sm text-gray-600">Доставлено</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{getTotalSpent().toLocaleString('ru-RU')} ₽</div>
              <div className="text-sm text-gray-600">Потрачено</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список заказов */}
      <div className="space-y-4">
        {orders.map((order: Order) => {
          const StatusIcon = statusIcons[order.status];
          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  
                  {/* Основная информация */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        Заказ #{order.id.toString().padStart(4, '0')}
                      </h3>
                      <Badge className={statusColors[order.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {getTotalItems(order.items)} товаров
                      </div>
                      {order.referral_code_used && (
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Использован промокод: <code className="bg-gray-100 px-1 rounded">{order.referral_code_used}</code>
                        </div>
                      )}
                      {order.payment_method && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {paymentMethodLabels[order.payment_method] || order.payment_method}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Доставка: {getDeliveryServiceName(order)}
                      </div>
                      {order.payment_status && (
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <Badge className={paymentStatusColors[order.payment_status]}>
                            {paymentStatusLabels[order.payment_status] || order.payment_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Сумма и действия */}
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-emerald-600">
                      {parseFloat(order.total).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                      {order.payment_status === 'pending' && order.payment_method !== 'cash' && (
                        <Button 
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => window.location.href = `/order-success?order=${order.id}`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Доплатить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Товары в заказе */}
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Товары в заказе:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-gray-600">
                          {item.quantity} шт. × {parseFloat(item.price).toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Модальное окно с деталями заказа */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

// Компонент модального окна для деталей заказа
function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = () => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getDeliveryServiceName = (order: Order) => {
    const deliveryService = (order as any).customer_info?.deliveryService;
    const serviceMap: Record<string, string> = {
      'sdek': 'СДЭК',
      'russianpost': 'Почта России', 
      'yandex': 'Яндекс Доставка',
      'cdek': 'СДЭК'
    };
    return serviceMap[deliveryService] || 'Не указано';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Заказ #{order.id.toString().padStart(4, '0')}
          </h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="space-y-6">
          {/* Статус и сумма */}
          <div className="flex justify-between items-center">
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
            <div className="text-2xl font-bold text-emerald-600">
              {parseFloat(order.total).toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <Separator />

          {/* Дата */}
          <div>
            <h3 className="font-semibold mb-2">Дата оформления</h3>
            <p className="text-gray-600">{formatDate(order.created_at)}</p>
          </div>

          {/* Доставка */}
          <div>
            <h3 className="font-semibold mb-2">Способ доставки</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-4 w-4" />
              {getDeliveryServiceName(order)}
            </div>
          </div>

          {/* Реферальный код */}
          {order.referral_code_used && (
            <div>
              <h3 className="font-semibold mb-2">Использован промокод</h3>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {order.referral_code_used}
              </code>
            </div>
          )}

          {/* Товары */}
          <div>
            <h3 className="font-semibold mb-4">Товары ({getTotalItems()} шт.)</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-600">
                      {item.quantity} шт. × {parseFloat(item.price).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div className="font-medium">
                    {(parseFloat(item.price) * item.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Итого:</span>
            <span className="text-emerald-600">
              {parseFloat(order.total).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;