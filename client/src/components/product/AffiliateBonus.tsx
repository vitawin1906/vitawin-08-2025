
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AffiliateBonusProps {
  price: number;
}

const AffiliateBonus = ({ price }: AffiliateBonusProps) => {
  const { t } = useLanguage();
  
  // Calculate affiliate bonuses
  const firstLevelBonus = (price * 0.2).toFixed(2);
  const secondLevelBonus = (price * 0.05).toFixed(2);
  const thirdLevelBonus = (price * 0.01).toFixed(2);
  const purchaseBonus = (price * 0.05).toFixed(2);
  
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('earnWithReferrals')}</h2>
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('yourPurchase')}</h3>
            <div className="text-3xl font-bold text-emerald-600 mb-2">{purchaseBonus} coins</div>
            <p className="text-sm text-gray-600">5% {t('purchaseBonus')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('firstLevelReferral')}</h3>
            <div className="text-3xl font-bold text-emerald-600 mb-2">${firstLevelBonus}</div>
            <p className="text-sm text-gray-600">20% {t('firstLevelCommission')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('secondLevelReferral')}</h3>
            <div className="text-3xl font-bold text-emerald-600 mb-2">${secondLevelBonus}</div>
            <p className="text-sm text-gray-600">5% {t('secondLevelCommission')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('thirdLevelReferral')}</h3>
            <div className="text-3xl font-bold text-emerald-600 mb-2">${thirdLevelBonus}</div>
            <p className="text-sm text-gray-600">1% {t('thirdLevelCommission')}</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            {t('joinAffiliateProgram')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateBonus;
