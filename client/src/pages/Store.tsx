
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import StoreSchema from '@/components/StoreSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Star, Heart, ShoppingCart, Plus, Coins, Gift } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';

const categories = [
  {
    id: 'heart-health',
    name: 'Здоровье сердца',
    description: 'Добавки для поддержки сердечно-сосудистой системы',
    image: '/placeholder.svg',
    productCount: 12
  },
  {
    id: 'immunity',
    name: 'Поддержка иммунитета',
    description: 'Витамины и минералы для укрепления иммунной системы',
    image: '/placeholder.svg',
    productCount: 18
  },
  {
    id: 'fitness',
    name: 'Фитнес и спорт',
    description: 'Протеины и добавки для спортсменов',
    image: '/placeholder.svg',
    productCount: 24
  },
  {
    id: 'general-health',
    name: 'Общее здоровье',
    description: 'Мультивитамины и комплексы для ежедневного приема',
    image: '/placeholder.svg',
    productCount: 15
  },
  {
    id: 'digestion',
    name: 'Здоровье пищеварения',
    description: 'Пробиотики и ферменты для здорового пищеварения',
    image: '/placeholder.svg',
    productCount: 9
  },
  {
    id: 'sleep',
    name: 'Сон и расслабление',
    description: 'Добавки для улучшения качества сна и снятия стресса',
    image: '/placeholder.svg',
    productCount: 7
  }
];



const Store = () => {
  const [location, setLocation] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  console.log(allProducts)
  const addToCart = useCartStore(state => state.addItem);
  const { toast } = useToast();

  // Загружаем товары из API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data.products || []);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredProducts = (allProducts || []).filter(product => {
    if (!product) return false;
    const name = product.name || product.title || '';
    const description = product.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (productId: number) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart({
        id: product.id,
        name: product.name || product.title,
        price: parseFloat(product.price) || 0,
        image: product.images?.[0] || product.image || '/placeholder.svg',
        quantity: 1
      });
      
      toast({
        title: "Товар добавлен в корзину!",
        description: `${product.name || product.title} добавлен в корзину`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive"
      });
    }
  };

  const handleBuyNow = async (product: any) => {
    try {
      await addToCart({
        id: product.id,
        name: product.name || product.title,
        price: parseFloat(product.price) || 0,
        image: product.images?.[0] || product.image || '/placeholder.svg',
        quantity: 1
      });
      
      setLocation('/checkout');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive"
      });
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Бестселлер": return "bg-emerald-500";
      case "Премиум": return "bg-purple-500";
      case "Популярный": return "bg-blue-500";
      case "Выгодно": return "bg-orange-500";
      case "Рекомендовано врачами": return "bg-red-500";
      case "Новинка": return "bg-pink-500";
      default: return "bg-gray-500";
    }
  };

  const getBonusCoins = (price: number) => Math.round(price * 0.05);
  const getCashback = (price: number) => Math.round(price * 0.02);
  const getDiscountPercentage = (originalPrice: number, price: number) => 
    Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <div className="min-h-screen bg-white" itemScope itemType="https://schema.org/Store">
      <SEOHead 
        title="Каталог товаров — Витамины и БАД | VitaWin"
        description="Премиальные витамины, БАД и пищевые добавки в каталоге VitaWin. Здоровье сердца, иммунитет, спорт и красота. Научный подход к каждому продукту."
        keywords="каталог витаминов, БАД, пищевые добавки, здоровье сердца, иммунитет, спортивное питание, красота"
        ogTitle="Каталог премиальных витаминов и БАД | VitaWin"
        ogDescription="Выберите качественные витамины и биодобавки из каталога VitaWin. Научно обоснованные формулы для вашего здоровья."
        ogUrl={`${window.location.origin}/store`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        twitterTitle="Каталог витаминов и БАД | VitaWin"
        twitterDescription="Премиальные витамины и биодобавки. Научный подход к здоровью."
      />
      <StoreSchema products={filteredProducts} />
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Каталог товаров</h1>
          <p className="text-xl text-gray-600">Найдите идеальные добавки для вашего здоровья</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {(categories || []).map(category => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">По популярности</SelectItem>
                <SelectItem value="price-low">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-high">Цена: по убыванию</SelectItem>
                <SelectItem value="rating">По рейтингу</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(categories || []).map(category => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToCategory(category.id)}
                className="text-sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Категории</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(categories || []).map(category => (
              <Card key={category.id} id={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-600">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {category.description}
                      </p>
                      <Badge variant="secondary">
                        {category.productCount} товаров
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Товары {selectedCategory !== 'all' && `- ${selectedCategory}`}
            </h2>
            <span className="text-gray-500">
              Найдено: {filteredProducts.length} товаров
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredProducts || []).map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden h-full flex flex-col">
                <div className="relative">
                  <Link to={`/product/${product.slug || product.id}`}>
                    <div 
                      className="overflow-hidden bg-gray-50"
                      style={{ width: '100%', height: '400px' }}
                    >
                      <img
                        src={product.images?.[0] || product.image || '/placeholder.svg'}
                        alt={product.name || product.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        style={{ 
                          width: '740px', 
                          height: '1110px',
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                      />
                    </div>
                  </Link>
                  
                  {/* Top badges */}
                  <Badge 
                    className={`absolute top-3 left-3 text-white text-xs ${getBadgeColor(product.badge)}`}
                  >
                    {product.badge}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white p-2"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                    />
                  </Button>

                  {/* Bottom bonus badges */}
                  <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
                    <Badge className="text-white text-xs" style={{ backgroundColor: '#FF4081' }}>
                      <Coins className="h-3 w-3 mr-1" />
                      +{getBonusCoins(parseFloat(product.price || '0'))} монет
                    </Badge>
                    <Badge className="bg-blue-500 text-white text-xs">
                      <Gift className="h-3 w-3 mr-1" />
                      {getCashback(parseFloat(product.price || '0'))} ₽ кэшбек
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="space-y-3 flex-grow">
                    <div>
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {product.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                        <Link to={`/product/${product.slug || product.id}`}>{product.name || product.title}</Link>
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                      <span className="text-sm text-gray-500">({product.reviews} отзывов)</span>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-gray-900">{parseFloat(product.price || '0').toLocaleString()} ₽</span>
                      {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                        <>
                          <span className="text-sm text-gray-500 line-through">{parseFloat(product.original_price).toLocaleString()} ₽</span>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                            -{getDiscountPercentage(parseFloat(product.original_price), parseFloat(product.price))}%
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleBuyNow(product)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Купить сейчас
                      </Button>
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        variant="outline"
                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        В корзину
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Store;
