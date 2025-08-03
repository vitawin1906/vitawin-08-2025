
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BlogPostForm } from './BlogPostForm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  imageUrl: string;
  views: number;
  readTime: number;
  status: 'published' | 'draft';
  recommendedProducts: number[];
  keywords?: string;
  customUrl?: string;
  videoUrl?: string;
  galleryImages?: string[];
}

const BlogManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Fetch blog posts from API - show all posts for admin
  const { data: blogPostsData, isLoading } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/blog');
      return response.json();
    }
  });

  const posts = (blogPostsData?.posts || []).map((post: any) => ({
    ...post,
    // Map API fields to frontend expected fields
    status: post.published ? 'published' : 'draft',
    excerpt: post.content?.substring(0, 150) + '...' || '',
    author: `Admin ${post.author_id}`,
    publishDate: post.created_at,
    category: 'Здоровье',
    imageUrl: '/placeholder-image.jpg',
    views: 0,
    readTime: Math.ceil(post.content?.length / 1000) || 1,
    recommendedProducts: post.related_products || [],
    keywords: '',
    customUrl: post.slug || '',
    videoUrl: '',
    galleryImages: []
  }));
  
  console.log('BlogManagement - blogPostsData:', blogPostsData);
  console.log('BlogManagement - posts:', posts);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest('DELETE', `/api/blog/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Статья удалена",
        description: "Статья успешно удалена"
      });
    },
    onError: (error) => {
      console.error('Delete blog post error:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить статью. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (postData: BlogPost) => {
      // Convert Markdown to HTML
      const { marked } = await import('marked');
      const htmlContent = marked(postData.content);
      
      const backendData = {
        title: postData.title,
        content: htmlContent,
        related_products: postData.recommendedProducts || [],
        published: postData.status === 'published',
        slug: postData.customUrl || null
      };
      
      console.log('Sending blog post data:', backendData);
      const response = await apiRequest('POST', '/api/blog', backendData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Статья создана",
        description: "Новая статья успешно создана"
      });
      setIsDialogOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      console.error('Create blog post error:', error);
      toast({
        title: "Ошибка создания",
        description: "Не удалось создать статью. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (postData: BlogPost) => {
      // Convert Markdown to HTML
      const { marked } = await import('marked');
      const htmlContent = marked(postData.content);
      
      const backendData = {
        title: postData.title,
        content: htmlContent,
        related_products: postData.recommendedProducts || [],
        published: postData.status === 'published',
        slug: postData.customUrl || null
      };
      
      console.log('Updating blog post with data:', backendData);
      const response = await apiRequest('PUT', `/api/blog/${postData.id}`, backendData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: "Статья обновлена",
        description: "Статья успешно обновлена"
      });
      setIsDialogOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      console.error('Update blog post error:', error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить статью. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  });

  const filteredPosts = posts.filter((post: any) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.keywords && post.keywords.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (postData: BlogPost) => {
    if (editingPost) {
      updateMutation.mutate(postData);
    } else {
      createMutation.mutate(postData);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление блогом</h2>
          <p className="text-gray-600">Создавайте и редактируйте статьи блога</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPost(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать статью
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Редактировать статью' : 'Создать статью'}</DialogTitle>
              <DialogDescription>
                {editingPost ? 'Измените содержание статьи' : 'Заполните информацию для новой статьи'}
              </DialogDescription>
            </DialogHeader>
            <BlogPostForm 
              onSubmit={handleSubmit} 
              onCancel={() => setIsDialogOpen(false)} 
              editingPost={editingPost} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статьи блога</CardTitle>
          <CardDescription>Всего статей: {(posts || []).length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск статей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredPosts.map((post: any) => (
                <Card key={post.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4 flex-grow">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{post.title}</h3>
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status === 'published' ? 'Опубликовано' : 'Черновик'}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{post.excerpt}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-1">
                            <span>{post.author}</span>
                            <span>{new Date(post.publishDate).toLocaleDateString('ru-RU')}</span>
                            <span>{post.category}</span>
                            <span><Eye className="h-3 w-3 inline mr-1" />{post.views}</span>
                            <span>{post.readTime} мин</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {(post.recommendedProducts || []).length > 0 && (
                              <span>Товаров: {(post.recommendedProducts || []).length}</span>
                            )}
                            {post.videoUrl && <span>Видео: ✓</span>}
                            {(post.galleryImages || []).length > 0 && (
                              <span>Галерея: {(post.galleryImages || []).length}</span>
                            )}
                            {post.customUrl && <span>URL: {post.customUrl}</span>}
                          </div>
                          {post.keywords && (
                            <div className="text-xs text-gray-400 mt-1">
                              Ключевые слова: {post.keywords}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { BlogManagement };
