import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Network, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ChevronRight,
  ChevronDown,
  User,
  Crown,
  Eye,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NetworkNode {
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
  };
  earnings: {
    totalEarned: number;
  };
  bonusPreferences?: {
    healthId: number;
    travel: number;
    home: number;
    auto: number;
    isLocked: boolean;
  };
  mentor?: {
    userId: number;
    firstName: string;
    username: string;
    telegramId: number;
    referralCode: string;
  };
  children: NetworkNode[];
  depth: number;
  hasMoreChildren?: boolean;
  totalChildren?: number;
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
  { level: 15, name: "Директор", color: "bg-purple-800" },
  { level: 16, name: "Создатель", color: "bg-black" }
];

const NetworkNodeComponent: React.FC<{
  node: NetworkNode;
  isExpanded: boolean;
  onToggle: (nodeId: number) => void;
  onSelectNode: (node: NetworkNode) => void;
}> = ({ node, isExpanded, onToggle, onSelectNode }) => {
  const levelInfo = MLM_LEVELS.find(l => l.level === node.currentLevel) || MLM_LEVELS[0];
  const hasChildren = node.children.length > 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="mb-2">
      <div 
        className={`flex items-center p-3 rounded-lg border transition-all hover:bg-gray-50 cursor-pointer ${
          node.depth === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
        }`}
        style={{ marginLeft: `${node.depth * 24}px` }}
        onClick={() => onSelectNode(node)}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.userId);
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
        
        {!hasChildren && <div className="w-8" />}
        
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-medium text-sm">
                {node.firstName} (@{node.username})
              </div>
              <div className="text-xs text-gray-500">
                {node.depth === 0 ? 'Вы' : `ур.${node.depth}`} • {node.network.directReferrals} прямых
              </div>
            </div>
          </div>
          
          <Badge className={`${levelInfo.color} text-white text-xs`}>
            {levelInfo.name}
          </Badge>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{node.network.directReferrals}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(node.personalVolume.totalAmount)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{node.personalVolume.totalPV} PV</span>
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="mt-2">
          {node.children.map((child) => (
            <NetworkNodeComponent
              key={child.userId}
              node={child}
              isExpanded={false}
              onToggle={onToggle}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MyNetwork: React.FC = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([2]));
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDepth, setMaxDepth] = useState(16);
  const [showAllFirstLevel, setShowAllFirstLevel] = useState(false);

  const { data: networkTree, isLoading, error } = useQuery({
    queryKey: ['/api/mlm/network/my-tree', maxDepth],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/mlm/network/my-tree?maxDepth=${maxDepth}`);
      return response.json();
    },
  });

  const { data: networkStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/mlm/network/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/mlm/network/stats');
      return response.json();
    },
  });

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Фильтрация узлов по поисковому запросу
  const filterNodes = (node: NetworkNode): NetworkNode | null => {
    if (!searchTerm) return node;
    
    const matchesSearch = 
      node.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.referralCode.includes(searchTerm);
    
    const filteredChildren = node.children
      .map(child => filterNodes(child))
      .filter(Boolean) as NetworkNode[];
    
    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }
    
    return null;
  };

  // Ограничение количества детей на первом уровне
  const limitFirstLevelChildren = (node: NetworkNode): NetworkNode => {
    if (node.depth === 0 && node.children.length > 10 && !showAllFirstLevel) {
      const limitedChildren = node.children.slice(0, 10);
      const hasMore = node.children.length > 10;
      
      return {
        ...node,
        children: limitedChildren,
        hasMoreChildren: hasMore,
        totalChildren: node.children.length
      };
    }
    
    return node;
  };

  const renderNetworkTree = (node: NetworkNode) => {
    const filteredNode = filterNodes(node);
    if (!filteredNode) return null;
    
    const limitedNode = limitFirstLevelChildren(filteredNode);
    const isExpanded = expandedNodes.has(limitedNode.userId);
    
    return (
      <div key={`${limitedNode.userId}-${limitedNode.depth}`}>
        <NetworkNodeComponent
          node={limitedNode}
          isExpanded={isExpanded}
          onToggle={toggleNode}
          onSelectNode={setSelectedNode}
        />
        
        {/* Рекурсивно отображаем дочерние узлы если узел развернут */}
        {isExpanded && limitedNode.children.length > 0 && (
          <div>
            {limitedNode.children.map((child) => renderNetworkTree(child))}
          </div>
        )}
        
        {limitedNode.hasMoreChildren && (
          <div style={{ marginLeft: `${(limitedNode.depth + 1) * 24}px` }} className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllFirstLevel(true)}
              className="text-xs"
            >
              <MoreHorizontal className="h-4 w-4 mr-1" />
              Показать еще {(limitedNode.totalChildren || 0) - 10} участников
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading || isStatsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Моя сеть</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>Моя сеть</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Ошибка при загрузке данных сети
          </div>
        </CardContent>
      </Card>
    );
  }

  const tree = networkTree?.data;
  const stats = networkStats?.data;

  return (
    <div className="space-y-6">
      {/* Поиск и фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={maxDepth.toString()} onValueChange={(value) => setMaxDepth(parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Глубина" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Только прямые (ур.1)</SelectItem>
                  <SelectItem value="2">До 2 уровня</SelectItem>
                  <SelectItem value="3">До 3 уровня</SelectItem>
                  <SelectItem value="5">До 5 уровня</SelectItem>
                  <SelectItem value="8">До 8 уровня</SelectItem>
                  <SelectItem value="10">До 10 уровня</SelectItem>
                  <SelectItem value="16">Все 16 уровней</SelectItem>
                </SelectContent>
              </Select>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Очистить
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика сети */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Всего рефералов</div>
                  <div className="text-2xl font-bold">{stats.totalReferrals || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm font-medium">Прямые рефералы</div>
                  <div className="text-2xl font-bold">{stats.directReferrals || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-sm font-medium">Групповой объем</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.groupVolume?.totalAmount || 0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">Заработано</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings || 0)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Дерево сети */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Структура сети</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {isLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <div className="ml-6 space-y-2">
                    <Skeleton className="h-12 w-4/5" />
                    <Skeleton className="h-12 w-3/5" />
                  </div>
                </div>
              )}
              {tree && !isLoading ? (
                <div className="space-y-2">
                  {renderNetworkTree(tree)}
                </div>
              ) : !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Ваша сеть пуста</p>
                  <p className="text-sm">Приглашайте новых участников для развития структуры</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Детали выбранного пользователя */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Детали участника</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-semibold text-lg">{selectedNode.firstName}</div>
                  <div className="text-sm text-gray-500">@{selectedNode.username}</div>
                  <Badge className={`mt-2 ${MLM_LEVELS.find(l => l.level === selectedNode.currentLevel)?.color || 'bg-gray-500'} text-white`}>
                    {MLM_LEVELS.find(l => l.level === selectedNode.currentLevel)?.name || 'Актив'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {selectedNode.mentor && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-2">👨‍🏫 Наставник</div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">{selectedNode.mentor.firstName}</div>
                          <div className="text-xs text-blue-600">@{selectedNode.mentor.username}</div>
                          <div className="text-xs text-blue-500">ID: {selectedNode.mentor.referralCode}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        Telegram: {selectedNode.mentor.telegramId}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-600">Личный объем</div>
                    <div className="font-semibold">{formatCurrency(selectedNode.personalVolume.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{selectedNode.personalVolume.totalPV} PV · {selectedNode.personalVolume.ordersCount} заказов</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600">Групповой объем</div>
                    <div className="font-semibold">{formatCurrency(selectedNode.groupVolume.totalAmount)}</div>
                    <div className="text-xs text-gray-500">{selectedNode.groupVolume.totalPV} PV · {selectedNode.groupVolume.ordersCount} заказов</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600">Сеть</div>
                    <div className="font-semibold">{selectedNode.network.totalReferrals} участников</div>
                    <div className="text-xs text-gray-500">{selectedNode.network.directReferrals} прямых рефералов</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600">Заработано</div>
                    <div className="font-semibold text-green-600">{formatCurrency(selectedNode.earnings.totalEarned)}</div>
                  </div>

                  {selectedNode.bonusPreferences && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Настройки бонусов</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Health ID</span>
                          <span>{selectedNode.bonusPreferences.healthId}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Путешествия</span>
                          <span>{selectedNode.bonusPreferences.travel}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Дом</span>
                          <span>{selectedNode.bonusPreferences.home}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Авто</span>
                          <span>{selectedNode.bonusPreferences.auto}%</span>
                        </div>
                        {selectedNode.bonusPreferences.isLocked && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            Заблокировано админом
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Выберите участника для просмотра деталей
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyNetwork;