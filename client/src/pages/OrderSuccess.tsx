import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  CheckCircle, 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  ShoppingBag,
  ArrowRight 
} from 'lucide-react';

interface OrderItem {
  product_id: number;
  quantity: number;
  price: string;
  title: string;
}

interface Order {
  id: number;
  items: OrderItem[];
  total: string;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Наличными курьеру',
  balance: 'С баланса личного кабинета',
  card: 'Банковская карта'
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  failed: 'Ошибка оплаты'
};

function OrderSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get('order');

  // Для демонстрации создадим мок-данные последнего заказа
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // В реальном приложении здесь был бы запрос к API
    // Пока используем последний созданный заказ
    const mockOrder: Order = {
      id: parseInt(orderId || '1'),
      items: [
        {
          product_id: 7,
          quantity: 1,
          price: "2590.00",
          title: "Ежовик гребенчатый - капсулы 60 шт"
        }
      ],
      total: "2590.00",
      status: "pending",
      payment_method: "cash",
      payment_status: "pending",
      created_at: new Date().toISOString()
    };
    setOrder(mockOrder);
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onCartClick={() => {}} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Заказ успешно оформлен — VitaWin"
        description="Ваш заказ успешно оформлен. Спасибо за покупку в VitaWin!"
        keywords=""
        ogTitle="Заказ успешно оформлен — VitaWin"
        ogDescription="Ваш заказ успешно оформлен. Спасибо за покупку в VitaWin!"
        ogUrl={`${window.location.origin}/order-success`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        noindex={true}
      />
      <Header onCartClick={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Заказ успешно оформлен!
            </h1>
            <p className="text-gray-600">
              Спасибо за покупку! Ваш заказ #{order.id.toString().padStart(4, '0')} принят в обработку.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Детали заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Номер заказа</div>
                  <div className="font-medium">#{order.id.toString().padStart(4, '0')}</div>
                </div>
                <div>
                  <div className="text-gray-600">Дата заказа</div>
                  <div className="font-medium">{formatDate(order.created_at)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Способ оплаты</div>
                  <div className="font-medium">{paymentMethodLabels[order.payment_method]}</div>
                </div>
                <div>
                  <div className="text-gray-600">Статус оплаты</div>
                  <Badge className={
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }>
                    {paymentStatusLabels[order.payment_status]}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h3 className="font-medium mb-3">Товары ({getTotalItems()} шт.)</h3>
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

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Итого к оплате:</span>
                <span className="text-emerald-600">
                  {parseFloat(order.total).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Что дальше?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {order.payment_status === 'pending' && order.payment_method === 'cash' && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                    <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Оплата наличными</div>
                      <div className="text-blue-700">
                        Оплатите заказ наличными при получении у курьера
                      </div>
                    </div>
                  </div>
                )}
                
                {order.payment_status === 'paid' && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Заказ оплачен</div>
                      <div className="text-green-700">
                        Ваш заказ оплачен и передан в обработку
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <Truck className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Доставка</div>
                    <div className="text-gray-600">
                      Мы свяжемся с вами для уточнения деталей доставки в течение 24 часов
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to="/account">
                <Package className="w-4 h-4 mr-2" />
                Мои заказы
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/store">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Продолжить покупки
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center mt-8 text-sm text-gray-600">
            <p>Есть вопросы по заказу?</p>
            <Link to="/contact" className="text-emerald-600 hover:underline">
              Свяжитесь с нами
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default OrderSuccess;