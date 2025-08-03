
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Star, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  original_price: string;
  badge: string;
  images: string[];
  category: string;
}

interface ProductSelectorProps {
  selectedProducts: number[];
  onProductsChange: (productIds: number[]) => void;
}

const ProductSelector = ({ selectedProducts, onProductsChange }: ProductSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Загружаем товары из API
  const { data: productsResponse, isLoading } = useQuery<{products: any[], success: boolean}>({
    queryKey: ['/api/products'],
  });

  const products = productsResponse?.products || [];

  const filteredProducts = products.filter((product: any) =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductToggle = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    onProductsChange(selectedProducts.filter(id => id !== productId));
  };

  // Найдем выбранные товары для отображения
  const selectedProductsData = products.filter((product: any) => 
    selectedProducts.includes(product.id)
  );

  if (isLoading) {
    return <div className="text-center py-4">Загрузка товаров...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Выбранные товары */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Выбранные товары ({selectedProducts.length})</h4>
          <div className="space-y-2">
            {selectedProductsData.map((product: any) => (
              <div key={product.id} className="flex items-center space-x-3 p-2 bg-emerald-50 rounded border">
                <img
                  src={product.images?.[0] || product.image || '/placeholder.svg'}
                  alt={product.title || product.name}
                  className="w-10 h-10 object-contain rounded"
                />
                <div className="flex-grow">
                  <span className="font-medium text-sm">{product.title || product.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Поиск товаров */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск товаров..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Список доступных товаров */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Checkbox
                  id={`product-${product.id}`}
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                />
                
                <div className="flex-shrink-0">
                  <img
                    src={product.images?.[0] || product.image || '/placeholder.svg'}
                    alt={product.title || product.name}
                    className="w-16 h-16 object-contain rounded"
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <Label htmlFor={`product-${product.id}`} className="cursor-pointer">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{product.title || product.name}</h4>
                      {product.badge && (
                        <Badge variant="secondary" className="text-xs">{product.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{product.price} ₽</span>
                        {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
                          <span className="text-sm text-gray-500 line-through">{product.original_price} ₽</span>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductSelector;
