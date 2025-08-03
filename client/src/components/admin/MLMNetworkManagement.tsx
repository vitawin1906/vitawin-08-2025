import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Crown, 
  RefreshCw,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MLMNetworkVisualization from './MLMNetworkVisualization';

interface UserNetworkStats {
  userId: number;
  firstName: string;
  username: string;
  telegramId: number;
  referralCode: string;
  currentLevel: number;
  
  personalVolume: {
    totalAmount: number;
    totalPV: number;
    ordersCount: number;
  };
  
  groupVolume: {
    totalAmount: number;
    totalPV: number;
    ordersCount: number;
  };
  
  network: {
    totalReferrals: number;
    directReferrals: number;
    levelBreakdown: Record<number, number>;
    maxDepth: number;
  };
  
  earnings: {
    totalEarned: number;
    referralBonuses: number;
    levelBonuses: number;
  };

  bonusPreferences?: {
    healthId: number;
    travel: number;
    home: number;
    auto: number;
    isLocked: boolean;
  };
}

interface NetworkSummary {
  totalUsers: number;
  totalPersonalVolume: number;
  totalGroupVolume: number;
  totalReferrals: number;
  totalEarnings: number;
}

const MLM_LEVELS = [
  { level: 1, name: "Актив", color: "bg-gray-500" },
  { level: 2, name: "Актив +", color: "bg-gray-600" },
  { level: 3, name: "Актив pro", color: "bg-blue-500" },
  { level: 4, name: "Партнер", color: "bg-blue-600" },
  { level: 5, name: "Партнер +", color: "bg-purple-500" },
  { level: 6, name: "Партнер pro", color: "bg-purple-600" },
  { level: 7, name: "Лидер", color: "bg-green-500" },
  { level: 8, name: "Лидер +", color: "bg-green-600" },
  { level: 9, name: "Лидер pro", color: "bg-yellow-500" },
  { level: 10, name: "Звезда", color: "bg-yellow-600" },
  { level: 11, name: "Звезда +", color: "bg-orange-500" },
  { level: 12, name: "Звезда pro", color: "bg-orange-600" },
  { level: 13, name: "Топ", color: "bg-red-500" },
  { level: 14, name: "Топ +", color: "bg-red-600" },
  { level: 15, name: "Топ pro", color: "bg-pink-500" },
  { level: 16, name: "Создатель", color: "bg-gradient-to-r from-purple-500 to-pink-500" }
];

const MLMNetworkManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalVolume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch all users network stats
  const { data: networkData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/mlm/network/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/mlm/network/users');
      return response.json();
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const users: UserNetworkStats[] = networkData?.data || [];
  const summary: NetworkSummary = networkData?.summary || {
    totalUsers: 0,
    totalPersonalVolume: 0,
    totalGroupVolume: 0,
    totalReferrals: 0,
    totalEarnings: 0
  };

  // Фильтрация и сортировка пользователей
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.telegramId.toString().includes(searchTerm);
      
      const matchesLevel = levelFilter === 'all' || user.currentLevel.toString() === levelFilter;
      
      return matchesSearch && matchesLevel;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'totalVolume':
          aValue = a.personalVolume.totalAmount + a.groupVolume.totalAmount;
          bValue = b.personalVolume.totalAmount + b.groupVolume.totalAmount;
          break;
        case 'personalVolume':
          aValue = a.personalVolume.totalAmount;
          bValue = b.personalVolume.totalAmount;
          break;
        case 'groupVolume':
          aValue = a.groupVolume.totalAmount;
          bValue = b.groupVolume.totalAmount;
          break;
        case 'totalReferrals':
          aValue = a.network.totalReferrals;
          bValue = b.network.totalReferrals;
          break;
        case 'earnings':
          aValue = a.earnings.totalEarned;
          bValue = b.earnings.totalEarned;
          break;
        case 'level':
          aValue = a.currentLevel;
          bValue = b.currentLevel;
          break;
        default:
          aValue = a.userId;
          bValue = b.userId;
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [users, searchTerm, levelFilter, sortBy, sortOrder]);

  const getLevelInfo = (level: number) => {
    return MLM_LEVELS.find(l => l.level === level) || { name: 'Неизвестно', color: 'bg-gray-400' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecalculate = async () => {
    try {
      await apiRequest('POST', '/api/admin/mlm/network/recalculate');
      toast({
        title: "Пересчет запущен",
        description: "Статистика будет пересчитана в фоновом режиме",
      });
      // Обновляем данные через несколько секунд
      setTimeout(() => refetch(), 3000);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось запустить пересчет статистики",
        variant: "destructive"
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Имя', 'Telegram ID', 'Уровень', 'ЛО (₽)', 'ГО (₽)', 'Рефералы', 'Заработок (₽)'].join(','),
      ...filteredAndSortedUsers.map(user => [
        user.userId,
        user.firstName,
        user.telegramId,
        user.currentLevel,
        user.personalVolume.totalAmount,
        user.groupVolume.totalAmount,
        user.network.totalReferrals,
        user.earnings.totalEarned
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mlm_statistics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            Ошибка загрузки статистики MLM сети
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MLM Сеть</h2>
          <p className="text-gray-600">Статистика и управление MLM структурой</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button onClick={handleRecalculate} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Пересчитать
          </Button>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Пользователи</p>
                <p className="text-2xl font-bold">{summary.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общий ЛО</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPersonalVolume)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общий ГО</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalGroupVolume)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Рефералы</p>
                <p className="text-2xl font-bold">{summary.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Заработок</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, username, Telegram ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по уровню" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                {MLM_LEVELS.map(level => (
                  <SelectItem key={level.level} value={level.level.toString()}>
                    {level.level}. {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Сортировать по" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalVolume">Общий объем</SelectItem>
                <SelectItem value="personalVolume">ЛО</SelectItem>
                <SelectItem value="groupVolume">ГО</SelectItem>
                <SelectItem value="totalReferrals">Рефералы</SelectItem>
                <SelectItem value="earnings">Заработок</SelectItem>
                <SelectItem value="level">Уровень</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>
            Пользователи ({filteredAndSortedUsers.length} из {users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Уровень</TableHead>
                    <TableHead>ЛО (Личный объем)</TableHead>
                    <TableHead>ГО (Групповой объем)</TableHead>
                    <TableHead>Структура</TableHead>
                    <TableHead>Заработок</TableHead>
                    <TableHead>PV</TableHead>
                    <TableHead>Свобода выбора</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => {
                    const levelInfo = getLevelInfo(user.currentLevel);
                    const totalVolume = user.personalVolume.totalAmount + user.groupVolume.totalAmount;
                    
                    return (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName}</div>
                            <div className="text-sm text-gray-500">
                              @{user.username} • ID: {user.telegramId}
                            </div>
                            <div className="text-xs text-gray-400">
                              Код: {user.referralCode}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={`${levelInfo.color} text-white`}>
                            {user.currentLevel}. {levelInfo.name}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(user.personalVolume.totalAmount)}</div>
                            <div className="text-sm text-gray-500">
                              {user.personalVolume.ordersCount} заказов
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(user.groupVolume.totalAmount)}</div>
                            <div className="text-sm text-gray-500">
                              {user.groupVolume.ordersCount} заказов
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.network.totalReferrals} рефералов</div>
                            <div className="text-sm text-gray-500">
                              Прямых: {user.network.directReferrals} • Глубина: {user.network.maxDepth}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(user.earnings.totalEarned)}</div>
                            <div className="text-sm text-gray-500">
                              Реф: {formatCurrency(user.earnings.referralBonuses)}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.personalVolume.totalPV + user.groupVolume.totalPV} PV</div>
                            <div className="text-sm text-gray-500">
                              ЛО: {user.personalVolume.totalPV} • ГО: {user.groupVolume.totalPV}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {user.bonusPreferences ? (
                            <div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>🏥 Health ID:</span>
                                  <span className="font-medium">{user.bonusPreferences.healthId}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>✈️ Путешествия:</span>
                                  <span className="font-medium">{user.bonusPreferences.travel}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>🏠 Дом:</span>
                                  <span className="font-medium">{user.bonusPreferences.home}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>🚗 Авто:</span>
                                  <span className="font-medium">{user.bonusPreferences.auto}%</span>
                                </div>
                              </div>
                              {user.bonusPreferences.isLocked && (
                                <div className="mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    🔒 Заблокировано
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 text-sm">
                              Не настроено
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <MLMNetworkVisualization 
                            userId={user.userId} 
                            userName={`${user.firstName} (@${user.username})`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MLMNetworkManagement;