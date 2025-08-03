import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Загружаем товары из API с рандомизацией для главной страницы
  useEffect(() => {
    let mounted = true;
    
    const fetchProducts = async () => {
      try {
        // Загружаем все товары и делаем рандомизацию на клиенте
        const response = await fetch('/api/products?limit=50', {
          headers: {
            'Cache-Control': 'max-age=300'
          }
        });
        const data = await response.json();
        if (data.success && mounted) {
          // Создаем качественную рандомизацию с использованием crypto API
          const randomizeArray = (array: any[]) => {
            const randomized = [...array];
            for (let i = randomized.length - 1; i > 0; i--) {
              const randomValues = new Uint32Array(1);
              crypto.getRandomValues(randomValues);
              const j = Math.floor((randomValues[0] / (0xFFFFFFFF + 1)) * (i + 1));
              [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
            }
            return randomized;
          };
          
          const shuffledProducts = randomizeArray(data.products);
          setProducts(shuffledProducts.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Мемоизированные обработчики для оптимизации
  const handleAddToCart = useCallback(async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      try {
        await addItem({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          image: product.images?.[0] || product.image
        });
        
        toast({
          title: "Товар добавлен в корзину!",
          description: `${product.name} добавлен в корзину`,
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить товар в корзину",
          variant: "destructive"
        });
      }
    }
  }, [products, addItem, toast]);

  const handleBuyNow = useCallback(async (product: any) => {
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images?.[0] || product.image
      });
      
      setLocation('/checkout');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive"
      });
    }
  }, [addItem, setLocation, toast]);

  const ProductSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="w-full h-64" />
      <div className="p-6">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Рекомендуемые товары</h2>
            <p className="text-lg text-gray-600">Лучшие предложения для вашего здоровья</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Специально для вас</h2>
          <p className="text-lg text-gray-600">Персональная подборка качественных добавок</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(products || []).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;