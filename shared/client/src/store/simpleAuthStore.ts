import { create } from 'zustand';

interface User {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  surname?: string;
  phone?: string;
  telegram?: string;
  username?: string;
  telegram_id?: number;
  telegramId?: number;
  referralCode?: string;
  referral_code?: string;
  referredBy?: string;
  applied_referral_code?: string;
  role?: string;
  balance?: number;
  is_admin?: boolean;
}

interface SimpleAuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useSimpleAuthStore = create<SimpleAuthStore>((set, get) => ({
  user: null,
  
  setUser: (user) => {
    console.log('SimpleAuth: Setting user:', user);
    
    // Проверяем, не вызывается ли это в бесконечном цикле
    const currentUser = get().user;
    if (currentUser && user && currentUser.id === user.id) {
      console.log('SimpleAuth: User already set, skipping');
      return;
    }
    
    set({ user });
    
    // Сохраняем в localStorage
    if (user) {
      localStorage.setItem('vitawin_user', JSON.stringify(user));
      localStorage.setItem('vitawin_auth', 'true');
    } else {
      localStorage.removeItem('vitawin_user');
      localStorage.removeItem('vitawin_auth');
    }
    
    console.log('SimpleAuth: User set successfully');
  },
  
  logout: () => {
    console.log('SimpleAuth: Logging out');
    console.trace('Logout called from:'); // Покажет стек вызовов
    
    // Добавляем защиту от случайных вызовов
    const stack = new Error().stack;
    console.log('Full stack trace:', stack);
    
    set({ user: null });
    localStorage.removeItem('vitawin_user');
    localStorage.removeItem('vitawin_auth');
  },
  
  initializeAuth: () => {
    const savedUser = localStorage.getItem('vitawin_user');
    const isAuth = localStorage.getItem('vitawin_auth');
    
    if (savedUser && isAuth === 'true') {
      try {
        const user = JSON.parse(savedUser);
        console.log('SimpleAuth: Restored user from localStorage:', user);
        set({ user });
      } catch (error) {
        console.error('SimpleAuth: Error parsing saved user:', error);
        localStorage.removeItem('vitawin_user');
        localStorage.removeItem('vitawin_auth');
      }
    }
  }
}));