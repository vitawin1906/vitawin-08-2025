
import { Edit, Search, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Product } from '@/types/product';

interface ProductListProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductList({ products, searchTerm, onSearchChange, onEdit, onDelete }: ProductListProps) {
  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Поиск товаров..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Товар</TableHead>
            <TableHead>Категория</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Склад</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(products || []).map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <img 
                    src={product.images?.[0] || '/placeholder.svg'} 
                    alt={product.name} 
                    className="h-10 w-10 object-cover rounded" 
                  />
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {typeof product.description === 'string' 
                        ? product.description.substring(0, 50) + '...'
                        : 'No description'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">${product.price}</div>
                  {product.originalPrice > product.price && (
                    <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={product.stock > 50 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                  {product.stock} шт.
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={(product.status === 'active' || !product.status) ? "default" : "secondary"}>
                  {(product.status === 'active' || !product.status) ? 'Активный' : 'Неактивный'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(product.id)}>
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
