import { Check, Info } from "lucide-react";

interface ProductDescriptionProps {
  description: string;
  benefits?: string[];
  composition?: Array<{ name: string; amount: string }>;
}

const ProductDescription = ({ description, benefits = [], composition = [] }: ProductDescriptionProps) => {
  const defaultBenefits = [
    "Поддерживает здоровый уровень сахара в крови и метаболизм глюкозы",
    "Способствует здоровому контролю веса и метаболизму жиров", 
    "Помогает снижать воспаление и поддерживает здоровье сердца"
  ];

  const defaultComposition = [
    { name: "Витамин D3", amount: "5050 МЕ" },
    { name: "Оливковое масло", amount: "200 мг" },
    { name: "Желатин (капсула)", amount: "100 мг" }
  ];

  const qualityGuarantees = [
    "Протестировано третьей стороной на чистоту и эффективность",
    "Экстракт высочайшего качества 97% концентрации",
    "Без тяжелых металлов и других загрязнителей"
  ];

  return (
    <div className="bg-white py-6 lg:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          
          {/* Описание товара */}
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Описание товара</h2>
            <p className="text-gray-700 leading-relaxed mb-6 lg:mb-8 text-sm lg:text-base">
              {description}
            </p>

            {/* Ключевые преимущества */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500 mr-2" />
                Ключевые преимущества
              </h3>
              <div className="space-y-2 lg:space-y-3">
                {(benefits?.length > 0 ? benefits : defaultBenefits).map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium mr-2 lg:mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 text-sm lg:text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Гарантия качества */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
              <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500 mr-2" />
              Гарантия качества
            </h3>
            <div className="space-y-2 lg:space-y-3 mb-6 lg:mb-8">
              {qualityGuarantees.map((guarantee, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500 mr-2 lg:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm lg:text-base">{guarantee}</span>
                </div>
              ))}
            </div>

            {/* Состав и пищевая ценность */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Состав и пищевая ценность</h3>
              <div className="space-y-2 lg:space-y-3">
                {(composition.length > 0 ? composition : defaultComposition).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700 text-sm lg:text-base">{item.name}</span>
                    <span className="font-medium text-gray-900 text-sm lg:text-base">{item.amount}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-emerald-50 rounded-lg flex items-start">
                <Info className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs lg:text-sm text-emerald-800">
                  <strong>Дополнительные компоненты:</strong> Желатин (капсула), глицерин, очищенная вода.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;