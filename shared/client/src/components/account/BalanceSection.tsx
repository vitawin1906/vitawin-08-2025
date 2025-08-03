import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Wallet, Download, CheckCircle, Clock, AlertCircle, Coins, Gift, Award, ShoppingCart, TrendingUp, Heart, Plane, Car, Home, Save } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalFormData {
  fullName: string;
  inn: string;
  bik: string;
  accountNumber: string;
  amount: number;
}

function BalanceSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [bonusPercentages, setBonusPercentages] = useState({
    healthId: 0,
    travel: 0,
    auto: 0,
    home: 0
  });
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Загружаем настройки бонусов из API
  const { data: bonusPreferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/user/bonus-preferences'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/bonus-preferences');
      return response.json();
    },
    enabled: !!user
  });

  // Обновляем состояние при получении данных из API
  useEffect(() => {
    if (bonusPreferences?.data) {
      const prefs = bonusPreferences.data;
      setBonusPercentages({
        healthId: prefs.health_id_percentage,
        travel: prefs.travel_percentage,
        auto: prefs.auto_percentage,
        home: prefs.home_percentage
      });
    }
  }, [bonusPreferences]);

  // Функция для сохранения настроек в API
  const savePercentages = async () => {
    try {
      const response = await apiRequest('PUT', '/api/user/bonus-preferences', {
        health_id_percentage: bonusPercentages.healthId,
        travel_percentage: bonusPercentages.travel,
        home_percentage: bonusPercentages.home,
        auto_percentage: bonusPercentages.auto
      });
      
      if (response.ok) {
        toast({
          title: "Настройки сохранены",
          description: "Ваши процентные настройки успешно сохранены",
        });
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };
  
  // Функция для обновления процентов
  const handlePercentageChange = (bonusType: keyof typeof bonusPercentages, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      const newPercentages = {
        ...bonusPercentages,
        [bonusType]: numValue
      };
      
      // Проверяем, что общий процент не превышает 100%
      const totalPercentage = Object.values(newPercentages).reduce((sum, val) => sum + val, 0);
      if (totalPercentage <= 100) {
        setBonusPercentages(newPercentages);
      }
    }
  };

  // Вычисляем общий процент
  const totalPercentage = Object.values(bonusPercentages).reduce((sum, val) => sum + val, 0);
  
  // Получаем Telegram ID из URL параметров
  useState(() => {
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
  });

  const currentTelegramId = telegramUser?.id || 131632979; // Fallback к известному ID

  // Загружаем реальные данные о рефералах напрямую по Telegram ID
  const { data: referralHistory, isLoading: historyLoading } = useQuery({
    queryKey: [`/api/referral/history/telegram/${currentTelegramId}`],
    enabled: !!currentTelegramId,
  });
  
  // Загружаем данные пользователя по Telegram ID
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/user/telegram/${currentTelegramId}`],
    enabled: !!currentTelegramId,
  });
  
  // Используем реальные данные из API
  const totalEarnings = parseFloat(
    (referralHistory as any)?.summary?.total_rewards || 
    (userData as any)?.user?.balance || 
    "0"
  );
  const bonusCoins = 45;
  const referralCount = (referralHistory as any)?.summary?.total_referrals || 0;
  
  const form = useForm<WithdrawalFormData>({
    defaultValues: {
      fullName: '',
      inn: '',
      bik: '',
      accountNumber: '',
      amount: 0
    }
  });

  // История выводов
  const withdrawalHistory = [
    {
      id: '1',
      amount: 150.00,
      status: 'completed' as const,
      date: '2024-01-15',
      method: 'bank_transfer'
    },
    {
      id: '2',
      amount: 75.50,
      status: 'pending' as const,
      date: '2024-01-20',
      method: 'bank_transfer'
    }
  ];

  const onSubmit = (data: WithdrawalFormData) => {
    setIsDialogOpen(false);
    form.reset();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Выполнено';
      case 'pending':
        return 'В обработке';
      case 'rejected':
        return 'Отклонено';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="space-y-6">
      {/* Основной баланс */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-emerald-500" />
            Баланс к выводу
          </CardTitle>
          <CardDescription>
            Управляйте своими доходами и запрашивайте выплаты
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div>
                <div className="text-3xl font-bold text-emerald-600">
                  {historyLoading ? "..." : `${totalEarnings.toFixed(2)} ₽`}
                </div>
                <div className="text-sm text-gray-600">Доступно к выводу</div>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={totalEarnings < 50}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Вывести средства
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Заявка на вывод средств</DialogTitle>
                    <DialogDescription>
                      Заполните банковские реквизиты для перевода средств
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ФИО получателя</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Иванов Иван Иванович" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Сумма к выводу</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="3500"
                                max={totalEarnings}
                                placeholder="3500.00" 
                              />
                            </FormControl>
                            <FormDescription>
                              Минимальная сумма вывода 3500 руб.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="inn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ИНН</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123456789012" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bik"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>БИК банка</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="044525225" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер счета</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="40817810099910004312" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                          Отправить заявку
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Отмена
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {totalEarnings < 3500 && (
              <div className="text-sm text-gray-500 text-center">
                Минимальная сумма для вывода: 3500 ₽
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bonus Coins */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-yellow-500 text-white text-xs">
                Активные
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-3">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                VitaWin Coins (VWC)
              </h3>
              <div className="text-2xl font-bold text-yellow-600">{bonusCoins}</div>
              <p className="text-sm text-gray-600">
                Доступно к использованию при следующей покупке
              </p>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Потратить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Реферальные награды */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-purple-500 text-white text-xs">
                +20%
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Реферальные награды (ЛО)
              </h3>
              <div className="text-2xl font-bold text-purple-600">
                {historyLoading ? "..." : `${totalEarnings.toFixed(2)} ₽`}
              </div>
              <p className="text-sm text-gray-600">
                От {historyLoading ? "..." : referralCount} рефералов
              </p>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Подробнее
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Общая статистика */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald-500 text-white text-xs">
                Статистика
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-3">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                Общая статистика
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Заказов:</span>
                  <span className="font-semibold text-emerald-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Потрачено:</span>
                  <span className="font-semibold text-emerald-600">$450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Рефералов:</span>
                  <span className="font-semibold text-emerald-600">
                    {historyLoading ? "..." : referralCount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Групповой объем (ГО) */}
      <Card className="mt-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
            Групповой объем (ГО)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-emerald-100">
                  <div className="text-emerald-600">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold">Standard</div>
                  <div className="text-sm text-gray-500">Текущий статус</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-emerald-600">0%</div>
                <div className="text-sm text-gray-500">до Partner</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Прогресс до статуса Partner (требуется 35 PV)
              </div>
            </div>

            {/* Network Volume Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-emerald-600">0 ₽</div>
                  <div className="text-xs text-gray-500">Ваш бонус</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-emerald-600">0</div>
                  <div className="text-xs text-gray-500">Участников в сети</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-emerald-600">0 PV</div>
                  <div className="text-xs text-gray-500">Общий ГО сети</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Заголовок для блоков с процентами */}
      <div className="mt-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Свобода выбора</h2>
        <p className="text-gray-600 text-center">Настройте распределение процентов от вашего дохода</p>
      </div>

      {/* Блоки с настройкой процентов */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Health ID */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-red-50 to-pink-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-500 text-white text-xs">
                Health
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-3">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Health ID
              </h3>
              <div className="text-2xl font-bold text-red-600">
                0.00 ₽
              </div>
              <p className="text-sm text-gray-600">
                Бонус за здоровье
              </p>
            </div>
            
            <div className="mt-3 mb-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={bonusPercentages.healthId}
                  onChange={(e) => handlePercentageChange('healthId', e.target.value)}
                  className="w-16 h-8 text-center border-red-200 focus:border-red-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">%</span>
                <span className="text-xs text-gray-500">от дохода</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-red-500 text-red-600 hover:bg-red-50"
              >
                <Heart className="h-4 w-4 mr-1" />
                Активировать
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Travel Fund */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-blue-500 text-white text-xs">
                Travel
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Мои путешествия
              </h3>
              <div className="text-2xl font-bold text-blue-600">
                0.00 ₽
              </div>
              <p className="text-sm text-gray-600">
                Фонд путешествий
              </p>
            </div>
            
            <div className="mt-3 mb-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={bonusPercentages.travel}
                  onChange={(e) => handlePercentageChange('travel', e.target.value)}
                  className="w-16 h-8 text-center border-blue-200 focus:border-blue-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">%</span>
                <span className="text-xs text-gray-500">от дохода</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Plane className="h-4 w-4 mr-1" />
                Накопить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto Bonus */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-500 text-white text-xs">
                Auto
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
              <Car className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Твой автомобиль
              </h3>
              <div className="text-2xl font-bold text-orange-600">
                0.00 ₽
              </div>
              <p className="text-sm text-gray-600">
                Автомобильный бонус
              </p>
            </div>
            
            <div className="mt-3 mb-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={bonusPercentages.auto}
                  onChange={(e) => handlePercentageChange('auto', e.target.value)}
                  className="w-16 h-8 text-center border-orange-200 focus:border-orange-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">%</span>
                <span className="text-xs text-gray-500">от дохода</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Car className="h-4 w-4 mr-1" />
                Получить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Мой дом */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="relative bg-gradient-to-br from-teal-50 to-green-50 p-4">
            <div className="absolute top-3 right-3">
              <Badge className="bg-teal-500 text-white text-xs">
                Дом
              </Badge>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg mb-3">
              <Home className="h-6 w-6 text-teal-600" />
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                Мой дом
              </h3>
              <div className="text-2xl font-bold text-teal-600">
                0.00 ₽
              </div>
              <p className="text-sm text-gray-600">
                Жилищный фонд
              </p>
            </div>
            
            <div className="mt-3 mb-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={bonusPercentages.home}
                  onChange={(e) => handlePercentageChange('home', e.target.value)}
                  className="w-16 h-8 text-center border-teal-200 focus:border-teal-500"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">%</span>
                <span className="text-xs text-gray-500">от дохода</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                <Home className="h-4 w-4 mr-1" />
                Копить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Индикатор общего процента */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Общий процент распределения</h3>
              <p className="text-sm text-gray-600">
                Вы можете распределить до 100% от вашего бонусного дохода
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                totalPercentage === 100 ? 'text-green-600' : 
                totalPercentage > 100 ? 'text-red-600' : 
                'text-blue-600'
              }`}>
                {totalPercentage}%
              </div>
              <div className="text-xs text-gray-500">
                {100 - totalPercentage}% свободно
              </div>
            </div>
          </div>
          
          {/* Прогресс бар */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalPercentage === 100 ? 'bg-green-500' : 
                  totalPercentage > 100 ? 'bg-red-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {totalPercentage > 100 && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              ⚠ Общий процент превышает 100%. Уменьшите некоторые значения.
            </div>
          )}
          
          {totalPercentage === 100 && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              ✓ Отлично! Вы распределили весь доход по бонусным программам.
            </div>
          )}
          
          {/* Кнопка сохранения */}
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={savePercentages}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              disabled={totalPercentage !== 100 || isLoadingPreferences || bonusPreferences?.data?.is_locked}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoadingPreferences ? "Загрузка..." : "Сохранить настройки"}
            </Button>
          </div>
          
          {/* Показать статус блокировки */}
          {bonusPreferences?.data?.is_locked && (
            <div className="mt-2 text-center text-sm text-gray-600">
              <span className="inline-flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Настройки заблокированы администратором
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* История выводов */}
      <Card>
        <CardHeader>
          <CardTitle>История выводов</CardTitle>
          <CardDescription>
            Все ваши заявки на вывод средств
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет заявок на вывод</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawalHistory.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <div className="font-medium">{withdrawal.amount.toFixed(0)} ₽</div>
                      <div className="text-sm text-gray-500">
                        {new Date(withdrawal.date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>
                    {getStatusText(withdrawal.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BalanceSection;