import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { ProductManagementNew } from '@/components/admin/ProductManagementNew';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { Analytics } from '@/components/admin/Analytics';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { BlogManagement } from '@/components/admin/BlogManagement';
import { ContactManagement } from '@/components/admin/ContactManagement';
import TelegramSettings from '@/components/admin/TelegramSettings';
import { PaymentSettings } from '@/components/admin/PaymentSettings';
import SimpleAIAgent from '@/components/admin/SimpleAIAgent';
import AIAgentDashboard from '@/components/admin/AIAgentDashboard';
import AdminSessionMonitor from '@/components/admin/AdminSessionMonitor';
import SecuritySection from '@/components/admin/SecuritySection';
import ReferralSettings from '@/components/admin/ReferralSettings';
import MLMNetworkManagement from '@/components/admin/MLMNetworkManagement';
import { Package, BarChart3, Settings, ShoppingCart, Users, FolderOpen, FileText, MapPin, Database, MessageCircle, CreditCard, Brain, Lock, Shield, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin is authenticated with optimized query
  const { data: adminProfile, isError, isLoading: queryLoading } = useQuery({
    queryKey: ['/api/admin/profile'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Memoized authorization check
  const authorizationStatus = useMemo(() => {
    if (queryLoading) {
      return { authorized: false, loading: true };
    }
    
    if (adminProfile && (adminProfile as any).admin) {
      return { authorized: true, loading: false };
    }
    
    return { authorized: false, loading: false };
  }, [adminProfile, queryLoading]);

  useEffect(() => {
    setIsAuthorized(authorizationStatus.authorized);
    setIsLoading(authorizationStatus.loading);
  }, [authorizationStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Перенаправляем на страницу входа в админку
    window.location.href = '/admin/login';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Перенаправление на страницу входа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <SEOHead 
        title="Админка — Доступ запрещен"
        description="Административная панель. Доступ только для авторизованных администраторов."
        keywords=""
        ogTitle="Админка — Доступ запрещен"
        ogDescription="Административная панель. Доступ только для авторизованных администраторов."
        ogUrl={`${window.location.origin}/admin`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        noindex={true}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Панель администратора</h1>
          <p className="text-gray-600 mt-2">Управление сайтом, товарами и аналитикой</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <div className="border-b mb-6">
            <TabsList className="h-auto p-4 bg-transparent">
              <div className="space-y-4 w-full">
                {/* Основное управление */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Управление</h3>
                  <div className="flex flex-wrap gap-2">
                    <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm px-3 py-2">
                      <BarChart3 className="h-4 w-4" />
                      Аналитика
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="flex items-center gap-2 text-sm px-3 py-2">
                      <ShoppingCart className="h-4 w-4" />
                      Заказы
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Package className="h-4 w-4" />
                      Товары
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2 text-sm px-3 py-2">
                      <FolderOpen className="h-4 w-4" />
                      Категории
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Users className="h-4 w-4" />
                      Пользователи
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="flex items-center gap-2 text-sm px-3 py-2">
                      <FileText className="h-4 w-4" />
                      Блог
                    </TabsTrigger>
                    <TabsTrigger value="mlm-network" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Network className="h-4 w-4" />
                      MLM Сеть
                    </TabsTrigger>
                  </div>
                </div>

                {/* Система и безопасность */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Система</h3>
                  <div className="flex flex-wrap gap-2">
                    <TabsTrigger value="ai-agent" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Brain className="h-4 w-4" />
                      ИИ Агент
                    </TabsTrigger>
                    <TabsTrigger value="session-monitor" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Shield className="h-4 w-4" />
                      Мониторинг
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Lock className="h-4 w-4" />
                      Безопасность
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 text-sm px-3 py-2">
                      <Settings className="h-4 w-4" />
                      Настройки
                    </TabsTrigger>
                  </div>
                </div>
              </div>
            </TabsList>
          </div>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>



          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="mlm-network">
            <MLMNetworkManagement />
          </TabsContent>

          <TabsContent value="ai-agent">
            <AIAgentDashboard />
          </TabsContent>

          <TabsContent value="session-monitor">
            <AdminSessionMonitor />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Платежные системы
                    </CardTitle>
                    <CardDescription>
                      Настройка платежных терминалов и методов оплаты
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentSettings />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Реферальная программа
                    </CardTitle>
                    <CardDescription>
                      Настройка процентных ставок для реферальной программы
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReferralSettings />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Контактная информация
                    </CardTitle>
                    <CardDescription>
                      Управление контактными данными
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContactManagement />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Общие настройки
                    </CardTitle>
                    <CardDescription>
                      Системные настройки и конфигурация
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdminSettings />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
