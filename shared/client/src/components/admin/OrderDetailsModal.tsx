import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, User, Calendar, CreditCard, MapPin, Gift } from 'lucide-react';

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
  referral_code_used?: string;
  created_at: string;
  user?: {
    first_name: string;
    username?: string;
    telegram_id: number;
  };
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
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

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemsTotal = () => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Заказ #{order.id.toString().padStart(4, '0')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Статус и основная информация */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Badge className={`${statusColors[order.status]} text-sm px-3 py-1`}>
              {statusLabels[order.status]}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">
                {parseFloat(order.total).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-sm text-gray-500">
                {getItemsTotal()} товаров
              </div>
            </div>
          </div>

          <Separator />

          {/* Информация о клиенте */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <User className="h-4 w-4" />
              Информация о клиенте
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-medium">Имя:</span> {order.user?.first_name || 'Неизвестно'}
              </div>
              {order.user?.username && (
                <div>
                  <span className="font-medium">Username:</span> @{order.user.username}
                </div>
              )}
              <div>
                <span className="font-medium">Telegram ID:</span> {order.user?.telegram_id || 'Неизвестно'}
              </div>
            </div>
          </div>

          {/* Дата заказа */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              Дата оформления
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {formatDate(order.created_at)}
            </div>
          </div>

          {/* Реферальный код */}
          {order.referral_code_used && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Gift className="h-4 w-4" />
                Использован реферальный код
              </h3>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <code className="text-emerald-700 font-mono">
                  {order.referral_code_used}
                </code>
              </div>
            </div>
          )}

          {/* Товары в заказе */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4" />
              Товары в заказе
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">
                      Количество: {item.quantity} шт.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {(parseFloat(item.price) * item.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-sm text-gray-500">
                      {parseFloat(item.price).toLocaleString('ru-RU')} ₽ за шт.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Итого */}
          <Separator />
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Итого к оплате:</span>
            <span className="text-emerald-600">
              {parseFloat(order.total).toLocaleString('ru-RU')} ₽
            </span>
          </div>

          {/* Кнопка закрытия */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}