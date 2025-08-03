import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageEditorProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  currentImage,
  onImageChange,
  className = "w-full h-96 object-cover rounded-2xl",
  alt = "Uploaded image",
  width = 600,
  height = 400
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл изображения",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }

      const data = await response.json();
      const imageUrl = `/api/images/${data.filename}`;
      
      setPreviewUrl(imageUrl);
      onImageChange(imageUrl);

      toast({
        title: "Успешно",
        description: "Изображение загружено"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл изображения",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }

      const data = await response.json();
      const imageUrl = `/api/images/${data.filename}`;
      
      setPreviewUrl(imageUrl);
      onImageChange(imageUrl);

      toast({
        title: "Успешно",
        description: "Изображение загружено"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {previewUrl ? (
        <div 
          className="relative group"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <img
            src={previewUrl}
            alt={alt}
            className={`${className} shadow-xl`}
          />
          <div className={`absolute inset-0 bg-black transition-all duration-200 rounded-2xl flex items-center justify-center ${
            isDragOver 
              ? 'bg-opacity-50 border-2 border-emerald-400 border-dashed' 
              : 'bg-opacity-0 group-hover:bg-opacity-30'
          }`}>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <Button
                onClick={handleFileSelect}
                disabled={isUploading}
                size="sm"
                className="bg-white text-gray-800 hover:bg-gray-100"
              >
                <Upload className="h-4 w-4 mr-2" />
                Заменить
              </Button>
              <Button
                onClick={handleRemoveImage}
                disabled={isUploading}
                size="sm"
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card 
          className={`${className} border-2 border-dashed transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-gray-300 hover:border-emerald-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent 
            className="h-full flex flex-col items-center justify-center p-8"
            onClick={handleFileSelect}
          >
            <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Выберите изображение
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Нажмите для выбора файла или перетащите изображение сюда
            </p>
            <Button
              onClick={handleFileSelect}
              disabled={isUploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isUploading ? (
                "Загрузка..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, WEBP до 5MB
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageEditor;