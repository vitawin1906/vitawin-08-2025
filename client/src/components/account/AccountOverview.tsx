
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Coins, Award, GiftIcon, Users, CreditCard, MapPin, Crown, Star, Diamond, TrendingUp, Network, Info } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import BalanceSection from "./BalanceSection";
import StatusBenefitsModal from "./StatusBenefitsModal";



const AccountOverview = () => {
  const user = useAuthStore(state => state.user);
  const bonusCoins = useAuthStore(state => state.bonusCoins);
  const totalEarnings = useAuthStore(state => state.totalEarnings);
  const referralEarnings = useAuthStore(state => state.referralEarnings);
  const { t } = useLanguage();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Получаем статистику рефералов для группового объема
  const { data: referralStats } = useQuery({
    queryKey: ['/api/referral/stats'],
    enabled: !!user?.id,
  });

  const referralStatsData = useMemo(() => {
    return {
      level1Count: referralEarnings.filter(e => e.level === 1).length,
      level2Count: referralEarnings.filter(e => e.level === 2).length,
      level3Count: referralEarnings.filter(e => e.level === 3).length,
      totalEarnings: totalEarnings
    };
  }, [referralEarnings, totalEarnings]);

  // Вычисляем показатели группового объема
  const networkStats = useMemo(() => {
    if (!user) {
      return { userBonus: 0, networkParticipants: 0, totalGroupVolume: 0 };
    }

    const totalReferrals = referralStats?.total_referrals || 0;
    const estimatedGroupVolumeRubles = totalReferrals * 1200;
    const groupVolumePV = Math.floor(estimatedGroupVolumeRubles / 200);
    const userBonusRubles = Math.floor(groupVolumePV * 100 * 0.1);

    return {
      userBonus: userBonusRubles,
      networkParticipants: totalReferrals,
      totalGroupVolume: groupVolumePV
    };
  }, [referralStats, user]);

  // Mock user stats for demo
  const userStats = {
    currentStatus: "Standard",
    nextStatus: "Partner",
    totalPurchases: 0,
    totalSpent: 0,
    referralsCount: 0,
    personalVolume: 0 // PV - личный объем
  };

  const statusLevels = [
    {
      name: "Standard",
      alias: "Покупатель",
      bgColor: "bg-gray-100",
      color: "text-gray-600",
      icon: <Star className="h-5 w-5" />,
      requirements: { purchases: 0, amount: 0, referrals: 0, personalVolume: 0 },
      benefits: [
        "Скидка на товар",
        "Кэшбек",
        "Бонус FastStart"
      ],
      restrictedBenefits: [
        "Участие в распределении сети",
        "Health ID",
        "Travel",
        "Auto", 
        "Home",
        "Распределение дополнительных бонусов"
      ],
      description: "Обычный покупатель. Базовые преимущества без участия в распределении сети."
    },
    {
      name: "Partner",
      alias: "Партнер",
      bgColor: "bg-emerald-100",
      color: "text-emerald-600",
      icon: <Award className="h-5 w-5" />,
      requirements: { purchases: 1, amount: 7000, referrals: 0, personalVolume: 35 },
      benefits: [
        "Скидка на товар",
        "Кэшбек",
        "Бонус FastStart",
        "Участие в распределении сети",
        "Health ID",
        "Travel",
        "Auto",
        "Home"
      ],
      restrictedBenefits: [
        "Распределение дополнительных бонусов",
        "Welcome бонус",
        "VitaWin PRO Club",
        "Горячие лиды",
        "Уникальный подарок",
        "Пул первых"
      ],
      description: "Партнер системы. Участвует в распределении сети и получает доступ к бонусным программам."
    },
    {
      name: "Partner PRO",
      alias: "Партнер PRO",
      bgColor: "bg-purple-100",
      color: "text-purple-600",
      icon: <Crown className="h-5 w-5" />,
      requirements: { purchases: 3, amount: 30000, referrals: 2, personalVolume: 150 },
      benefits: [
        "Скидка на товар",
        "Кэшбек", 
        "Бонус FastStart",
        "Участие в распределении сети",
        "Health ID",
        "Travel",
        "Auto",
        "Home",
        "Распределение дополнительных бонусов",
        "Welcome бонус",
        "VitaWin PRO Club",
        "Горячие лиды",
        "Уникальный подарок",
        "Пул первых",
        "Доступ к страт.сессии компании",
        "Заморозка статуса",
        "Ускоренная поддержка от команды VitaWin",
        "Имя и статус PRO",
        "Доступ к закрытому обучению"
      ],
      restrictedBenefits: [],
      description: "PRO партнер. Максимальные привилегии и все доступные бонусы компании."
    }
  ];

  // Helper function to get current status index
  const getCurrentStatusIndex = () => {
    return statusLevels.findIndex(level => level.name === userStats.currentStatus);
  };

  const getProgressToNextLevel = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex >= statusLevels.length - 1) return 100;
    
    const nextLevel = statusLevels[currentIndex + 1];
    
    // Для Standard -> Partner: учитываем активацию 35 PV
    if (currentIndex === 0) {
      return Math.min((userStats.personalVolume / nextLevel.requirements.personalVolume) * 100, 100);
    }
    
    // Для Partner -> Partner PRO: учитываем 150 PV квалификацию
    if (currentIndex === 1) {
      return Math.min((userStats.personalVolume / nextLevel.requirements.personalVolume) * 100, 100);
    }
    
    return 100;
  };
  
  return (
    <div className="space-y-6">
      {/* Balance Section */}
      <BalanceSection />
      {/* Optimized Status Levels Guide */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-emerald-500" />
              Статусы участников
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsStatusModalOpen(true)}
              className="flex items-center space-x-1 text-[#c2080e]"
            >
              <Info className="h-4 w-4" />
              <span>Сравнить статусы</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Ваши достижения и цели для повышения статуса
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLevels.map((level, index) => {
            const isCurrentLevel = level.name === userStats.currentStatus;
            const isAchieved = getCurrentStatusIndex() >= index;
            
            return (
              <div 
                key={level.name}
                className={`border rounded-lg transition-all ${
                  isCurrentLevel 
                    ? 'border-emerald-500 bg-emerald-50 p-4' 
                    : isAchieved 
                      ? `${level.bgColor} border-emerald-300 p-4`
                      : 'border-gray-200 bg-white p-4'
                } ${level.name === "Partner PRO" ? 'p-6' : 'p-4'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${level.bgColor} ${level.borderColor} border`}>
                      <div className={level.color}>
                        {level.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${level.name === "Partner PRO" ? 'text-xl' : 'text-lg'}`}>
                          {level.alias || level.name}
                        </h3>
                        {level.name === "Partner PRO" && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            МАКСИМУМ
                          </span>
                        )}
                        {isCurrentLevel && level.name !== "Partner PRO" && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                            Текущий
                          </span>
                        )}
                        {isAchieved && !isCurrentLevel && level.name !== "Partner PRO" && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            Достигнут
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Optimized two-column layout for requirements and benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Requirements */}
                  <div className="space-y-2">
                    <div className="font-medium text-sm text-gray-700 mb-2">
                      {level.name === "Partner PRO" ? "Квалификация Partner PRO:" : "Требования:"}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {level.requirements.personalVolume > 0 && (
                        <div className="flex justify-between items-center">
                          <span>• Личный объем:</span>
                          <span className={`font-medium ${level.name === "Partner PRO" ? 'text-purple-600 font-bold' : ''}`}>
                            {level.requirements.personalVolume} PV
                          </span>
                        </div>
                      )}
                      {level.requirements.referrals > 0 && (
                        <div className="flex justify-between items-center">
                          <span>• Партнеры:</span>
                          <span className="font-medium">{level.requirements.referrals}</span>
                        </div>
                      )}
                      {level.requirements.amount > 0 && (
                        <div className="flex justify-between items-center">
                          <span>• Оборот (ЛО):</span>
                          <span className="font-medium">{level.requirements.amount.toLocaleString()} ₽</span>
                        </div>
                      )}
                      {level.name === "Standard" && (
                        <div className="text-xs text-gray-500 italic">
                          Без дополнительных требований
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <div className="font-medium text-sm text-gray-700 mb-2">Преимущества:</div>
                    <div className="space-y-1 text-sm">
                      {/* Для Partner PRO показываем все преимущества */}
                      {level.name === "Partner PRO" ? (
                        <div className="grid grid-cols-1 gap-1">
                          {level.benefits.map((benefit, i) => (
                            <div key={i} className="flex items-start">
                              <span className="text-emerald-500 mr-2 text-xs font-bold">✓</span>
                              <span className="text-gray-700 text-xs font-medium">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {level.benefits.slice(0, 5).map((benefit, i) => (
                            <div key={i} className="flex items-start">
                              <span className="text-emerald-500 mr-1 text-xs">✓</span>
                              <span className="text-gray-600 text-xs">{benefit}</span>
                            </div>
                          ))}
                          {level.benefits.length > 5 && (
                            <div className="text-xs text-gray-500 mt-2">
                              +{level.benefits.length - 5} дополнительных преимуществ
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {level.restrictedBenefits && level.restrictedBenefits.length > 0 && level.name !== "Partner PRO" && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="font-medium text-sm text-gray-500 mb-2">Недоступно:</div>
                        <div className="space-y-1 text-sm">
                          {level.restrictedBenefits.slice(0, 3).map((benefit, i) => (
                            <div key={i} className="flex items-start">
                              <span className="text-gray-400 mr-1 text-xs">✗</span>
                              <span className="text-gray-400 text-xs">{benefit}</span>
                            </div>
                          ))}
                          {level.restrictedBenefits.length > 3 && (
                            <div className="text-xs text-gray-400 mt-1">
                              +{level.restrictedBenefits.length - 3} ограничений
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Progress for current level */}
                {isCurrentLevel && index < statusLevels.length - 1 && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="text-sm font-medium text-emerald-700 mb-3">
                      Прогресс до {statusLevels[index + 1].name}:
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1 text-gray-600">
                          <span>Личный объем (ЛО)</span>
                          <span className="font-medium">{userStats.personalVolume} PV/{statusLevels[index + 1].requirements.personalVolume} PV</span>
                        </div>
                        <Progress 
                          value={Math.min((userStats.personalVolume / statusLevels[index + 1].requirements.personalVolume) * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                      {statusLevels[index + 1].requirements.referrals > 0 && (
                        <div>
                          <div className="flex justify-between mb-1 text-gray-600">
                            <span>Рефералы</span>
                            <span className="font-medium">{userStats.referralsCount}/{statusLevels[index + 1].requirements.referrals}</span>
                          </div>
                          <Progress 
                            value={Math.min((userStats.referralsCount / statusLevels[index + 1].requirements.referrals) * 100, 100)} 
                            className="h-2" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      {/* Quick Access */}
      <h2 className="text-xl font-semibold mt-8 mb-4">{t('quickAccess')}</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        <QuickAccessCard
          icon={<CreditCard className="h-6 w-6 mb-2 text-blue-500" />}
          title={t('paymentMethods')}
          description={t('manageCards')}
          linkTo="#payment"
        />
        <QuickAccessCard
          icon={<MapPin className="h-6 w-6 mb-2 text-red-500" />}
          title={t('addresses')}
          description={t('deliveryLocations')}
          linkTo="#delivery"
        />
        <QuickAccessCard
          icon={<Users className="h-6 w-6 mb-2 text-purple-500" />}
          title={t('referralProgram')}
          description={t('inviteFriends')}
          linkTo="#referral"
        />
        <QuickAccessCard
          icon={<Award className="h-6 w-6 mb-2 text-emerald-500" />}
          title={t('rewards')}
          description={t('viewBenefits')}
          linkTo="#"
        />
      </div>
      {/* Status Benefits Modal */}
      <StatusBenefitsModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusLevels={statusLevels}
      />
    </div>
  );
};

const QuickAccessCard = ({ 
  icon, 
  title, 
  description, 
  linkTo 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  linkTo: string;
}) => (
  <Link to={linkTo}>
    <Card className="hover:border-emerald-500 transition-all duration-200 h-full">
      <CardContent className="flex flex-col items-center justify-center text-center p-6">
        {icon}
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  </Link>
);



export default AccountOverview;
