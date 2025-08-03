import { createHash } from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // время жизни в миллисекундах
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очистка кэша каждые 10 минут
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  /**
   * Генерирует ключ кэша на основе данных
   */
  private generateKey(data: any): string {
    const serialized = JSON.stringify(data);
    return createHash('md5').update(serialized).digest('hex');
  }

  /**
   * Сохраняет данные в кэш
   */
  set(key: string, data: any, ttlMinutes: number = 60): void {
    const ttl = ttlMinutes * 60 * 1000; // конвертируем в миллисекунды
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Получает данные из кэша
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Проверяем не истек ли срок
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Создает ключ кэша для ИИ запросов
   */
  createAIKey(prompt: string, model: string = 'gpt-4o'): string {
    return this.generateKey({ prompt, model, type: 'ai_response' });
  }

  /**
   * Кэширует ответ ИИ
   */
  cacheAIResponse(prompt: string, response: any, model: string = 'gpt-4o', ttlMinutes: number = 120): void {
    const key = this.createAIKey(prompt, model);
    this.set(key, response, ttlMinutes);
  }

  /**
   * Получает закэшированный ответ ИИ
   */
  getAIResponse(prompt: string, model: string = 'gpt-4o'): any | null {
    const key = this.createAIKey(prompt, model);
    return this.get(key);
  }

  /**
   * Кэширует данные продукта
   */
  cacheProduct(productId: number, data: any, ttlMinutes: number = 30): void {
    const key = `product_${productId}`;
    this.set(key, data, ttlMinutes);
  }

  /**
   * Получает закэшированные данные продукта
   */
  getProduct(productId: number): any | null {
    const key = `product_${productId}`;
    return this.get(key);
  }

  /**
   * Кэширует список товаров
   */
  cacheProductList(data: any, ttlMinutes: number = 15): void {
    const key = 'products_list';
    this.set(key, data, ttlMinutes);
  }

  /**
   * Получает закэшированный список товаров
   */
  getProductList(): any | null {
    const key = 'products_list';
    return this.get(key);
  }

  /**
   * Очищает устаревшие записи
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Возвращает статистику кэша
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Освобождает ресурсы
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const cacheService = new CacheService();