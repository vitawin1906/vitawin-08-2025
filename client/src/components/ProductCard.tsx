import { useState, memo, useCallback, useMemo, lazy } from 'react';
import { Link } from 'wouter';
import { Heart, ShoppingCart, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { getMainProductImage } from '@/utils/imageUtils';
import { useProductCalculations } from '@/utils/productCalculations';
import { ProductBonuses } from './ProductBonuses';

interface Product {
  id: number;
  name: string;
  title?: string;
  description: string;
  price: string;
  original_price?: string;
  badge?: string;
  images?: string[];
  image?: string;
  slug?: string;
  stock: number;
  category?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  onBuyNow?: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  console.log(product)
  // Мемоизируем вычисления для предотвращения ненужных перерендеров
  const productImage = useMemo(() => {
    const imagesArray = Array.isArray(product.images)
        ? product.images
        : product.image
            ? [product.image]
            : [];

    return getMainProductImage(imagesArray);
  }, [product.images, product.image]);

  const productUrl = useMemo(() => `/product/${product.slug || product.id}`, [product.slug, product.id]);
  
  // Используем централизованные расчеты
  const calculations = useProductCalculations(product);

  // Рейтинг (фиксированный на основе ID товара)
  const rating = 4.8;
  const reviewsCount = 736 + (product.id * 47) % 500; // Генерируем стабильное число на основе ID

  return (
    <Card className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      {/* Бейдж в верхнем левом углу */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-emerald-500 text-white px-2 py-1 text-xs font-semibold">
            {product.badge}
          </Badge>
        </div>
      )}

      {/* Кнопка избранного */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsLiked(!isLiked);
        }}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
      >
        <Heart 
          className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
        />
      </button>

      {/* Изображение товара - обернуто в ссылку */}
      <Link to={productUrl} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <LazyImage
            src={productImage}
            alt={product.name}
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
            aspectRatio="1/1"
            loading="lazy"
          />
          
          {/* PV и кешбэк бейджи */}
          <ProductBonuses 
            price={parseFloat(product.price)}
            customPV={(product as any).custom_pv}
            customCashback={(product as any).custom_cashback}
            className="absolute bottom-3 right-3"
          />
        </div>
      </Link>

      {/* Информация о товаре - flexbox для равномерного распределения */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Категория */}
        {product.category && (
          <div className="text-sm text-gray-500 mb-1">{product.category}</div>
        )}
        
        {/* Название - адаптивная высота для мобильных */}
        <Link to={productUrl} className="block">
          <h3 className="text-base md:text-lg font-bold text-emerald-600 mb-2 line-clamp-2 hover:text-emerald-700 transition-colors min-h-[2.5rem] md:min-h-[3.5rem] flex items-start leading-tight">
            {product.title || product.name}
          </h3>
        </Link>
        
        {/* Описание - скрыто на очень маленьких экранах */}
        <p className="hidden sm:block text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem] flex items-start">
          {product.description}
        </p>

        {/* Рейтинг - компактный для мобильных */}
        <div className="flex items-center gap-1 mb-3 h-6">
          {[1, 2, 3, 4, 5]|([] || []).map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 md:w-4 md:h-4 ${
                star <= Math.floor(rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="font-semibold text-gray-800 ml-1 text-sm">{rating}</span>
          <span className="text-gray-500 text-xs md:text-sm hidden sm:inline">({reviewsCount} отзывов)</span>
        </div>

        {/* Разделитель для выталкивания кнопок вниз */}
        <div className="flex-grow"></div>

        {/* Цена - компактная для мобильных */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3">
          <span className="text-lg md:text-xl font-bold text-gray-900">
            {calculations.formattedPrice}
          </span>
          {calculations.hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-gray-400 line-through">
                {calculations.formattedOriginalPrice}
              </span>
              {calculations.discountPercentage > 0 && (
                <span className="text-xs md:text-sm text-emerald-600 font-semibold">
                  -{calculations.discountPercentage}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Кнопки действий - в одну строку с адаптивным масштабированием */}
        <div className="flex gap-1 sm:gap-2">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBuyNow?.(product);
            }}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Купить</span>
            <span className="xs:hidden">₽</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product.id);
            }}
            className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Корзина</span>
          </Button>
        </div>
      </div>
    </Card>
  );
});

export { ProductCard };
export default ProductCard;