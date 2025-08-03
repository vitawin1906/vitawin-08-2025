import { Request, Response } from 'express';
import { deliveryService, DeliveryCalculation } from '../services/deliveryServices';

// ХАРДКОД НАСТРОЙКИ ДОСТАВКИ
const HARDCODED_DELIVERY_OPTIONS = {
  standardDeliveryFee: 300,
  expressDeliveryFee: 500,
  pickupFee: 0,
  postFee: 400,
};

interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
  workingTime: string;
  phone?: string;
  latitude: number;
  longitude: number;
}

interface DeliveryOptionLocal {
  id: string;
  name: string;
  type: 'pickup' | 'courier';
  price: number;
  minDays: number;
  maxDays: number;
  description: string;
  provider: 'cdek' | 'russianpost' | 'yandex';
}

interface DeliveryCalculationRequest {
  fromCityId: string;
  toCityId: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number;
}

class DeliveryController {
  // Получение доступных вариантов доставки
  async getDeliveryOptions(req: Request, res: Response) {
    try {
      const { cityId, weight = 1000, declaredValue = 1000 } = req.query;

      if (!cityId) {
        return res.status(400).json({
          error: 'City ID is required',
          message: 'Необходимо указать город доставки'
        });
      }

      // ХАРДКОД НАСТРОЙКИ - фиксированные варианты доставки
      const deliveryOptions: DeliveryOptionLocal[] = [
        // СДЭК варианты
        {
          id: 'cdek_pickup',
          name: 'СДЭК - Пункт выдачи',
          type: 'pickup',
          price: HARDCODED_DELIVERY_OPTIONS.pickupFee,
          minDays: 1,
          maxDays: 3,
          description: 'Самовывоз из пункта выдачи СДЭК (бесплатно)',
          provider: 'cdek'
        },
        {
          id: 'cdek_courier',
          name: 'СДЭК - Курьер до двери',
          type: 'courier',
          price: HARDCODED_DELIVERY_OPTIONS.standardDeliveryFee,
          minDays: 2,
          maxDays: 5,
          description: 'Доставка курьером до двери',
          provider: 'cdek'
        },
        // Яндекс Доставка варианты
        {
          id: 'yandex_pickup',
          name: 'Яндекс - Пункт выдачи',
          type: 'pickup',
          price: HARDCODED_DELIVERY_OPTIONS.pickupFee,
          minDays: 1,
          maxDays: 3,
          description: 'Самовывоз из пункта выдачи Яндекс (бесплатно)',
          provider: 'yandex'
        },
        {
          id: 'yandex_courier',
          name: 'Яндекс - Экспресс курьер',
          type: 'courier',
          price: HARDCODED_DELIVERY_OPTIONS.expressDeliveryFee,
          minDays: 1,
          maxDays: 2,
          description: 'Быстрая доставка курьером до двери',
          provider: 'yandex'
        },
        // Почта России
        {
          id: 'russianpost_standard',
          name: 'Почта России - Стандартная',
          type: 'pickup',
          price: HARDCODED_DELIVERY_OPTIONS.postFee,
          minDays: 5,
          maxDays: 10,
          description: 'Доставка до почтового отделения',
          provider: 'russianpost'
        }
      ];

      res.json({
        success: true,
        deliveryOptions,
        city: cityId,
        calculatedFor: {
          weight: Number(weight),
          declaredValue: Number(declaredValue)
        }
      });

    } catch (error) {
      console.error('Delivery options error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Ошибка при получении вариантов доставки'
      });
    }
  }

  // Получение пунктов выдачи для выбранной службы доставки
  async getPickupPoints(req: Request, res: Response) {
    try {
      const { provider, cityId } = req.query;

      if (!provider || !cityId) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'Необходимо указать службу доставки и город'
        });
      }

      // Моковые данные пунктов выдачи
      const pickupPoints: DeliveryPoint[] = [];

      if (provider === 'cdek') {
        pickupPoints.push(
          {
            id: 'cdek_001',
            name: 'СДЭК - ТЦ Мега',
            address: 'г. Москва, МКАД 24-й км, вл. 1',
            workingTime: 'Пн-Вс: 10:00-22:00',
            phone: '+7 (800) 250-00-00',
            latitude: 55.755826,
            longitude: 37.6173
          },
          {
            id: 'cdek_002', 
            name: 'СДЭК - Метро Тушинская',
            address: 'г. Москва, ул. Свободы, д. 56',
            workingTime: 'Пн-Пт: 9:00-20:00, Сб-Вс: 10:00-18:00',
            phone: '+7 (800) 250-00-00',
            latitude: 55.827124,
            longitude: 37.437449
          }
        );
      }

      if (provider === 'yandex') {
        pickupPoints.push(
          {
            id: 'yandex_001',
            name: 'Яндекс Маркет - Пункт выдачи',
            address: 'г. Москва, ул. Арбат, д. 15',
            workingTime: 'Пн-Вс: 09:00-21:00',
            latitude: 55.751244,
            longitude: 37.618423
          },
          {
            id: 'yandex_002',
            name: 'Яндекс Маркет - ТЦ Европейский',
            address: 'г. Москва, пл. Киевского Вокзала, д. 2',
            workingTime: 'Пн-Вс: 10:00-22:00',
            latitude: 55.743814,
            longitude: 37.567093
          }
        );
      }

      res.json({
        success: true,
        pickupPoints,
        provider,
        city: cityId
      });

    } catch (error) {
      console.error('Pickup points error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Ошибка при получении пунктов выдачи'
      });
    }
  }

  // Расчет стоимости доставки
  async calculateDelivery(req: Request, res: Response) {
    try {
      const { from_city, to_city, to_address, to_postal_code, weight, dimensions } = req.body;
      
      // Данные для расчета доставки
      const calculationData: DeliveryCalculation = {
        from_location: {
          city: from_city || 'Москва',
          postal_code: '101000'
        },
        to_location: {
          city: to_city,
          postal_code: to_postal_code,
          address: to_address
        },
        packages: [{
          weight: weight || 500, // граммы
          length: dimensions?.length || 20, // см
          width: dimensions?.width || 15,   // см
          height: dimensions?.height || 10  // см
        }]
      };

      // Получаем реальные расчеты от всех служб доставки
      const deliveryOptions = await deliveryService.calculateAllOptions(calculationData);

      res.json({
        success: true,
        options: deliveryOptions,
        requestData: calculationData
      });

    } catch (error) {
      console.error('Delivery calculation error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Ошибка при расчете доставки'
      });
    }
  }

  // Создание заказа на доставку
  async createDeliveryOrder(req: Request, res: Response) {
    try {
      const {
        provider,
        deliveryType,
        recipientInfo,
        pickupPointId,
        orderItems,
        totalWeight,
        totalValue
      } = req.body;

      // Здесь будет создание заказа в API выбранной службы доставки
      const deliveryOrderId = `${provider}_${Date.now()}`;

      res.json({
        success: true,
        deliveryOrderId,
        provider,
        deliveryType,
        message: 'Заказ на доставку создан успешно'
      });

    } catch (error) {
      console.error('Create delivery order error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Ошибка при создании заказа на доставку'
      });
    }
  }

  // Получение информации о городах для автокомплита
  async getCities(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || (query as string).length < 2) {
        return res.json({
          success: true,
          cities: []
        });
      }

      // Моковые данные городов для демонстрации
      const cities = [
        { id: 'moscow', name: 'Москва', region: 'Московская область' },
        { id: 'spb', name: 'Санкт-Петербург', region: 'Ленинградская область' },
        { id: 'ekb', name: 'Екатеринбург', region: 'Свердловская область' },
        { id: 'nsk', name: 'Новосибирск', region: 'Новосибирская область' },
        { id: 'kzn', name: 'Казань', region: 'Республика Татарстан' }
      ].filter(city => 
        city.name.toLowerCase().includes((query as string).toLowerCase())
      );

      res.json({
        success: true,
        cities
      });

    } catch (error) {
      console.error('Cities search error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Ошибка при поиске городов'
      });
    }
  }
}

export const deliveryController = new DeliveryController();