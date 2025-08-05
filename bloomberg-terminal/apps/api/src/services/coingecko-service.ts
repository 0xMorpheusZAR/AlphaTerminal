import axios, { AxiosInstance } from 'axios';
import { RedisCache } from './redis-cache';
import { logger } from '../utils/logger';

export interface MarketData {
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
  last_updated: string;
  sparkline_in_7d: {
    price: number[];
  };
}

export interface GlobalData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ongoing_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: { [key: string]: number };
  total_volume: { [key: string]: number };
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
}

export class CoinGeckoService {
  private client: AxiosInstance;
  private cache: RedisCache;
  private rateLimiter: Map<string, number> = new Map();
  
  // CoinGecko Pro rate limits: 500 calls/minute
  private readonly RATE_LIMIT = 500;
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute
  
  constructor(apiKey: string, cache: RedisCache) {
    this.client = axios.create({
      baseURL: 'https://pro-api.coingecko.com/api/v3',
      headers: {
        'x-cg-pro-api-key': apiKey,
      },
      timeout: 10000,
    });
    
    this.cache = cache;
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.checkRateLimit();
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('CoinGecko rate limit exceeded');
        } else if (error.response?.status === 401) {
          logger.error('Invalid CoinGecko API key');
        }
        return Promise.reject(error);
      }
    );
  }
  
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.RATE_WINDOW;
    
    // Clean old entries
    for (const [timestamp] of this.rateLimiter) {
      if (parseInt(timestamp) < windowStart) {
        this.rateLimiter.delete(timestamp);
      }
    }
    
    // Check if we're at the limit
    if (this.rateLimiter.size >= this.RATE_LIMIT) {
      const oldestCall = Math.min(...Array.from(this.rateLimiter.keys()).map(Number));
      const waitTime = this.RATE_WINDOW - (now - oldestCall);
      
      if (waitTime > 0) {
        logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Record this call
    this.rateLimiter.set(now.toString(), now);
  }
  
  async getMarkets(
    vsCurrency = 'usd',
    options: {
      ids?: string[];
      category?: string;
      order?: string;
      perPage?: number;
      page?: number;
      sparkline?: boolean;
      priceChangePercentage?: string;
    } = {}
  ): Promise<MarketData[]> {
    const cacheKey = `markets:${vsCurrency}:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const params = {
        vs_currency: vsCurrency,
        ids: options.ids?.join(','),
        category: options.category,
        order: options.order || 'market_cap_desc',
        per_page: options.perPage || 250,
        page: options.page || 1,
        sparkline: options.sparkline !== false,
        price_change_percentage: options.priceChangePercentage || '1h,24h,7d',
      };
      
      const response = await this.client.get<MarketData[]>('/coins/markets', { params });
      
      // Cache for 1 minute
      await this.cache.set(cacheKey, response.data, 60);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch market data:', error);
      throw error;
    }
  }
  
  async getGlobalData(): Promise<GlobalData> {
    const cacheKey = 'global';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get<{ data: GlobalData }>('/global');
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, response.data.data, 300);
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch global data:', error);
      throw error;
    }
  }
  
  async getCoinDetails(id: string): Promise<any> {
    const cacheKey = `coin:${id}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get(`/coins/${id}`, {
        params: {
          localization: false,
          tickers: true,
          market_data: true,
          community_data: true,
          developer_data: true,
          sparkline: true,
        },
      });
      
      // Cache for 2 minutes
      await this.cache.set(cacheKey, response.data, 120);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch coin details for ${id}:`, error);
      throw error;
    }
  }
  
  async getOHLC(
    id: string,
    vsCurrency: string,
    days: number
  ): Promise<number[][]> {
    const cacheKey = `ohlc:${id}:${vsCurrency}:${days}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get(`/coins/${id}/ohlc`, {
        params: {
          vs_currency: vsCurrency,
          days,
        },
      });
      
      // Cache based on timeframe
      const ttl = days <= 1 ? 60 : days <= 7 ? 300 : 3600;
      await this.cache.set(cacheKey, response.data, ttl);
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch OHLC for ${id}:`, error);
      throw error;
    }
  }
  
  async getTrending(): Promise<any> {
    const cacheKey = 'trending';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get('/search/trending');
      
      // Cache for 10 minutes
      await this.cache.set(cacheKey, response.data, 600);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch trending data:', error);
      throw error;
    }
  }
  
  async getExchanges(perPage = 100, page = 1): Promise<any[]> {
    const cacheKey = `exchanges:${perPage}:${page}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get('/exchanges', {
        params: {
          per_page: perPage,
          page,
        },
      });
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, response.data, 300);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch exchanges:', error);
      throw error;
    }
  }
  
  async getDerivatives(): Promise<any[]> {
    const cacheKey = 'derivatives';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get('/derivatives');
      
      // Cache for 2 minutes
      await this.cache.set(cacheKey, response.data, 120);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch derivatives:', error);
      throw error;
    }
  }
  
  async getNFTs(
    order = 'market_cap_usd_desc',
    perPage = 100,
    page = 1
  ): Promise<any[]> {
    const cacheKey = `nfts:${order}:${perPage}:${page}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.client.get('/nfts/list', {
        params: {
          order,
          per_page: perPage,
          page,
        },
      });
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, response.data, 300);
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch NFTs:', error);
      throw error;
    }
  }
  
  async getDefiProtocols(): Promise<any[]> {
    const cacheKey = 'defi-protocols';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      // Get DeFi category coins
      const response = await this.getMarkets('usd', {
        category: 'decentralized-finance-defi',
        perPage: 250,
        sparkline: false,
      });
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, response, 300);
      
      return response;
    } catch (error) {
      logger.error('Failed to fetch DeFi protocols:', error);
      throw error;
    }
  }
}