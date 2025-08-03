
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const CheckoutSuccess = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const { addBonusCoins } = useAuthStore();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<any>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Восстанавливаем данные заказа из localStorage
    const pendingOrderData = localStorage.getItem('pendingOrder');
    if (pendingOrderData) {
      const data = JSON.parse(pendingOrderData);
      setOrderData(data);
      
      // Добавляем бонусные монеты
      if (data.bonusCoins) {
        addBonusCoins(data.bonusCoins);
      }
      
      // Очищаем localStorage
      localStorage.removeItem('pendingOrder');
      
      toast({
        title: "Платеж успешно обработан!",
        description: `Заказ ${data.orderId} оплачен. Спасибо за покупку!`,
      });
    }
  }, [addBonusCoins, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Платеж успешно обработан — VitaWin"
        description="Платеж успешно обработан. Ваш заказ принят к исполнению."
        keywords=""
        ogTitle="Платеж успешно обработан — VitaWin"
        ogDescription="Платеж успешно обработан. Ваш заказ принят к исполнению."
        ogUrl={`${window.location.origin}/checkout-success`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        noindex={true}
      />
      <Header onCartClick={() => {}} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Платеж успешно обработан!
            </h1>
            
            {orderData && (
              <>
                <p className="text-gray-600 mb-2">
                  Номер заказа: <span className="font-semibold">{orderData.orderId}</span>
                </p>
                {orderData.bonusCoins > 0 && (
                  <p className="text-emerald-600 mb-4">
                    Вы получили {orderData.bonusCoins} бонусных монет!
                  </p>
                )}
              </>
            )}
            
            <p className="text-gray-600 mb-8">
              Мы отправили подтверждение на вашу электронную почту. 
              Вы можете отслеживать статус заказа в личном кабинете.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => setLocation('/')} 
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Продолжить покупки
              </Button>
              <Button 
                onClick={() => setLocation('/account')} 
                className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
              >
                Личный кабинет
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
