import { Coins, Users, TrendingUp, Gift, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReferralSettingsEditor from "@/components/admin/ReferralSettingsEditor";

const ReferralProgram = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Загружаем настройки реферальной программы
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/referral-settings'],
    retry: false,
  });

  const settings = (settingsData as any)?.settings;
  const purchaseAmount = 14995.00; // Базовая сумма для расчетов
  
  // Используем настройки из API или значения по умолчанию
  const level1Commission = parseFloat(settings?.level1_commission || "20") / 100;
  const level2Commission = parseFloat(settings?.level2_commission || "5") / 100;
  const level3Commission = parseFloat(settings?.level3_commission || "1") / 100;
  const bonusCoinsPercentage = parseFloat(settings?.bonus_coins_percentage || "5") / 100;
  
  const referralData = [
    {
      title: "Ваша покупка",
      amount: "от 100 000 руб.*",
      description: `${(bonusCoinsPercentage * 100).toFixed(0)}% возврат бонусными монетами с покупки`,
      color: "text-gray-900"
    },
    {
      title: "Реферал 1-го уровня", 
      amount: `${(level1Commission * 100).toFixed(0)}%`,
      description: `${(level1Commission * 100).toFixed(0)}% комиссия с прямых рефералов`,
      color: "text-emerald-600"
    },
    {
      title: "Реферал 2-го уровня",
      amount: `${(level2Commission * 100).toFixed(0)}%`, 
      description: `${(level2Commission * 100).toFixed(0)}% комиссия с рефералов 2-го уровня`,
      color: "text-emerald-600"
    },
    {
      title: "Реферал 3-го уровня",
      amount: `${(level3Commission * 100).toFixed(0)}%`,
      description: `${(level3Commission * 100).toFixed(0)}% комиссия с рефералов 3-го уровня`, 
      color: "text-emerald-600"
    }
  ];

  if (isEditing) {
    return <ReferralSettingsEditor onClose={() => setIsEditing(false)} />;
  }

  // Проверяем, разрешено ли редактирование (режим разработки или админ)
  const isEditingAllowed = import.meta.env.DEV || window.location.search.includes('admin=true');

  return (
    <div className="bg-emerald-50 py-12 relative">
      {/* Кнопка редактирования - только для разработки или админов */}
      {isEditingAllowed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
          title="Редактировать настройки реферальной программы"
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8 text-center" id="referral-program">Зарабатывайте с рефералами</h2>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-lg">
          {/* Мобильная версия - горизонтальная прокрутка */}
          <div className="block sm:hidden mb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
              {referralData.map((item, index) => (
                <div key={index} className="flex-shrink-0 w-48 text-center p-4 bg-gray-50 rounded-lg snap-start">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h3>
                  <div className={`text-xl font-bold mb-2 ${item.color}`}>
                    {item.amount}
                  </div>
                  <p className="text-xs text-gray-600 leading-tight">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Десктопная версия - сетка */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {referralData.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">{item.title}</h3>
                <div className={`text-xl lg:text-2xl font-bold mb-2 ${item.color}`}>
                  {item.amount}
                </div>
                <p className="text-xs lg:text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Преимущества программы */}
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8" itemScope itemType="https://schema.org/ItemList">
            <article className="text-center p-4" itemScope itemType="https://schema.org/Service">
              <div className="bg-emerald-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base" itemProp="name">Мгновенные выплаты</h3>
              <p className="text-xs lg:text-sm text-gray-600" itemProp="description">Получайте комиссию сразу после покупки реферала</p>
            </article>

            <article className="text-center p-4" itemScope itemType="https://schema.org/Service">
              <div className="bg-blue-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base" itemProp="name">Многоуровневая система</h3>
              <p className="text-xs lg:text-sm text-gray-600" itemProp="description">Зарабатывайте с покупок рефералов до 3-го уровня</p>
            </article>

            <article className="text-center p-4 sm:col-span-2 lg:col-span-1" itemScope itemType="https://schema.org/Service">
              <div className="bg-purple-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base" itemProp="name">Растущий доход</h3>
              <p className="text-xs lg:text-sm text-gray-600" itemProp="description">Чем больше рефералов, тем выше ваш пассивный доход</p>
            </article>
          </section>

          {/* Потенциальный расчет */}
          <div className="bg-emerald-600 text-white p-4 lg:p-6 rounded-lg mb-6">
            <h3 className="text-lg lg:text-xl font-semibold mb-4 text-center">Ваш ежемесячный потенциальный доход</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 text-center mb-4 lg:mb-6">
              <div className="p-3 lg:p-0">
                <div className="text-lg lg:text-2xl font-bold mb-1">113 500 руб.</div>
                <div className="text-xs lg:text-sm opacity-90">При 100 прямых рефералах</div>
              </div>
              <div className="p-3 lg:p-0">
                <div className="text-lg lg:text-2xl font-bold mb-1">56 750 руб.</div>
                <div className="text-xs lg:text-sm opacity-90">При 50 прямых рефералах</div>
              </div>
              <div className="p-3 lg:p-0">
                <div className="text-lg lg:text-2xl font-bold mb-1">13 500 руб.</div>
                <div className="text-xs lg:text-sm opacity-90">При 10 прямых рефералах</div>
              </div>
            </div>

            <p className="text-center text-xs lg:text-sm opacity-90 mb-4 lg:mb-6 px-2">* Расчеты основаны на средней покупке 5 000 руб. Фактические результаты могут отличаться.</p>
          </div>

          {/* Кнопка подключения */}
          <div className="text-center px-4">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 lg:px-8 py-3 text-base lg:text-lg font-semibold">
              <Gift className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              Присоединиться к партнерской программе
            </Button>
            <p className="text-xs lg:text-sm text-gray-600 mt-3 px-2">
              Бесплатная регистрация • Мгновенный старт • Без скрытых комиссий
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;