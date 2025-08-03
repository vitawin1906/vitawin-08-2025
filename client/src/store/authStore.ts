
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface ReferralEarning {
  id: string;
  userId: string;
  level: number;
  amount: number;
  orderId: string;
  date: string;
}

interface AuthStore {
  user: User | null;
  bonusCoins: number;
  totalEarnings: number;
  referralEarnings: ReferralEarning[];
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
  login: (user: any, token: string) => void;
  logout: () => void;
  addBonusCoins: (coins: number) => void;
  addReferralEarning: (earning: Omit<ReferralEarning, 'id' | 'date'>) => void;
  getReferralStats: () => {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalEarnings: number;
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      bonusCoins: 0,
      totalEarnings: 0,
      referralEarnings: [],
      
      setUser: (user) => {
        console.log('AuthStore: Setting user:', user);
        
        // Сохраняем пользователя в localStorage для persistence
        if (user) {
          localStorage.setItem('vitawin_user', JSON.stringify(user));
          localStorage.setItem('vitawin_auth', 'true');
          // Также сохраняем в старом формате для совместимости
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('auth_token', 'demo_token_' + user.id);
        } else {
          // Очищаем все ключи
          localStorage.removeItem('vitawin_user');
          localStorage.removeItem('vitawin_auth');
          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');
        }
        set({ user });
        console.log('AuthStore: User set successfully, localStorage updated');
      },
      
      updateUser: (user) => {
        set({ user });
      },
      
      login: (user, token) => {
        // Конвертируем данные пользователя из API в формат нашего интерфейса
        const formattedUser: User = {
          id: user.id.toString(),
          email: user.email || '',
          name: user.first_name || user.name || '',
          surname: user.last_name || '',
          phone: user.phone || '',
          telegram: user.username || '',
          username: user.username || '',
          telegramId: user.telegramId || null,
          referralCode: user.referralCode || user.referral_code || ''
        };
        
        set({ user: formattedUser });
        
        // Сохраняем токен и пользователя в localStorage для синхронизации между вкладками
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        localStorage.setItem('user', JSON.stringify(formattedUser));
        
        // Загружаем корзину пользователя после авторизации
        const { loadCart } = require('./cartStore').useCartStore.getState();
      },
      
      logout: () => {
        set({ 
          user: null, 
          bonusCoins: 0, 
          totalEarnings: 0, 
          referralEarnings: [] 
        });
        // Очищаем данные авторизации для синхронизации между вкладками
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      },
      
      addBonusCoins: (coins) => {
        set((state) => ({
          bonusCoins: state.bonusCoins + coins
        }));
      },
      
      addReferralEarning: (earning) => {
        const newEarning: ReferralEarning = {
          ...earning,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString()
        };
        
        set((state) => ({
          referralEarnings: [...state.referralEarnings, newEarning],
          totalEarnings: state.totalEarnings + earning.amount
        }));
      },
      
      getReferralStats: () => {
        const state = get();
        const earnings = state.referralEarnings;
        return {
          level1Count: earnings.filter(e => e.level === 1).length,
          level2Count: earnings.filter(e => e.level === 2).length,
          level3Count: earnings.filter(e => e.level === 3).length,
          totalEarnings: state.totalEarnings
        };
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
