
import { Progress } from '@/components/ui/progress';
import { Info, Leaf, CheckCircle, Star, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductTabsProps {
  product: {
    longDescription: string;
    composition: Record<string, string>;
    usage: string;
    additionalInfo: string;
    rating: number;
    reviews: number;
    reviewBreakdown: Record<number, number>;
    userReviews: Array<{
      userName: string;
      rating: number;
      date: string;
      title: string;
      comment: string;
    }>;
    howToTake?: 'morning' | 'morning_evening' | 'with_meals' | 'before_meals' | 'custom';
  };
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const { t } = useLanguage();
  const totalReviews = Object.values(product.reviewBreakdown).reduce((a, b) => a + b, 0);
  
  const getHowToTakeDisplay = (howToTake?: string) => {
    switch (howToTake) {
      case 'morning':
        return {
          title: 'Утром',
          description: 'Принимайте одну дозу утром',
          time: '08:00',
          icon: '🌅'
        };
      case 'morning_evening':
        return {
          title: 'Утром и вечером',
          description: 'Принимайте по одной дозе утром и вечером',
          time: '08:00 / 20:00',
          icon: '🌅🌙'
        };
      case 'with_meals':
        return {
          title: 'Во время еды',
          description: 'Принимайте во время основных приемов пищи',
          time: 'С едой',
          icon: '🍽️'
        };
      case 'before_meals':
        return {
          title: 'До еды',
          description: 'Принимайте за 30 минут до еды',
          time: 'За 30 мин до еды',
          icon: '⏰'
        };
      case 'custom':
        return {
          title: 'Индивидуально',
          description: 'Следуйте индивидуальным рекомендациям',
          time: 'По назначению',
          icon: '👨‍⚕️'
        };
      default:
        return null;
    }
  };

  const howToTakeInfo = getHowToTakeDisplay(product.howToTake);
  
  return (
    <div className="space-y-12">
      {/* Product Details */}
      <section>
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-bold">{t('productDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-gray-700 leading-relaxed mb-4">
              {product.longDescription}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-lg mb-4 flex items-center">
                  <Leaf className="h-5 w-5 mr-2 text-emerald-600" />
                  Ключевые преимущества
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">1</span>
                    </div>
                    <span>Поддерживает здоровый уровень сахара в крови и метаболизм глюкозы</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">2</span>
                    </div>
                    <span>Способствует здоровому контролю веса и метаболизму жиров</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">3</span>
                    </div>
                    <span>Помогает снижать воспаление и поддерживает здоровье сердца</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-lg mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-emerald-600" />
                  Гарантия качества
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">✓</span>
                    </div>
                    <span>Протестировано третьей стороной на чистоту и эффективность</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">✓</span>
                    </div>
                    <span>Экстракт высочайшего качества 97% концентрации</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-emerald-600 font-medium">✓</span>
                    </div>
                    <span>Без тяжелых металлов и других загрязнителей</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Composition */}
      <section>
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-bold">{t('nutritionalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="bg-gray-50 rounded-xl p-6">
              <table className="w-full">
                <tbody>
                  {Object.entries(product.composition).map(([key, value], i) => (
                    <tr key={i} className={i !== 0 ? "border-t border-gray-200" : ""}>
                      <td className="py-3 text-gray-700">{key}</td>
                      <td className="py-3 text-right font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 bg-emerald-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-emerald-600 mr-2" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Дополнительные компоненты:</span> Желатин (капсула), глицерин, очищенная вода.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Usage */}
      <section>
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-bold">{t('howToUse')}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="bg-gray-50 p-6 rounded-xl mb-6">
              <p className="text-gray-700 mb-4">{product.usage}</p>
              
              {howToTakeInfo && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-emerald-600" />
                    Как принимать
                  </h4>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{howToTakeInfo.icon}</span>
                      <div>
                        <div className="font-medium text-emerald-700">{howToTakeInfo.title}</div>
                        <div className="text-sm text-emerald-600">{howToTakeInfo.time}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{howToTakeInfo.description}</p>
                  </div>
                </div>
              )}
              
              <h4 className="font-semibold text-lg mb-4 mt-6">Рекомендуемое время приема</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="font-medium text-center mb-2">Утром</div>
                  <div className="text-sm text-gray-600 text-center">С завтраком для лучшего усвоения</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <div className="font-medium text-center mb-2 text-emerald-700">Рекомендуется</div>
                  <div className="text-sm text-emerald-600 text-center">С основным приемом пищи</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="font-medium text-center mb-2">Вечером</div>
                  <div className="text-sm text-gray-600 text-center">С ужином при желании</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Инструкции по хранению</h4>
              <p className="text-gray-700">{product.additionalInfo}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ProductTabs;
