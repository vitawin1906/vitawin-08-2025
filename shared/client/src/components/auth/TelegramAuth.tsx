import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthProps {
  onSuccess: (user: TelegramUser) => void;
  onError?: (error: string) => void;
}

// Расширяем интерфейс Window для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export const TelegramAuth = ({ onSuccess, onError }: TelegramAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Загружаем Telegram Web App скрипт
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    
    script.onload = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        
        // Если пользователь уже авторизован через WebApp
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        if (user) {
          handleTelegramAuth(user);
        }
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleTelegramAuth = async (user: TelegramUser) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          auth_date: user.auth_date,
          hash: user.hash,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Сохраняем токен в localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: "Успешный вход",
          description: `Добро пожаловать, ${user.first_name}!`,
        });
        
        onSuccess(user);
      } else {
        const errorMessage = data.message || 'Ошибка авторизации';
        toast({
          title: "Ошибка входа",
          description: errorMessage,
          variant: "destructive",
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Не удалось подключиться к серверу';
      toast({
        title: "Ошибка подключения",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openTelegramBot = () => {
    // Генерируем уникальный идентификатор сессии
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Сохраняем в localStorage для последующей проверки
    localStorage.setItem('telegram_auth_session', sessionId);
    
    // Открываем бот с параметром для авторизации
    const deepLink = `https://t.me/vitawin_bot?start=auth_${sessionId}`;
    
    toast({
      title: "Открытие Telegram",
      description: "Переходим к боту для авторизации...",
    });
    
    // Открываем в той же вкладке для лучшего UX
    window.location.href = deepLink;
  };

  return (
    <div className="flex flex-col space-y-4">
      <Button
        onClick={openTelegramBot}
        disabled={isLoading}
        className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Вход через Telegram...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169.693-1.286 6.55-1.82 8.701-.227.908-.674 1.215-1.107 1.244-.939.084-1.653-.621-2.565-1.218l-3.484-2.278c-1.518-.996-2.23-1.638-2.228-2.625-.001-.629.315-1.18.86-1.566l8.338-6.155c.372-.272.727-.073.727.351-.003.171-.014.34-.03.518zm.185-2.185c-.142-.015-.298-.014-.45-.014-1.032.001-2.064.005-3.096.005-3.095-.001-6.191.005-9.287-.002-.426 0-.766.308-.836.747-.044.276-.046.557-.011.835.031.244.19.47.451.544.163.046.334.061.5.061 4.096-.009 8.192.004 12.288-.004.419-.001.813-.322.891-.762.048-.272.042-.553.008-.823-.033-.258-.189-.485-.458-.587z"/>
            </svg>
            <span>Войти через Telegram</span>
          </div>
        )}
      </Button>
      
      <p className="text-sm text-gray-500 text-center">
        Безопасная авторизация через Telegram бот
      </p>
    </div>
  );
};