import { useQuery } from "@tanstack/react-query";

interface ReferralCardsProps {
  className?: string;
}

const ReferralCards = ({ className = "" }: ReferralCardsProps) => {
  const { data: settings } = useQuery({
    queryKey: ["/api/referral-settings"],
  });

  const settingsData = settings?.settings || {};
  const level1Commission = parseFloat(settingsData.level1_commission || "20");
  const level2Commission = parseFloat(settingsData.level2_commission || "5");
  const level3Commission = parseFloat(settingsData.level3_commission || "1");
  const bonusCoinsPercentage = parseFloat(settingsData.bonus_coins_percentage || "5");
  
  const referralData = [
    {
      title: "Ваша покупка",
      amount: "от 100 000 руб.*",
      description: `${bonusCoinsPercentage}% возврат бонусными монетами с покупки`,
      color: "text-gray-900"
    },
    {
      title: "Реферал 1-го уровня", 
      amount: `${level1Commission}%`,
      description: `${level1Commission}% комиссия с прямых рефералов`,
      color: "text-emerald-600"
    },
    {
      title: "Реферал 2-го уровня",
      amount: `${level2Commission}%`, 
      description: `${level2Commission}% комиссия с рефералов 2-го уровня`,
      color: "text-emerald-600"
    },
    {
      title: "Реферал 3-го уровня",
      amount: `${level3Commission}%`,
      description: `${level3Commission}% комиссия с рефералов 3-го уровня`, 
      color: "text-emerald-600"
    }
  ];

  return (
    <div className={`bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-lg ${className}`}>
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
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
    </div>
  );
};

export default ReferralCards;