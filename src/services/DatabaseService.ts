/**
 * @fileoverview Database service for persistent data storage with TypeORM
 * @module DatabaseService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import { DataSource, Repository, EntityManager, QueryRunner } from 'typeorm';
import { CacheService } from './CacheService';

/**
 * Database configuration
 */
export interface DatabaseConfig extends ServiceConfig {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean;
  entities: string[];
  migrations?: string[];
  subscribers?: string[];
  pool?: {
    min?: number;
    max?: number;
    acquireTimeout?: number;
    idleTimeout?: number;
  };
  cache?: {
    enabled: boolean;
    duration?: number;
    alwaysEnabled?: boolean;
  };
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  retries?: number;
  retryDelay?: number;
}

/**
 * Query performance metrics
 */
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  error?: string;
}

/**
 * Database service with advanced features
 */
export class DatabaseService extends BaseService {
  private dataSource?: DataSource;
  private repositories: Map<string, Repository<any>> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private dbConfig: DatabaseConfig;
  private cacheService?: CacheService;
  
  constructor(config: DatabaseConfig, logger: Logger, cacheService?: CacheService) {
    super('DatabaseService', config, logger);
    this.dependencies = cacheService ? ['CacheService'] : [];
    this.dbConfig = config;
    this.cacheService = cacheService;
  }
  
  /**
   * Initialize database service
   */
  protected async onInitialize(): Promise<void> {
    // Create data source
    this.dataSource = new DataSource({
      type: this.dbConfig.type,
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      username: this.dbConfig.username,
      password: this.dbConfig.password,
      database: this.dbConfig.database,
      synchronize: this.dbConfig.synchronize,
      logging: this.dbConfig.logging,
      entities: this.dbConfig.entities,
      migrations: this.dbConfig.migrations,
      subscribers: this.dbConfig.subscribers,
      poolSize: this.dbConfig.pool?.max,
      extra: {
        min: this.dbConfig.pool?.min,
        acquireTimeoutMillis: this.dbConfig.pool?.acquireTimeout,
        idleTimeoutMillis: this.dbConfig.pool?.idleTimeout
      },
      cache: this.dbConfig.cache?.enabled ? {
        duration: this.dbConfig.cache.duration || 60000,
        alwaysEnabled: this.dbConfig.cache.alwaysEnabled
      } : false
    });
    
    // Initialize connection
    await this.dataSource.initialize();
    this.logger.info('Database connection established');
    
    // Run migrations if needed
    if (this.dataSource.migrations.length > 0) {
      await this.runMigrations();
    }
    
    // Set up query logging
    if (this.dbConfig.logging) {
      this.setupQueryLogging();
    }
  }
  
  /**
   * Start database service
   */
  protected async onStart(): Promise<void> {
    this.logger.info('Database service started');
  }
  
  /**
   * Stop database service
   */
  protected async onStop(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.info('Database connection closed');
    }
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      return {
        status: 'unhealthy',
        message: 'Database not connected'
      };
    }
    
    try {
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'healthy',
        details: {
          driver: this.dataSource.driver.options.type,
          database: this.dataSource.driver.database,
          connected: this.dataSource.isInitialized,
          migrations: {
            executed: this.dataSource.migrations.filter(m => m.timestamp).length,
            pending: this.dataSource.migrations.filter(m => !m.timestamp).length
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }
  
  /**
   * Get repository for entity
   */
  getRepository<T>(entity: string | Function): Repository<T> {
    const key = typeof entity === 'string' ? entity : entity.name;
    
    if (!this.repositories.has(key)) {
      if (!this.dataSource) {
        throw new Error('Database not initialized');
      }
      
      const repository = this.dataSource.getRepository(entity as any);
      this.repositories.set(key, repository);
    }
    
    return this.repositories.get(key)!;
  }
  
  /**
   * Execute transaction
   */
  async transaction<T>(
    work: (manager: EntityManager) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    
    const maxRetries = options?.retries || 3;
    const retryDelay = options?.retryDelay || 1000;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner();
      
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction(options?.isolationLevel);
        
        const result = await work(queryRunner.manager);
        
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        lastError = error;
        
        this.logger.warn(`Transaction failed (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      } finally {
        await queryRunner.release();
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Execute raw query
   */
  async query<T = any>(sql: string, parameters?: any[]): Promise<T> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    
    const startTime = Date.now();
    
    try {
      const result = await this.dataSource.query(sql, parameters);
      
      this.recordQueryMetrics({
        query: sql,
        duration: Date.now() - startTime,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      this.recordQueryMetrics({
        query: sql,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Bulk insert with optimization
   */
  async bulkInsert<T>(
    entity: string | Function,
    data: T[],
    options?: {
      chunk?: number;
      onConflict?: 'ignore' | 'update';
      updateColumns?: string[];
    }
  ): Promise<void> {
    if (!data.length) return;
    
    const repository = this.getRepository<T>(entity);
    const chunkSize = options?.chunk || 1000;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      const queryBuilder = repository.createQueryBuilder()
        .insert()
        .values(chunk);
      
      if (options?.onConflict === 'ignore') {
        queryBuilder.orIgnore();
      } else if (options?.onConflict === 'update' && options.updateColumns) {
        queryBuilder.orUpdate(options.updateColumns);
      }
      
      await queryBuilder.execute();
      
      this.logger.debug(`Bulk inserted ${chunk.length} records into ${entity}`);
    }
  }
  
  /**
   * Create paginated query
   */
  async paginate<T>(
    entity: string | Function,
    options: {
      page?: number;
      limit?: number;
      where?: any;
      order?: any;
      relations?: string[];
      cache?: boolean | number;
    } = {}
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const repository = this.getRepository<T>(entity);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;
    
    const queryBuilder = repository.createQueryBuilder('entity');
    
    if (options.where) {
      queryBuilder.where(options.where);
    }
    
    if (options.order) {
      Object.entries(options.order).forEach(([field, direction]) => {
        queryBuilder.addOrderBy(`entity.${field}`, direction as 'ASC' | 'DESC');
      });
    }
    
    if (options.relations) {
      options.relations.forEach(relation => {
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }
    
    if (options.cache) {
      queryBuilder.cache(options.cache === true ? 60000 : options.cache);
    }
    
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    };
  }
  
  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    
    const migrations = await this.dataSource.runMigrations();
    this.logger.info(`Ran ${migrations.length} migrations`);
  }
  
  /**
   * Revert last migration
   */
  async revertMigration(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    
    await this.dataSource.undoLastMigration();
    this.logger.info('Reverted last migration');
  }
  
  /**
   * Create database backup
   */
  async backup(path: string): Promise<void> {
    if (this.dbConfig.type === 'sqlite') {
      // Simple file copy for SQLite
      const fs = await import('fs/promises');
      await fs.copyFile(this.dbConfig.database, path);
    } else {
      // For other databases, use native backup tools
      throw new Error(`Backup not implemented for ${this.dbConfig.type}`);
    }
    
    this.logger.info(`Database backed up to: ${path}`);
  }
  
  /**
   * Setup query logging
   */
  private setupQueryLogging(): void {
    if (!this.dataSource) return;
    
    const originalQuery = this.dataSource.driver.query.bind(this.dataSource.driver);
    
    this.dataSource.driver.query = async (query: string, parameters?: any[]) => {
      const startTime = Date.now();
      
      try {
        const result = await originalQuery(query, parameters);
        
        this.recordQueryMetrics({
          query,
          duration: Date.now() - startTime,
          timestamp: new Date()
        });
        
        return result;
      } catch (error) {
        this.recordQueryMetrics({
          query,
          duration: Date.now() - startTime,
          timestamp: new Date(),
          error: error.message
        });
        
        throw error;
      }
    };
  }
  
  /**
   * Record query metrics
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 queries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
    
    // Log slow queries
    if (metrics.duration > 1000) {
      this.logger.warn('Slow query detected', {
        query: metrics.query.substring(0, 100),
        duration: metrics.duration
      });
    }
  }
  
  /**
   * Get query performance stats
   */
  getQueryStats(): {
    total: number;
    avgDuration: number;
    slowQueries: number;
    errors: number;
  } {
    const total = this.queryMetrics.length;
    const avgDuration = total > 0
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / total
      : 0;
    const slowQueries = this.queryMetrics.filter(m => m.duration > 1000).length;
    const errors = this.queryMetrics.filter(m => m.error).length;
    
    return { total, avgDuration, slowQueries, errors };
  }
  
  /**
   * Clear query metrics
   */
  clearQueryMetrics(): void {
    this.queryMetrics = [];
  }
  
  /**
   * Get data source
   */
  getDataSource(): DataSource | undefined {
    return this.dataSource;
  }
}