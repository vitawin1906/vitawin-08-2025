
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description?: string;
  long_description?: string;
  price: number;
  original_price?: number;
  category: string;
  images?: string[];
  badge?: string;
  benefits?: string[];
  rating?: number;
  reviews?: number;
  stock: number;
  status: 'active' | 'inactive';
  sku?: string;
  composition?: any;
  usage?: string;
  additional_info?: string;
  custom_url?: string;
  capsule_count?: number;
  capsule_volume?: string;
  servings_per_container?: number;
  manufacturer?: string;
  country_of_origin?: string;
  expiration_date?: string;
  storage_conditions?: string;
  how_to_take?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductsQueryParams {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Получение списка товаров
export const useProducts = (params: ProductsQueryParams = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/products?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.products as Product[];
    },
  });
};

// Получение одного товара
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return await response.json() as Product;
    },
    enabled: !!id,
  });
};

// Создание товара
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return await response.json() as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Товар создан",
        description: "Новый товар успешно добавлен в каталог",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать товар: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Обновление товара
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return await response.json() as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast({
        title: "Товар обновлен",
        description: "Информация о товаре успешно обновлена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить товар: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Удаление товара
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Товар удален",
        description: "Товар успешно удален из каталога",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить товар: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Загрузка изображения товара
export const useUploadProductImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, productId }: { file: File; productId?: string }) => {
      const formData = new FormData();
      formData.append('image', file); // Меняем 'file' на 'image' для соответствия серверу
      if (productId) {
        formData.append('productId', productId);
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Изображение загружено",
        description: "Изображение товара успешно загружено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось загрузить изображение: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Получение категорий
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Возвращаем базовые категории
      return [
        { name: 'Добавки', count: 0 },
        { name: 'Витамины', count: 0 },
        { name: 'Протеины', count: 0 },
        { name: 'Здоровье', count: 0 }
      ];
    },
  });
};
