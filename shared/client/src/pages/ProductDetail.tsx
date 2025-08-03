import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Cart from '../components/Cart';
import ProductGallery from '../components/product/ProductGallery';
import ProductInfo from '../components/product/ProductInfo';
import ProductDescription from '../components/product/ProductDescription';
import ProductReviewsSection from '../components/product/ProductReviewsSection';
import UsageRecommendations from '../components/product/UsageRecommendations';
import DetailedDescription from '../components/product/DetailedDescription';
import ProductInfoSections from '../components/product/ProductInfoSections';
import RelatedProducts from '../components/product/RelatedProducts';
import CompanyCommitments from '../components/product/CompanyCommitments';
import ReferralProgram from '../components/product/ReferralProgram';
import ProductSchema from '../components/ProductSchema';
import { useToast } from '../hooks/use-toast';
import { useCartStore } from '../store/cartStore';

interface Product {
  id: number;
  name: string;
  title: string;
  description: string;
  long_description?: string;
  price: string;
  original_price?: string;
  category: string;
  badge?: string;
  images: string[];
  stock: number;
  rating?: number;
  reviews?: number;
  slug?: string;
  sku?: string;
  benefits?: string[];
  key_benefits?: string;
  quality_guarantee?: string;
  composition_table?: { component: string; amount: string }[];
  nutrition_facts?: string;
  how_to_take?: string;
  capsuleCount?: number;
  capsuleVolume?: string;
  servingsPerContainer?: number;
  manufacturer?: string;
  countryOfOrigin?: string;
  expirationDate?: string;
  storageConditions?: string;
}

const ProductDetail = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { identifier } = useParams<{ identifier: string }>();
  const { toast } = useToast();
  const { addItem } = useCartStore();

  // Определяем, является ли identifier числом (ID) или строкой (slug)
  const isNumeric = identifier && /^\d+$/.test(identifier);
  const apiUrl = isNumeric 
    ? `/api/product/${identifier}` 
    : `/api/product/slug/${identifier}`;

  const { data: response, isLoading, error } = useQuery({
    queryKey: [apiUrl],
    enabled: !!identifier
  });

  // Извлекаем продукт из ответа API
  const product = (response as any)?.product;

  // Прокрутка вверх при изменении товара
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [identifier]);



  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addItem({
        id: product.id,
        name: product.title || product.name,
        price: parseFloat(product.price),
        image: product.images?.[0] || '/placeholder.svg',
        quantity: 1
      });
      
      // Показываем модальное окно успеха
      setShowSuccessModal(true);
      
      // Автоматически скрываем модальное окно через 1.5 секунды
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 1500);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Товар не найден</h1>
          <p className="text-gray-600 mb-4">Проверьте правильность ссылки</p>
          <a href="/" className="text-emerald-600 hover:text-emerald-800">
            Вернуться на главную
          </a>
        </div>
      </div>
    );
  }


  
  // Используем данные напрямую из базы данных
  const productData = {
    id: product.id,
    sku: product.sku,
    name: product.title || product.name,
    description: product.description,
    price: parseInt(product.price),
    original_price: product.original_price ? parseInt(product.original_price) : undefined,
    category: product.category,
    badge: product.badge,
    benefits: product.benefits,
    capsule_count: product.capsule_count,
    capsule_volume: product.capsule_volume,
    servings_per_container: product.servings_per_container,
    composition: product.composition,
    manufacturer: product.manufacturer,
    country_of_origin: product.country_of_origin,
    expiration_date: product.expiration_date,
    storage_conditions: product.storage_conditions,
    benefits_text: product.benefits_text
  };

  return (
    <div className="min-h-screen bg-gray-50" itemScope itemType="https://schema.org/Product">
      {product && (
        <SEOHead 
          title={`${product.title || product.name} — Купить с доставкой | VitaWin`}
          description={`${product.title || product.name} по цене ${product.price} ₽. ${product.description ? product.description.substring(0, 140) + '...' : 'Качественные витамины и БАД от VitaWin с быстрой доставкой.'}`}
          keywords={`${product.title || product.name}, ${product.category}, витамины, БАД, купить, vitawin`}
          ogTitle={`${product.title || product.name} | VitaWin`}
          ogDescription={`Купить ${product.title || product.name} по выгодной цене ${product.price} ₽ с доставкой от VitaWin. Качественные витамины и БАД.`}
          ogImage={product.images?.[0] || undefined}
        />
      )}
      {product && (
        <ProductSchema 
          product={product}
          rating={4.8}
          reviewCount={1247}
        />
      )}
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 mb-8 lg:mb-12">
          <div className="w-full">
            <ProductGallery images={product.images} productName={productData.name} />
          </div>
          <div className="w-full">
            <ProductInfo product={productData} onAddToCart={handleAddToCart} />
          </div>
        </div>
        
        <ProductReviewsSection 
          rating={4.8}
          totalReviews={1247}
          reviewBreakdown={{
            5: 800,
            4: 300,
            3: 100,
            2: 30,
            1: 17
          }}
          userReviews={[
            {
              userName: 'Алексей М.',
              rating: 5,
              date: '2023-04-15',
              title: 'Заметное улучшение в контроле сахара',
              comment: 'Принимаю уже 3 месяца и заметил значительное снижение уровня сахара в крови. Определенно буду продолжать использовать!'
            },
            {
              userName: 'Сара К.',
              rating: 4,
              date: '2023-03-22',
              title: 'Качественный продукт',
              comment: 'Никаких побочных эффектов, что отлично! Заметила лучшую концентрацию и улучшение метаболизма с тех пор, как начала принимать.'
            },
            {
              userName: 'Михаил Т.',
              rating: 5,
              date: '2023-05-10',
              title: 'Рекомендован врачом',
              comment: 'Мой кардиолог рекомендовал этот конкретный бренд для здоровья сердца. Мои показатели холестерина улучшились всего за 2 месяца!'
            }
          ]}
        />
        
        <ProductInfoSections 
          keyBenefits={product.key_benefits}
          qualityGuarantee={product.quality_guarantee}
          compositionTable={product.composition_table}
          nutritionFacts={product.nutrition_facts}
          howToTake={product.how_to_take}
        />
        
        <ReferralProgram />
        
        <RelatedProducts 
          currentProductId={product?.id}
          currentCategory={product?.category}
        />
        
        <DetailedDescription 
          productName={product.name} 
          longDescription={product.long_description} 
        />
        
        <CompanyCommitments />
      </div>

      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Модальное окно успеха */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full text-center shadow-xl">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Товар добавлен в корзину! 🛒</h3>
            <p className="text-gray-600">{product?.title || product?.name} добавлен в корзину</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;