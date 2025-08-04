import { coinGeckoRateLimiter } from './api-rate-limiter';
import { cacheConfig, cacheKeys } from './cache-manager';
import axios, { AxiosInstance } from 'axios';

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_1y_in_currency: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

export interface CoinGeckoHistorical {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export class EnhancedCoinGeckoService {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coingecko.com/api/v3';
  private axios: AxiosInstance;
  private lastRequestTime = 0;
  private requestCount = 0;

  constructor() {
    this.apiKey = process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  CoinGecko API key not found. API calls will return mock data.');
    }

    // Configure axios with retry logic
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Cg-Pro-Api-Key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    // Add request interceptor for logging
    this.axios.interceptors.request.use((config) => {
      this.requestCount++;
      console.log(`[CoinGecko API] Request #${this.requestCount}: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        const remaining = response.headers['x-ratelimit-remaining'];
        if (remaining) {
          console.log(`[CoinGecko API] Rate limit remaining: ${remaining}`);
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 429) {
          console.warn('[CoinGecko API] Rate limit exceeded. Waiting...');
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          await this.delay(retryAfter * 1000);
          return this.axios.request(error.config);
        }
        throw error;
      }
    );
  }

  private async makeRequest<T>(endpoint: string, cacheKey?: string, cacheTTL?: number): Promise<T> {
    if (!this.apiKey) {
      console.log('📊 Returning mock CoinGecko data (no API key)');
      return this.getMockData(endpoint) as T;
    }

    // Check cache first if cache key provided
    if (cacheKey) {
      const cached = await cacheConfig.marketData.get(
        cacheKey,
        async () => this.fetchFromAPI<T>(endpoint),
        cacheTTL
      );
      return cached;
    }

    // Rate limited request without cache
    return coinGeckoRateLimiter.executeRequest(() => this.fetchFromAPI<T>(endpoint));
  }

  private async fetchFromAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.axios.get(endpoint);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      if (response.status >= 400) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[CoinGecko API] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  async getTopCoins(limit: number = 100): Promise<CoinGeckoPrice[]> {
    const endpoint = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y`;
    const cacheKey = cacheKeys.topCoins(limit);
    
    return this.makeRequest<CoinGeckoPrice[]>(endpoint, cacheKey, 60); // 1 minute cache
  }

  async getCoinById(id: string): Promise<any> {
    const endpoint = `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const cacheKey = cacheKeys.coinDetails(id);
    
    return this.makeRequest(endpoint, cacheKey, 300); // 5 minute cache
  }

  async getCoinPrice(id: string): Promise<any> {
    const endpoint = `/simple/price?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
    const cacheKey = cacheKeys.coinPrice(id);
    
    return this.makeRequest(endpoint, cacheKey, 30); // 30 second cache
  }

  async getCoinHistory(id: string, days: number = 365): Promise<CoinGeckoHistorical> {
    const endpoint = `/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const cacheKey = cacheKeys.historical(id, days);
    const cacheTTL = days > 30 ? 3600 : 300; // 1 hour for long history, 5 min for short
    
    return this.makeRequest<CoinGeckoHistorical>(endpoint, cacheKey, cacheTTL);
  }

  async getGlobalData(): Promise<any> {
    const endpoint = '/global';
    const cacheKey = cacheKeys.marketCap();
    
    return this.makeRequest(endpoint, cacheKey, 60); // 1 minute cache
  }

  async getTrendingCoins(): Promise<any> {
    const endpoint = '/search/trending';
    const cacheKey = cacheKeys.trending();
    
    return this.makeRequest(endpoint, cacheKey, 300); // 5 minute cache
  }

  async batchGetPrices(ids: string[]): Promise<any> {
    // Batch requests for efficiency
    const batchSize = 250; // CoinGecko max
    const batches = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const endpoint = `/simple/price?ids=${batch.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
      batches.push(this.makeRequest(endpoint));
    }
    
    const results = await Promise.all(batches);
    return Object.assign({}, ...results);
  }

  // Get multiple coins with caching
  async getMultipleCoins(ids: string[]): Promise<CoinGeckoPrice[]> {
    const cacheResults = cacheConfig.coinDetails.mget<CoinGeckoPrice>(
      ids.map(id => cacheKeys.coinDetails(id))
    );
    
    const missingIds = ids.filter(id => !cacheResults[cacheKeys.coinDetails(id)]);
    
    if (missingIds.length > 0) {
      const endpoint = `/coins/markets?vs_currency=usd&ids=${missingIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y`;
      const freshData = await this.makeRequest<CoinGeckoPrice[]>(endpoint);
      
      // Cache the fresh data
      freshData.forEach(coin => {
        cacheConfig.coinDetails.set(cacheKeys.coinDetails(coin.id), coin, 300);
      });
      
      return [...Object.values(cacheResults).filter(Boolean), ...freshData] as CoinGeckoPrice[];
    }
    
    return Object.values(cacheResults).filter(Boolean) as CoinGeckoPrice[];
  }

  // Health check endpoint
  async checkApiHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    rateLimit: any;
    cacheStats: any;
    message: string;
  }> {
    try {
      const response = await this.axios.get('/ping');
      const rateLimitRemaining = coinGeckoRateLimiter.getRemainingTokens();
      const cacheStats = cacheConfig.marketData.getStats();
      
      return {
        status: 'healthy',
        rateLimit: rateLimitRemaining,
        cacheStats,
        message: 'CoinGecko API is operational'
      };
    } catch (error) {
      return {
        status: 'down',
        rateLimit: coinGeckoRateLimiter.getRemainingTokens(),
        cacheStats: cacheConfig.marketData.getStats(),
        message: 'CoinGecko API is not responding'
      };
    }
  }

  // Clear all caches
  clearCache() {
    Object.values(cacheConfig).forEach(cache => cache.flush());
    console.log('[CoinGecko] All caches cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      marketData: cacheConfig.marketData.getStats(),
      coinDetails: cacheConfig.coinDetails.getStats(),
      historicalData: cacheConfig.historicalData.getStats(),
      staticData: cacheConfig.staticData.getStats()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMockData(endpoint: string): any {
    // Return appropriate mock data based on endpoint
    if (endpoint.includes('/coins/markets')) {
      return this.getMockTopCoins();
    }
    if (endpoint.includes('/global')) {
      return this.getMockGlobalData();
    }
    if (endpoint.includes('/search/trending')) {
      return this.getMockTrendingCoins();
    }
    return {};
  }

  private getMockTopCoins(): CoinGeckoPrice[] {
    return [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 45000,
        market_cap: 880000000000,
        market_cap_rank: 1,
        fully_diluted_valuation: 945000000000,
        total_volume: 25000000000,
        high_24h: 46000,
        low_24h: 44000,
        price_change_24h: 1000,
        price_change_percentage_24h: 2.3,
        price_change_percentage_7d_in_currency: 5.2,
        price_change_percentage_30d_in_currency: 15.8,
        price_change_percentage_1y_in_currency: 120.5,
        market_cap_change_24h: 20000000000,
        market_cap_change_percentage_24h: 2.3,
        circulating_supply: 19500000,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: 69000,
        ath_change_percentage: -34.8,
        ath_date: '2021-11-10T14:24:11.849Z',
        atl: 67.81,
        atl_change_percentage: 66000,
        atl_date: '2013-07-06T00:00:00.000Z',
        roi: null,
        last_updated: new Date().toISOString()
      },
      // Add more mock coins as needed
    ];
  }

  private getMockGlobalData() {
    return {
      data: {
        active_cryptocurrencies: 12854,
        markets: 735,
        total_market_cap: { usd: 2450000000000 },
        total_volume: { usd: 124500000000 },
        market_cap_percentage: { btc: 52.3, eth: 18.7 },
        market_cap_change_percentage_24h_usd: 3.2
      }
    };
  }

  private getMockTrendingCoins() {
    return {
      coins: [
        { item: { id: 'pepe', symbol: 'PEPE', name: 'Pepe' } },
        { item: { id: 'bonk', symbol: 'BONK', name: 'Bonk' } }
      ]
    };
  }

  // Helper methods
  calculateDeclineFromATH(currentPrice: number, ath: number): number {
    return ((ath - currentPrice) / ath) * 100;
  }

  determineRiskLevel(declineFromAth: number): string {
    if (declineFromAth >= 90) return 'extreme';
    if (declineFromAth >= 75) return 'high';
    if (declineFromAth >= 50) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const enhancedCoinGeckoService = new EnhancedCoinGeckoService();