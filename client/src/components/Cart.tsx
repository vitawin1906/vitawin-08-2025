
import { useState } from 'react';
import { useLocation } from 'wouter';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import FreeShippingProgress from '@/components/FreeShippingProgress';
import { getProductImageUrl } from '@/utils/imageUtils';
import { formatPrice } from '@/utils/priceUtils';
import { DELIVERY_CONFIG } from '@/config/checkoutConfig';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart = ({ isOpen, onClose }: CartProps) => {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart, processingItems } = useCartStore();
  const { addBonusCoins } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    onClose();
    setLocation('/checkout');
  };

  // ХАРДКОД НАСТРОЙКИ ДОСТАВКИ
  const freeShippingThreshold = DELIVERY_CONFIG.freeShippingThreshold;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 md:px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Корзина</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <ShoppingBag className="h-12 md:h-16 w-12 md:w-16 text-gray-400 mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Ваша корзина пуста</h3>
                <p className="text-sm md:text-base text-gray-500 mb-6">Начните покупки, чтобы добавить товары в корзину</p>
                <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
                  Продолжить покупки
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Free Shipping Progress */}
                <FreeShippingProgress 
                  currentAmount={getTotalPrice()}
                  freeShippingThreshold={freeShippingThreshold}
                  className="mb-4"
                />
                
                {(items || []).map((item, index) => (
                  <Card key={`${item.id}-${index}`} className="shadow-sm">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <img
                          src={getProductImageUrl(item.image)}
                          alt={item.name}
                          className="h-12 w-12 md:h-16 md:w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500">{formatPrice(item.price)}</p>
                          <p className="text-xs text-emerald-600">
                            Получите {Math.round(item.price * 0.05)} монет
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            disabled={processingItems?.includes?.(item.id) || false}
                            className="h-6 w-6 md:h-8 md:w-8 p-0"
                          >
                            <Minus className="h-2 w-2 md:h-3 md:w-3" />
                          </Button>
                          <span className="text-xs md:text-sm font-medium w-6 md:w-8 text-center">
                            {processingItems?.includes?.(item.id) ? "..." : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                            disabled={processingItems?.includes?.(item.id) || item.quantity >= 99}
                            className="h-6 w-6 md:h-8 md:w-8 p-0"
                          >
                            <Plus className="h-2 w-2 md:h-3 md:w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={processingItems?.includes?.(item.id) || false}
                          className="text-red-500 hover:text-red-700 h-6 w-6 md:h-8 md:w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 px-4 md:px-6 py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Подытог</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className={getTotalPrice() >= freeShippingThreshold ? "font-medium text-emerald-600" : "font-medium"}>
                    {getTotalPrice() >= freeShippingThreshold ? 'Бесплатно' : formatPrice(DELIVERY_CONFIG.standardDeliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Бонусные монеты (5%)</span>
                  <span className="font-medium text-emerald-600">
                    +{Math.round(getTotalPrice() * 0.05)} монет
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm md:text-base font-medium text-gray-900">Итого</span>
                    <span className="text-sm md:text-base font-medium text-gray-900">
                      {formatPrice(getTotalPrice() + (getTotalPrice() >= freeShippingThreshold ? 0 : DELIVERY_CONFIG.standardDeliveryFee))}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm md:text-base py-2 md:py-3"
              >
                Оформить заказ
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
