import axios from 'axios';

// ХАРДКОД НАСТРОЙКИ ДОСТАВКИ - импорт конфигурации
const HARDCODED_DELIVERY_CONFIG = {
  freeShippingThreshold: 5050,
  standardDeliveryFee: 300,
  expressDeliveryFee: 500,
  pickupFee: 0,
  postFee: 400,
};

// Интерфейсы для работы с доставкой
export interface DeliveryCalculation {
  from_location: {
    city: string;
    postal_code?: string;
  };
  to_location: {
    city: string;
    postal_code?: string;
    address?: string;
  };
  packages: {
    weight: number; // граммы
    length: number; // см
    width: number;  // см
    height: number; // см
  }[];
}

export interface DeliveryOption {
  service: 'cdek' | 'russianpost' | 'yandex';
  name: string;
  cost: number;
  min_days: number;
  max_days: number;
  delivery_type: 'pickup' | 'courier';
  description?: string;
}

// СДЭК API
class CDEKService {
  private baseUrl = 'https://api.cdek.ru/v2';
  private account = process.env.CDEK_API_ACCOUNT;
  private secret = process.env.CDEK_API_SECRET;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.account,
        client_secret: this.secret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
      return this.token;
    } catch (error) {
      console.error('CDEK token error:', error);
      throw new Error('Ошибка авторизации СДЭК');
    }
  }

  async calculateDelivery(data: DeliveryCalculation): Promise<DeliveryOption[]> {
    try {
      const token = await this.getToken();
      
      const calculationData = {
        from_location: {
          city: data.from_location.city
        },
        to_location: {
          city: data.to_location.city
        },
        packages: data.packages,
        tariff_code: [136, 137, 138] // Основные тарифы СДЭК
      };

      const response = await axios.post(`${this.baseUrl}/calculator/tariff`, calculationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.tariffs?.map((tariff: any) => ({
        service: 'cdek' as const,
        name: `СДЭК ${tariff.tariff_name}`,
        cost: Math.round(tariff.delivery_sum),
        min_days: tariff.period_min,
        max_days: tariff.period_max,
        delivery_type: tariff.tariff_code === 136 ? 'pickup' : 'courier',
        description: tariff.tariff_description
      })) || [];
    } catch (error) {
      console.error('CDEK calculation error:', error);
      return [{
        service: 'cdek',
        name: 'СДЭК',
        cost: 300,
        min_days: 2,
        max_days: 5,
        delivery_type: 'pickup'
      }];
    }
  }
}

// Почта России API
class RussianPostService {
  private baseUrl = 'https://otpravka-api.pochta.ru';
  private apiKey = process.env.RUSSIANPOST_API_KEY;

  async calculateDelivery(data: DeliveryCalculation): Promise<DeliveryOption[]> {
    try {
      const calculationData = {
        'index-from': data.from_location.postal_code || '101000',
        'index-to': data.to_location.postal_code || '190000',
        'mass': data.packages[0]?.weight || 500,
        'mail-type': 'POSTAL_PARCEL',
        'mail-category': 'ORDINARY'
      };

      const response = await axios.get(`${this.baseUrl}/1.0/tariff`, {
        params: calculationData,
        headers: {
          'Authorization': `AccessToken ${this.apiKey}`,
          'X-User-Authorization': `AccessToken ${this.apiKey}`
        }
      });

      return [{
        service: 'russianpost',
        name: 'Почта России',
        cost: Math.round(response.data.paynds / 100), // коп в рубли
        min_days: 3,
        max_days: 7,
        delivery_type: 'pickup',
        description: 'Доставка почтой России'
      }];
    } catch (error) {
      console.error('Russian Post calculation error:', error);
      return [{
        service: 'russianpost',
        name: 'Почта России',
        cost: 200,
        min_days: 3,
        max_days: 7,
        delivery_type: 'pickup'
      }];
    }
  }
}

// Яндекс Доставка API
class YandexDeliveryService {
  private baseUrl = 'https://api.delivery.yandex.ru';
  private apiKey = process.env.YANDEX_DELIVERY_API_KEY;

  async calculateDelivery(data: DeliveryCalculation): Promise<DeliveryOption[]> {
    try {
      const calculationData = {
        from: {
          location: data.from_location.city
        },
        to: {
          location: data.to_location.city
        },
        packages: data.packages.map(pkg => ({
          weight: pkg.weight / 1000, // граммы в кг
          dimensions: {
            length: pkg.length,
            width: pkg.width,
            height: pkg.height
          }
        }))
      };

      const response = await axios.post(`${this.baseUrl}/v1/delivery-options`, calculationData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.options?.map((option: any) => ({
        service: 'yandex' as const,
        name: `Яндекс ${option.type === 'pickup' ? 'ПВЗ' : 'Курьер'}`,
        cost: Math.round(option.cost.total),
        min_days: 1,
        max_days: 3,
        delivery_type: option.type,
        description: option.description
      })) || [];
    } catch (error) {
      console.error('Yandex delivery calculation error:', error);
      return [
        {
          service: 'yandex',
          name: 'Яндекс Доставка',
          cost: 350,
          min_days: 1,
          max_days: 3,
          delivery_type: 'courier'
        }
      ];
    }
  }
}

// Главный сервис доставки
export class DeliveryService {
  private cdek = new CDEKService();
  private russianPost = new RussianPostService();
  private yandex = new YandexDeliveryService();

  async calculateAllOptions(data: DeliveryCalculation): Promise<DeliveryOption[]> {
    // ХАРДКОД НАСТРОЙКИ - всегда возвращаем фиксированные варианты доставки
    return [
      {
        service: 'cdek',
        name: 'СДЭК - Курьерская доставка',
        cost: HARDCODED_DELIVERY_CONFIG.standardDeliveryFee,
        min_days: 2,
        max_days: 5,
        delivery_type: 'courier'
      },
      {
        service: 'cdek',
        name: 'СДЭК - Самовывоз',
        cost: HARDCODED_DELIVERY_CONFIG.pickupFee,
        min_days: 1,
        max_days: 3,
        delivery_type: 'pickup'
      },
      {
        service: 'russianpost',
        name: 'Почта России',
        cost: HARDCODED_DELIVERY_CONFIG.postFee,
        min_days: 3,
        max_days: 7,
        delivery_type: 'pickup'
      },
      {
        service: 'yandex',
        name: 'Яндекс - Экспресс доставка',
        cost: HARDCODED_DELIVERY_CONFIG.expressDeliveryFee,
        min_days: 1,
        max_days: 2,
        delivery_type: 'courier'
      }
    ];
  }
}

export const deliveryService = new DeliveryService();