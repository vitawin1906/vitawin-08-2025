
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  productCount: number;
  status: 'active' | 'inactive';
  parentId?: number;
}

const CategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "Здоровье сердца", description: "Добавки для поддержки сердечно-сосудистой системы", slug: "heart-health", productCount: 12, status: 'active' },
    { id: 2, name: "Поддержка иммунитета", description: "Витамины и добавки для укрепления иммунной системы", slug: "immune-support", productCount: 8, status: 'active' },
    { id: 3, name: "Фитнес", description: "Спортивное питание и добавки для тренировок", slug: "fitness", productCount: 15, status: 'active' },
    { id: 4, name: "Общее здоровье", description: "Мультивитамины и общеукрепляющие добавки", slug: "general-health", productCount: 6, status: 'active' },
    { id: 5, name: "Здоровье пищеварения", description: "Пробиотики и добавки для пищеварительной системы", slug: "digestive-health", productCount: 4, status: 'active' },
    { id: 6, name: "Сон и расслабление", description: "Добавки для улучшения сна и снятия стресса", slug: "sleep-relaxation", productCount: 3, status: 'active' }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      slug: ''
    }
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[а-я]/g, (char) => {
        const map: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onSubmit = (data: any) => {
    const categoryData = {
      ...data,
      id: editingCategory ? editingCategory.id : Date.now(),
      slug: data.slug || generateSlug(data.name),
      productCount: editingCategory ? editingCategory.productCount : 0,
      status: 'active' as const
    };

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? categoryData : c));
      toast({
        title: "Категория обновлена",
        description: "Информация о категории успешно обновлена"
      });
    } else {
      setCategories([...categories, categoryData]);
      toast({
        title: "Категория добавлена",
        description: "Новая категория успешно добавлена"
      });
    }

    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description,
      slug: category.slug
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const category = categories.find(c => c.id === id);
    if (category && category.productCount > 0) {
      toast({
        title: "Невозможно удалить",
        description: "В категории есть товары. Сначала удалите или переместите все товары.",
        variant: "destructive"
      });
      return;
    }

    setCategories(categories.filter(c => c.id !== id));
    toast({
      title: "Категория удалена",
      description: "Категория успешно удалена"
    });
  };

  const toggleStatus = (id: number) => {
    setCategories(categories.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
        : c
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление категориями</h2>
          <p className="text-gray-600">Создавайте и управляйте категориями товаров</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCategory(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить категорию
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Измените информацию о категории' : 'Заполните информацию о новой категории'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название категории</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название категории" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Введите описание категории" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL-адрес (slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="автоматически сгенерируется" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Обновить' : 'Добавить'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Список категорий</CardTitle>
            <CardDescription>Всего категорий: {categories.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Товары</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.description}</div>
                          <div className="text-xs text-gray-400">/{category.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.productCount} товаров</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(category.id)}
                      >
                        <Badge variant={category.status === 'active' ? "default" : "secondary"}>
                          {category.status === 'active' ? 'Активная' : 'Неактивная'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(category.id)}
                          disabled={category.productCount > 0}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика категорий</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Активные категории</span>
                <span className="font-medium">{categories.filter(c => c.status === 'active').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Неактивные категории</span>
                <span className="font-medium">{categories.filter(c => c.status === 'inactive').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Общее количество товаров</span>
                <span className="font-medium">{categories.reduce((sum, c) => sum + c.productCount, 0)}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Топ категории по товарам:</h4>
              <div className="space-y-2">
                {categories
                  .sort((a, b) => b.productCount - a.productCount)
                  .slice(0, 3)
                  .map((category) => (
                    <div key={category.id} className="flex justify-between text-sm">
                      <span className="truncate">{category.name}</span>
                      <span className="font-medium">{category.productCount}</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { CategoryManagement };
