import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Network, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ChevronRight,
  ChevronDown,
  User,
  Crown
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
  children: NetworkNode[];
  depth: number;
}

interface MLMNetworkVisualizationProps {
  userId: number;
  userName: string;
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

const NetworkNodeComponent: React.FC<{ 
  node: NetworkNode; 
  isExpanded: boolean; 
  onToggle: () => void;
  onSelectNode: (node: NetworkNode) => void;
  expandedNodes: Set<number>;
  toggleNode: (nodeId: number) => void;
}> = ({ node, isExpanded, onToggle, onSelectNode, expandedNodes, toggleNode }) => {
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mr-2 p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        
        {!hasChildren && <div className="w-6 mr-2" />}
        
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-sm">{node.firstName}</div>
                <div className="text-xs text-gray-500">@{node.username}</div>
              </div>
            </div>
            
            <Badge className={`${levelInfo.color} text-white text-xs`}>
              {node.currentLevel}. {levelInfo.name}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-xs text-gray-500">ЛО</div>
              <div className="font-medium">{formatCurrency(node.personalVolume.totalAmount)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">ГО</div>
              <div className="font-medium">{formatCurrency(node.groupVolume.totalAmount)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">Рефералы</div>
              <div className="font-medium">{node.network.totalReferrals}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">Заработок</div>
              <div className="font-medium">{formatCurrency(node.earnings.totalEarned)}</div>
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
              isExpanded={expandedNodes.has(child.userId)}
              onToggle={() => toggleNode(child.userId)}
              onSelectNode={onSelectNode}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MLMNetworkVisualization: React.FC<MLMNetworkVisualizationProps> = ({ userId, userName }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([userId]));
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: networkTree, isLoading, error } = useQuery({
    queryKey: ['/api/admin/mlm/network/tree', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/mlm/network/tree/${userId}`);
      return response.json();
    },
    enabled: isOpen,
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

  const renderNetworkTree = (node: NetworkNode) => {
    return (
      <NetworkNodeComponent
        key={node.userId}
        node={node}
        isExpanded={expandedNodes.has(node.userId)}
        onToggle={() => toggleNode(node.userId)}
        onSelectNode={setSelectedNode}
        expandedNodes={expandedNodes}
        toggleNode={toggleNode}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Network className="h-4 w-4 mr-2" />
          Показать сеть
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>MLM структура: {userName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Дерево структуры */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Структура сети</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedNodes(new Set([userId]))}
                  >
                    Свернуть все
                  </Button>
                </div>
                
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-500 py-8">
                      Ошибка загрузки структуры
                    </div>
                  ) : networkTree?.success && networkTree.data ? (
                    renderNetworkTree(networkTree.data)
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Нет данных о структуре
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Детали выбранного узла */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Детали пользователя</h3>
                
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="font-medium text-lg">{selectedNode.firstName}</div>
                      <div className="text-sm text-gray-500">@{selectedNode.username}</div>
                      <div className="text-xs text-gray-400">ID: {selectedNode.telegramId}</div>
                      <div className="text-xs text-gray-400">Код: {selectedNode.referralCode}</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`${MLM_LEVELS.find(l => l.level === selectedNode.currentLevel)?.color} text-white`}>
                        {selectedNode.currentLevel}. {MLM_LEVELS.find(l => l.level === selectedNode.currentLevel)?.name}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Личный объем:</span>
                        <span className="font-medium">{formatCurrency(selectedNode.personalVolume.totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Групповой объем:</span>
                        <span className="font-medium">{formatCurrency(selectedNode.groupVolume.totalAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Всего рефералов:</span>
                        <span className="font-medium">{selectedNode.network.totalReferrals}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Прямых рефералов:</span>
                        <span className="font-medium">{selectedNode.network.directReferrals}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Заработок:</span>
                        <span className="font-medium">{formatCurrency(selectedNode.earnings.totalEarned)}</span>
                      </div>
                    </div>
                    
                    {selectedNode.bonusPreferences && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Свобода выбора:</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Health ID:</span>
                            <span>{selectedNode.bonusPreferences.healthId}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Путешествия:</span>
                            <span>{selectedNode.bonusPreferences.travel}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Дом:</span>
                            <span>{selectedNode.bonusPreferences.home}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Авто:</span>
                            <span>{selectedNode.bonusPreferences.auto}%</span>
                          </div>
                          {selectedNode.bonusPreferences.isLocked && (
                            <div className="text-red-500 text-xs mt-1">🔒 Заблокировано</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Выберите пользователя в структуре для просмотра деталей
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MLMNetworkVisualization;