import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSimpleAuthStore } from './simpleAuthStore';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  processingItems: number[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// Кеш для предотвращения множественных запросов
const requestCache = new Map<string, Promise<any>>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5050; // 5 секунд

// Функции для работы с API с кешированием
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const now = Date.now();
  
  // Проверяем кеш только для GET запросов
  if (!options.method || options.method === 'GET') {
    const cachedExpiry = cacheExpiry.get(cacheKey);
    if (cachedExpiry && now < cachedExpiry) {
      const cachedRequest = requestCache.get(cacheKey);
      if (cachedRequest) {
        return cachedRequest;
      }
    }
  }

  // Создаем новый запрос
  const request = fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }).then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });

  // Кешируем только GET запросы
  if (!options.method || options.method === 'GET') {
    requestCache.set(cacheKey, request);
    cacheExpiry.set(cacheKey, now + CACHE_DURATION);
    
    // Очищаем кеш после истечения времени
    setTimeout(() => {
      requestCache.delete(cacheKey);
      cacheExpiry.delete(cacheKey);
    }, CACHE_DURATION);
  }

  return request;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      processingItems: [],
      
      loadCart: async () => {
        try {
          set({ isLoading: true });
          const response = await apiRequest('/api/cart');
          
          if (response.success && response.cart) {
            // Handle the correct API response format
            const cartItems = response.cart.items || [];
            const formattedItems = cartItems.map((item: any) => ({
              id: item.product?.id || item.product_id,
              name: item.product?.title || item.name,
              price: parseFloat(item.product?.price || item.price || '0'),
              image: item.product?.image || item.image,
              quantity: item.quantity
            }));
            set({ items: formattedItems });
          } else {
            // For unauthenticated users, keep local cart
            set({ items: [] });
          }
        } catch (error) {
          console.warn('Failed to load cart from server:', error);
          // Don't clear local cart on error
        } finally {
          set({ isLoading: false });
        }
      },
      
      addItem: async (newItem) => {
        const existingItem = get().items.find(item => item.id === newItem.id);
        
        if (existingItem) {
          get().updateQuantity(newItem.id, existingItem.quantity + (newItem.quantity || 1));
          return;
        }
        
        const itemToAdd = {
          ...newItem,
          quantity: newItem.quantity || 1
        };
        
        // Добавляем локально
        set({
          items: [...get().items, itemToAdd]
        });

        // Синхронизируем с сервером
        const user = useSimpleAuthStore.getState().user;
        if (user) {
          try {
            await apiRequest('/api/cart', {
              method: 'POST',
              body: JSON.stringify({
                action: 'add',
                product_id: newItem.id,
                quantity: newItem.quantity || 1
              })
            });
          } catch (error) {
            console.warn('Failed to sync cart addition with server:', error);
          }
        }
      },
      
      updateQuantity: async (id, quantity) => {
        const user = useSimpleAuthStore.getState().user;
        
        // Validate quantity
        if (quantity < 0) return;
        if (quantity === 0) {
          get().removeItem(id);
          return;
        }
        if (quantity > 99) {
          console.warn('Maximum quantity is 99');
          quantity = 99;
        }
        
        // Add to processing state
        set(state => ({
          processingItems: [...state.processingItems.filter(item => item !== id), id]
        }));
        
        // Обновляем локально
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        });

        // Синхронизируем с сервером
        if (user) {
          try {
            await apiRequest('/api/cart', {
              method: 'POST',
              body: JSON.stringify({
                action: 'update',
                product_id: id,
                quantity
              })
            });
          } catch (error) {
            console.warn('Failed to sync quantity update with server:', error);
          }
        }
        
        // Remove from processing state
        set(state => ({
          processingItems: state.processingItems.filter(item => item !== id)
        }));
      },
      
      removeItem: async (id) => {
        // Add to processing state
        set(state => ({
          processingItems: [...state.processingItems.filter(item => item !== id), id]
        }));
        
        // Удаляем локально
        set({
          items: get().items.filter(item => item.id !== id)
        });

        // Синхронизируем с сервером используя POST с action "remove"
        try {
          await apiRequest('/api/cart', {
            method: 'POST',
            body: JSON.stringify({
              action: 'remove',
              product_id: id
            })
          });
        } catch (error) {
          console.warn('Failed to sync cart removal with server:', error);
        }
        
        // Remove from processing state
        set(state => ({
          processingItems: state.processingItems.filter(item => item !== id)
        }));
      },
      
      clearCart: async () => {
        const user = useSimpleAuthStore.getState().user;
        
        // Clear locally
        set({ items: [] });

        // Sync with server
        try {
          set({ isLoading: true });
          
          if (user) {
            const response = await apiRequest('/api/cart', {
              method: 'DELETE'
            });
            
            if (response.success && response.cart) {
              const cartItems = response.cart.items || [];
              const formattedItems = cartItems.map((item: any) => ({
                id: item.product?.id || item.product_id,
                name: item.product?.title || item.name,
                price: parseFloat(item.product?.price || item.price || '0'),
                image: item.product?.image || item.image,
                quantity: item.quantity
              }));
              
              set({ items: formattedItems });
            }
          }
        } catch (error) {
          console.warn('Failed to sync cart clear with server:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.processingItems = [];
          state.isLoading = false;
        }
      }
    }
  )
);