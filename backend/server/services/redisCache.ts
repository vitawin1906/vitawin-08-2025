import { createClient, RedisClientType } from 'redis';

class RedisCache {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    // Отключаем Redis для Replit окружения
    if (process.env.REPLIT_ENVIRONMENT || !process.env.REDIS_URL) {
      console.log('🔧 Redis отключен для Replit окружения');
      this.isConnected = false;
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (err) => {
      console.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  // Кеширование товаров
  async cacheProducts(products: any[], ttl = 300) { // 5 минут
    if (!this.isConnected) return;
    try {
      await this.client.setEx('products:all', ttl, JSON.stringify(products));
    } catch (error) {
      console.error('Redis cache error:', error);
    }
  }

  async getCachedProducts(): Promise<any[] | null> {
    if (!this.isConnected) return null;
    try {
      const cached = await this.client.get('products:all');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Кеширование статей блога
  async cacheBlogPosts(posts: any[], ttl = 600) { // 10 минут
    if (!this.isConnected) return;
    try {
      await this.client.setEx('blog:posts', ttl, JSON.stringify(posts));
    } catch (error) {
      console.error('Redis blog cache error:', error);
    }
  }

  async getCachedBlogPosts(): Promise<any[] | null> {
    if (!this.isConnected) return null;
    try {
      const cached = await this.client.get('blog:posts');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis blog get error:', error);
      return null;
    }
  }

  // Кеширование статистики
  async cacheStats(stats: any, ttl = 120) { // 2 минуты
    if (!this.isConnected) return;
    try {
      await this.client.setEx('stats:general', ttl, JSON.stringify(stats));
    } catch (error) {
      console.error('Redis stats cache error:', error);
    }
  }

  async getCachedStats(): Promise<any | null> {
    if (!this.isConnected) return null;
    try {
      const cached = await this.client.get('stats:general');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis stats get error:', error);
      return null;
    }
  }

  // Очистка кеша
  async clearCache(pattern?: string) {
    if (!this.isConnected) return;
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        await this.client.flushAll();
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  // Дополнительные методы для совместимости
  async invalidateProducts() {
    await this.clearCache('products:*');
  }

  async invalidateBlogPosts() {
    await this.clearCache('blog:*');
  }

  async invalidateUserStats() {
    await this.clearCache('stats:*');
  }

  async getCachedProduct(id: number): Promise<any | null> {
    if (!this.isConnected) return null;
    try {
      const cached = await this.client.get(`product:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis product get error:', error);
      return null;
    }
  }

  async cacheProduct(id: number, product: any, ttl = 1800) {
    if (!this.isConnected) return;
    try {
      await this.client.setEx(`product:${id}`, ttl, JSON.stringify(product));
    } catch (error) {
      console.error('Redis product cache error:', error);
    }
  }

  async getCachedUserStats(): Promise<any | null> {
    if (!this.isConnected) return null;
    try {
      const cached = await this.client.get('stats:users');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis user stats get error:', error);
      return null;
    }
  }

  async cacheUserStats(stats: any, ttl = 120) {
    if (!this.isConnected) return;
    try {
      await this.client.setEx('stats:users', ttl, JSON.stringify(stats));
    } catch (error) {
      console.error('Redis user stats cache error:', error);
    }
  }
}

export const redisCache = new RedisCache();