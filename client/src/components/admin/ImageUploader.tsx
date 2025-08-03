import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        
        // Проверяем размер файла
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (${(file.size / 1024 / 1024).toFixed(2)}MB). Максимальный размер: 5MB`);
        }
        
        // Отправляем файл на сервер
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to upload image';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        newImages.push(result.url);
      }

      onImagesChange([...images, ...newImages]);
      toast.success(`Загружено ${newImages.length} изображений`);
    } catch (error) {
      toast.error('Ошибка загрузки изображений: ' + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Освобождаем память от временного URL
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      toast.success('Изображение удалено');
    } catch (error) {
      toast.error('Ошибка удаления изображения');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Загрузка...' : 'Добавить изображения'}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <img
                  src={imageUrl}
                  alt={`Товар ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(imageUrl, index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Изображения не добавлены</p>
          <p className="text-sm text-gray-400">
            Добавьте хотя бы одно изображение товара
          </p>
        </div>
      )}
    </div>
  );
}