
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Star, ImagePlus, ToggleLeft, ToggleRight, Loader2, FileText } from 'lucide-react';
import { useCreateProduct, useUpdateProduct, useUploadProductImage, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from './ImageUploader';
// Временно убираем импорт utils до исправления Docker сборки
// import { performFullImageCacheRefresh, refreshProductImages } from '@/utils/imageCacheUtils';


// Предустановленные категории
const CATEGORIES = [
  'Здоровье сердца',
  'Поддержка иммунитета', 
  'Фитнес и спорт',
  'Общее здоровье',
  'Здоровье пищеварения',
  'Сон и расслабление'
];

// Предустановленные бейджи
const BADGES = [
  'Бестселлер',
  'Новинка',
  'Премиум',
  'Популярный',
  'Выгодно',
  'Рекомендовано врачами',
  'Ограниченная серия',
  'Эко-продукт'
];

interface ProductFormNewProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductFormNew({ product, onSuccess, onCancel }: ProductFormNewProps) {
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [benefits, setBenefits] = useState<string[]>(product?.benefits || []);
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [compositionRows, setCompositionRows] = useState<{component: string, amount: string}[]>(
    (product as any)?.composition_table && Array.isArray((product as any).composition_table) 
      ? (product as any).composition_table 
      : [{ component: '', amount: '' }]
  );
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(product?.status === 'active' || !product);
  const [selectedCategory, setSelectedCategory] = useState<string>(product?.category || '');
  const [selectedBadge, setSelectedBadge] = useState<string>(product?.badge || '');
  const [isGeneratingArticle, setIsGeneratingArticle] = useState<boolean>(false);

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const { toast } = useToast();

  // Инициализируем изображения при редактировании товара
  useEffect(() => {
    if (product?.images) {
      setImages(product.images);
    }
  }, [product]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      long_description: product?.long_description || '',
      price: product?.price || 0,
      original_price: product?.original_price || 0,
      category: product?.category || '',
      badge: product?.badge || '',
      stock: product?.stock || 0,
      status: (product?.status || 'active') as 'active' | 'inactive',
      sku: product?.sku || '',
      slug: (product as any)?.slug || '',
      capsule_count: product?.capsule_count || 0,
      capsule_volume: product?.capsule_volume || '',
      servings_per_container: product?.servings_per_container || 0,
      manufacturer: product?.manufacturer || '',
      country_of_origin: product?.country_of_origin || '',
      expiration_date: product?.expiration_date || '',
      storage_conditions: product?.storage_conditions || '',
      how_to_take: (product?.how_to_take || 'morning') as 'morning' | 'morning_evening' | 'with_meals' | 'before_meals' | 'custom',
      usage: product?.usage || '',
      additional_info: product?.additional_info || '',
      custom_pv: (product as any)?.custom_pv || '',
      custom_cashback: (product as any)?.custom_cashback || '',
    }
  });

  const toggleActiveStatus = async () => {
    if (!product?.id) return;
    
    const newStatus = isActive ? 'inactive' : 'active' as 'active' | 'inactive';

    try {
      await updateProductMutation.mutateAsync({ 
        id: product.id.toString(), 
        status: newStatus
      });
      
      setIsActive(!isActive);
      (setValue as any)('status', newStatus);
      
      toast({
        title: isActive ? "Товар деактивирован" : "Товар активирован",
        description: `Товар ${isActive ? 'скрыт' : 'отображается'} на сайте`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус товара",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: any) => {
    
    // Включаем текущий статус активации в данные
    data.status = isActive ? 'active' : 'inactive';
    
    // Добавляем title для совместимости с API
    data.title = data.name;
    
    // Переставляем главное изображение на первое место
    const orderedImages = [...(images || [])];
    if (mainImageIndex > 0 && orderedImages.length > 0) {
      const mainImage = orderedImages[mainImageIndex];
      orderedImages.splice(mainImageIndex, 1);
      orderedImages.unshift(mainImage);
    }

    const productData = {
      ...data,
      // Преобразуем данные в правильные типы для API
      price: data.price.toString(),
      original_price: data.original_price ? data.original_price.toString() : null,
      stock: parseInt(data.stock) || 0,
      capsule_count: parseInt(data.capsule_count) || 0,
      servings_per_container: parseInt(data.servings_per_container) || 0,
      images: orderedImages.length > 0 ? orderedImages : [],
      benefits,
      // Добавляем новые поля
      key_benefits: data.key_benefits || null,
      quality_guarantee: data.quality_guarantee || null,
      nutrition_facts: data.nutrition_facts || null,
      composition_table: compositionRows.filter(row => row.component.trim() || row.amount.trim()),
      rating: product?.rating || 0,
      reviews: product?.reviews || 0,
      custom_pv: data.custom_pv ? parseInt(data.custom_pv) : null,
      custom_cashback: data.custom_cashback ? parseFloat(data.custom_cashback) : null,
    };

    try {
      if (product?.id) {
        const updateResult = await updateProductMutation.mutateAsync({ id: product.id, ...productData });
        
        // Автоматическая очистка кэша изображений после обновления товара
        if (updateResult?.imageRefreshRequired || updateResult?.cacheCleared) {
          console.log('🧹 Очищаем кэш изображений после обновления товара...');
          
          // Простая очистка кэша изображений без внешних утилит
          setTimeout(() => {
            // Обновляем все изображения на странице добавляя timestamp
            const images = document.querySelectorAll('img[src*="/uploads/"], img[src*="/api/uploads/"]');
            const timestamp = Date.now();
            
            images.forEach((img: any, index: number) => {
              const currentSrc = img.src;
              if (currentSrc && !currentSrc.includes('?t=')) {
                const separator = currentSrc.includes('?') ? '&' : '?';
                img.src = `${currentSrc}${separator}t=${timestamp + index}`;
              }
            });
            
            // Очищаем кэш в localStorage/sessionStorage
            try {
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.includes('image') || key.includes('product') || key.includes('upload'))) {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {}
            
          }, 500);
          
          toast({
            title: "Товар обновлен",
            description: "Товар успешно обновлен. Кэш изображений очищен.",
          });
        }
      } else {
        const result = await createProductMutation.mutateAsync(productData);
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: `Не удалось сохранить товар: ${error?.message || 'Неизвестная ошибка'}`,
        variant: "destructive",
      });
    }
  };

  const handleMultipleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadImageMutation.mutateAsync({ file, productId: product?.id })
      );

      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map(result => result.url);
      
      setImages(prev => [...prev, ...newImageUrls]);
      
      toast({
        title: "Изображения загружены",
        description: `Успешно загружено ${files.length} изображений`,
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить одно или несколько изображений",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
      // Сбрасываем input
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Корректируем индекс главного изображения
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const addBenefit = () => {
    if (currentBenefit.trim()) {
      setBenefits(prev => [...prev, currentBenefit.trim()]);
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(prev => prev.filter((_, i) => i !== index));
  };

  const addCompositionRow = () => {
    setCompositionRows(prev => [...prev, { component: '', amount: '' }]);
  };

  const removeCompositionRow = (index: number) => {
    setCompositionRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateCompositionRow = (index: number, field: 'component' | 'amount', value: string) => {
    setCompositionRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="name">Название товара * <span className="text-xs text-blue-600">(Title для SEO)</span></Label>
            </div>
            <Input
              id="name"
              {...register('name', { required: 'Название обязательно' })}
              placeholder="Название товара"
            />
            <div className="text-xs text-gray-500 mt-1">
              🎯 SEO: Используется как заголовок H1 на странице товара и в мета-теге title
            </div>
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="description">Краткое описание <span className="text-xs text-blue-600">(Meta Description)</span></Label>
            </div>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Краткое описание товара"
            />
            <div className="text-xs text-gray-500 mt-1">
              🎯 SEO: Отображается в карточках товаров и используется для мета-описания страницы
            </div>
          </div>

          <div>
            <Label htmlFor="slug">URL адрес товара * <span className="text-xs text-blue-600">(SEO URL)</span></Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">https://vitawin.ru/product/</span>
              <Input
                id="slug"
                {...register('slug', { 
                  required: 'URL адрес обязателен',
                  validate: (value) => {
                    if (!value) return 'URL адрес обязателен';
                    if (/^\d+$/.test(value)) return 'URL не должен состоять только из цифр';
                    if (!/^[a-z0-9-]+$/.test(value)) return 'URL может содержать только строчные буквы, цифры и дефисы';
                    return true;
                  }
                })}
                placeholder="berberinplus-120caps"
                className="flex-1"
                onChange={(e) => {
                  // Разрешаем дефисы в URL
                  const value = e.target.value;
                  setValue('slug', value);
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🎯 SEO: ЧПУ для страницы товара. Используйте только буквы, цифры и дефисы
            </div>
            {errors.slug && <p className="text-red-500 text-sm">{String(errors.slug.message)}</p>}
            {watch('slug') && !errors.slug && (
              <div className="text-xs text-emerald-600 mt-1">
                Полная ссылка: https://vitawin.ru/product/{watch('slug')}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="long_description">Полное описание <span className="text-xs text-blue-600">(Контент для SEO)</span></Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!watch('name')) {
                    toast({
                      title: "Ошибка",
                      description: "Сначала введите название товара",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  setIsGeneratingArticle(true);
                  try {
                    const response = await fetch('/api/ai/generate-full-article', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: watch('name'),
                        description: watch('description'),
                        category: watch('category')
                      })
                    });
                    
                    if (!response.ok) throw new Error('Ошибка генерации');
                    
                    const data = await response.json();
                    setValue('long_description', data.article);
                    
                    toast({
                      title: "Статья создана! ✨",
                      description: `Научная статья ${data.character_count} символов готова`,
                    });
                  } catch (error) {
                    toast({
                      title: "Ошибка",
                      description: "Не удалось создать статью",
                      variant: "destructive"
                    });
                  } finally {
                    setIsGeneratingArticle(false);
                  }
                }}
                disabled={isGeneratingArticle || !watch('name')}
                className="shrink-0"
              >
                {isGeneratingArticle ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Создаю...
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    Статья ИИ
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              {/* Панель инструментов для форматирования */}
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n# Заголовок H1\n');
                  }}
                >
                  H1
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n## Заголовок H2\n');
                  }}
                >
                  H2
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n### Заголовок H3\n');
                  }}
                >
                  H3
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n#### Заголовок H4\n');
                  }}
                >
                  H4
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n##### Заголовок H5\n');
                  }}
                >
                  H5
                </button>
                <div className="border-l mx-2"></div>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n- Элемент списка\n');
                  }}
                >
                  • Список
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n**Жирный текст**\n');
                  }}
                >
                  B
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const currentText = watch('long_description') || '';
                    setValue('long_description', currentText + '\n*Курсив*\n');
                  }}
                >
                  I
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
                  onClick={() => {
                    const text = prompt("Введите текст ссылки:");
                    const url = prompt("Введите URL:");
                    if (text && url) {
                      const currentText = watch('long_description') || '';
                      setValue('long_description', currentText + `\n[${text}](${url})\n`);
                    }
                  }}
                >
                  🔗
                </button>
              </div>
              <Textarea
                id="long_description"
                {...register('long_description')}
                placeholder="Полное описание товара с поддержкой Markdown: 
# Заголовок H1
## Заголовок H2
### Заголовок H3
**Жирный текст**
*Курсив*
- Элемент списка"
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-gray-500">
                💡 Используйте кнопки выше или Markdown разметку: # H1, ## H2, ### H3, **жирный**, *курсив*, - списки
              </div>
              <div className="text-xs text-blue-600 mt-1">
                🎯 SEO: Создает статью с микроразметкой Schema.org для лучшего ранжирования в поиске
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Цена *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { required: 'Цена обязательна', min: 0 })}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
            </div>

            <div>
              <Label htmlFor="original_price">Первоначальная цена</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                {...register('original_price', { min: 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Категория *</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setValue('category', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>

            <div>
              <Label htmlFor="badge">Бейдж</Label>
              <Select 
                value={selectedBadge} 
                onValueChange={(value) => {
                  setSelectedBadge(value);
                  setValue('badge', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бейдж" />
                </SelectTrigger>
                <SelectContent>
                  {BADGES.map((badge) => (
                    <SelectItem key={badge} value={badge}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock">Количество на складе *</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock', { required: 'Количество обязательно', min: 0 })}
                placeholder="0"
              />
              {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
            </div>

            <div>
              <Label htmlFor="status">Статус</Label>
              <Select onValueChange={(value: 'active' | 'inactive') => setValue('status', value)} defaultValue={watch('status')}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="inactive">Неактивный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register('sku')}
                placeholder="PROD-001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Изображения */}
      <Card>
        <CardHeader>
          <CardTitle>Изображения товара</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader 
            images={images} 
            onImagesChange={setImages} 
          />
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capsule_count">Количество капсул</Label>
              <Input
                id="capsule_count"
                type="number"
                {...register('capsule_count', { min: 0 })}
                placeholder="60"
              />
            </div>

            <div>
              <Label htmlFor="capsule_volume">Объем капсулы</Label>
              <Input
                id="capsule_volume"
                {...register('capsule_volume')}
                placeholder="500mg"
              />
            </div>

            <div>
              <Label htmlFor="servings_per_container">Порций в упаковке</Label>
              <Input
                id="servings_per_container"
                type="number"
                {...register('servings_per_container', { min: 0 })}
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="key_benefits">Ключевые преимущества</Label>
            <Textarea
              id="key_benefits"
              {...(register as any)('key_benefits')}
              placeholder="Поддерживает здоровый уровень сахара в крови
Способствует здоровому контролю веса
Помогает снижать воспаление"
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 Каждое преимущество пишите с новой строки
            </div>
          </div>

          <div>
            <Label htmlFor="quality_guarantee">Гарантия качества</Label>
            <Textarea
              id="quality_guarantee"
              {...(register as any)('quality_guarantee')}
              placeholder="Протестировано третьей стороной на чистоту и эффективность
Экстракт высочайшего качества 97% концентрации
Без тяжелых металлов и других загрязнителей"
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 Каждый пункт гарантии пишите с новой строки
            </div>
          </div>

          <div>
            <Label htmlFor="composition">Состав</Label>
            <Input
              id="composition"
              {...(register as any)('composition')}
              placeholder="Витамин D3, желатин, глицерин"
            />
          </div>

          <div>
            <Label>Состав и пищевая ценность (таблица)</Label>
            <div className="space-y-2">
              {compositionRows.map((row, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Компонент (например: Витамин D3)"
                    value={row.component}
                    onChange={(e) => updateCompositionRow(index, 'component', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Дозировка (например: 5000 МЕ)"
                      value={row.amount}
                      onChange={(e) => updateCompositionRow(index, 'amount', e.target.value)}
                    />
                    {compositionRows.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCompositionRow(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompositionRow}
              >
                + Добавить компонент
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              💡 Добавьте компоненты и их дозировки в отдельные поля
            </div>
          </div>

          <div>
            <Label htmlFor="nutrition_facts">Дополнительная информация о составе</Label>
            <Textarea
              id="nutrition_facts"
              {...(register as any)('nutrition_facts')}
              placeholder="Дополнительные компоненты: Желатин (капсула), глицерин, очищенная вода."
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 Укажите дополнительную информацию о составе
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Производитель</Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="Название производителя"
              />
            </div>

            <div>
              <Label htmlFor="country_of_origin">Страна производства</Label>
              <Input
                id="country_of_origin"
                {...register('country_of_origin')}
                placeholder="США"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiration_date">Срок годности</Label>
              <Input
                id="expiration_date"
                {...register('expiration_date')}
                placeholder="2 года"
              />
            </div>

            <div>
              <Label htmlFor="how_to_take">Рекомендуемое время приема</Label>
              <Select onValueChange={(value) => (setValue as any)('how_to_take', value)} defaultValue={watch('how_to_take')}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите время приема" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Утром</SelectItem>
                  <SelectItem value="morning_evening">Утром и вечером</SelectItem>
                  <SelectItem value="with_meals">С едой</SelectItem>
                  <SelectItem value="before_meals">До еды</SelectItem>
                  <SelectItem value="custom">Индивидуально</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                💡 Выберите оптимальное время для приема препарата
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="storage_conditions">Условия хранения</Label>
            <Input
              id="storage_conditions"
              {...register('storage_conditions')}
              placeholder="Хранить в сухом прохладном месте"
            />
          </div>

          <div>
            <Label htmlFor="usage">Способ применения</Label>
            <Textarea
              id="usage"
              {...register('usage')}
              placeholder="Принимать по 1 капсуле в день"
            />
          </div>

          <div>
            <Label htmlFor="benefits_text">Польза</Label>
            <Textarea
              id="benefits_text"
              {...(register as any)('benefits_text')}
              placeholder="Описание пользы товара для характеристик"
            />
          </div>

          <div>
            <Label htmlFor="additional_info">Дополнительная информация</Label>
            <Textarea
              id="additional_info"
              {...register('additional_info')}
              placeholder="Дополнительная информация о товаре"
            />
          </div>
        </CardContent>
      </Card>

      {/* PV и Кешбэк */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки PV и Кешбэка</CardTitle>
          <p className="text-sm text-gray-600">
            Настройте персональные значения PV и кешбэка для товара. Если поля пустые, будет использоваться автоматический расчет.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom_pv">Ручное значение PV</Label>
              <Input
                id="custom_pv"
                type="number"
                {...register('custom_pv', { min: 0 })}
                placeholder="Автоматически: 1 PV за 200₽"
              />
              <div className="text-xs text-gray-500 mt-1">
                Оставьте пустым для автоматического расчета (1 PV за каждые 200₽)
              </div>
            </div>

            <div>
              <Label htmlFor="custom_cashback">Ручное значение кешбэка (₽)</Label>
              <Input
                id="custom_cashback"
                type="number"
                step="0.01"
                {...register('custom_cashback', { min: 0 })}
                placeholder="Автоматически: 5% от цены"
              />
              <div className="text-xs text-gray-500 mt-1">
                Оставьте пустым для автоматического расчета (5% от цены товара)
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Предварительный расчет:</p>
            <div className="text-sm text-blue-700 mt-1">
              При цене {watch('price') || 0}₽:
              <br />• PV: {watch('custom_pv') || Math.floor((watch('price') || 0) / 200)} PV
              <br />• Кешбэк: {watch('custom_cashback') || Math.ceil((watch('price') || 0) * 0.05)}₽
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Польза */}
      <Card>
        <CardHeader>
          <CardTitle>Польза товара</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                placeholder="Добавить пользу"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" onClick={addBenefit}>
                Добавить
              </Button>
            </div>

            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {benefit}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeBenefit(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Кнопки */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {product?.id && (
            <Button
              type="button"
              variant={isActive ? "default" : "secondary"}
              onClick={toggleActiveStatus}
              disabled={updateProductMutation.isPending}
              className={`${isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-500 hover:bg-gray-600'} text-white`}
            >
              {isActive ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-2" />
                  Активен
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-2" />
                  Неактивен
                </>
              )}
            </Button>
          )}
        </div>

        
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button 
            type="submit" 
            disabled={createProductMutation.isPending || updateProductMutation.isPending}
          >
            {product?.id ? 'Обновить товар' : 'Создать товар'}
          </Button>
        </div>
      </div>
    </form>
  );
}
