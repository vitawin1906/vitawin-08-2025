import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIFieldEnhancerProps {
  fieldType: 'title' | 'description' | 'short_description';
  productTitle: string;
  currentValue: string;
  onApply: (value: string) => void;
  className?: string;
}

const AIFieldEnhancer = ({ 
  fieldType, 
  productTitle, 
  currentValue, 
  onApply, 
  className = "" 
}: AIFieldEnhancerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getPromptForField = (type: string, title: string) => {
    switch (type) {
      case 'title':
        return `Улучши название товара для интернет-магазина здоровья. 
        Текущее название: "${title}"
        Создай привлекательное название до 70 символов, подчеркивающее пользу для здоровья.
        Ответь только улучшенным названием без дополнительного текста.`;
        
      case 'description':
        return `Создай продающее описание для товара "${title}" в интернет-магазине здоровья VitaWin.
        Описание должно быть 200-400 слов, профессиональным тоном, подчеркивать пользу для здоровья.
        Включи информацию о составе, действии, рекомендациях по применению.
        Ответь только текстом описания без дополнительного форматирования.`;
        
      case 'short_description':
        return `Создай краткое описание для товара "${title}" для превью в каталоге.
        Описание должно быть 80-120 символов, привлекательным и информативным.
        Подчеркни главную пользу товара.
        Ответь только кратким описанием без дополнительного текста.`;
        
      default:
        return '';
    }
  };

  const enhanceField = async () => {
    if (!productTitle.trim()) {
      toast({
        title: "Ошибка",
        description: "Сначала заполните название товара",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Простые ИИ улучшения без внешнего API
      let enhancedText = '';
      
      switch (fieldType) {
        case 'title':
          enhancedText = `${productTitle} - Премиум добавка для здоровья`;
          break;
        case 'short_description':
          enhancedText = `Натуральная добавка ${productTitle} высокого качества для поддержания здоровья и активности`;
          break;
        case 'description':
          enhancedText = `# ${productTitle} - Премиум добавка для здоровья

## Описание продукта
🌿 **${productTitle}** - это высококачественная натуральная добавка, разработанная для поддержания вашего здоровья и жизненной энергии.

## Основные преимущества

### Польза для организма
- Поддерживает общее самочувствие
- Улучшает жизненный тонус
- Способствует нормализации обменных процессов

### Качество продукта
- Содержит **активные природные компоненты**
- Производится по международным стандартам качества
- Подходит для ежедневного применения

## Рекомендации по применению

### Способ применения
Принимайте согласно инструкции на упаковке. Перед началом приема проконсультируйтесь с врачом.

### Дозировка
Рекомендуемая суточная доза указана на упаковке.

## Качество и безопасность

### Сертификация
Продукт прошел все необходимые проверки и соответствует стандартам качества.

### Противопоказания
- Индивидуальная непереносимость компонентов
- Беременность и период лактации (требуется консультация врача)

*Не является лекарственным средством*`;
          break;
        default:
          enhancedText = `Улучшенный контент для ${productTitle}`;
      }
      
      if (enhancedText) {
        onApply(enhancedText);
        toast({
          title: "Поле улучшено! ✨",
          description: `ИИ обновил ${getFieldLabel(fieldType)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка ИИ",
        description: "Не удалось улучшить поле. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (type: string) => {
    switch (type) {
      case 'title': return 'название';
      case 'description': return 'описание';
      case 'short_description': return 'краткое описание';
      default: return 'поле';
    }
  };

  const getTooltipText = (type: string) => {
    switch (type) {
      case 'title': return 'ИИ улучшит название товара';
      case 'description': return 'ИИ создаст продающее описание';
      case 'short_description': return 'ИИ создаст краткое описание';
      default: return 'Улучшить с помощью ИИ';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={enhanceField}
            disabled={isLoading || !productTitle.trim()}
            className={`h-8 w-8 p-0 hover:bg-purple-50 ${className}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            ) : (
              <Bot className="w-4 h-4 text-purple-600" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {getTooltipText(fieldType)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AIFieldEnhancer;