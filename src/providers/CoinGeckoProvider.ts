import { DataProvider, RequestParams, ApiResponse } from '../services/RefactoredDataService';

export interface CoinGeckoConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  rateLimit: number;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  sparkline_in_7d?: {
    price: number[];
  };
  last_updated: string;
}

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    price_btc: number;
    score: number;
  };
}

export interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export class CoinGeckoProvider implements DataProvider {
  public readonly name = 'CoinGecko MCP';
  private config: CoinGeckoConfig;
  private isInitialized = false;

  constructor(config: Partial<CoinGeckoConfig> = {}) {
    this.config = {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3',
      timeout: 10000,
      rateLimit: 50, // requests per minute
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Test connection with a simple ping
      await this.testConnection();
      this.isInitialized = true;
      console.log('✅ CoinGecko Provider initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ CoinGecko Provider initialization failed:', errorMessage);
      throw new Error(`CoinGecko initialization failed: ${errorMessage}`);
    }
  }

  private async testConnection(): Promise<void> {
    const response = await this.makeRequest('/ping');
    if (!response.gecko_says) {
      throw new Error('CoinGecko API connection test failed');
    }
  }

  async fetch<T>(params: RequestParams): Promise<ApiResponse<T>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Provider not initialized',
        timestamp: new Date(),
        source: this.name
      };
    }

    try {
      // Validate and sanitize input
      const sanitizedParams = this.sanitizeParams(params);
      
      // Route to appropriate handler
      const data = await this.routeRequest<T>(sanitizedParams);
      
      return {
        success: true,
        data,
        timestamp: new Date(),
        source: this.name
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        source: this.name
      };
    }
  }

  private sanitizeParams(params: RequestParams): RequestParams {
    // Input validation and sanitization
    const sanitized = { ...params };
    
    // Ensure endpoint starts with /
    if (!sanitized.endpoint.startsWith('/')) {
      sanitized.endpoint = '/' + sanitized.endpoint;
    }
    
    // Validate method
    if (sanitized.method && !['GET', 'POST'].includes(sanitized.method)) {
      sanitized.method = 'GET';
    }
    
    // Sanitize body parameters
    if (sanitized.body) {
      sanitized.body = this.sanitizeBody(sanitized.body);
    }
    
    return sanitized;
  }

  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // Whitelist allowed parameters
    const allowedParams = [
      'vs_currency', 'ids', 'category', 'order', 'per_page', 'page',
      'sparkline', 'price_change_percentage', 'include_market_cap',
      'include_24hr_vol', 'include_24hr_change', 'include_last_updated_at'
    ];
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedParams.includes(key)) {
        // Additional sanitization based on parameter type
        if (key === 'per_page') {
          sanitized[key] = Math.min(Math.max(1, parseInt(String(value))), 250);
        } else if (key === 'page') {
          sanitized[key] = Math.max(1, parseInt(String(value)));
        } else if (typeof value === 'string') {
          sanitized[key] = value.trim().toLowerCase();
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  private async routeRequest<T>(params: RequestParams): Promise<T> {
    switch (params.endpoint) {
      case '/coins/markets':
        return this.getMarketData(params.body) as Promise<T>;
      
      case '/search/trending':
        return this.getTrendingCoins() as Promise<T>;
      
      case '/global':
        return this.getGlobalData() as Promise<T>;
      
      case '/coins/list':
        return this.getCoinsList() as Promise<T>;
      
      default:
        throw new Error(`Unknown endpoint: ${params.endpoint}`);
    }
  }

  public async getMarketData(params: Record<string, any> = {}): Promise<MarketData[]> {
    const queryParams = new URLSearchParams({
      vs_currency: params.vs_currency || 'usd',
      order: params.order || 'market_cap_desc',
      per_page: String(params.per_page || 100),
      page: String(params.page || 1),
      sparkline: String(params.sparkline || false),
      price_change_percentage: params.price_change_percentage || '24h,7d'
    });

    if (params.ids) {
      queryParams.append('ids', Array.isArray(params.ids) ? params.ids.join(',') : params.ids);
    }

    if (params.category) {
      queryParams.append('category', params.category);
    }

    const data = await this.makeRequest(`/coins/markets?${queryParams.toString()}`);
    return this.transformMarketData(data);
  }

  public async getTrendingCoins(): Promise<TrendingCoin[]> {
    const data = await this.makeRequest('/search/trending');
    return data.coins || [];
  }

  public async getGlobalData(): Promise<GlobalData> {
    const data = await this.makeRequest('/global');
    return data;
  }

  public async getCoinsList(): Promise<Array<{id: string; symbol: string; name: string}>> {
    const data = await this.makeRequest('/coins/list');
    return data;
  }

  public async getCoinHistory(coinId: string, days: number = 7): Promise<any> {
    const data = await this.makeRequest(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
    return data;
  }

  private transformMarketData(rawData: any[]): MarketData[] {
    return rawData.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price || 0,
      market_cap: coin.market_cap || 0,
      market_cap_rank: coin.market_cap_rank || 999999,
      total_volume: coin.total_volume || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      price_change_percentage_7d: coin.price_change_percentage_7d || 0,
      sparkline_in_7d: coin.sparkline_in_7d ? {
        price: coin.sparkline_in_7d.price || []
      } : undefined,
      last_updated: coin.last_updated || new Date().toISOString()
    }));
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'AlphaTerminal/1.0',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add API key if available
    if (this.config.apiKey) {
      headers['x-cg-pro-api-key'] = this.config.apiKey;
    }

    const requestOptions: RequestInit = {
      method: 'GET',
      headers,
      timeout: this.config.timeout,
      ...options
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format - expected JSON');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown request error');
    }
  }

  disconnect(): void {
    this.isInitialized = false;
    console.log('🔌 CoinGecko Provider disconnected');
  }

  // Health check method
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.makeRequest('/ping');
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Rate limit information
  public getRateLimitInfo(): {
    limit: number;
    remaining: number;
    resetTime: Date;
  } {
    // In a real implementation, this would track actual rate limits
    return {
      limit: this.config.rateLimit,
      remaining: Math.floor(Math.random() * this.config.rateLimit),
      resetTime: new Date(Date.now() + 60000)
    };
  }
}