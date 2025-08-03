
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const CompanyInfo = () => {
  const { t } = useLanguage();
  
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('ourQualityCommitment')}</h2>
      <div className="bg-gray-50 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-4">{t('theHighestStandards')}</h3>
            <p className="text-gray-700 mb-4">
              {t('qualityDescription1')}
            </p>
            <p className="text-gray-700 mb-4">
              {t('qualityDescription2')}
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Badge className="bg-gray-700 hover:bg-gray-800">{t('gmpCertified')}</Badge>
              <Badge className="bg-gray-700 hover:bg-gray-800">{t('fdaRegistered')}</Badge>
              <Badge className="bg-gray-700 hover:bg-gray-800">{t('thirdPartyTested')}</Badge>
              <Badge className="bg-gray-700 hover:bg-gray-800">{t('sustainablySourced')}</Badge>
            </div>
          </div>
          <div className="bg-emerald-600 p-6 md:p-8 flex items-center">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-4">{t('ourPromise')}</h3>
              <p className="mb-4">
                {t('promiseDescription')}
              </p>
              <div className="mt-6">
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600">
                  {t('learnMoreAboutCompany')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
