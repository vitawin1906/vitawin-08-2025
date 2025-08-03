import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAuthStore } from '@/store/simpleAuthStore';
import { useCartStore } from '@/store/cartStore';

interface TelegramSimpleAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelegramSimpleAuth = ({ isOpen, onClose }: TelegramSimpleAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setUser } = useSimpleAuthStore();
  const { loadCart } = useCartStore();

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    console.log('Starting auth process...');
    
    try {
      // Реальная авторизация через API с получением JWT токена
      console.log('Calling auth API...');
      const response = await fetch('/api/auth/telegram-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 131632979, // Eugene Aliev для тестирования
          first_name: "Eugene Aliev",
          username: "alievgeniy"
        })
      });
      
      console.log('Auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth response data:', data);
        
        if (data.success && data.user && data.token) {
          // Форматируем данные пользователя для store
          const formattedUser = {
            id: data.user.id.toString(),
            name: data.user.first_name || data.user.name,
            first_name: data.user.first_name,
            username: data.user.username,
            telegram_id: data.user.telegram_id,
            referral_code: data.user.referral_code,
            balance: parseFloat(data.user.balance || '0'),
            applied_referral_code: data.user.applied_referral_code,
            is_admin: data.user.is_admin
          };
          
          console.log('Setting user:', formattedUser);
          
          setUser(formattedUser);
          
          // Сохраняем РЕАЛЬНЫЙ JWT токен
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(formattedUser));
          
          console.log('User and real JWT token set successfully');
          
          toast({
            title: "Успешно!",
            description: `Добро пожаловать, ${formattedUser.first_name}! Баланс: ${formattedUser.balance}₽`,
          });
          
          setIsLoading(false);
          
          // Закрываем модальное окно через небольшую задержку
          setTimeout(() => {
            console.log('Closing modal after auth success');
            onClose();
          }, 1000);
          return;
        }
      }
      
      // Если не удалось - показываем ошибку
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось авторизоваться",
        variant: "destructive"
      });

    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: `Произошла ошибка при авторизации: ${error}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        console.log('Dialog closing, calling onClose');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Вход через Telegram
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Войдите через бот @vitawin_bot для доступа к VitaWin
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Telegram иконка */}
          <div className="w-16 h-16 bg-[#0088cc] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169.693-1.286 6.55-1.82 8.701-.227.908-.674 1.215-1.107 1.244-.939.084-1.653-.621-2.565-1.218l-3.484-2.278c-1.518-.996-2.23-1.638-2.228-2.625-.001-.629.315-1.18.86-1.566l8.338-6.155c.372-.272.727-.073.727.351-.003.171-.014.34-.03.518z"/>
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Тестовая авторизация</h3>
            <p className="text-gray-600 text-sm">
              Нажмите кнопку для мгновенного входа как Eugene Aliev
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
                <span>Открытие...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.169.693-1.286 6.55-1.82 8.701-.227.908-.674 1.215-1.107 1.244-.939.084-1.653-.621-2.565-1.218l-3.484-2.278c-1.518-.996-2.23-1.638-2.228-2.625-.001-.629.315-1.18.86-1.566l8.338-6.155c.372-.272.727-.073.727.351-.003.171-.014.34-.03.518z"/>
                </svg>
                <span>Открыть @vitawin_bot</span>
              </div>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 font-medium">
              Как войти:
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>1. Нажмите кнопку выше</p>
              <p>2. Откроется бот @vitawin_bot</p>
              <p>3. Нажмите /start в боте</p>
              <p>4. Вернитесь на сайт и обновите страницу</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramSimpleAuth;