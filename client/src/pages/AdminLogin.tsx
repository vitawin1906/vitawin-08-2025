import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const AdminLogin = () => {
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // const loadCaptcha = async () => {
  //   try {
  //     const response = await fetch('/api/admin/captcha');
  //     const data = await response.json();
  //     setCaptchaQuestion(data.question);
  //     setCaptchaId(data.captchaId);
  //     setCaptcha('');
  //     setError('');
  //   } catch (error) {
  //     setError('Ошибка загрузки капчи');
  //   }
  // };

  // useEffect(() => {
  //   loadCaptcha();
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для получения куков
        body: JSON.stringify({
          email,
          password,
          captcha: "0", // Временно передаем любое значение, так как проверка отключена
          captchaId: "test"
        })
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers);
      const responseText = await response.text();
      console.log('Login response text:', responseText);
      console.log('Login response text length:', responseText.length);
      console.log('Login response text includes token:', responseText.includes('token'));
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Login response data parsed:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        data = {};
      }

      if (response.ok && data.success) {
        console.log('Login successful, redirecting to /admin');
        
        // Сохраняем токен в localStorage как резервный способ
        if (data.token) {
          console.log('Saving token to localStorage:', data.token.substring(0, 20) + '...');
          localStorage.setItem('adminToken', data.token);
          console.log('Token saved, checking:', localStorage.getItem('adminToken') ? 'Found' : 'Not found');
        } else {
          console.error('No token in response data:', data);
        }
        
        // Успешный вход - перенаправляем
        setLocation('/admin');
      } else {
        console.error('Login failed:', data);
        setError(data.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <SEOHead 
        title="Вход в админку — Доступ запрещен"
        description="Административная панель VitaWin. Доступ только для авторизованных администраторов."
        keywords=""
        ogTitle="Вход в админку — Доступ запрещен"
        ogDescription="Административная панель VitaWin. Доступ только для авторизованных администраторов."
        ogUrl={`${window.location.origin}/admin/login`}
        ogImage={`${window.location.origin}/vitawin-logo.png`}
        noindex={true}
      />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-emerald-600 rounded-full p-3">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Вход в админку
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              VitaWin - Панель администратора
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите email"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Капча временно отключена 
            <div className="space-y-2">
              <Label htmlFor="captcha">
                Решите пример: {captchaQuestion}
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="captcha"
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Ответ"
                  required
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={loadCaptcha}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            */}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !email || !password}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Только для администраторов
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;