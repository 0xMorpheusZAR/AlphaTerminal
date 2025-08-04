import { EventEmitter } from 'events';

// Type definitions for better code quality
export interface DataProvider {
  name: string;
  initialize(): Promise<void>;
  fetch<T>(params: RequestParams): Promise<ApiResponse<T>>;
  disconnect(): void;
}

export interface RequestParams {
  endpoint: string;
  method?: 'GET' | 'POST';
  body?: Record<string, any>;
  timeout?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  source: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface DataServiceConfig {
  providers: string[];
  cacheSize: number;
  cacheTTL: number;
  retryAttempts: number;
  retryDelay: number;
  enableRateLimit: boolean;
  rateLimit: number;
}

// Base Data Service with improved error handling and caching
export class RefactoredDataService extends EventEmitter {
  private providers: Map<string, DataProvider> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: DataServiceConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private rateLimitCounter: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: Partial<DataServiceConfig> = {}) {
    super();
    this.config = {
      providers: ['coingecko', 'velo'],
      cacheSize: 1000,
      cacheTTL: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      enableRateLimit: true,
      rateLimit: 100, // requests per minute
      ...config
    };

    this.setupErrorHandling();
    this.startCacheCleanup();
  }

  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      this.emit('error', { type: 'uncaught', error: error.message });
    });

    process.on('unhandledRejection', (reason) => {
      this.emit('error', { type: 'unhandled', error: reason });
    });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Emit cleanup stats
    this.emit('cache:cleanup', {
      removed: keysToDelete.length,
      remaining: this.cache.size
    });
  }

  public async registerProvider(name: string, provider: DataProvider): Promise<void> {
    try {
      await provider.initialize();
      this.providers.set(name, provider);
      this.emit('provider:registered', { name, provider: provider.name });
    } catch (error) {
      this.emit('error', { 
        type: 'provider_registration', 
        provider: name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  public async fetchData<T>(
    providerName: string, 
    params: RequestParams
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey(providerName, params);
    
    // Check cache first
    const cachedData = this.getFromCache<T>(cacheKey);
    if (cachedData) {
      this.emit('cache:hit', { key: cacheKey });
      return {
        success: true,
        data: cachedData,
        timestamp: new Date(),
        source: `${providerName}-cache`
      };
    }

    // Check rate limits
    if (this.config.enableRateLimit && this.isRateLimited(providerName)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        timestamp: new Date(),
        source: providerName
      };
    }

    // Get provider
    const provider = this.providers.get(providerName);
    if (!provider) {
      const error = `Provider ${providerName} not found`;
      this.emit('error', { type: 'provider_not_found', provider: providerName });
      return {
        success: false,
        error,
        timestamp: new Date(),
        source: providerName
      };
    }

    // Fetch with retry logic
    return this.fetchWithRetry<T>(provider, params, cacheKey);
  }

  private async fetchWithRetry<T>(
    provider: DataProvider,
    params: RequestParams,
    cacheKey: string,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const response = await provider.fetch<T>(params);
      
      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
        this.emit('fetch:success', { provider: provider.name, attempt });
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < this.config.retryAttempts) {
        this.emit('fetch:retry', { 
          provider: provider.name, 
          attempt, 
          error: errorMessage 
        });
        
        // Wait before retry with exponential backoff
        await this.sleep(this.config.retryDelay * Math.pow(2, attempt - 1));
        return this.fetchWithRetry<T>(provider, params, cacheKey, attempt + 1);
      }

      this.emit('fetch:failed', { 
        provider: provider.name, 
        attempts: attempt, 
        error: errorMessage 
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        source: provider.name
      };
    }
  }

  private generateCacheKey(provider: string, params: RequestParams): string {
    return `${provider}:${params.endpoint}:${JSON.stringify(params.body || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL
    });
  }

  private isRateLimited(provider: string): boolean {
    const now = Date.now();
    const key = provider;
    const limit = this.rateLimitCounter.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimitCounter.set(key, {
        count: 1,
        resetTime: now + 60000 // Reset every minute
      });
      return false;
    }

    if (limit.count >= this.config.rateLimit) {
      return true;
    }

    limit.count++;
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Queue management for batch operations
  public async queueRequest<T>(
    providerName: string,
    params: RequestParams
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.fetchData<T>(providerName, params);
          if (response.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Request failed'));
          }
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          this.emit('queue:error', error);
        }
      }
      
      // Small delay between requests to prevent overwhelming
      await this.sleep(100);
    }

    this.isProcessingQueue = false;
  }

  // Health check and monitoring
  public getHealthStatus(): {
    providers: Record<string, boolean>;
    cache: { size: number; hitRate: number };
    queue: { length: number; processing: boolean };
  } {
    const providers: Record<string, boolean> = {};
    for (const [name] of this.providers) {
      providers[name] = true; // In real implementation, check actual health
    }

    return {
      providers,
      cache: {
        size: this.cache.size,
        hitRate: 0.85 // Mock hit rate - would calculate actual in real implementation
      },
      queue: {
        length: this.requestQueue.length,
        processing: this.isProcessingQueue
      }
    };
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    this.emit('service:shutdown:start');

    // Process remaining queue items
    await this.processQueue();

    // Disconnect all providers
    for (const [name, provider] of this.providers) {
      try {
        provider.disconnect();
        this.emit('provider:disconnected', { name });
      } catch (error) {
        this.emit('error', { type: 'shutdown', provider: name, error });
      }
    }

    // Clear cache and cleanup
    this.cache.clear();
    this.providers.clear();
    this.requestQueue = [];

    this.emit('service:shutdown:complete');
  }

  // Public API for external monitoring
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    evictions: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      hitRate: 0.85, // Would calculate actual hit rate
      evictions: 0 // Would track actual evictions
    };
  }

  public getProviderStats(): Array<{
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    requestCount: number;
    errorCount: number;
    lastRequest?: Date;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      status: 'connected', // Would check actual status
      requestCount: 0, // Would track actual requests
      errorCount: 0, // Would track actual errors
      lastRequest: new Date()
    }));
  }
}