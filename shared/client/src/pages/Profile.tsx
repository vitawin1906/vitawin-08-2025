import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReferralSection } from '@/components/ReferralSection';
import BalanceSection from '@/components/account/BalanceSection';
import OrderHistory from '@/components/account/OrderHistory';
import { useAuthStore } from '@/store/authStore';
import { User, ShoppingBag, Gift, Settings, Wallet } from 'lucide-react';

function Profile() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Войдите в систему для просмотра личного кабинета</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Личный кабинет
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Добро пожаловать, {user.name}!
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Аккаунт
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Заказы
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Gift className="h-4 w-4 mr-2" />
            Рефералы
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="space-y-6">
            {/* Информация о профиле */}
            <Card>
              <CardHeader>
                <CardTitle>Информация о профиле</CardTitle>
                <CardDescription>
                  Ваши основные данные из Telegram
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Имя
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Telegram ID
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white font-mono">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Реферальный код
                    </label>
                    <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      {user.referralCode || user.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Статус
                    </label>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Активный пользователь
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Баланс и доходы */}
            <BalanceSection />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrderHistory />
        </TabsContent>

        <TabsContent value="referrals">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Реферальная программа</CardTitle>
                <CardDescription>
                  Приглашайте друзей и зарабатывайте на их покупках
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      20%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ваша комиссия
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      10%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Скидка друзей
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      0
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Приглашено друзей
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ReferralSection />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Настройки</CardTitle>
              <CardDescription>
                Управление настройками аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Настройки будут добавлены в будущих обновлениях</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Profile;