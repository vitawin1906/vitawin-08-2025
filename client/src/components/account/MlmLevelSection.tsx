import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Star, 
  Crown, 
  Award, 
  Target, 
  TrendingUp,
  Users,
  ArrowUp
} from "lucide-react";

interface MlmLevel {
  id: number;
  level: number;
  name: string;
  description: string;
  percentage: string;
  required_referrals: number;
  required_personal_volume?: number; // Опциональное поле для обратной совместимости
  required_group_volume?: number; // Опциональное поле для обратной совместимости
}

interface MlmStatus {
  currentLevel: number;
  currentLevelInfo: MlmLevel;
  nextLevel: MlmLevel | null;
  totalReferrals: number;
  requiredForNext: number;
  progressPercentage: number;
  allLevels: MlmLevel[];
}

// Получить иконку для уровня
const getLevelIcon = (level: number) => {
  if (level <= 3) return Trophy;
  if (level <= 6) return Star;
  if (level <= 9) return Crown;
  if (level <= 12) return Award;
  if (level <= 15) return Target;
  return TrendingUp;
};

// Получить цвет для уровня
const getLevelColor = (level: number) => {
  if (level <= 3) return "from-red-500 to-pink-500";
  if (level <= 6) return "from-blue-500 to-cyan-500";
  if (level <= 9) return "from-purple-500 to-violet-500";
  if (level <= 12) return "from-yellow-500 to-orange-500";
  if (level <= 15) return "from-green-500 to-emerald-500";
  return "from-gray-700 to-black";
};

// Получить цвет Badge для уровня
const getLevelBadgeColor = (level: number) => {
  if (level <= 3) return "bg-red-500";
  if (level <= 6) return "bg-blue-500";
  if (level <= 9) return "bg-purple-500";
  if (level <= 12) return "bg-yellow-500";
  if (level <= 15) return "bg-green-500";
  return "bg-gray-700";
};

// Форматировать проценты как целые числа
const formatPercentage = (percentage: string) => {
  const num = parseFloat(percentage);
  return Math.round(num).toString();
};

export default function MlmLevelSection() {
  const { data: mlmStatus, isLoading, error } = useQuery<MlmStatus>({
    queryKey: ['/api/mlm/user/details'],
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MLM Статус</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !mlmStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MLM Статус</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Ошибка загрузки MLM статуса</p>
        </CardContent>
      </Card>
    );
  }

  const { currentLevelInfo, nextLevel, totalReferrals, requiredForNext, progressPercentage } = mlmStatus;
  const LevelIcon = getLevelIcon(currentLevelInfo.level);
  const currentLevelColor = getLevelColor(currentLevelInfo.level);
  const currentBadgeColor = getLevelBadgeColor(currentLevelInfo.level);

  return (
    <div className="space-y-6">
      {/* Текущий уровень */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
        <div className={`relative bg-gradient-to-br ${currentLevelColor} p-6 text-white`}>
          <div className="absolute top-4 right-4">
            <Badge className={`${currentBadgeColor} text-white text-xs`}>
              Уровень {currentLevelInfo.level}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-lg">
              <LevelIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{currentLevelInfo.name}</h2>
              <p className="text-white/80 text-sm">{currentLevelInfo.description}</p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{totalReferrals} рефералов</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">{formatPercentage(currentLevelInfo.percentage)}% бонус</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {nextLevel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Прогресс до следующего уровня
                  </h3>
                  <p className="text-sm text-gray-600">
                    До "{nextLevel.name}" осталось {requiredForNext} рефералов
                  </p>
                </div>
                <Badge variant="outline">
                  {Math.max(0, progressPercentage)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={Math.max(0, progressPercentage)} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{totalReferrals} текущих</span>
                  <span>{nextLevel.required_referrals} требуется</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ArrowUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Следующий уровень: {nextLevel.name}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Бонус: {formatPercentage(nextLevel.percentage)}% • Требуется: {nextLevel.required_referrals} рефералов
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Crown className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">
                Максимальный уровень достигнут!
              </h3>
              <p className="text-sm text-gray-600">
                Вы достигли высшего уровня в MLM структуре
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Все уровни */}
      <Card>
        <CardHeader>
          <CardTitle>Структура уровней</CardTitle>
          <p className="text-sm text-gray-600">
            16-уровневая матричная система с процентными бонусами
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {mlmStatus.allLevels.map((level) => {
              const isCurrentLevel = level.level === currentLevelInfo.level;
              const isAchieved = level.level <= currentLevelInfo.level;
              const LevelIcon = getLevelIcon(level.level);
              const levelColor = getLevelColor(level.level);
              const badgeColor = getLevelBadgeColor(level.level);

              return (
                <div
                  key={level.id}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                    isCurrentLevel
                      ? 'border-blue-500 bg-blue-50'
                      : isAchieved
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded ${
                      isAchieved ? `bg-gradient-to-br ${levelColor}` : 'bg-gray-300'
                    }`}>
                      <LevelIcon className={`h-4 w-4 ${
                        isAchieved ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    <Badge 
                      className={`text-xs ${
                        isAchieved ? `${badgeColor} text-white` : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {level.level}
                    </Badge>
                  </div>
                  
                  <h4 className={`font-semibold text-sm ${
                    isCurrentLevel ? 'text-blue-900' : isAchieved ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    {level.name}
                  </h4>
                  
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-600">
                      {formatPercentage(level.percentage)}% бонус
                    </div>
                    <div className="text-xs text-gray-600">
                      {level.required_referrals} рефералов
                    </div>
                    {((level.required_personal_volume ?? 0) > 0 || (level.required_group_volume ?? 0) > 0) && (
                      <>
                        {(level.required_personal_volume ?? 0) > 0 && (
                          <div className="text-xs text-blue-600">
                            LO: {level.required_personal_volume} PV
                          </div>
                        )}
                        {(level.required_group_volume ?? 0) > 0 && (
                          <div className="text-xs text-green-600">
                            GO: {level.required_group_volume} PV
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isCurrentLevel && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}