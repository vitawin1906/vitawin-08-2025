interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: any;
  resolved: boolean;
}

class ErrorMonitoringService {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000; // Максимальное количество ошибок в памяти

  /**
   * Логирует ошибку
   */
  logError(level: 'error' | 'warning' | 'info', message: string, error?: Error, context?: any): void {
    const errorLog: ErrorLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      stack: error?.stack,
      context,
      resolved: false
    };

    this.errors.unshift(errorLog);

    // Ограничиваем количество ошибок
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Выводим в консоль для разработки
    if (level === 'error') {
      console.error('Error logged:', { message, stack: error?.stack, context });
    } else if (level === 'warning') {
      console.warn('Warning logged:', { message, context });
    } else {
      console.info('Info logged:', { message, context });
    }
  }

  /**
   * Получает список ошибок
   */
  getErrors(limit: number = 50, level?: 'error' | 'warning' | 'info'): ErrorLog[] {
    let filteredErrors = this.errors;
    
    if (level) {
      filteredErrors = this.errors.filter(error => error.level === level);
    }
    
    return filteredErrors.slice(0, limit);
  }

  /**
   * Помечает ошибку как решенную
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Получает статистику ошибок
   */
  getErrorStats(): { total: number; byLevel: Record<string, number>; unresolved: number } {
    const stats = {
      total: this.errors.length,
      byLevel: { error: 0, warning: 0, info: 0 },
      unresolved: 0
    };

    this.errors.forEach(error => {
      stats.byLevel[error.level]++;
      if (!error.resolved) {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * Очищает старые ошибки
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.errors.length;
    
    this.errors = this.errors.filter(error => error.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.errors.length;
    if (removedCount > 0) {
      console.log(`Error monitoring cleanup: removed ${removedCount} old errors`);
    }
  }

  /**
   * Очищает все ошибки
   */
  clearAll(): void {
    this.errors = [];
  }
}

export const errorMonitoringService = new ErrorMonitoringService();

// Автоматическая очистка каждые 6 часов
setInterval(() => {
  errorMonitoringService.cleanup();
}, 6 * 60 * 60 * 1000);