import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ExternalLink, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface UserOrder {
  id: number;
  total: number;
  status: string;
  delivery_type: string;
  delivery_service: string;
  delivery_address: string;
  delivery_city: string;
  tracking_number: string;
  estimated_delivery: string;
  created_at: string;
  items: any[];
}

const DeliveryTracking = () => {
  const user = useAuthStore(state => state.user);
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user,
  });

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидает обработки',
      'processing': 'Обрабатывается',
      'packed': 'Упаковано',
      'shipped': 'Отправлено',
      'in_transit': 'В пути',
      'out_for_delivery': 'Доставляется',
      'delivered': 'Доставлено',
      'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'packed': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-orange-100 text-orange-800',
      'in_transit': 'bg-indigo-100 text-indigo-800',
      'out_for_delivery': 'bg-teal-100 text-teal-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Отслеживание доставки
          </CardTitle>
          <CardDescription>
            Здесь будет отображаться информация о ваших заказах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">У вас пока нет заказов</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Отслеживание доставки
          </CardTitle>
          <CardDescription>
            Следите за статусом ваших заказов
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {(orders as UserOrder[]).map((order: UserOrder) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Заказ #{order.id}</CardTitle>
                  <CardDescription>
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Сумма заказа</p>
                  <p className="text-lg font-semibold">{order.total} ₽</p>
                </div>
                
                {order.delivery_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Тип доставки</p>
                    <p className="capitalize">{order.delivery_type}</p>
                  </div>
                )}
                
                {order.delivery_service && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Служба доставки</p>
                    <p className="capitalize">{order.delivery_service}</p>
                  </div>
                )}
                
                {order.tracking_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Трек-номер</p>
                    <p className="font-mono text-sm">{order.tracking_number}</p>
                  </div>
                )}
                
                {order.delivery_address && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Адрес доставки</p>
                    <p>{order.delivery_address}</p>
                    {order.delivery_city && <p>{order.delivery_city}</p>}
                  </div>
                )}
              </div>
              
              {order.status === 'delivered' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Заказ успешно доставлен</span>
                  </div>
                </div>
              )}
              
              {order.status === 'shipped' && order.tracking_number && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Отследить посылку
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeliveryTracking;