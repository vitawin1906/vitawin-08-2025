import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image as ImageIcon, X, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Product } from '@/types/product';

interface ProductFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingProduct: Product | null;
}

// Categories data (same as in CategoryManagement)
const categories = [
  { id: 1, name: "Здоровье сердца", slug: "heart-health" },
  { id: 2, name: "Поддержка иммунитета", slug: "immune-support" },
  { id: 3, name: "Фитнес", slug: "fitness" },
  { id: 4, name: "Общее здоровье", slug: "general-health" },
  { id: 5, name: "Здоровье пищеварения", slug: "digestive-health" },
  { id: 6, name: "Сон и расслабление", slug: "sleep-relaxation" }
];

// How to take options
const howToTakeOptions = [
  { value: 'morning', label: 'Утром' },
  { value: 'morning_evening', label: 'Утром и вечером' },
  { value: 'with_meals', label: 'Во время еды' },
  { value: 'before_meals', label: 'До еды' },
  { value: 'custom', label: 'Индивидуально' }
];

export function ProductForm({ onSubmit, onCancel, editingProduct }: ProductFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>(editingProduct?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [compositionFields, setCompositionFields] = useState<Array<{key: string, value: string}>>(
    editingProduct?.composition ? Object.entries(editingProduct.composition).map(([key, value]) => ({key, value})) : []
  );

  const form = useForm({
    defaultValues: {
      name: editingProduct?.name || '',
      description: editingProduct?.description || '',
      longDescription: editingProduct?.longDescription || '',
      price: editingProduct?.price.toString() || '',
      originalPrice: editingProduct?.originalPrice.toString() || '',
      category: editingProduct?.category || '',
      badge: editingProduct?.badge || '',
      benefits: editingProduct?.benefits ? editingProduct.benefits.join(', ') : '',
      stock: editingProduct?.stock.toString() || '',
      sku: editingProduct?.sku || '',
      usage: editingProduct?.usage || '',
      additionalInfo: editingProduct?.additionalInfo || '',
      customUrl: editingProduct?.customUrl || '',
      capsuleCount: editingProduct?.capsuleCount?.toString() || '',
      capsuleVolume: editingProduct?.capsuleVolume || '',
      servingsPerContainer: editingProduct?.servingsPerContainer?.toString() || '',
      manufacturer: editingProduct?.manufacturer || '',
      countryOfOrigin: editingProduct?.countryOfOrigin || '',
      expirationDate: editingProduct?.expirationDate || '',
      storageConditions: editingProduct?.storageConditions || '',
      howToTake: editingProduct?.howToTake || ''
    }
  });

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    const newUploadedImages = [...uploadedImages];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        
        // Upload to our API endpoint
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${file.name}: ${errorData.error || 'Неизвестная ошибка'}`,
            variant: "destructive"
          });
          continue;
        }
        
        const data = await response.json();
        newUploadedImages.push(data.url);
      }
      
      setUploadedImages(newUploadedImages);
      
      toast({
        title: "Изображения загружены",
        description: `Загружено ${files.length} изображений`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке изображений",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
    }
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(uploadedImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setUploadedImages(items);
  };
  
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const addCompositionField = () => {
    setCompositionFields([...compositionFields, { key: '', value: '' }]);
  };

  const removeCompositionField = (index: number) => {
    const newFields = [...compositionFields];
    newFields.splice(index, 1);
    setCompositionFields(newFields);
  };

  const updateCompositionField = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...compositionFields];
    newFields[index][field] = value;
    setCompositionFields(newFields);
  };

  const handleFormSubmit = (data: any) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Добавьте изображения",
        description: "Необходимо загрузить хотя бы одно изображение товара",
        variant: "destructive"
      });
      return;
    }
    
    const composition = compositionFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const productData = {
      ...data,
      id: editingProduct ? editingProduct.id : Date.now(),
      price: parseFloat(data.price),
      originalPrice: parseFloat(data.originalPrice),
      stock: parseInt(data.stock),
      benefits: data.benefits.split(',').map((b: string) => b.trim()),
      images: uploadedImages,
      composition,
      capsuleCount: data.capsuleCount ? parseInt(data.capsuleCount) : undefined,
      servingsPerContainer: data.servingsPerContainer ? parseInt(data.servingsPerContainer) : undefined,
      rating: editingProduct ? editingProduct.rating : 0,
      reviews: editingProduct ? editingProduct.reviews : 0,
      status: 'active' as const
    };

    onSubmit(productData);
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="mb-4">
          <Label>Изображения товара</Label>
          <div 
            className="mt-2 p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDragDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileInputChange} 
            />
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Перетащите изображения сюда или нажмите для выбора файлов</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP или GIF · До 10 МБ</p>
            {isUploading && <p className="text-xs text-blue-500 mt-2">Загрузка...</p>}
          </div>
          
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <Label className="mb-2 block">Изображения товара ({uploadedImages.length})</Label>
              <p className="text-xs text-gray-500 mb-2">Первое изображение будет главным. Перетащите изображения для изменения порядка.</p>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="images" direction="horizontal">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef} 
                      className="flex flex-wrap gap-3"
                    >
                      {uploadedImages.map((image, index) => (
                        <Draggable key={image} draggableId={image} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative group border rounded-md overflow-hidden h-24 w-24 flex-shrink-0 ${index === 0 ? 'ring-2 ring-emerald-500' : ''}`}
                            >
                              <img src={image} alt="" className="h-full w-full object-cover" />
                              {index === 0 && (
                                <div className="absolute top-1 left-1">
                                  <Badge variant="default" className="bg-emerald-500">Главное</Badge>
                                </div>
                              )}
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название товара</FormLabel>
                <FormControl>
                  <Input placeholder="Введите название товара" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Артикул (SKU)</FormLabel>
                <FormControl>
                  <Input placeholder="BRB-PRE-2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пользовательский URL</FormLabel>
              <FormControl>
                <Input placeholder="berberine-premium" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Краткое описание</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Краткое описание товара для карточки" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подробное описание</FormLabel>
              <FormControl>
                <RichTextEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Введите подробное описание товара"
                  className="min-h-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена (руб.)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="2499" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Первоначальная цена (руб.)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="3299" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Количество на складе</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="badge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бейдж</FormLabel>
                <FormControl>
                  <Input placeholder="Бестселлер, Новинка..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Характеристики товара</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="capsuleCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Количество капсул</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="90" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capsuleVolume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Объем капсулы</FormLabel>
                  <FormControl>
                    <Input placeholder="600 мг" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servingsPerContainer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Порций в упаковке</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="90" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Производитель</FormLabel>
                  <FormControl>
                    <Input placeholder="Health Solutions Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryOfOrigin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Страна производства</FormLabel>
                  <FormControl>
                    <Input placeholder="США" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок годности</FormLabel>
                  <FormControl>
                    <Input placeholder="12/2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storageConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Условия хранения</FormLabel>
                  <FormControl>
                    <Input placeholder="При температуре не выше +25°C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="howToTake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Как принимать</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите время приема" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {howToTakeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Преимущества (через запятую)</FormLabel>
              <FormControl>
                <Input placeholder="Контроль сахара, Поддержка метаболизма, Контроль веса" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Состав и характеристики</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCompositionField}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить поле
            </Button>
          </div>
          {compositionFields.map((field, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Название (например: Размер порции)"
                value={field.key}
                onChange={(e) => updateCompositionField(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Значение (например: 1 капсула)"
                value={field.value}
                onChange={(e) => updateCompositionField(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeCompositionField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="usage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Способ применения</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Принимайте по 1 капсуле в день во время еды или по рекомендации врача." 
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дополнительная информация</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Хранить в прохладном, сухом месте, защищенном от прямых солнечных лучей." 
                  {...field}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {editingProduct ? 'Обновить товар' : 'Добавить товар'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
