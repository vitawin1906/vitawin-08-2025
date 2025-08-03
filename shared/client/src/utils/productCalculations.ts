import { useQuery } from "@tanstack/react-query";

// Интерфейс для настроек реферальной программы
interface ReferralSettings {
  level1_commission: string;
  level2_commission: string;
  level3_commission: string;
  bonus_coins_percentage: string;
  cashback_percentage?: string;
}

// Хук для получения настроек реферальной программы
export const useReferralSettings = () => {
  return useQuery({
    queryKey: ["/api/referral-settings"],
    staleTime: 5 * 60 * 1000, // 5 минут кеширования
  });
};

// Утилиты для расчетов
export class ProductCalculations {
  private static settings: ReferralSettings | null = null;

  // Установить настройки
  static setSettings(settings: ReferralSettings) {
    this.settings = settings;
  }

  // Получить настройки с fallback значениями
  private static getSettings(): ReferralSettings {
    return this.settings || {
      level1_commission: "20",
      level2_commission: "5", 
      level3_commission: "1",
      bonus_coins_percentage: "5",
      cashback_percentage: "2"
    };
  }

  // Расчет скидки в процентах
  static calculateDiscountPercentage(originalPrice: number | string, currentPrice: number | string): number {
    const original = Number(originalPrice);
    const current = Number(currentPrice);
    
    if (!original || !current || original <= current) return 0;
    
    return Math.round(((original - current) / original) * 100);
  }

  // Расчет бонусных монет
  static calculateBonusCoins(price: number | string): number {
    const settings = ProductCalculations.getSettings();
    const priceNum = Number(price);
    const percentage = Number(settings.bonus_coins_percentage) / 100;
    
    return Math.round(priceNum * percentage);
  }

  // Расчет кэшбека
  static calculateCashback(price: number | string): number {
    const settings = ProductCalculations.getSettings();
    const priceNum = Number(price);
    const percentage = Number(settings.cashback_percentage || "2") / 100;
    
    return Math.round(priceNum * percentage);
  }

  // Расчет реферальной комиссии по уровню
  static calculateReferralCommission(price: number | string, level: 1 | 2 | 3): number {
    const settings = ProductCalculations.getSettings();
    const priceNum = Number(price);
    
    let percentage: number;
    switch (level) {
      case 1:
        percentage = Number(settings.level1_commission) / 100;
        break;
      case 2:
        percentage = Number(settings.level2_commission) / 100;
        break;
      case 3:
        percentage = Number(settings.level3_commission) / 100;
        break;
    }
    
    return Math.round(priceNum * percentage);
  }

  // Форматирование цены
  static formatPrice(price: number | string, currency: string = "₽"): string {
    const priceNum = Number(price);
    return `${priceNum.toLocaleString('ru-RU')} ${currency}`;
  }

  // Расчет экономии при скидке
  static calculateSavings(originalPrice: number | string, currentPrice: number | string): number {
    const original = Number(originalPrice);
    const current = Number(currentPrice);
    
    return Math.max(0, original - current);
  }

  // Проверка наличия скидки
  static hasDiscount(originalPrice: number | string, currentPrice: number | string): boolean {
    return Number(originalPrice) > Number(currentPrice);
  }

  // Получение всех расчетов для продукта
  static getProductCalculations(product: {
    price: number | string;
    original_price?: number | string;
  }) {
    const price = Number(product.price);
    const originalPrice = Number(product.original_price || product.price);

    return {
      price,
      originalPrice,
      formattedPrice: this.formatPrice(price),
      formattedOriginalPrice: this.formatPrice(originalPrice),
      discountPercentage: this.calculateDiscountPercentage(originalPrice, price),
      savings: this.calculateSavings(originalPrice, price),
      bonusCoins: this.calculateBonusCoins(price),
      cashback: this.calculateCashback(price),
      hasDiscount: this.hasDiscount(originalPrice, price),
      referralCommissions: {
        level1: this.calculateReferralCommission(price, 1),
        level2: this.calculateReferralCommission(price, 2),
        level3: this.calculateReferralCommission(price, 3),
      }
    };
  }
}

// React хук для получения расчетов продукта
export const useProductCalculations = (product: {
  price: number | string;
  original_price?: number | string;
}) => {
  const { data: settingsResponse } = useReferralSettings();
  
  // Обновляем настройки когда они загрузятся
  if (settingsResponse?.settings) {
    ProductCalculations.setSettings(settingsResponse.settings);
  }
  
  return ProductCalculations.getProductCalculations(product);
};

// Экспорт для обратной совместимости
export const calculateDiscountPercentage = ProductCalculations.calculateDiscountPercentage;
export const calculateBonusCoins = ProductCalculations.calculateBonusCoins;
export const calculateCashback = ProductCalculations.calculateCashback;
export const formatPrice = ProductCalculations.formatPrice;