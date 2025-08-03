import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export const useAuthSync = () => {
  const { user, setUser } = useAuthStore();
  const loadCart = useCartStore(state => state.loadCart);

  useEffect(() => {
    // Проверяем все возможные места сохранения данных пользователя
    const checkAuthStatus = () => {
      // Сначала проверяем новый формат
      let userData = localStorage.getItem('vitawin_user');
      let authStatus = localStorage.getItem('vitawin_auth');
      
      // Если не найдено, проверяем старый формат
      if (!userData) {
        userData = localStorage.getItem('user');
        authStatus = localStorage.getItem('auth_token');
      }
      
      if (userData && authStatus && !user) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('useAuthSync: Restoring user from localStorage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          // Очищаем все возможные ключи
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('vitawin_user');
          localStorage.removeItem('vitawin_auth');
        }
      }
    };

    // Проверяем только один раз при загрузке
    checkAuthStatus();
  }, [setUser]);

  // Загружаем корзину при изменении пользователя
  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user, loadCart]);
};