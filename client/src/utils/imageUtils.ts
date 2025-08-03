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
  
  // Убираем лишние слеши и очищаем путь
  let cleanPath = imagePath.replace(/\/+/g, '/');
  
  // Извлекаем только имя файла из пути
  const filename = cleanPath.split('/').pop() || '';
  
  // Проверяем что это файл изображения
  if (filename && filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
    // Используем простой роут /api/img/ для прямого доступа
    console.log(`[IMAGE UTILS] Using direct image route for: ${filename}`);
    return `/uploads/${filename}`;
  }
  
  // Если путь уже начинается с /api/uploads/ - попробуем извлечь имя файла
  if (cleanPath.startsWith('/api/uploads/')) {
    const extractedFilename = cleanPath.replace('/api/uploads/', '');
    if (extractedFilename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
      return `/uploads/${extractedFilename}`;
    }
  }
  
  // Для всех остальных случаев - fallback на placeholder
  console.log(`[IMAGE UTILS] Using placeholder for invalid path: ${imagePath}`);
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

  return '/placeholder.svg';
}