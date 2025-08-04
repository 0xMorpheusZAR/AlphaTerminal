import { RateLimiter } from 'limiter';

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

export class ApiRateLimiter {
  private minuteLimiter: RateLimiter;
  private hourLimiter?: RateLimiter;
  private dayLimiter?: RateLimiter;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(config: RateLimitConfig) {
    // CoinGecko Pro limits: 500 calls/minute
    this.minuteLimiter = new RateLimiter({
      tokensPerInterval: config.requestsPerMinute,
      interval: 'minute',
      fireImmediately: true
    });

    if (config.requestsPerHour) {
      this.hourLimiter = new RateLimiter({
        tokensPerInterval: config.requestsPerHour,
        interval: 'hour',
        fireImmediately: true
      });
    }

    if (config.requestsPerDay) {
      this.dayLimiter = new RateLimiter({
        tokensPerInterval: config.requestsPerDay,
        interval: 'day',
        fireImmediately: true
      });
    }
  }

  async executeRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      // Wait for all rate limiters
      await this.waitForTokens();

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }

      // Add small delay between requests to be respectful
      await this.delay(100);
    }

    this.processing = false;
  }

  private async waitForTokens() {
    const promises = [this.minuteLimiter.removeTokens(1)];

    if (this.hourLimiter) {
      promises.push(this.hourLimiter.removeTokens(1));
    }

    if (this.dayLimiter) {
      promises.push(this.dayLimiter.removeTokens(1));
    }

    await Promise.all(promises);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  getRemainingTokens(): {
    minute: number;
    hour?: number;
    day?: number;
  } {
    const result: any = {
      minute: this.minuteLimiter.getTokensRemaining()
    };

    if (this.hourLimiter) {
      result.hour = this.hourLimiter.getTokensRemaining();
    }

    if (this.dayLimiter) {
      result.day = this.dayLimiter.getTokensRemaining();
    }

    return result;
  }
}

// CoinGecko specific rate limiter
export const coinGeckoRateLimiter = new ApiRateLimiter({
  requestsPerMinute: 30, // Conservative limit for CoinGecko Pro
  requestsPerHour: 1000,
  requestsPerDay: 10000
});

// Velo API rate limiter
export const veloRateLimiter = new ApiRateLimiter({
  requestsPerMinute: 60
});

// DeFiLlama rate limiter (they're generous)
export const defiLlamaRateLimiter = new ApiRateLimiter({
  requestsPerMinute: 300
});