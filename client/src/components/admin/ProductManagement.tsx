import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProductFormNew } from './ProductFormNew';
import { ProductList } from './ProductList';
import { Product } from '@/types/product';

const ProductManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем товары из API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (productData: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
      toast({
        title: "Товар обновлен",
        description: "Информация о товаре успешно обновлена"
      });
    } else {
      setProducts([...products, productData]);
      toast({
        title: "Товар добавлен",
        description: "Новый товар успешно добавлен в каталог"
      });
    }

    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Товар удален",
      description: "Товар успешно удален из каталога"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление товарами</h2>
          <p className="text-gray-600">Добавляйте, редактируйте и управляйте товарами</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Измените информацию о товаре' : 'Заполните информацию о новом товаре'}
              </DialogDescription>
            </DialogHeader>
            <ProductFormNew 
              product={editingProduct} 
              onSuccess={() => {
                setIsDialogOpen(false);
                setEditingProduct(null);
                // Обновляем список товаров
                const fetchProducts = async () => {
                  try {
                    const response = await fetch('/api/admin/products');
                    if (response.ok) {
                      const data = await response.json();
                      setProducts(data.products || []);
                    }
                  } catch (error) {
                  }
                };
                fetchProducts();
              }}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>Всего товаров: {products.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductList 
            products={filteredProducts}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export { ProductManagement };