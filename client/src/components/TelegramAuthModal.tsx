import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelegramAuthModal = ({ isOpen, onClose }: TelegramAuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const { loadCart } = useCartStore();

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    
    try {
      // Проверяем, работаем ли мы в Telegram Web App
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        if (tg.initDataUnsafe?.user) {
          const user = tg.initDataUnsafe.user;
          await authenticateUser({
            id: user.id,
            first_name: user.first_name,
            username: user.username,
            photo_url: user.photo_url
          });
          return;
        }
      }
      
      // Если не в Telegram Web App, открываем бот
      const botUsername = 'Vitawin_bot';
      const webAppUrl = encodeURIComponent(window.location.origin);
      const deepLink = `https://t.me/${botUsername}?start=auth`;
      
      // Определяем устройство
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // На мобильных устройствах открываем напрямую в Telegram
        window.location.href = deepLink;
      } else {
        // На десктопе открываем в новой вкладке
        window.open(deepLink, '_blank');
        
        toast({
          title: "Переход в Telegram",
          description: "Откройте бот в Telegram для завершения авторизации",
        });
        
        // Ждем возвращения пользователя
        const checkAuth = setInterval(() => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('tgId')) {
            clearInterval(checkAuth);
            handleUrlAuth();
          }
        }, 1000);
        
        // Останавливаем проверку через 60 секунд
        setTimeout(() => {
          clearInterval(checkAuth);
          setIsLoading(false);
        }, 60000);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить авторизацию",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const authenticateUser = async (telegramData: any) => {
    try {
      const response = await fetch('/api/auth/telegram-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.user.id.toString(),
          email: data.user.username ? `${data.user.username}@telegram.user` : 'user@telegram.user',
          name: data.user.name,
          username: data.user.username,
          telegramId: data.user.telegramId,
          referralCode: data.user.referralCode,
          role: data.user.role
        });
        
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Синхронизируем корзину после авторизации
        await loadCart();
        
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать в VitaWin!",
        });
        
        onClose();
      } else {
        throw new Error('Ошибка авторизации');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить авторизацию",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlAuth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('tgId');
    const tgFirstName = urlParams.get('tgFirstName');
    const tgUsername = urlParams.get('tgUsername');

    if (tgId && tgFirstName) {
      authenticateUser({
        id: parseInt(tgId),
        first_name: tgFirstName,
        username: tgUsername
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Вход через Telegram
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Войдите через Telegram бот для доступа к VitaWin
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Telegram иконка */}
          <div className="w-16 h-16 bg-[#0088cc] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169.693-1.286 6.55-1.82 8.701-.227.908-.674 1.215-1.107 1.244-.939.084-1.653-.621-2.565-1.218l-3.484-2.278c-1.518-.996-2.23-1.638-2.228-2.625-.001-.629.315-1.18.86-1.566l8.338-6.155c.372-.272.727-.073.727.351-.003.171-.014.34-.03.518zm.185-2.185c-.142-.015-.298-.014-.45-.014-1.032.001-2.064.005-3.096.005-3.095-.001-6.191.005-9.287-.002-.426 0-.766.308-.836.747-.044.276-.046.557-.011.835.031.244.19.47.451.544.163.046.334.061.5.061 4.096-.009 8.192.004 12.288-.004.419-.001.813-.322.891-.762.048-.272.042-.553.008-.823-.033-.258-.189-.485-.458-.587z"/>
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Безопасная авторизация</h3>
            <p className="text-gray-600 text-sm">
              Войдите через Telegram бот для доступа к VitaWin
            </p>
          </div>

          {/* Кнопка авторизации */}
          <Button
            onClick={handleTelegramAuth}
            disabled={isLoading}
            className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white py-3"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Открытие Telegram...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169.693-1.286 6.55-1.82 8.701-.227.908-.674 1.215-1.107 1.244-.939.084-1.653-.621-2.565-1.218l-3.484-2.278c-1.518-.996-2.23-1.638-2.228-2.625-.001-.629.315-1.18.86-1.566l8.338-6.155c.372-.272.727-.073.727.351-.003.171-.014.34-.03.518z"/>
                </svg>
                <span>Войти через Telegram</span>
              </div>
            )}
          </Button>

          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">
              Нажимая кнопку, вы соглашаетесь с условиями использования
            </p>
            <p className="text-xs text-gray-400">
              Ваши данные Telegram используются только для авторизации
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramAuthModal;