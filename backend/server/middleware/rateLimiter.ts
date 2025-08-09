interface RateLimit {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimit>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очистка каждые 5 минут
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Проверяет лимит для IP адреса
   */
  checkLimit(ip: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = ip;
    
    const current = this.limits.get(key);
    
    if (!current || now > current.resetTime) {
      // Новое окно времени
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false; // Превышен лимит
    }
    
    current.count++;
    return true;
  }

  /**
   * Получает информацию о лимитах
   */
  getLimitInfo(ip: string): { remaining: number; resetTime: number } | null {
    const current = this.limits.get(ip);
    if (!current) {
      return null;
    }
    
    return {
      remaining: Math.max(0, 100 - current.count),
      resetTime: current.resetTime
    };
  }

  /**
   * Очищает истекшие записи
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.limits.forEach((limit, key) => {
      if (now > limit.resetTime) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => {
      this.limits.delete(key);
    });
    
    console.log(`Rate limiter cleanup: removed ${toDelete.length} expired entries`);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Middleware для ограничения частоты запросов
 */
export function createRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!rateLimiter.checkLimit(ip, maxRequests, windowMs)) {
      const limitInfo = rateLimiter.getLimitInfo(ip);
      
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: limitInfo ? Math.ceil((limitInfo.resetTime - Date.now()) / 1000) : 60
      });
      return;
    }
    
    // Добавляем заголовки с информацией о лимитах
    const limitInfo = rateLimiter.getLimitInfo(ip);
    if (limitInfo) {
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': limitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(limitInfo.resetTime).toISOString()
      });
    }
    
    next();
  };
}