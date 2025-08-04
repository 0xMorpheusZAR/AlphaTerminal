/**
 * @fileoverview Advanced caching service with Redis and in-memory fallback
 * @module CacheService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import Redis, { RedisClient } from 'redis';
import { promisify } from 'util';
import LRU from 'lru-cache';

/**
 * Cache configuration
 */
export interface CacheConfig extends ServiceConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    enableOfflineQueue?: boolean;
    maxRetriesPerRequest?: number;
  };
  memory?: {
    max: number;
    ttl: number;
    updateAgeOnGet?: boolean;
  };
  defaultTTL: number;
  keyPrefix: string;
}

/**
 * Cache entry metadata
 */
interface CacheMetadata {
  key: string;
  createdAt: Date;
  expiresAt?: Date;
  hitCount: number;
  lastAccessed: Date;
  size: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryUsage: number;
  keyCount: number;
}

/**
 * Advanced caching service with multiple backends
 */
export class CacheService extends BaseService {
  private redisClient?: RedisClient;
  private memoryCache: LRU<string, any>;
  private redisGet?: (key: string) => Promise<string | null>;
  private redisSet?: (key: string, value: string, mode: string, duration: number) => Promise<string>;
  private redisDel?: (key: string) => Promise<number>;
  private redisKeys?: (pattern: string) => Promise<string[]>;
  private redisTtl?: (key: string) => Promise<number>;
  private stats: CacheStats;
  private cacheConfig: CacheConfig;
  
  constructor(config: CacheConfig, logger: Logger) {
    super('CacheService', config, logger);
    this.dependencies = [];
    this.cacheConfig = config;
    
    // Initialize memory cache
    this.memoryCache = new LRU({
      max: config.memory?.max || 500,
      ttl: (config.memory?.ttl || 300) * 1000, // Convert to milliseconds
      updateAgeOnGet: config.memory?.updateAgeOnGet ?? true,
      dispose: (key, value) => {
        this.stats.evictions++;
      }
    });
    
    // Initialize stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
      keyCount: 0
    };
  }
  
  /**
   * Initialize cache service
   */
  protected async onInitialize(): Promise<void> {
    if (this.cacheConfig.redis) {
      await this.initializeRedis();
    }
    
    // Set up periodic stats reporting
    setInterval(() => {
      this.reportStats();
    }, 60000); // Every minute
  }
  
  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redisClient = Redis.createClient({
        host: this.cacheConfig.redis!.host,
        port: this.cacheConfig.redis!.port,
        password: this.cacheConfig.redis!.password,
        db: this.cacheConfig.redis!.db || 0,
        enable_offline_queue: this.cacheConfig.redis!.enableOfflineQueue ?? true,
        max_attempts: this.cacheConfig.redis!.maxRetriesPerRequest || 3,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            this.logger.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      this.redisClient.on('connect', () => {
        this.logger.info('Redis connected');
        resolve();
      });
      
      this.redisClient.on('error', (error) => {
        this.logger.error('Redis error:', error);
        if (!this.redisGet) {
          reject(error);
        }
      });
      
      this.redisClient.on('ready', () => {
        // Promisify Redis methods
        this.redisGet = promisify(this.redisClient!.get).bind(this.redisClient);
        this.redisSet = promisify(this.redisClient!.set).bind(this.redisClient);
        this.redisDel = promisify(this.redisClient!.del).bind(this.redisClient);
        this.redisKeys = promisify(this.redisClient!.keys).bind(this.redisClient);
        this.redisTtl = promisify(this.redisClient!.ttl).bind(this.redisClient);
        
        this.logger.info('Redis ready');
      });
    });
  }
  
  /**
   * Start cache service
   */
  protected async onStart(): Promise<void> {
    this.logger.info('Cache service started');
  }
  
  /**
   * Stop cache service
   */
  protected async onStop(): Promise<void> {
    if (this.redisClient && this.redisClient.connected) {
      await new Promise<void>((resolve) => {
        this.redisClient!.quit(() => {
          this.logger.info('Redis connection closed');
          resolve();
        });
      });
    }
    
    this.memoryCache.clear();
    this.logger.info('Cache service stopped');
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    const details: any = {
      memoryCache: {
        size: this.memoryCache.size,
        itemCount: this.memoryCache.itemCount
      },
      stats: this.stats
    };
    
    if (this.redisClient) {
      details.redis = {
        connected: this.redisClient.connected,
        ready: this.redisClient.ready
      };
    }
    
    return {
      status: 'healthy',
      details
    };
  }
  
  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    
    // Try memory cache first
    const memoryValue = this.memoryCache.get(fullKey);
    if (memoryValue !== undefined) {
      this.stats.hits++;
      return memoryValue;
    }
    
    // Try Redis if available
    if (this.redisGet) {
      try {
        const redisValue = await this.redisGet(fullKey);
        if (redisValue) {
          this.stats.hits++;
          const parsed = JSON.parse(redisValue);
          // Store in memory cache for faster access
          this.memoryCache.set(fullKey, parsed);
          return parsed;
        }
      } catch (error) {
        this.logger.error(`Redis get error for key ${fullKey}:`, error);
      }
    }
    
    this.stats.misses++;
    return null;
  }
  
  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const ttlSeconds = ttl || this.cacheConfig.defaultTTL;
    
    // Store in memory cache
    this.memoryCache.set(fullKey, value);
    
    // Store in Redis if available
    if (this.redisSet) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisSet(fullKey, serialized, 'EX', ttlSeconds);
      } catch (error) {
        this.logger.error(`Redis set error for key ${fullKey}:`, error);
      }
    }
    
    this.stats.sets++;
  }
  
  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    
    // Delete from memory cache
    this.memoryCache.delete(fullKey);
    
    // Delete from Redis if available
    if (this.redisDel) {
      try {
        await this.redisDel(fullKey);
      } catch (error) {
        this.logger.error(`Redis delete error for key ${fullKey}:`, error);
      }
    }
    
    this.stats.deletes++;
    return true;
  }
  
  /**
   * Clear all cache entries with pattern
   */
  async clear(pattern?: string): Promise<number> {
    let cleared = 0;
    
    if (pattern) {
      const fullPattern = this.buildKey(pattern);
      
      // Clear from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(fullPattern)) {
          this.memoryCache.delete(key);
          cleared++;
        }
      }
      
      // Clear from Redis if available
      if (this.redisKeys && this.redisDel) {
        try {
          const keys = await this.redisKeys(fullPattern + '*');
          if (keys.length > 0) {
            await Promise.all(keys.map(k => this.redisDel!(k)));
            cleared += keys.length;
          }
        } catch (error) {
          this.logger.error('Redis clear error:', error);
        }
      }
    } else {
      // Clear all
      cleared = this.memoryCache.size;
      this.memoryCache.clear();
      
      if (this.redisClient) {
        await new Promise<void>((resolve) => {
          this.redisClient!.flushdb(() => resolve());
        });
      }
    }
    
    return cleared;
  }
  
  /**
   * Get cache metadata
   */
  async getMetadata(key: string): Promise<CacheMetadata | null> {
    const fullKey = this.buildKey(key);
    const value = await this.get(key);
    
    if (!value) return null;
    
    let ttl = -1;
    if (this.redisTtl) {
      try {
        ttl = await this.redisTtl(fullKey);
      } catch (error) {
        this.logger.error('Redis TTL error:', error);
      }
    }
    
    return {
      key: fullKey,
      createdAt: new Date(),
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined,
      hitCount: 0,
      lastAccessed: new Date(),
      size: JSON.stringify(value).length
    };
  }
  
  /**
   * Cache warming - preload frequently accessed data
   */
  async warm(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      const value = await this.get(key);
      if (!value) {
        const loaded = await loader(key);
        if (loaded) {
          await this.set(key, loaded);
        }
      }
    });
    
    await Promise.all(promises);
    this.logger.info(`Cache warmed with ${keys.length} keys`);
  }
  
  /**
   * Memoize function results
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    const cache = this;
    
    return (async function(...args: Parameters<T>): Promise<ReturnType<T>> {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      const cached = await cache.get<ReturnType<T>>(key);
      if (cached !== null) {
        return cached;
      }
      
      const result = await fn(...args);
      await cache.set(key, result, ttl);
      
      return result;
    }) as T;
  }
  
  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.cacheConfig.keyPrefix}:${key}`;
  }
  
  /**
   * Report cache statistics
   */
  private reportStats(): void {
    this.stats.memoryUsage = process.memoryUsage().heapUsed;
    this.stats.keyCount = this.memoryCache.size;
    
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    this.logger.info('Cache statistics', {
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      ...this.stats
    });
  }
  
  /**
   * Get current statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryUsage: 0,
      keyCount: 0
    };
  }
}