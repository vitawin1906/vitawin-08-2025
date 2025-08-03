interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
}

class MemoryManager {
  private thresholds: MemoryThresholds = {
    warning: 150, // 150MB (увеличено для уменьшения частых предупреждений)
    critical: 250  // 250MB
  };
  
  private alertCallbacks: Array<(level: 'warning' | 'critical', stats: MemoryStats) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  /**
   * Запуск мониторинга памяти
   */
  startMonitoring(intervalMs: number = 300000) { // каждые 5 минут
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    console.log('Memory monitoring started');
  }

  /**
   * Остановка мониторинга памяти
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Memory monitoring stopped');
    }
  }

  /**
   * Проверка использования памяти
   */
  private checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
    };

    // Проверяем пороги
    if (stats.heapUsed > this.thresholds.critical) {
      this.triggerAlert('critical', stats);
      this.performEmergencyCleanup();
    } else if (stats.heapUsed > this.thresholds.warning) {
      this.triggerAlert('warning', stats);
      this.performGentleCleanup();
    }
  }

  /**
   * Получение текущих статистик памяти
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
    };
  }

  /**
   * Принудительная сборка мусора
   */
  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      console.log('Forced garbage collection completed');
      return true;
    } else {
      console.warn('Garbage collection not exposed. Use --expose-gc flag');
      return false;
    }
  }

  /**
   * Мягкая очистка памяти
   */
  private async performGentleCleanup() {
    console.log('Performing gentle memory cleanup...');
    
    // Очистка кэшей
    await this.notifyCleanupServices('gentle');
    
    // Принудительная сборка мусора если доступна
    this.forceGarbageCollection();
  }

  /**
   * Экстренная очистка памяти
   */
  private performEmergencyCleanup() {
    console.log('Performing emergency memory cleanup...');
    
    // Агрессивная очистка всех кэшей
    this.notifyCleanupServices('emergency');
    
    // Принудительная сборка мусора
    this.forceGarbageCollection();
    
    // Дополнительная очистка через 5 секунд
    setTimeout(() => {
      this.forceGarbageCollection();
    }, 5000);
  }

  /**
   * Уведомление сервисов о необходимости очистки
   */
  private async notifyCleanupServices(level: 'gentle' | 'emergency') {
    // Этот метод будет вызывать очистку в других сервисах
    try {
      // Импортируем сервисы динамически чтобы избежать циклических зависимостей
      const { cacheService } = await import('./cacheService');
      const { errorMonitoringService } = await import('./errorMonitoringService');
      
      if (level === 'emergency') {
        cacheService.clear();
        errorMonitoringService.clearAll();
      } else {
        // Мягкая очистка - удаляем только старые записи
        cacheService.cleanup();
        errorMonitoringService.cleanup(1); // Очищаем записи старше 1 часа
      }
    } catch (error) {
      console.error('Error during cleanup notification:', error);
    }
  }

  /**
   * Добавление callback для уведомлений о превышении лимитов
   */
  onMemoryAlert(callback: (level: 'warning' | 'critical', stats: MemoryStats) => void) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Запуск уведомлений
   */
  private triggerAlert(level: 'warning' | 'critical', stats: MemoryStats) {
    console.log(`Memory ${level}: ${stats.heapUsed}MB used`);
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(level, stats);
      } catch (error) {
        console.error('Error in memory alert callback:', error);
      }
    });
  }

  /**
   * Установка пользовательских порогов
   */
  setThresholds(warning: number, critical: number) {
    this.thresholds = { warning, critical };
    console.log(`Memory thresholds updated: warning=${warning}MB, critical=${critical}MB`);
  }

  /**
   * Получение рекомендаций по оптимизации памяти
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getMemoryStats();
    const recommendations: string[] = [];

    if (stats.heapUsed > 80) {
      recommendations.push('Высокое использование heap памяти - рассмотрите очистку кэшей');
    }

    if (stats.external > 50) {
      recommendations.push('Высокое использование external памяти - проверьте буферы и файловые операции');
    }

    if (stats.arrayBuffers > 20) {
      recommendations.push('Много ArrayBuffer объектов - оптимизируйте работу с изображениями');
    }

    if (stats.rss > 300) {
      recommendations.push('Высокое общее потребление памяти - рассмотрите перезапуск сервиса');
    }

    return recommendations;
  }

  /**
   * Освобождение ресурсов
   */
  destroy() {
    this.stopMonitoring();
    this.alertCallbacks = [];
  }
}

export const memoryManager = new MemoryManager();

// Добавляем обработчик для graceful shutdown
process.on('SIGTERM', () => {
  memoryManager.destroy();
});

process.on('SIGINT', () => {
  memoryManager.destroy();
});