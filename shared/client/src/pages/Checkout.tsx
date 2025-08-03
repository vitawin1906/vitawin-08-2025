import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreeShippingProgress from '@/components/FreeShippingProgress';
import { getProductImageUrl } from '@/utils/imageUtils';
import { formatPrice, formatPriceNumber } from '@/utils/priceUtils';
import { CHECKOUT_CONFIG, DELIVERY_CONFIG, BONUS_CONFIG } from '@/config/checkoutConfig';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Truck, 
  CreditCard, 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

// Define delivery services
const deliveryServices = [
  { 
    id: 'sdek', 
    name: 'СДЭК', 
    logo: Package, 
    price: 300, 
    estimatedDays: '2-5' 
  },
  { 
    id: 'russianpost', 
    name: 'Почта России', 
    logo: Package, 
    price: 200, 
    estimatedDays: '3-7' 
  },
  { 
    id: 'yandex', 
    name: 'Яндекс Доставка', 
    logo: Truck, 
    price: 350, 
    estimatedDays: '1-3' 
  }
];

// Define payment methods - will be filtered based on auth status

export interface CheckoutFormValues {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryService: string;
  paymentMethod: string;
  notes: string;
  referralCode: string;
}

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [referralCodeError, setReferralCodeError] = useState<string>('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const { items, getTotalPrice, clearCart, updateQuantity } = useCartStore();
  const user = useAuthStore(state => state.user);
  const { addBonusCoins } = useAuthStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Загружаем реальный баланс пользователя
  const { data: referralStats } = useQuery({
    queryKey: [`/api/referral/stats/telegram/131632979`],
  });

  const userBalance = parseFloat((referralStats as any)?.total_earnings || user?.balance || "0");

  // Define payment methods based on auth status
  const paymentMethods = user ? [
    { id: 'balance', name: 'С баланса', logo: Wallet },
    { id: 'card', name: 'Банковской картой', logo: CreditCard },
  ] : [
    { id: 'card', name: 'Банковской картой', logo: CreditCard },
  ];

  // Initialize form with user data if available
  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      deliveryService: 'sdek',
      paymentMethod: user ? 'balance' : 'card', // Default to card for non-authenticated users
      notes: '',
      referralCode: user?.applied_referral_code || '', // Предзаполнение примененного реферального кода
    },
  });

  const selectedDelivery = deliveryServices.find(
    service => service.id === form.watch('deliveryService')
  );

  // ХАРДКОД НАСТРОЙКИ ЧЕКАУТА
  const subtotal = getTotalPrice();
  const freeShippingThreshold = DELIVERY_CONFIG.freeShippingThreshold;
  const deliveryFee = subtotal >= freeShippingThreshold ? 0 : DELIVERY_CONFIG.standardDeliveryFee;
  
  // Логика реферальной скидки из конфигурации
  const referralCode = form.watch('referralCode');
  const hasReferralDiscount = referralCode && referralCode.trim().length > 0 && !referralCodeError;
  const referralDiscount = hasReferralDiscount ? Math.round(subtotal * CHECKOUT_CONFIG.promos.referralDiscountRate) : 0;
  const totalAfterDiscount = subtotal - referralDiscount;
  const total = totalAfterDiscount + deliveryFee;
  
  // ХАРДКОД БОНУСЫ из конфигурации
  const bonusCoins = Math.round(totalAfterDiscount * BONUS_CONFIG.bonusRate);
  const cashback = bonusCoins;
  
  // Функция валидации реферального кода
  const validateReferralCode = async (code: string) => {
    if (!code || !code.trim()) {
      setReferralCodeError('');
      return;
    }

    setIsValidatingCode(true);
    setReferralCodeError('');

    try {
      const response = await fetch('/api/validate-referral-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ referralCode: code.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error === 'own_code') {
          setReferralCodeError('Нельзя использовать свой промокод, используйте промокод того кто вас пригласил');
        } else if (response.status === 400) {
          setReferralCodeError('Промокод не найден или недействителен');
        } else {
          setReferralCodeError('Ошибка проверки промокода');
        }
      }
    } catch (error) {
      setReferralCodeError('Ошибка проверки промокода');
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  // Следим за изменением способа оплаты
  const watchedPaymentMethod = form.watch('paymentMethod');
  
  // Показываем информацию о балансе когда выбран способ оплаты "С баланса"
  useEffect(() => {
    if (watchedPaymentMethod === 'balance') {
      setShowBalanceInfo(true);
    } else {
      setShowBalanceInfo(false);
    }
  }, [watchedPaymentMethod]);

  const validateRequiredFields = () => {
    const data = form.getValues();
    const errors: Record<string, boolean> = {};
    
    if (!data.fullName?.trim()) errors.fullName = true;
    if (!data.email?.trim()) errors.email = true;
    if (!data.phone?.trim()) errors.phone = true;
    if (!data.address?.trim()) errors.address = true;
    if (!data.city?.trim()) errors.city = true;
    if (!data.postalCode?.trim()) errors.postalCode = true;
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (step === 1) {
      if (!validateRequiredFields()) {
        toast({
          title: "Заполните все обязательные поля",
          description: "Поля отмечены красным цветом должны быть заполнены",
          variant: "destructive",
        });
        return;
      }
    }
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      setIsProcessing(true);
      
      // Проверяем актуальную авторизацию через API
      let isUserAuthenticated = false;
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const userResponse = await fetch('/api/user', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          isUserAuthenticated = userResponse.ok;
        } catch (error) {
          isUserAuthenticated = false;
        }
      }
      
      // Выбираем правильный endpoint в зависимости от реальной авторизации
      const orderEndpoint = isUserAuthenticated ? '/api/checkout' : '/api/orders/guest';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Добавляем токен авторизации для зарегистрированных пользователей
      if (isUserAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Подготавливаем данные для заказа в зависимости от типа пользователя
      const orderPayload = isUserAuthenticated ? {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        payment_method: data.paymentMethod,
        delivery_info: {
          service: data.deliveryService,
          address: `${data.city}, ${data.address}`,
          postal_code: data.postalCode,
          recipient_name: data.fullName,
          recipient_phone: data.phone
        },
        referral_code: data.referralCode || ""
      } : {
        customerInfo: data,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          title: item.name
        })),
        total: total,
        delivery_cost: deliveryFee
      };
      
      
      const orderResponse = await fetch(orderEndpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(`Ошибка создания заказа: ${errorText}`);
      }

      const orderData = await orderResponse.json();
      
      // Обновляем пользователя с примененным реферальным кодом если он был использован
      if (data.referralCode && data.referralCode.trim() && user) {
        const updatedUser = { ...user, applied_referral_code: data.referralCode.trim() };
        useAuthStore.getState().updateUser(updatedUser);
      }
      
      const orderId = orderData.order?.id;

      if (!orderId) {
        throw new Error('Не удалось получить ID заказа');
      }


      // Подготавливаем данные для платежа
      const paymentPayload = {
        orderId: orderId,
        amount: total,
        description: `Заказ №${orderId} в магазине VitaWin`,
        customerEmail: data.email,
        customerPhone: data.phone
      };
      

      // Создаем платеж через Тинькофф
      const paymentResponse = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload)
      });



      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        throw new Error(`Ошибка создания платежа: ${errorText}`);
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.paymentUrl) {
        
        // Сохраняем данные для восстановления после оплаты
        const pendingOrderData = {
          orderId,
          items,
          formData: data,
          totalAmount: total,
          bonusCoins: bonusCoins
        };
        
        localStorage.setItem('pendingOrder', JSON.stringify(pendingOrderData));

        // Перенаправляем на страницу оплаты Тинькофф
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error(paymentData.error || 'Ошибка создания платежа');
      }
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('Checkout error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: "Ошибка при оформлении заказа",
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };



  // Redirect if cart is empty
  if (items.length === 0 && !isComplete) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead 
        title="Оформление заказа — VitaWin"
        description="Оформление заказа в интернет-магазине VitaWin. Безопасная оплата и быстрая доставка."
        keywords=""
        ogTitle="Оформление заказа — VitaWin"
        ogDescription="Оформление заказа в интернет-магазине VitaWin."
        ogUrl={`${window.location.origin}/checkout`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        noindex={true}
      />
      <Header onCartClick={() => {}} />
      <main className="flex-grow container mx-auto py-4 md:py-8 px-4">
        {isComplete ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Заказ успешно оформлен!</h1>
            <p className="text-gray-600 mb-6">
              Спасибо за ваш заказ. Номер вашего заказа: <span className="font-semibold">{orderNumber}</span>
            </p>
            <p className="text-gray-600 mb-8">
              Мы отправили подтверждение на вашу электронную почту. Вы можете отслеживать статус заказа в разделе "Доставка" в личном кабинете.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => setLocation('/')} variant="outline">
                Продолжить покупки
              </Button>
              <Button onClick={() => setLocation('/account')} className="bg-emerald-600 hover:bg-emerald-700">
                Перейти в личный кабинет
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">Оформление заказа</h1>
            
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Order Summary - Mobile First */}
              <div className="lg:hidden">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Ваш заказ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Free Shipping Progress */}
                      <FreeShippingProgress 
                        currentAmount={subtotal}
                        freeShippingThreshold={freeShippingThreshold}
                      />
                      
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 md:h-16 md:w-16 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => useCartStore.getState().updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-sm"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="text-xs md:text-sm text-gray-700 min-w-[20px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => useCartStore.getState().updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="font-medium text-sm md:text-base">{item.price * item.quantity} ₽</p>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Итого</span>
                          <span>{subtotal} ₽</span>
                        </div>
                        {hasReferralDiscount && (
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">Скидка 10%</span>
                            <span className="text-red-600 font-medium">-{referralDiscount} ₽</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Доставка</span>
                          <span className={deliveryFee === 0 ? "text-emerald-600 font-medium" : ""}>
                            {deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee} ₽`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Бонус + (5% от заказа)</span>
                          <span className="text-emerald-600 font-medium">+{bonusCoins} ₽</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between font-bold text-base md:text-lg">
                          <span>К оплате</span>
                          <span>{total.toFixed(1)} ₽</span>
                        </div>
                      </div>
                      
                      {/* Bonuses Section */}
                      <div className="bg-emerald-50 p-3 md:p-4 rounded-lg">
                        <h4 className="font-medium text-emerald-800 mb-2 text-sm md:text-base">Ваши бонусы</h4>
                        <div className="space-y-1 text-xs md:text-sm">
                          <div className="flex justify-between text-emerald-700">
                            <span>Бонусные монеты (5%):</span>
                            <span>+{bonusCoins} ₽</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs md:text-sm text-gray-500 flex items-center mt-4">
                        <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 mr-2 text-gray-400" />
                        Защищенный платеж. Ваши данные в безопасности.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Checkout Form */}
              <div className="lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <div className="flex items-center mb-6 overflow-x-auto">
                    <div className={`flex items-center justify-center h-6 w-6 md:h-8 md:w-8 rounded-full ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200'} mr-2 text-xs md:text-sm`}>
                      1
                    </div>
                    <span className="font-semibold text-sm md:text-base whitespace-nowrap">Адрес доставки</span>
                    <div className="h-px flex-1 bg-gray-200 mx-2 md:mx-4 min-w-[20px]"></div>
                    <div className={`flex items-center justify-center h-6 w-6 md:h-8 md:w-8 rounded-full ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200'} mr-2 text-xs md:text-sm`}>
                      2
                    </div>
                    <span className="font-semibold text-sm md:text-base whitespace-nowrap">Способ доставки и оплаты</span>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                      {step === 1 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <FormField
                              control={form.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    ФИО <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Иван Иванов" 
                                      className={fieldErrors.fullName ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    Email <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="ваш@email.ru" 
                                      type="email" 
                                      className={fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    Телефон <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="+7 (000) 000-00-00" 
                                      className={fieldErrors.phone ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    Адрес <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Улица, дом, квартира" 
                                      className={fieldErrors.address ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    Город <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Москва" 
                                      className={fieldErrors.city ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    Индекс <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="123456" 
                                      className={fieldErrors.postalCode ? "border-red-500 focus:border-red-500" : ""}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {user && (
                              <FormField
                                control={form.control}
                                name="referralCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center">
                                      Реферальный код 
                                      <span className="text-xs text-gray-500 ml-2">(введи код и получи скидку 10%)</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Введите реферальный код" 
                                        className={`${referralCodeError 
                                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                                          : "border-emerald-200 focus:border-emerald-500"
                                        }`}
                                        disabled={!!user?.applied_referral_code || isValidatingCode}
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          // Валидируем с задержкой
                                          setTimeout(() => {
                                            validateReferralCode(e.target.value);
                                          }, 500);
                                        }}
                                      />
                                    </FormControl>
                                    
                                    {referralCodeError && (
                                      <p className="text-xs text-red-600">
                                        {referralCodeError}
                                      </p>
                                    )}
                                    
                                    {user?.applied_referral_code && !referralCodeError && (
                                      <p className="text-xs text-emerald-600">
                                        Используется ваш реферальный код из аккаунта
                                      </p>
                                    )}
                                    
                                    {isValidatingCode && (
                                      <p className="text-xs text-gray-500">
                                        Проверка промокода...
                                      </p>
                                    )}
                                    
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                          
                          <Button 
                            type="button" 
                            onClick={nextStep} 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 mt-6"
                          >
                            Продолжить <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {step === 2 && (
                        <div className="space-y-4 md:space-y-6">
                          <div>
                            <h3 className="text-base md:text-lg font-medium mb-3">Способ доставки</h3>
                            <FormField
                              control={form.control}
                              name="deliveryService"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="space-y-3"
                                    >
                                      {deliveryServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-2 border p-3 rounded-md">
                                          <RadioGroupItem value={service.id} id={service.id} />
                                          <Label htmlFor={service.id} className="flex items-center cursor-pointer w-full">
                                            <div className="mr-3 p-2 bg-gray-100 rounded-md">
                                              <service.logo className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-medium text-sm md:text-base">{service.name}</div>
                                              <div className="text-xs md:text-sm text-gray-500">
                                                {service.estimatedDays} дней • {subtotal >= freeShippingThreshold ? 'Бесплатно' : `${service.price} ₽`}
                                              </div>
                                            </div>
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div>
                            <h3 className="text-base md:text-lg font-medium mb-3">Способ оплаты</h3>
                            <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="space-y-3"
                                    >
                                      {paymentMethods.map((method) => (
                                        <div key={method.id} className="flex items-center space-x-2 border p-3 rounded-md">
                                          <RadioGroupItem value={method.id} id={method.id} />
                                          <Label htmlFor={method.id} className="flex items-center cursor-pointer w-full">
                                            <div className="mr-3 p-2 bg-gray-100 rounded-md">
                                              <method.logo className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="font-medium text-sm md:text-base">{method.name}</div>
                                              <div className="text-xs md:text-sm text-gray-500">
                                                {method.id === 'balance' ? 'Оплата с вашего баланса' : 'Безопасная онлайн оплата'}
                                              </div>
                                            </div>
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {/* Информация о балансе пользователя */}
                            {showBalanceInfo && user && (
                              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-emerald-800">Доступный баланс</h4>
                                    <p className="text-sm text-emerald-600">
                                      На вашем счету: <span className="font-semibold">{userBalance.toFixed(2)} ₽</span>
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-emerald-600">
                                      Сумма к оплате: <span className="font-semibold">{total.toFixed(1)} ₽</span>
                                    </p>
                                    {userBalance < total && (
                                      <p className="text-xs text-red-600 mt-1">
                                        Недостаточно средств. Пополните баланс на {(total - userBalance).toFixed(1)} ₽
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Примечания к заказу</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Дополнительная информация для доставки"
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Чекбокс согласия с документами */}
                          <div className="flex items-start space-x-2">
                            <Checkbox 
                              id="agree-terms"
                              checked={agreeToTerms}
                              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                            />
                            <label htmlFor="agree-terms" className="text-sm text-gray-600 leading-relaxed">
                              Соглашаюсь с{' '}
                              <Link to="/contract-offer" className="text-emerald-600 hover:text-emerald-700 underline">
                                Офертой
                              </Link>
                              ,{' '}
                              <Link to="/privacy-policy" className="text-emerald-600 hover:text-emerald-700 underline">
                                Политикой конфиденциальности
                              </Link>
                              , использованием cookie и{' '}
                              <Link to="/terms-of-service" className="text-emerald-600 hover:text-emerald-700 underline">
                                Условиями сервиса
                              </Link>
                            </label>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-4">
                            <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                              Назад
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isProcessing || !agreeToTerms} 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? 'Создание платежа...' : 'Перейти к оплате'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </div>
              
              {/* Order Summary - Desktop */}
              <div className="lg:w-1/3 hidden lg:block">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Ваш заказ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Free Shipping Progress */}
                      <FreeShippingProgress 
                        currentAmount={subtotal}
                        freeShippingThreshold={freeShippingThreshold}
                      />
                      
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={getProductImageUrl(item.image)}
                            alt={item.name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => useCartStore.getState().updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-sm"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="text-sm text-gray-700 min-w-[25px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => useCartStore.getState().updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Итого</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        
                        {/* Показываем скидку только если введен реферальный код */}
                        {hasReferralDiscount && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Скидка по промокоду (10%)</span>
                            <span>-{formatPrice(referralDiscount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Доставка</span>
                          <span className={deliveryFee === 0 ? "text-emerald-600 font-medium" : ""}>
                            {deliveryFee === 0 ? 'Бесплатно' : formatPrice(deliveryFee)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-[#ed870c]">Бонус + (5% от заказа)</span>
                          <span className="font-medium text-[#f2ac60]">+{formatPrice(bonusCoins)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between font-bold text-lg">
                          <span>К оплате</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 flex items-center mt-4">
                        <ShieldCheck className="h-4 w-4 mr-2 text-gray-400" />
                        Защищенный платеж. Ваши данные в безопасности.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
