import NodeCache from 'node-cache';

interface CacheConfig {
  stdTTL: number; // Time to live in seconds
  checkperiod?: number; // Check period for expired keys
  maxKeys?: number; // Maximum number of keys
}

export class CacheManager {
  private cache: NodeCache;
  private hitRate = { hits: 0, misses: 0 };

  constructor(config: CacheConfig) {
    this.cache = new NodeCache({
      stdTTL: config.stdTTL,
      checkperiod: config.checkperiod || 120,
      maxKeys: config.maxKeys || 1000,
      useClones: false // For better performance
    });

    // Log cache statistics periodically
    setInterval(() => {
      const stats = this.getStats();
      if (stats.keys > 0) {
        console.log(`[Cache Stats] Keys: ${stats.keys}, Hit Rate: ${stats.hitRate}%, Memory: ${stats.memoryUsage}`);
      }
    }, 60000); // Every minute
  }

  async get<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.cache.get<T>(key);
    
    if (cached !== undefined) {
      this.hitRate.hits++;
      return cached;
    }

    this.hitRate.misses++;

    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails, try to return stale data if available
      const staleData = this.cache.get<T>(key, true); // Get even if expired
      if (staleData !== undefined) {
        console.log(`[Cache] Returning stale data for key: ${key} due to fetch error`);
        return staleData;
      }
      throw error;
    }
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    this.hitRate = { hits: 0, misses: 0 };
  }

  getStats() {
    const total = this.hitRate.hits + this.hitRate.misses;
    const hitRate = total > 0 ? ((this.hitRate.hits / total) * 100).toFixed(2) : '0';
    const keys = this.cache.keys().length;
    const stats = this.cache.getStats();

    return {
      keys,
      hitRate: `${hitRate}`,
      hits: this.hitRate.hits,
      misses: this.hitRate.misses,
      memoryUsage: this.formatBytes(stats.vsize),
      ...stats
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Batch operations for efficiency
  mget<T>(keys: string[]): { [key: string]: T | undefined } {
    const result: { [key: string]: T | undefined } = {};
    
    for (const key of keys) {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.hitRate.hits++;
        result[key] = value;
      } else {
        this.hitRate.misses++;
      }
    }
    
    return result;
  }

  mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): boolean[] {
    return keyValuePairs.map(({ key, value, ttl }) => 
      ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value)
    );
  }
}

// Different cache instances for different data types
export const cacheConfig = {
  // Market data - short TTL for real-time feel
  marketData: new CacheManager({
    stdTTL: 30, // 30 seconds
    maxKeys: 500
  }),

  // Coin details - moderate TTL
  coinDetails: new CacheManager({
    stdTTL: 300, // 5 minutes
    maxKeys: 1000
  }),

  // Historical data - longer TTL
  historicalData: new CacheManager({
    stdTTL: 3600, // 1 hour
    maxKeys: 200
  }),

  // Static data (categories, etc) - very long TTL
  staticData: new CacheManager({
    stdTTL: 86400, // 24 hours
    maxKeys: 100
  }),

  // News and sentiment - short TTL
  newsData: new CacheManager({
    stdTTL: 60, // 1 minute
    maxKeys: 300
  })
};

// Helper to generate cache keys
export const cacheKeys = {
  marketCap: () => 'global:market_cap',
  coinPrice: (id: string) => `coin:${id}:price`,
  coinDetails: (id: string) => `coin:${id}:details`,
  topCoins: (limit: number) => `top_coins:${limit}`,
  trending: () => 'trending:coins',
  defiProtocols: () => 'defi:protocols',
  news: (limit: number) => `news:${limit}`,
  historical: (id: string, days: number) => `historical:${id}:${days}`,
  showcaseData: (timeframe: string) => `showcase:${timeframe}`
};