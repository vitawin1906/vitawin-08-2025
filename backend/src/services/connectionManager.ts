import { Pool } from 'pg';

class ConnectionManager {
  private pool: Pool;
  private queryQueue: Array<{ query: string; params: any[]; resolve: Function; reject: Function }> = [];
  private activeConnections = 0;
  private maxConnections = 10;
  private connectionTimeout = 30000; // 30 секунд

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: this.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: this.connectionTimeout,
      // Настройки для оптимальной производительности
      statement_timeout: 10000, // 10 секунд на запрос
      query_timeout: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    });

    this.setupPoolEvents();
  }

  private setupPoolEvents() {
    this.pool.on('connect', () => {
      this.activeConnections++;
      console.log(`Database connection established. Active: ${this.activeConnections}`);
    });

    this.pool.on('remove', () => {
      this.activeConnections--;
      console.log(`Database connection removed. Active: ${this.activeConnections}`);
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  async executeQuery(query: string, params: any[] = []) {
    if (this.activeConnections >= this.maxConnections) {
      // Добавляем в очередь если превышен лимит соединений
      return new Promise((resolve, reject) => {
        this.queryQueue.push({ query, params, resolve, reject });
        this.processQueue();
      });
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query(query, params);
      client.release();
      
      // Обрабатываем очередь после освобождения соединения
      this.processQueue();
      
      return result;
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  private async processQueue() {
    if (this.queryQueue.length === 0 || this.activeConnections >= this.maxConnections) {
      return;
    }

    const { query, params, resolve, reject } = this.queryQueue.shift()!;
    
    try {
      const result = await this.executeQuery(query, params);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  async executeTransaction(queries: Array<{ query: string; params: any[] }>) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { query, params } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPoolStatus() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      activeConnections: this.activeConnections,
      queueLength: this.queryQueue.length
    };
  }

  async closePool() {
    await this.pool.end();
    console.log('Database pool closed');
  }
}

export const connectionManager = new ConnectionManager();