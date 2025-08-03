// Простой кэш для ускорения запросов к базе данных
class QueryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 минут

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Очистка просроченных записей
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Получить размер кэша
  size(): number {
    return this.cache.size;
  }

  // Инвалидация по паттерну
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

// Очистка кэша каждые 10 минут
setInterval(() => {
  queryCache.cleanup();
}, 10 * 60 * 1000);