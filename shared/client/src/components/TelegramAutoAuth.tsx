import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';

const TelegramAutoAuth = () => {
  const { setUser } = useAuthStore();
  const { loadCart } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    const attemptAuth = async () => {
      // 1. Проверяем Telegram Web App API
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        await authenticateUser({
          id: user.id,
          first_name: user.first_name,
          username: user.username,
          photo_url: user.photo_url
        });
        return;
      }

      // 2. Проверяем URL параметры (разные форматы)
      const urlParams = new URLSearchParams(window.location.search);
      
      // Логируем все параметры для отладки
      const allParams = Object.fromEntries(urlParams.entries());
      
      // Стандартные параметры
      let tgId = urlParams.get('tgId');
      let tgFirstName = urlParams.get('tgFirstName');
      let tgUsername = urlParams.get('tgUsername');
      
      // Альтернативные параметры от бота
      if (!tgId) tgId = urlParams.get('tg_id');
      if (!tgFirstName) tgFirstName = urlParams.get('first_name');
      if (!tgUsername) tgUsername = urlParams.get('username');

      if (tgId && tgFirstName) {
        await authenticateUser({
          id: parseInt(tgId),
          first_name: tgFirstName,
          username: tgUsername
        });
        return;
      }

      // 3. Проверяем hash параметры (для мобильных приложений)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const hashTgId = hashParams.get('tgId');
        const hashTgFirstName = hashParams.get('tgFirstName');
        const hashTgUsername = hashParams.get('tgUsername');

        if (hashTgId && hashTgFirstName) {
          await authenticateUser({
            id: parseInt(hashTgId),
            first_name: hashTgFirstName,
            username: hashTgUsername
          });
          return;
        }
      }

      // 4. Проверяем localStorage на случай повторного визита
      const savedAuth = localStorage.getItem('telegram_auth_data');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          const authTime = new Date(authData.timestamp);
          const now = new Date();
          const hoursSinceAuth = (now.getTime() - authTime.getTime()) / (1000 * 60 * 60);
          
          // Если авторизация была меньше 24 часов назад
          if (hoursSinceAuth < 24) {
            await authenticateUser(authData.user);
            return;
          } else {
            localStorage.removeItem('telegram_auth_data');
          }
        } catch (error) {
          localStorage.removeItem('telegram_auth_data');
        }
      }

      // 5. Если мы в Telegram Web App, но нет данных пользователя
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
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
          
          // Сохраняем данные для будущих визитов
          localStorage.setItem('telegram_auth_data', JSON.stringify({
            user: telegramData,
            timestamp: new Date().toISOString()
          }));
          
          // Синхронизируем корзину после авторизации
          await loadCart();

          toast({
            title: "Авторизация выполнена",
            description: `Добро пожаловать, ${data.user.name}!`,
          });

          // Очищаем URL от параметров авторизации
          if (window.location.search.includes('tgId') || window.location.hash.includes('tgId')) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } else {
          const errorData = await response.json();
        }
      } catch (error) {
      }
    };

    // Небольшая задержка для загрузки Telegram API
    const timer = setTimeout(attemptAuth, 500);
    
    return () => clearTimeout(timer);
  }, [setUser, toast]);

  return null; // Этот компонент не рендерит ничего
};

export default TelegramAutoAuth;