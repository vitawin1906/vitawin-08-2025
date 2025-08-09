interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  statusCode: number;
}

interface SystemHealth {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    activeConnections: number;
    queryTime: number;
  };
  cache: {
    hitRate: number;
    size: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private alerts: string[] = [];

  /**
   * Middleware для мониторинга производительности запросов
   */
  createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();

        const metric: PerformanceMetric = {
          endpoint: req.path,
          method: req.method,
          duration,
          timestamp: startTime,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
          },
          statusCode: res.statusCode
        };

        this.addMetric(metric);
        this.checkPerformanceAlerts(metric);
      });

      next();
    };
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.unshift(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
  }

  private checkPerformanceAlerts(metric: PerformanceMetric) {
    // Предупреждение о медленных запросах
    if (metric.duration > 2000) {
      this.alerts.unshift(`Медленный запрос: ${metric.method} ${metric.endpoint} - ${metric.duration}ms`);
    }

    // Предупреждение о высоком использовании памяти
    if (metric.memoryUsage.heapUsed > 50 * 1024 * 1024) { // 50MB
      this.alerts.unshift(`Высокое использование памяти: ${(metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    // Ограничиваем количество предупреждений
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  /**
   * Получение метрик производительности
   */
  getMetrics(limit: number = 50) {
    return {
      recent: this.metrics.slice(0, limit),
      summary: this.calculateSummary(),
      alerts: this.alerts.slice(0, 10)
    };
  }

  private calculateSummary() {
    if (this.metrics.length === 0) {
      return null;
    }

    const recentMetrics = this.metrics.slice(0, 100);
    
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const maxDuration = Math.max(...recentMetrics.map(m => m.duration));
    const minDuration = Math.min(...recentMetrics.map(m => m.duration));
    
    const slowRequests = recentMetrics.filter(m => m.duration > 1000).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;

    return {
      avgResponseTime: Math.round(avgDuration),
      maxResponseTime: maxDuration,
      minResponseTime: minDuration,
      slowRequestsCount: slowRequests,
      errorRate: ((errorRequests / recentMetrics.length) * 100).toFixed(2),
      totalRequests: recentMetrics.length
    };
  }

  /**
   * Получение текущего состояния системы
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: this.calculateCpuPercentage(cpuUsage),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      database: {
        activeConnections: 0, // Будет заполнено из connectionManager
        queryTime: this.getAverageDbQueryTime()
      },
      cache: {
        hitRate: this.calculateCacheHitRate(),
        size: 0 // Будет заполнено из cacheService
      }
    };
  }

  private calculateCpuPercentage(cpuUsage: NodeJS.CpuUsage): number {
    // Упрощенный расчет CPU usage
    return Math.round((cpuUsage.user + cpuUsage.system) / 1000000);
  }

  private getAverageDbQueryTime(): number {
    const dbMetrics = this.metrics
      .filter(m => m.endpoint.startsWith('/api/'))
      .slice(0, 50);
    
    if (dbMetrics.length === 0) return 0;
    
    return Math.round(
      dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length
    );
  }

  private calculateCacheHitRate(): number {
    // Заглушка для расчета cache hit rate
    // В реальности будет получать данные из cacheService
    return 85.5;
  }

  /**
   * Очистка старых метрик
   */
  cleanup(olderThanHours: number = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(`Performance monitor cleanup: removed ${removedCount} old metrics`);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Автоматическая очистка каждые 6 часов
setInterval(() => {
  performanceMonitor.cleanup();
}, 6 * 60 * 60 * 1000);