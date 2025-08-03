import { Clock, CheckCircle, Heart, Info } from 'lucide-react';

interface ProductInfoSectionsProps {
  keyBenefits?: string | null;
  qualityGuarantee?: string | null;
  compositionTable?: { component: string; amount: string }[] | null;
  nutritionFacts?: string | null;
  howToTake?: string;
}

const ProductInfoSections = ({ 
  keyBenefits, 
  qualityGuarantee, 
  compositionTable,
  nutritionFacts,
  howToTake 
}: ProductInfoSectionsProps) => {
  // Если нет данных для отображения, не показываем компонент
  if (!keyBenefits && !qualityGuarantee && (!compositionTable || compositionTable.length === 0) && !nutritionFacts && !howToTake) {
    return null;
  }

  return (
    <div className="bg-white py-4 sm:py-8">
      <div className="w-full px-4 space-y-6 sm:space-y-8">
        
        {/* Гарантия качества и Состав - адаптивная сетка */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Гарантия качества */}
          {qualityGuarantee && qualityGuarantee.trim() && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Гарантия качества</h3>
              </div>
              <div className="space-y-2">
                {qualityGuarantee.split('\n').filter(item => item.trim()).map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Состав и пищевая ценность */}
          {((compositionTable && compositionTable.length > 0) || (nutritionFacts && nutritionFacts.trim())) && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Состав и пищевая ценность</h3>
              
              {compositionTable && compositionTable.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 overflow-x-auto">
                  <table className="w-full border-collapse min-w-full">
                    <tbody>
                      {compositionTable.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                          <td className="py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 font-medium pr-4">{item.component}</td>
                          <td className="py-1.5 sm:py-2 text-sm sm:text-base text-right text-gray-900 font-semibold whitespace-nowrap">{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {nutritionFacts && nutritionFacts.trim() && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-green-700">Дополнительные компоненты:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{nutritionFacts}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ключевые преимущества - адаптивная сетка */}
        {keyBenefits && keyBenefits.trim() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ключевые преимущества</h3>
              </div>
              <div className="space-y-2">
                {keyBenefits.split('\n').filter(benefit => benefit.trim()).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5 text-sm sm:text-base flex-shrink-0">{index + 1}.</span>
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{benefit.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block"></div>
          </div>
        )}

        {/* Рекомендуемое время приема - оптимизировано для мобильных */}
        {howToTake && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 text-center">Рекомендуемое время приема</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Утром */}
              <div className={`border-2 rounded-lg p-3 sm:p-4 text-center transition-all ${
                howToTake === 'morning' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white opacity-60'
              }`}>
                <div className="text-xl sm:text-2xl mb-2">☀️</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Утром</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">С завтраком для лучшего усвоения</div>
                {howToTake === 'morning' && (
                  <div className="text-xs text-yellow-700 mt-2 font-medium">Рекомендуется принимать с едой</div>
                )}
              </div>

              {/* Днем */}
              <div className={`border-2 rounded-lg p-3 sm:p-4 text-center transition-all ${
                howToTake === 'recommended' ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white opacity-60'
              }`}>
                <div className="text-xl sm:text-2xl mb-2">🕐</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Днем</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">С основным приемом пищи</div>
                {howToTake === 'recommended' && (
                  <div className="text-xs text-green-700 mt-2 font-medium">Оптимальное время</div>
                )}
              </div>

              {/* Вечером */}
              <div className={`border-2 rounded-lg p-3 sm:p-4 text-center transition-all ${
                howToTake === 'evening' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white opacity-60'
              }`}>
                <div className="text-xl sm:text-2xl mb-2">🌙</div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">Вечером</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">С ужином при желании</div>
                {howToTake === 'evening' && (
                  <div className="text-xs text-blue-700 mt-2 font-medium">При необходимости дополнительного приема</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfoSections;