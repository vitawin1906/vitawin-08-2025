import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Brain,
  Network,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HealthMetrics {
  health_score: number;
  metrics: {
    users: { total: number; new_today: number };
    orders: { total: number; today: number };
    errors: { total_24h: number; critical_24h: number; unresolved: number };
    system: { uptime: number; memory: any };
  };
  analysis: {
    status: string;
    recommendations: string[];
    alerts: string[];
  };
}

interface NetworkData {
  network: {
    nodes: any[];
    connections: any[];
    stats: {
      total_nodes: number;
      active_connections: number;
      referral_depth: number;
    };
  };
}

interface ErrorData {
  errors: Array<{
    id: string;
    timestamp: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
  }>;
}

const AIAgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка данных о сети
  const { data: networkData, isLoading: networkLoading, refetch: refetchNetwork } = useQuery<NetworkData>({
    queryKey: ['/api/ai-agent/network'],
    enabled: false,
  });

  // Загрузка логов ошибок
  const { data: errorData, isLoading: errorLoading, refetch: refetchErrors } = useQuery<ErrorData>({
    queryKey: ['/api/ai-agent/errors'],
    enabled: false,
  });

  // Загрузка отчета о здоровье системы
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthMetrics>({
    queryKey: ['/api/ai-agent/health'],
    enabled: false,
  });

  // Расчет бонусов
  const calculateBonusesMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch('/api/ai-agent/calculate-bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) throw new Error('Failed to calculate bonuses');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Бонусы пересчитаны",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-agent/health'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось пересчитать бонусы",
        variant: "destructive",
      });
    },
  });

  const runDiagnostics = async () => {
    try {
      await Promise.all([
        refetchHealth(),
        refetchNetwork(),
        refetchErrors(),
      ]);
      toast({
        title: "Диагностика завершена",
        description: "Все системы проверены",
      });
    } catch (error) {
      toast({
        title: "Ошибка диагностики",
        description: "Не удалось выполнить диагностику",
        variant: "destructive",
      });
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isLoading = healthLoading || networkLoading || errorLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ИИ Агент: Система Мониторинга</h2>
          <p className="text-gray-600">Автоматический анализ реферальной сети и здоровья системы</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            <Brain className="mr-2 h-4 w-4" />
            Запустить диагностику
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="network">Сеть</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
          <TabsTrigger value="analysis">Анализ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className={`h-5 w-5 ${getHealthScoreColor(healthData?.health_score || 0)}`} />
                  <div>
                    <p className="text-sm text-gray-600">Здоровье системы</p>
                    <p className={`text-2xl font-bold ${getHealthScoreColor(healthData?.health_score || 0)}`}>
                      {healthData?.health_score || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Пользователи</p>
                    <p className="text-2xl font-bold">{healthData?.metrics?.users?.total || 0}</p>
                    <p className="text-xs text-green-600">+{healthData?.metrics?.users?.new_today || 0} сегодня</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Заказы</p>
                    <p className="text-2xl font-bold">{healthData?.metrics?.orders?.total || 0}</p>
                    <p className="text-xs text-green-600">+{healthData?.metrics?.orders?.today || 0} сегодня</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    (healthData?.metrics?.errors?.critical_24h || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-600">Ошибки (24ч)</p>
                    <p className="text-2xl font-bold">{healthData?.metrics?.errors?.total_24h || 0}</p>
                    <p className="text-xs text-red-600">
                      {healthData?.metrics?.errors?.critical_24h || 0} критических
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Анализ реферальной сети
              </CardTitle>
              <CardDescription>
                Структура и состояние реферальных связей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{networkData?.network?.stats?.total_nodes || 0}</p>
                  <p className="text-sm text-gray-600">Всего узлов</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{networkData?.network?.stats?.active_connections || 0}</p>
                  <p className="text-sm text-gray-600">Активных связей</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{networkData?.network?.stats?.referral_depth || 0}</p>
                  <p className="text-sm text-gray-600">Максимальная глубина</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Системные ошибки
              </CardTitle>
              <CardDescription>
                Мониторинг и анализ ошибок системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorData?.errors?.length ? (
                  errorData.errors.map((error) => (
                    <div key={error.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={`h-4 w-4 ${
                          error.severity === 'critical' ? 'text-red-600' : 
                          error.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                        <div>
                          <p className="font-medium">{error.type}</p>
                          <p className="text-sm text-gray-600">{error.message}</p>
                          <p className="text-xs text-gray-500">{new Date(error.timestamp).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                      <Badge variant={error.resolved ? "default" : "destructive"}>
                        {error.resolved ? 'Решено' : 'Активно'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-gray-600">Ошибок не обнаружено</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ИИ Анализ и Рекомендации
              </CardTitle>
              <CardDescription>
                Автоматические рекомендации по оптимизации системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Статус системы</h4>
                  <Badge variant="default">
                    {healthData?.analysis?.status || 'Неизвестно'}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Рекомендации</h4>
                  <div className="space-y-2">
                    {healthData?.analysis?.recommendations?.length ? (
                      healthData.analysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-sm">Рекомендации не найдены</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Предупреждения</h4>
                  <div className="space-y-2">
                    {healthData?.analysis?.alerts?.length ? (
                      healthData.analysis.alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm">{alert}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-sm">Предупреждений нет</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentDashboard;