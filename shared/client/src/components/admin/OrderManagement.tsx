import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  Truck, 
  Eye, 
  Edit, 
  Search,
  Filter,
  Download
} from "lucide-react";

interface Order {
  id: number;
  user_id: number | null;
  items: any[];
  total: string;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  customer_info: any;
  delivery_type?: string;
  delivery_service?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_cost?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  discount_amount?: string;
  final_total?: string;
  referral_code_used?: string;
  user?: {
    first_name: string;
    username: string;
    telegram_id: number | null;
    type: 'registered' | 'guest';
  };
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен'
};

function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загружаем все заказы
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/admin/orders'],
  });

  const orders = (ordersData as any)?.orders || [];

  // Фильтрация заказов
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = searchTerm === '' || 
      order.id.toString().includes(searchTerm) ||
      order.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_info?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && orderDate.toDateString() === now.toDateString()) ||
      (dateFilter === 'week' && (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
      (dateFilter === 'month' && (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Обновление статуса заказа
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Статус заказа обновлен" });
    },
    onError: () => {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить статус заказа",
        variant: "destructive"
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Загрузка заказов...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление заказами</h2>
          <p className="text-gray-600">Общий реестр всех заказов в системе</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Всего заказов</p>
                <p className="text-lg font-semibold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Общая сумма</p>
                <p className="text-lg font-semibold">
                  {orders.reduce((sum: number, order: Order) => sum + parseFloat(order.total || '0'), 0).toFixed(2)} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">В обработке</p>
                <p className="text-lg font-semibold">
                  {orders.filter((order: Order) => ['pending', 'processing'].includes(order.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Проблемные</p>
                <p className="text-lg font-semibold text-red-600">
                  {orders.filter((order: Order) => !order.user_id).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по номеру заказа, имени клиента..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает обработки</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="shipped">Отправлен</SelectItem>
                <SelectItem value="delivered">Доставлен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список заказов */}
      <div className="grid gap-4">
        {filteredOrders.map((order: Order) => (
          <Card key={order.id} className={!order.user_id ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">Заказ #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Клиент:</p>
                    <p className="font-medium">
                      {order.user?.first_name || order.customer_info?.fullName || 'Неизвестен'}
                      {!order.user_id && <span className="text-red-600 ml-2">(без привязки)</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Товаров:</p>
                    <p className="font-medium">{getTotalItems(order.items || [])}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Сумма:</p>
                    <p className="font-medium">{order.total} ₽</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                  
                  <Select 
                    value={order.status} 
                    onValueChange={(status) => updateOrderStatus.mutate({ orderId: order.id, status })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает обработки</SelectItem>
                      <SelectItem value="processing">В обработке</SelectItem>
                      <SelectItem value="shipped">Отправлен</SelectItem>
                      <SelectItem value="delivered">Доставлен</SelectItem>
                      <SelectItem value="cancelled">Отменен</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Заказы не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить фильтры поиска</p>
          </CardContent>
        </Card>
      )}

      {/* Детали заказа (модальное окно) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Заказ #{selectedOrder.id}</CardTitle>
                  <CardDescription>
                    Создан: {formatDate(selectedOrder.created_at)}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Закрыть
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Информация о клиенте */}
              <div>
                <h4 className="font-medium mb-2">Информация о клиенте</h4>
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <p><span className="font-medium">Имя:</span> {selectedOrder.user?.first_name || selectedOrder.customer_info?.fullName || 'Неизвестен'}</p>
                  <p><span className="font-medium">Telegram ID:</span> {selectedOrder.user?.telegram_id || 'Отсутствует'}</p>
                  <p><span className="font-medium">Телефон:</span> {selectedOrder.customer_info?.phone || 'Не указан'}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customer_info?.email || 'Не указан'}</p>
                  <p><span className="font-medium">Тип клиента:</span> {selectedOrder.user?.type === 'registered' ? 'Зарегистрированный' : 'Гостевой'}</p>
                </div>
              </div>

              {/* Информация о доставке */}
              <div>
                <h4 className="font-medium mb-2">Информация о доставке</h4>
                <div className="bg-blue-50 p-3 rounded space-y-1">
                  <p><span className="font-medium">Адрес:</span> {selectedOrder.customer_info?.address || (selectedOrder as any).delivery_address || 'Не указан'}</p>
                  <p><span className="font-medium">Город:</span> {selectedOrder.customer_info?.city || (selectedOrder as any).delivery_city || 'Не указан'}</p>
                  <p><span className="font-medium">Индекс:</span> {selectedOrder.customer_info?.postalCode || 'Не указан'}</p>
                  <p><span className="font-medium">Служба доставки:</span> {selectedOrder.customer_info?.deliveryService || (selectedOrder as any).delivery_service || 'Не указана'}</p>
                  <p><span className="font-medium">Тип доставки:</span> {(selectedOrder as any).delivery_type || 'Не указан'}</p>
                  <p><span className="font-medium">Стоимость доставки:</span> {(selectedOrder as any).delivery_cost ? `${(selectedOrder as any).delivery_cost} ₽` : 'Бесплатно'}</p>
                  {(selectedOrder as any).tracking_number && (
                    <p><span className="font-medium">Трек-номер:</span> {(selectedOrder as any).tracking_number}</p>
                  )}
                  {(selectedOrder as any).estimated_delivery && (
                    <p><span className="font-medium">Ожидаемая доставка:</span> {new Date((selectedOrder as any).estimated_delivery).toLocaleDateString('ru-RU')}</p>
                  )}
                </div>
              </div>

              {/* Информация об оплате */}
              <div>
                <h4 className="font-medium mb-2">Информация об оплате</h4>
                <div className="bg-green-50 p-3 rounded space-y-1">
                  <p><span className="font-medium">Способ оплаты:</span> {selectedOrder.payment_method === 'cash' ? 'Наличными' : selectedOrder.payment_method === 'card' ? 'Картой' : selectedOrder.payment_method === 'balance' ? 'Из баланса' : 'Не указан'}</p>
                  <p><span className="font-medium">Статус оплаты:</span> {
                    selectedOrder.payment_status === 'pending' ? 'Ожидает оплаты' :
                    selectedOrder.payment_status === 'paid' ? 'Оплачено' :
                    selectedOrder.payment_status === 'failed' ? 'Ошибка оплаты' :
                    'Неизвестно'
                  }</p>
                  {(selectedOrder as any).discount_amount && parseFloat((selectedOrder as any).discount_amount) > 0 && (
                    <p><span className="font-medium">Скидка:</span> {(selectedOrder as any).discount_amount} ₽</p>
                  )}
                  {(selectedOrder as any).final_total && (
                    <p><span className="font-medium">Итоговая сумма:</span> {(selectedOrder as any).final_total} ₽</p>
                  )}
                  {(selectedOrder as any).referral_code_used && (
                    <p><span className="font-medium">Реферальный код:</span> {(selectedOrder as any).referral_code_used}</p>
                  )}
                </div>
              </div>

              {/* Товары */}
              <div>
                <h4 className="font-medium mb-2">Товары</h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{(parseFloat(item.price) * item.quantity).toFixed(2)} ₽</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Итого */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Итого:</span>
                  <span className="text-lg font-semibold">{selectedOrder.total} ₽</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export { OrderManagement };
export default OrderManagement;