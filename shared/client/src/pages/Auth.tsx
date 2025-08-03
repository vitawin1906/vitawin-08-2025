import { useEffect, useState } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useSimpleAuthStore } from '@/store/simpleAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [, setLocation] = useLocation();
  const { setUser } = useSimpleAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Токен авторизации не найден в URL');
      return;
    }

    // Авторизуемся с полученным токеном
    authenticateWithToken(token);
  }, []);

  const authenticateWithToken = async (token: string) => {
    try {
      console.log('Авторизация с токеном:', token.substring(0, 20) + '...');

      // Проверяем токен и получаем данные пользователя
      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Данные пользователя получены:', userData);

        const formattedUser = {
          id: userData.id.toString(),
          name: userData.first_name || userData.name,
          first_name: userData.first_name,
          username: userData.username,
          telegram_id: userData.telegram_id,
          referral_code: userData.referral_code,
          balance: parseFloat(userData.balance || '0'),
          applied_referral_code: userData.applied_referral_code,
          is_admin: userData.is_admin
        };

        // Сохраняем пользователя и токен
        setUser(formattedUser);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(formattedUser));

        setStatus('success');
        
        toast({
          title: "Успешная авторизация!",
          description: `Добро пожаловать, ${formattedUser.first_name}!`,
        });

        // Перенаправляем в личный кабинет через 2 секунды
        setTimeout(() => {
          setLocation('/account');
        }, 2000);

      } else {
        const errorData = await response.json();
        setStatus('error');
        setErrorMessage(errorData.message || 'Неверный токен авторизации');
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      setStatus('error');
      setErrorMessage('Ошибка соединения с сервером');
    }
  };

  const handleRetry = () => {
    setLocation('/');
  };

  const handleGoToTelegram = () => {
    window.open('https://t.me/vitawin_bot?start=auth', '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Авторизация
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Проверяем ваш токен авторизации...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Успешно!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Вы успешно авторизованы в VitaWin!
            </p>
            <p className="text-sm text-gray-500">
              Перенаправляем вас в личный кабинет...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <XCircle className="h-6 w-6" />
            Ошибка авторизации
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {errorMessage}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={handleGoToTelegram}
              className="w-full"
              variant="default"
            >
              🤖 Получить новый токен в боте
            </Button>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="w-full"
            >
              🏠 Вернуться на главную
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;