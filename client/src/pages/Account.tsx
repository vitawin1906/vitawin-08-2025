
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import AccountOverview from '@/components/account/AccountOverview';
import PaymentMethods from '@/components/account/PaymentMethods';
import DeliveryAddresses from '@/components/account/DeliveryAddresses';

import ReferralProgram from '@/components/account/ReferralProgram';
import AccountSettings from '@/components/account/AccountSettings';
import OrderHistory from '@/components/account/OrderHistory';
import MlmLevelSection from '@/components/account/MlmLevelSection';
import BonusPreferences from '@/components/BonusPreferences';
import MyNetwork from '@/components/MyNetwork';

import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';

const Account = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();

  // Проверка авторизации и перенаправление неавторизованных пользователей
  useEffect(() => {
    // Проверяем есть ли Telegram параметры в URL для автоматической авторизации
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tg_id');
    
    // Если нет Telegram параметров и пользователь не авторизован
    if (!tgId && !user) {
      setLocation('/');
      return;
    }
  }, [user, setLocation]);

  useEffect(() => {
    // Проверяем URL параметры для автоматического входа через Telegram
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tg_id');
    const tgFirstName = urlParams.get('first_name');
    const tgUsername = urlParams.get('username');


    if (tgId && tgFirstName) {
      // Создаем объект пользователя Telegram
      const tgUser = {
        id: parseInt(tgId),
        first_name: decodeURIComponent(tgFirstName),
        username: tgUsername || null
      };
      
      setTelegramUser(tgUser);
      
      // Пытаемся авторизоваться через Telegram
      authenticateWithTelegram(tgUser);
      
      // Очищаем URL от параметров
      window.history.replaceState({}, '', '/account');
    } else {
    }
  }, []);

  const authenticateWithTelegram = async (tgUser: any) => {
    try {
      
      const requestData = {
        id: tgUser.id,
        first_name: tgUser.first_name,
        username: tgUser.username
      };
      
      
      const response = await fetch('/api/auth/telegram-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          login(data.user, data.token);
        }
      } else {
        const errorData = await response.text();
      }
    } catch (error) {
    }
  };

  // Fetch referral stats to get current balance
  const { data: referralData } = useQuery<{
    success: boolean;
    referral_code: string;
    total_referrals: number;
    total_earnings: string;
    pending_rewards: string;
  }>({
    queryKey: ["/api/referral/stats"],
    enabled: !!(user || telegramUser), // Only fetch if user is logged in
  });

  const currentUser = user || telegramUser;
  const currentBalance = parseFloat(referralData?.total_earnings || "0");

  return (
    <div className="min-h-screen bg-gray-50" itemScope itemType="https://schema.org/ProfilePage">
      <SEOHead 
        title="Личный кабинет — VitaWin | Управление аккаунтом"
        description="Личный кабинет VitaWin: управление заказами, реферальная программа, история покупок, настройки профиля. Отслеживайте кешбэк и бонусы."
        keywords="личный кабинет, аккаунт vitawin, заказы, реферальная программа, кешбэк, бонусы, профиль пользователя"
        ogTitle="Личный кабинет VitaWin"
        ogDescription="Управляйте заказами, отслеживайте кешбэк и развивайте реферальную сеть в личном кабинете VitaWin."
        ogUrl={`${window.location.origin}/account`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        twitterTitle="Личный кабинет VitaWin"
        twitterDescription="Управление заказами, кешбэк и реферальная программа."
        noindex={true}
      />
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
            Добро пожаловать, {currentUser?.first_name || currentUser?.name || 'Пользователь'}, мы тебя <span className="text-[20px] md:text-[24px]">🫶🏻</span>
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-2">
            {/* Первая строка навигации */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="overview" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Обзор
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="orders" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Заказы
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="payment" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Оплата
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="addresses" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Адреса
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="referral" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Рефералы
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Вторая строка навигации */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="network" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Моя сеть
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="mlm" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  MLM Уровни
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="bonus-preferences" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Свобода выбора
                </TabsTrigger>
              </TabsList>
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="settings" className="w-full text-xs md:text-sm px-2 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                  Настройки
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <TabsContent value="overview" className="mt-0 pt-2">
              <AccountOverview />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-0 pt-2">
              <OrderHistory />
            </TabsContent>
            

            <TabsContent value="payment" className="mt-0 pt-2">
              <PaymentMethods />
            </TabsContent>
            
            <TabsContent value="addresses" className="mt-0 pt-2">
              <DeliveryAddresses />
            </TabsContent>
            
            <TabsContent value="referral" className="mt-0 pt-2">
              <ReferralProgram />
            </TabsContent>
            
            <TabsContent value="network" className="mt-0 pt-2">
              <MyNetwork />
            </TabsContent>
            
            <TabsContent value="mlm" className="mt-0 pt-2">
              <MlmLevelSection />
            </TabsContent>

            <TabsContent value="bonus-preferences" className="mt-0 pt-2">
              <BonusPreferences />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 pt-2">
              <AccountSettings />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Account;
