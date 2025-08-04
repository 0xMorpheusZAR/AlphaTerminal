import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiError, NetworkError, TimeoutError } from './error-handler';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

export interface HttpClientConfig extends AxiosRequestConfig {
  retry?: Partial<RetryConfig>;
  rateLimit?: {
    maxRequests: number;
    perMilliseconds: number;
  };
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']
};

export class HttpClient {
  private axios: AxiosInstance;
  private retryConfig: RetryConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private maxConcurrent = 10;

  constructor(config: HttpClientConfig = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    
    this.axios = axios.create({
      timeout: 30000,
      ...config,
      headers: {
        'User-Agent': 'AlphaTerminal/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        if (duration > 5000) {
          console.warn(`Slow request detected: ${response.config.url} took ${duration}ms`);
        }
        return response;
      },
      async (error) => {
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    const config = error.config as any;
    const retryCount = config?.retryCount || 0;

    if (retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    if (error.response) {
      return this.retryConfig.retryableStatuses.includes(error.response.status);
    }

    if (error.code) {
      return this.retryConfig.retryableErrors.includes(error.code);
    }

    return false;
  }

  private async retryRequest(error: AxiosError): Promise<any> {
    const config = error.config as any;
    config.retryCount = (config.retryCount || 0) + 1;

    const delay = this.calculateBackoff(config.retryCount);
    
    console.log(
      `Retrying request to ${config.url} (attempt ${config.retryCount}/${this.retryConfig.maxRetries}) after ${delay}ms`
    );

    await this.sleep(delay);

    return this.axios.request(config);
  }

  private calculateBackoff(retryCount: number): number {
    const exponentialDelay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitteredDelay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message;

      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new ApiError('RateLimit', message, { retryAfter });
      }

      if (status >= 500) {
        throw new ApiError('Server', message, { status });
      }

      throw new ApiError('Client', message, { status, data });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new TimeoutError(error.config?.url || 'Unknown', error.config?.timeout || 0);
    }

    if (error.code) {
      throw new NetworkError(error.message, { code: error.code });
    }

    throw error;
  }

  // Rate-limited request execution
  private async executeWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeRequests >= this.maxConcurrent) {
      await this.sleep(100);
    }

    this.activeRequests++;
    try {
      return await fn();
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  // Public methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRateLimit(async () => {
      const response = await this.axios.get<T>(url, config);
      return response.data;
    });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRateLimit(async () => {
      const response = await this.axios.post<T>(url, data, config);
      return response.data;
    });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRateLimit(async () => {
      const response = await this.axios.put<T>(url, data, config);
      return response.data;
    });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRateLimit(async () => {
      const response = await this.axios.delete<T>(url, config);
      return response.data;
    });
  }

  // Batch request support
  async batch<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map(req => this.executeWithRateLimit(req)));
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch request ${index} failed:`, result.reason);
        throw result.reason;
      }
    });
  }

  // Circuit breaker pattern
  private circuitBreaker = {
    failures: new Map<string, number>(),
    lastFailureTime: new Map<string, number>(),
    threshold: 5,
    timeout: 60000, // 1 minute

    isOpen(key: string): boolean {
      const failures = this.failures.get(key) || 0;
      const lastFailure = this.lastFailureTime.get(key) || 0;
      
      if (failures >= this.threshold) {
        if (Date.now() - lastFailure < this.timeout) {
          return true;
        } else {
          // Reset after timeout
          this.failures.delete(key);
          this.lastFailureTime.delete(key);
          return false;
        }
      }
      
      return false;
    },

    recordSuccess(key: string): void {
      this.failures.delete(key);
      this.lastFailureTime.delete(key);
    },

    recordFailure(key: string): void {
      const current = this.failures.get(key) || 0;
      this.failures.set(key, current + 1);
      this.lastFailureTime.set(key, Date.now());
    }
  };

  async requestWithCircuitBreaker<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.circuitBreaker.isOpen(key)) {
      throw new ApiError('CircuitBreaker', `Circuit breaker is open for ${key}`);
    }

    try {
      const result = await fn();
      this.circuitBreaker.recordSuccess(key);
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure(key);
      throw error;
    }
  }
}

// Export preconfigured clients
export const defaultHttpClient = new HttpClient();

export const apiHttpClient = new HttpClient({
  timeout: 60000,
  retry: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNABORTED']
  }
});