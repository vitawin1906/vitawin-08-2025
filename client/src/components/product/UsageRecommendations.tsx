import { Clock, Sun, Moon } from "lucide-react";

interface UsageRecommendationsProps {
  product: {
    how_to_take?: string;
    usage?: string;
    storage_conditions?: string;
  };
}

const UsageRecommendations = ({ product }: UsageRecommendationsProps) => {
  const getRecommendedTime = () => {
    switch (product.how_to_take) {
      case 'morning':
        return { time: 'morning', label: 'Утром' };
      case 'morning_evening':
        return { time: 'morning_evening', label: 'Утром и вечером' };
      case 'with_meals':
        return { time: 'with_meals', label: 'С приемом пищи' };
      case 'before_meals':
        return { time: 'before_meals', label: 'До еды' };
      default:
        return { time: 'with_meals', label: 'С приемом пищи' };
    }
  };

  const recommendedTime = getRecommendedTime();
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Рекомендуемое время приема</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Утром */}
          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <Sun className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Утром</h3>
            <p className="text-sm text-gray-600 mb-3">С завтраком для лучшего усвоения</p>
            <div className="text-xs text-gray-500">Рекомендуется принимать с едой</div>
          </div>

          {/* Рекомендуется */}
          <div className="text-center p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
            <div className="flex justify-center mb-4">
              <Clock className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Рекомендуется</h3>
            <p className="text-sm text-gray-600 mb-3">С основным приемом пищи</p>
            <div className="text-xs text-emerald-600 font-medium">Оптимальное время</div>
          </div>

          {/* Вечером */}
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <Moon className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Вечером</h3>
            <p className="text-sm text-gray-600 mb-3">С ужином при желании</p>
            <div className="text-xs text-gray-500">При необходимости дополнительного приема</div>
          </div>
        </div>

        {/* Инструкции по хранению */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Инструкции по хранению</h3>
          <p className="text-gray-700 leading-relaxed">
            {product.storage_conditions || 'Хранить в сухом прохладном месте при температуре не выше 25°C. Беречь от прямых солнечных лучей. Хранить в недоступном для детей месте.'}
          </p>
          {product.usage && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Дополнительная информация по применению</h4>
              <p className="text-gray-700 leading-relaxed">{product.usage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageRecommendations;