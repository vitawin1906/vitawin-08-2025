
import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Cart from '@/components/Cart';
import BlogProductRecommendation from '@/components/blog/BlogProductRecommendation';
import BlogQualityCommitment from '@/components/blog/BlogQualityCommitment';
import BlogAffiliatePromo from '@/components/blog/BlogAffiliatePromo';
import BlogArticleHeader from '@/components/blog/BlogArticleHeader';
import BlogArticleContent from '@/components/blog/BlogArticleContent';
import BlogArticleFooter from '@/components/blog/BlogArticleFooter';
import { Skeleton } from '@/components/ui/skeleton';



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

const BlogArticle = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { id } = useParams();

  // Fetch blog post from API
  const { data: blogResponse, isLoading, error } = useQuery({
    queryKey: ['/api/blog', id],
    queryFn: async () => {
      const response = await fetch(`/api/blog/${id}`);
      if (!response.ok) {
        throw new Error('Article not found');
      }
      return response.json();
    },
    enabled: !!id
  });

  const article = blogResponse?.post;



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCartClick={() => setIsCartOpen(true)} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-8" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCartClick={() => setIsCartOpen(true)} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Статья не найдена</h1>
          <p className="text-gray-600">Возможно, статья была удалена или URL неверный</p>
        </div>
        <Footer />
      </div>
    );
  }

  const readTime = Math.ceil(article.content.length / 1000);

  return (
    <div className="min-h-screen bg-gray-50" itemScope itemType="https://schema.org/Article">
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <div className="w-full">
        <div className="py-8">
          <BlogArticleHeader
            title={article.title}
            category="Здоровье"
            author={article.author ? `${article.author.first_name || article.author.username}` : `Автор #${article.author_id}`}
            publishDate={article.created_at}
            views={0}
            readTime={readTime}
            imageUrl={article.image_id ? `/api/images/${article.image_id}` : "/vitawin-logo.png"}
          />
          
          <BlogArticleContent 
            content={article.content} 
            videoUrl=""
            galleryImages={[]}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlogProductRecommendation 
              category="Здоровье костей"
              title="Рекомендуемые витамины для здоровья костей"
              maxProducts={4}
            />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlogQualityCommitment />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlogAffiliatePromo />
          </div>
          
          <div className="px-4 sm:px-6 lg:px-12">
            <BlogArticleFooter author={`Автор #${article.author_id}`} />
          </div>
        </div>
      </div>

      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default BlogArticle;
