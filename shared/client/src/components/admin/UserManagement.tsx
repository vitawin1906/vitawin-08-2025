
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Ban, CheckCircle, Users, UserPlus, Phone } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  username?: string;
  telegram_id: number;
  phone?: string;
  referral_code: string;
  is_admin: boolean;
  balance: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
  last_login: string;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Загружаем пользователей из базы данных
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const users: User[] = (usersData as any)?.users || [];

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const totalCustomers = users.filter(u => !u.is_admin).length;
  const activeUsers = users.length; // Все пользователи считаются активными
  const totalRevenue = users.reduce((sum, u) => sum + (u.total_spent || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Управление пользователями</h2>
            <p className="text-gray-600">Загрузка пользователей...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление пользователями</h2>
          <p className="text-gray-600">Просматривайте и управляйте пользователями системы</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Клиенты</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активные</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общая выручка</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} ₽</p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>Все зарегистрированные пользователи</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Заказы</TableHead>
                <TableHead>Потрачено</TableHead>
                <TableHead>Последний вход</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.first_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.first_name}</div>
                        <div className="text-sm text-gray-500">ID: {user.telegram_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.phone && (
                        <div className="text-sm text-gray-600">{user.phone}</div>
                      )}
                      {user.username && (
                        <div className="text-sm text-blue-600">@{user.username}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                      {user.is_admin ? 'Администратор' : 'Клиент'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      Активный
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.orders_count || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{(user.total_spent || 0).toFixed(2)} ₽</span>
                  </TableCell>
                  <TableCell>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('ru-RU') : 'Никогда'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <div className="flex items-center">
                          <span className="text-blue-500 mr-1">📱</span>
                          Telegram
                        </div>
                      </Button>
                      {!user.is_admin && (
                        <Button size="sm" variant="outline">
                          <Ban className="h-3 w-3 mr-1" />
                          Заблокировать
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export { UserManagement };
