
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BasicInfoSection from './blog/BasicInfoSection';
import MediaSection from './blog/MediaSection';
import ContentSection from './blog/ContentSection';
import SEOSection from './blog/SEOSection';
import ProductSelectionSection from './blog/ProductSelectionSection';

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

interface BlogPostFormProps {
  onSubmit: (post: BlogPost) => void;
  onCancel: () => void;
  editingPost?: BlogPost | null;
}

const BlogPostForm = ({ onSubmit, onCancel, editingPost }: BlogPostFormProps) => {
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: editingPost?.title || '',
    excerpt: editingPost?.excerpt || '',
    content: editingPost?.content || '',
    author: editingPost?.author || 'Админ',
    publishDate: editingPost?.publishDate || getCurrentDate(),
    category: editingPost?.category || '',
    imageUrl: editingPost?.imageUrl || '',
    readTime: editingPost?.readTime || 5,
    status: editingPost?.status || 'draft' as 'published' | 'draft',
    recommendedProducts: editingPost?.recommendedProducts || [],
    keywords: editingPost?.keywords || '',
    customUrl: editingPost?.customUrl || '',
    videoUrl: editingPost?.videoUrl || '',
    galleryImages: editingPost?.galleryImages || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Заголовок обязателен';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Содержание статьи обязательно';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Категория обязательна';
    }

    if (!formData.customUrl.trim()) {
      newErrors.customUrl = 'URL адрес статьи обязателен';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Краткое описание обязательно';
    }

    if (!formData.publishDate) {
      newErrors.publishDate = 'Дата публикации обязательна';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Автор обязателен';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    
    const blogPost: BlogPost = {
      id: editingPost?.id || Date.now().toString(),
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      author: formData.author || 'Админ',
      publishDate: formData.publishDate,
      category: formData.category,
      imageUrl: formData.imageUrl,
      views: editingPost?.views || 0,
      readTime: formData.readTime,
      status: formData.status,
      recommendedProducts: formData.recommendedProducts,
      keywords: formData.keywords,
      customUrl: formData.customUrl,
      videoUrl: formData.videoUrl,
      galleryImages: formData.galleryImages
    };

    onSubmit(blogPost);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleProductsChange = (productIds: number[]) => {
    setFormData(prev => ({ ...prev, recommendedProducts: productIds }));
  };

  const handleGalleryChange = (galleryImages: string[]) => {
    setFormData(prev => ({ ...prev, galleryImages }));
  };

  const handleStatusChange = (status: 'published' | 'draft') => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleImageUrlChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BasicInfoSection
        formData={{
          title: formData.title,
          excerpt: formData.excerpt,
          author: formData.author,
          publishDate: formData.publishDate,
          category: formData.category,
          customUrl: formData.customUrl
        }}
        onChange={handleChange}
        errors={errors}
      />

      <MediaSection
        formData={{
          imageUrl: formData.imageUrl,
          videoUrl: formData.videoUrl,
          galleryImages: formData.galleryImages
        }}
        onChange={handleChange}
        onGalleryChange={handleGalleryChange}
        onImageUrlChange={handleImageUrlChange}
      />

      <ContentSection
        content={formData.content}
        onContentChange={handleContentChange}
        errors={errors}
      />

      <SEOSection
        formData={{
          keywords: formData.keywords,
          customUrl: formData.customUrl,
          readTime: formData.readTime,
          status: formData.status
        }}
        onChange={handleChange}
        onStatusChange={handleStatusChange}
      />

      <ProductSelectionSection
        selectedProducts={formData.recommendedProducts}
        onProductsChange={handleProductsChange}
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отменить
        </Button>
        <Button type="submit">
          {editingPost ? 'Сохранить изменения' : 'Создать статью'}
        </Button>
      </div>
    </form>
  );
};

export { BlogPostForm };
