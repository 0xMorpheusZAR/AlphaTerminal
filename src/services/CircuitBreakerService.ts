/**
 * @fileoverview Circuit breaker service for fault tolerance
 * @module CircuitBreakerService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig extends ServiceConfig {
  breakers: {
    [name: string]: BreakerOptions;
  };
  defaults?: BreakerOptions;
}

/**
 * Individual breaker options
 */
export interface BreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
  errorThresholdPercentage?: number;
  requestVolumeThreshold?: number;
  sleepWindow?: number;
  rollingWindow?: number;
  fallback?: (...args: any[]) => Promise<any>;
}

/**
 * Circuit breaker statistics
 */
interface BreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  rejections: number;
  timeouts: number;
  fallbacks: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttempt?: Date;
  totalRequests: number;
  errorPercentage: number;
}

/**
 * Request metrics for rolling window
 */
interface RequestMetrics {
  timestamp: number;
  success: boolean;
  duration: number;
  error?: Error;
}

/**
 * Individual circuit breaker
 */
class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private rejections: number = 0;
  private timeouts: number = 0;
  private fallbacks: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttempt?: Date;
  private metrics: RequestMetrics[] = [];
  private halfOpenRequests: number = 0;
  
  constructor(
    private name: string,
    private options: Required<BreakerOptions>,
    private logger: Logger
  ) {
    super();
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (!this.shouldAttemptReset()) {
        this.rejections++;
        this.emit('rejected', this.name);
        
        if (this.options.fallback) {
          this.fallbacks++;
          return this.options.fallback(...args);
        }
        
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      
      // Move to half-open state
      this.state = CircuitState.HALF_OPEN;
      this.emit('half-open', this.name);
      this.logger.info(`Circuit breaker ${this.name} entering HALF-OPEN state`);
    }
    
    // Check volume threshold
    if (!this.hasEnoughVolume()) {
      return this.executeFunction(fn, args);
    }
    
    // Execute with circuit breaker logic
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++;
      
      try {
        const result = await this.executeFunction(fn, args);
        this.handleSuccess();
        return result;
      } catch (error) {
        this.handleFailure(error);
        throw error;
      } finally {
        this.halfOpenRequests--;
      }
    }
    
    // Normal execution (CLOSED state)
    try {
      const result = await this.executeFunction(fn, args);
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure(error);
      
      if (this.options.fallback) {
        this.fallbacks++;
        return this.options.fallback(...args);
      }
      
      throw error;
    }
  }
  
  /**
   * Execute the actual function with timeout
   */
  private async executeFunction<T>(
    fn: (...args: any[]) => Promise<T>,
    args: any[]
  ): Promise<T> {
    const startTime = Date.now();
    
    return new Promise<T>(async (resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      let completed = false;
      
      // Set timeout
      if (this.options.timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!completed) {
            completed = true;
            this.timeouts++;
            const error = new Error(`Timeout after ${this.options.timeout}ms`);
            this.recordMetric(startTime, false, error);
            reject(error);
          }
        }, this.options.timeout);
      }
      
      try {
        const result = await fn(...args);
        
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId!);
          this.recordMetric(startTime, true);
          resolve(result);
        }
      } catch (error) {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId!);
          this.recordMetric(startTime, false, error);
          reject(error);
        }
      }
    });
  }
  
  /**
   * Handle successful execution
   */
  private handleSuccess(): void {
    this.successes++;
    this.lastSuccessTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failures = 0;
    }
    
    this.emit('success', this.name);
  }
  
  /**
   * Handle failed execution
   */
  private handleFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
    } else if (this.state === CircuitState.CLOSED) {
      if (this.shouldOpen()) {
        this.open();
      }
    }
    
    this.emit('failure', this.name, error);
  }
  
  /**
   * Check if circuit should open
   */
  private shouldOpen(): boolean {
    // Check failure threshold
    if (this.failures >= this.options.failureThreshold) {
      return true;
    }
    
    // Check error percentage
    const errorPercentage = this.getErrorPercentage();
    if (errorPercentage >= this.options.errorThresholdPercentage) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) return true;
    return Date.now() >= this.nextAttempt.getTime();
  }
  
  /**
   * Check if has enough volume for decisions
   */
  private hasEnoughVolume(): boolean {
    const recentMetrics = this.getRecentMetrics();
    return recentMetrics.length >= this.options.requestVolumeThreshold;
  }
  
  /**
   * Open the circuit
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = new Date(Date.now() + this.options.sleepWindow);
    
    this.emit('open', this.name);
    this.logger.warn(`Circuit breaker ${this.name} is now OPEN`);
  }
  
  /**
   * Close the circuit
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = undefined;
    
    this.emit('close', this.name);
    this.logger.info(`Circuit breaker ${this.name} is now CLOSED`);
  }
  
  /**
   * Record request metric
   */
  private recordMetric(startTime: number, success: boolean, error?: Error): void {
    const metric: RequestMetrics = {
      timestamp: Date.now(),
      success,
      duration: Date.now() - startTime,
      error
    };
    
    this.metrics.push(metric);
    
    // Clean old metrics
    const cutoff = Date.now() - this.options.rollingWindow;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }
  
  /**
   * Get recent metrics within rolling window
   */
  private getRecentMetrics(): RequestMetrics[] {
    const cutoff = Date.now() - this.options.rollingWindow;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }
  
  /**
   * Calculate error percentage
   */
  private getErrorPercentage(): number {
    const recent = this.getRecentMetrics();
    if (recent.length === 0) return 0;
    
    const errors = recent.filter(m => !m.success).length;
    return (errors / recent.length) * 100;
  }
  
  /**
   * Get circuit breaker statistics
   */
  getStats(): BreakerStats {
    const recent = this.getRecentMetrics();
    
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      rejections: this.rejections,
      timeouts: this.timeouts,
      fallbacks: this.fallbacks,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttempt: this.nextAttempt,
      totalRequests: recent.length,
      errorPercentage: this.getErrorPercentage()
    };
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.rejections = 0;
    this.timeouts = 0;
    this.fallbacks = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttempt = undefined;
    this.metrics = [];
    this.halfOpenRequests = 0;
    
    this.emit('reset', this.name);
    this.logger.info(`Circuit breaker ${this.name} has been reset`);
  }
}

/**
 * Circuit breaker service
 */
export class CircuitBreakerService extends BaseService {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultOptions: Required<BreakerOptions>;
  private cbConfig: CircuitBreakerConfig;
  
  constructor(config: CircuitBreakerConfig, logger: Logger) {
    super('CircuitBreakerService', config, logger);
    this.dependencies = [];
    this.cbConfig = config;
    
    // Set default options
    this.defaultOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 3000,
      resetTimeout: 30000,
      volumeThreshold: 10,
      errorThresholdPercentage: 50,
      requestVolumeThreshold: 20,
      sleepWindow: 60000,
      rollingWindow: 60000,
      fallback: undefined,
      ...config.defaults
    };
  }
  
  /**
   * Initialize circuit breaker service
   */
  protected async onInitialize(): Promise<void> {
    // Create breakers from config
    for (const [name, options] of Object.entries(this.cbConfig.breakers)) {
      this.createBreaker(name, options);
    }
    
    // Set up periodic stats reporting
    setInterval(() => {
      this.reportStats();
    }, 60000); // Every minute
  }
  
  /**
   * Start circuit breaker service
   */
  protected async onStart(): Promise<void> {
    this.logger.info('Circuit breaker service started');
  }
  
  /**
   * Stop circuit breaker service
   */
  protected async onStop(): Promise<void> {
    // Remove all listeners
    for (const breaker of this.breakers.values()) {
      breaker.removeAllListeners();
    }
    
    this.breakers.clear();
    this.logger.info('Circuit breaker service stopped');
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    const breakerStats: Record<string, BreakerStats> = {};
    
    for (const [name, breaker] of this.breakers) {
      breakerStats[name] = breaker.getStats();
    }
    
    const openBreakers = Object.values(breakerStats)
      .filter(stats => stats.state === CircuitState.OPEN).length;
    
    return {
      status: openBreakers > 0 ? 'degraded' : 'healthy',
      details: {
        breakers: breakerStats,
        openBreakers
      }
    };
  }
  
  /**
   * Create a circuit breaker
   */
  createBreaker(name: string, options?: BreakerOptions): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }
    
    const breakerOptions = { ...this.defaultOptions, ...options };
    const breaker = new CircuitBreaker(name, breakerOptions, this.logger);
    
    // Set up event listeners
    breaker.on('open', (breakerName) => {
      this.emit('breaker:open', breakerName);
    });
    
    breaker.on('close', (breakerName) => {
      this.emit('breaker:close', breakerName);
    });
    
    breaker.on('half-open', (breakerName) => {
      this.emit('breaker:half-open', breakerName);
    });
    
    this.breakers.set(name, breaker);
    this.logger.info(`Created circuit breaker: ${name}`);
    
    return breaker;
  }
  
  /**
   * Get a circuit breaker
   */
  getBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
  
  /**
   * Execute function with circuit breaker
   */
  async execute<T>(
    breakerName: string,
    fn: (...args: any[]) => Promise<T>,
    ...args: any[]
  ): Promise<T> {
    let breaker = this.breakers.get(breakerName);
    
    if (!breaker) {
      breaker = this.createBreaker(breakerName);
    }
    
    return breaker.execute(fn, ...args);
  }
  
  /**
   * Wrap function with circuit breaker
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    breakerName: string,
    fn: T,
    options?: BreakerOptions
  ): T {
    const breaker = this.createBreaker(breakerName, options);
    
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return breaker.execute(fn, ...args);
    }) as T;
  }
  
  /**
   * Reset a circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    
    this.logger.info('All circuit breakers reset');
  }
  
  /**
   * Get all breaker stats
   */
  getAllStats(): Record<string, BreakerStats> {
    const stats: Record<string, BreakerStats> = {};
    
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    
    return stats;
  }
  
  /**
   * Report circuit breaker statistics
   */
  private reportStats(): void {
    const stats = this.getAllStats();
    const summary = {
      total: this.breakers.size,
      open: 0,
      halfOpen: 0,
      closed: 0
    };
    
    for (const breakerStats of Object.values(stats)) {
      switch (breakerStats.state) {
        case CircuitState.OPEN:
          summary.open++;
          break;
        case CircuitState.HALF_OPEN:
          summary.halfOpen++;
          break;
        case CircuitState.CLOSED:
          summary.closed++;
          break;
      }
    }
    
    this.logger.info('Circuit breaker statistics', summary);
  }
}