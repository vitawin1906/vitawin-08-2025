/**
 * Утилита для правильного отображения изображений товаров
 * Обрабатывает изображения из базы данных через API endpoint
 */

export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '/placeholder.svg';
  }
  
  // Блокируем внешние URL для безопасности
  if (imagePath.startsWith('http')) {
    return '/placeholder.svg';
  }
  
  // Если путь уже начинается с /api/uploads/ - используем как есть
  if (imagePath.startsWith('/api/uploads/')) {
    return imagePath;
  }
  
  // Если путь начинается с /uploads/ - используем API endpoint
  if (imagePath.startsWith('/uploads/')) {
    return `/api${imagePath}`;
  }
  
  // Если просто название файла - используем как есть (так как API уже возвращает полный путь)
  if (!imagePath.startsWith('/')) {
    return imagePath;
  }
  
  // Для всех остальных случаев - fallback на placeholder
  return '/placeholder.svg';
}

/**
 * Получает основное изображение товара из массива изображений
 */
export function getMainProductImage(images: string[] | string | null | undefined): string {
  if (Array.isArray(images) && images.length > 0) {
    return getProductImageUrl(images[0]);
  }
  
  if (typeof images === 'string') {
    return getProductImageUrl(images);
  }
  
  return getProductImageUrl(null);
}