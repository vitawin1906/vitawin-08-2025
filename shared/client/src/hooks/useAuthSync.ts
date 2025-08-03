import { useEffect } from 'react';
import { useSimpleAuthStore } from '@/store/simpleAuthStore';
import { useCartStore } from '@/store/cartStore';

export const useAuthSync = () => {
  const { user, setUser } = useSimpleAuthStore();
  const loadCart = useCartStore(state => state.loadCart);

  useEffect(() => {
    // Простая проверка localStorage только при загрузке
    const checkAuthStatus = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData && !user) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('useAuthSync: Restoring user from localStorage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
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