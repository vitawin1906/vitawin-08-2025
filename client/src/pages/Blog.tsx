
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Search, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  related_products?: number[];
  author_id: number;
  published: boolean;
  slug?: string;
  image_id?: number;
  created_at: string;
}

const categories = ['Все', 'Витамины', 'Питание', 'Спорт', 'Здоровье', 'Исследования'];

const Blog = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');

  // Fetch blog posts from API
  const { data: blogData, isLoading, error } = useQuery({
    queryKey: ['/api/blog'],
    select: (data: any) => data?.posts || []
  });

  const posts = blogData || [];

  const filteredPosts = posts.filter((post: BlogPost) => {
    const excerpt = post.content.substring(0, 200) + "...";
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, show all posts regardless of category since we don't have categories in DB yet
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50" itemScope itemType="https://schema.org/Blog">
      <SEOHead 
        title="Блог о здоровье — VitaWin | Экспертные статьи"
        description="Экспертные статьи о здоровье, питании и БАД от специалистов VitaWin. Научные исследования, советы по применению витаминов и биодобавок."
        keywords="блог о здоровье, статьи витамины, БАД советы, научные исследования, здоровое питание, экспертные статьи"
        ogTitle="Блог о здоровье VitaWin — Экспертные статьи"
        ogDescription="Читайте экспертные статьи о здоровье, витаминах и БАД от специалистов VitaWin. Научно обоснованные советы для вашего здоровья."
        ogUrl={`${window.location.origin}/blog`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        twitterTitle="Блог о здоровье VitaWin"
        twitterDescription="Экспертные статьи о витаминах, БАД и здоровье. Научные советы."
      />
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Блог о здоровье
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Экспертные статьи о здоровье, питании и биологически активных добавках от ведущих специалистов
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск статей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {(categories || []).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <Skeleton className="aspect-video rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Ошибка загрузки статей</p>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => {
              const excerpt = post.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
              const readTime = Math.ceil(post.content.length / 1000) || 1;
              const url = post.slug ? `/blog/${post.slug}` : `/blog/${post.id}`;
              
              return (
                <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 border-none shadow-sm overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                    {post.image_id ? (
                      <img
                        src={`/api/images/${post.image_id}`}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-100 to-blue-100 flex items-center justify-center">
                        <div className="text-center p-6">
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">{post.title}</h4>
                          <p className="text-sm text-gray-500">Статья о здоровье</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        Здоровье
                      </Badge>
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {Math.floor(Math.random() * 1000) + 500}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Автор #{post.author_id}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{readTime} мин чтения</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2"
                        asChild
                      >
                        <Link to={url}>
                          Читать
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && !error && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Статей по вашему запросу не найдено</p>
          </div>
        )}
      </div>

      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Blog;
