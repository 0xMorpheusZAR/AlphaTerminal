/**
 * @fileoverview Advanced rate limiting service with multiple strategies
 * @module RateLimitService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from './CacheService';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig extends ServiceConfig {
  strategies: {
    [key: string]: RateLimitStrategy;
  };
  globalLimits?: {
    windowMs: number;
    maxRequests: number;
  };
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

/**
 * Rate limit strategy
 */
export interface RateLimitStrategy {
  type: 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';
  windowMs: number;
  maxRequests: number;
  skipIf?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  weight?: (req: Request) => number;
  burst?: number; // For token bucket
  refillRate?: number; // For token bucket
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * Token bucket implementation
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Advanced rate limiting service
 */
export class RateLimitService extends BaseService {
  private cacheService: CacheService;
  private strategies: Map<string, RateLimitStrategy> = new Map();
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private rateLimitConfig: RateLimitConfig;
  
  constructor(config: RateLimitConfig, logger: Logger, cacheService: CacheService) {
    super('RateLimitService', config, logger);
    this.dependencies = ['CacheService'];
    this.cacheService = cacheService;
    this.rateLimitConfig = config;
  }
  
  /**
   * Initialize rate limit service
   */
  protected async onInitialize(): Promise<void> {
    // Load strategies
    for (const [name, strategy] of Object.entries(this.rateLimitConfig.strategies)) {
      this.strategies.set(name, strategy);
      this.logger.info(`Loaded rate limit strategy: ${name}`);
    }
    
    // Set up cleanup interval
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }
  
  /**
   * Start rate limit service
   */
  protected async onStart(): Promise<void> {
    this.logger.info('Rate limit service started');
  }
  
  /**
   * Stop rate limit service
   */
  protected async onStop(): Promise<void> {
    this.tokenBuckets.clear();
    this.logger.info('Rate limit service stopped');
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    return {
      status: 'healthy',
      details: {
        strategies: Array.from(this.strategies.keys()),
        buckets: this.tokenBuckets.size
      }
    };
  }
  
  /**
   * Create middleware for rate limiting
   */
  createMiddleware(strategyName: string): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Rate limit strategy not found: ${strategyName}`);
    }
    
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if should skip
        if (strategy.skipIf && strategy.skipIf(req)) {
          return next();
        }
        
        // Generate key
        const key = this.generateKey(req, strategy);
        
        // Check rate limit
        const allowed = await this.checkRateLimit(key, strategy, req);
        
        if (!allowed.allowed) {
          res.setHeader('X-RateLimit-Limit', allowed.info.limit.toString());
          res.setHeader('X-RateLimit-Remaining', allowed.info.remaining.toString());
          res.setHeader('X-RateLimit-Reset', allowed.info.reset.toISOString());
          
          if (allowed.info.retryAfter) {
            res.setHeader('Retry-After', allowed.info.retryAfter.toString());
          }
          
          if (this.rateLimitConfig.handler) {
            return this.rateLimitConfig.handler(req, res);
          }
          
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: allowed.info.retryAfter
          });
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', allowed.info.limit.toString());
        res.setHeader('X-RateLimit-Remaining', allowed.info.remaining.toString());
        res.setHeader('X-RateLimit-Reset', allowed.info.reset.toISOString());
        
        next();
      } catch (error) {
        this.logger.error('Rate limit middleware error:', error);
        next(error);
      }
    };
  }
  
  /**
   * Check rate limit
   */
  private async checkRateLimit(
    key: string,
    strategy: RateLimitStrategy,
    req: Request
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const weight = strategy.weight ? strategy.weight(req) : 1;
    
    switch (strategy.type) {
      case 'fixed-window':
        return this.checkFixedWindow(key, strategy, weight);
      
      case 'sliding-window':
        return this.checkSlidingWindow(key, strategy, weight);
      
      case 'token-bucket':
        return this.checkTokenBucket(key, strategy, weight);
      
      case 'leaky-bucket':
        return this.checkLeakyBucket(key, strategy, weight);
      
      default:
        throw new Error(`Unknown rate limit type: ${strategy.type}`);
    }
  }
  
  /**
   * Fixed window rate limiting
   */
  private async checkFixedWindow(
    key: string,
    strategy: RateLimitStrategy,
    weight: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const windowKey = `ratelimit:fixed:${key}:${Math.floor(Date.now() / strategy.windowMs)}`;
    
    const current = await this.cacheService.get<number>(windowKey) || 0;
    const newCount = current + weight;
    
    if (newCount > strategy.maxRequests) {
      const resetTime = Math.ceil(Date.now() / strategy.windowMs) * strategy.windowMs;
      return {
        allowed: false,
        info: {
          limit: strategy.maxRequests,
          remaining: Math.max(0, strategy.maxRequests - current),
          reset: new Date(resetTime),
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        }
      };
    }
    
    await this.cacheService.set(windowKey, newCount, Math.ceil(strategy.windowMs / 1000));
    
    return {
      allowed: true,
      info: {
        limit: strategy.maxRequests,
        remaining: strategy.maxRequests - newCount,
        reset: new Date(Math.ceil(Date.now() / strategy.windowMs) * strategy.windowMs)
      }
    };
  }
  
  /**
   * Sliding window rate limiting
   */
  private async checkSlidingWindow(
    key: string,
    strategy: RateLimitStrategy,
    weight: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const now = Date.now();
    const windowStart = now - strategy.windowMs;
    const requestKey = `ratelimit:sliding:${key}`;
    
    // Get all requests in the window
    const requests = await this.cacheService.get<Array<{ time: number; weight: number }>>(requestKey) || [];
    
    // Filter out expired requests
    const validRequests = requests.filter(r => r.time > windowStart);
    
    // Calculate total weight
    const totalWeight = validRequests.reduce((sum, r) => sum + r.weight, 0) + weight;
    
    if (totalWeight > strategy.maxRequests) {
      const oldestRequest = validRequests[0];
      const retryAfter = oldestRequest ? Math.ceil((oldestRequest.time + strategy.windowMs - now) / 1000) : 1;
      
      return {
        allowed: false,
        info: {
          limit: strategy.maxRequests,
          remaining: Math.max(0, strategy.maxRequests - totalWeight + weight),
          reset: new Date(now + strategy.windowMs),
          retryAfter
        }
      };
    }
    
    // Add new request
    validRequests.push({ time: now, weight });
    await this.cacheService.set(requestKey, validRequests, Math.ceil(strategy.windowMs / 1000));
    
    return {
      allowed: true,
      info: {
        limit: strategy.maxRequests,
        remaining: strategy.maxRequests - totalWeight,
        reset: new Date(now + strategy.windowMs)
      }
    };
  }
  
  /**
   * Token bucket rate limiting
   */
  private async checkTokenBucket(
    key: string,
    strategy: RateLimitStrategy,
    weight: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const bucketKey = `bucket:${key}`;
    
    if (!this.tokenBuckets.has(bucketKey)) {
      this.tokenBuckets.set(
        bucketKey,
        new TokenBucket(
          strategy.burst || strategy.maxRequests,
          strategy.refillRate || strategy.maxRequests / (strategy.windowMs / 1000)
        )
      );
    }
    
    const bucket = this.tokenBuckets.get(bucketKey)!;
    const allowed = bucket.consume(weight);
    const remaining = Math.floor(bucket.getTokens());
    
    return {
      allowed,
      info: {
        limit: strategy.burst || strategy.maxRequests,
        remaining,
        reset: new Date(Date.now() + strategy.windowMs),
        retryAfter: allowed ? undefined : Math.ceil(weight / (strategy.refillRate || 1))
      }
    };
  }
  
  /**
   * Leaky bucket rate limiting
   */
  private async checkLeakyBucket(
    key: string,
    strategy: RateLimitStrategy,
    weight: number
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const bucketKey = `ratelimit:leaky:${key}`;
    const now = Date.now();
    
    const bucket = await this.cacheService.get<{
      volume: number;
      lastLeak: number;
    }>(bucketKey) || { volume: 0, lastLeak: now };
    
    // Calculate leak
    const leakRate = strategy.maxRequests / (strategy.windowMs / 1000);
    const timeSinceLastLeak = (now - bucket.lastLeak) / 1000;
    const leaked = timeSinceLastLeak * leakRate;
    
    bucket.volume = Math.max(0, bucket.volume - leaked);
    bucket.lastLeak = now;
    
    if (bucket.volume + weight > strategy.maxRequests) {
      const timeToLeak = (bucket.volume + weight - strategy.maxRequests) / leakRate;
      
      return {
        allowed: false,
        info: {
          limit: strategy.maxRequests,
          remaining: Math.max(0, strategy.maxRequests - bucket.volume),
          reset: new Date(now + timeToLeak * 1000),
          retryAfter: Math.ceil(timeToLeak)
        }
      };
    }
    
    bucket.volume += weight;
    await this.cacheService.set(bucketKey, bucket, Math.ceil(strategy.windowMs / 1000));
    
    return {
      allowed: true,
      info: {
        limit: strategy.maxRequests,
        remaining: strategy.maxRequests - bucket.volume,
        reset: new Date(now + strategy.windowMs)
      }
    };
  }
  
  /**
   * Generate rate limit key
   */
  private generateKey(req: Request, strategy: RateLimitStrategy): string {
    if (strategy.keyGenerator) {
      return strategy.keyGenerator(req);
    }
    
    if (this.rateLimitConfig.keyGenerator) {
      return this.rateLimitConfig.keyGenerator(req);
    }
    
    // Default: IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
  
  /**
   * Clean up expired entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    // Clean up old token buckets
    for (const [key, bucket] of this.tokenBuckets.entries()) {
      if (bucket.getTokens() >= (bucket as any).capacity) {
        this.tokenBuckets.delete(key);
      }
    }
    
    this.logger.debug(`Cleaned up rate limit entries, remaining buckets: ${this.tokenBuckets.size}`);
  }
  
  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    const patterns = [
      `ratelimit:fixed:${key}:*`,
      `ratelimit:sliding:${key}`,
      `ratelimit:leaky:${key}`
    ];
    
    for (const pattern of patterns) {
      await this.cacheService.clear(pattern);
    }
    
    this.tokenBuckets.delete(`bucket:${key}`);
    
    this.logger.info(`Reset rate limits for key: ${key}`);
  }
  
  /**
   * Get rate limit info for a key
   */
  async getInfo(key: string, strategyName: string): Promise<RateLimitInfo | null> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return null;
    
    const result = await this.checkRateLimit(key, strategy, { ip: key } as Request);
    return result.info;
  }
}