import { SuperClaudeFramework } from '../core/SuperClaudeFramework';
import { EventEmitter } from 'events';

export interface CoinGeckoMCPConfig {
  enableCache: boolean;
  cacheTimeout: number;
  maxRequestsPerMinute: number;
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

export class CoinGeckoMCPService extends EventEmitter {
  private framework: SuperClaudeFramework;
  private config: CoinGeckoMCPConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private requestCount: number = 0;
  private requestResetTime: number = Date.now() + 60000;

  constructor(framework: SuperClaudeFramework, config?: Partial<CoinGeckoMCPConfig>) {
    super();
    this.framework = framework;
    this.config = {
      enableCache: true,
      cacheTimeout: 30000, // 30 seconds
      maxRequestsPerMinute: 50,
      ...config
    };
  }

  async initialize(): Promise<void> {
    // Use Backend persona to design CoinGecko MCP integration
    const result = await this.framework.processTask({
      command: '/design',
      input: `Design CoinGecko MCP server integration:
        - Efficient API rate limit management
        - Smart caching strategies
        - Error handling and retry logic
        - Data transformation pipeline
        - Real-time update mechanisms`,
      context: {
        service: 'coingecko-mcp',
        integration: 'market-data',
        requirements: ['reliable', 'performant']
      }
    });

    this.emit('initialized', result);
  }

  async getMarketData(params: {
    vs_currency?: string;
    ids?: string[];
    category?: string;
    order?: string;
    per_page?: number;
    page?: number;
    sparkline?: boolean;
    price_change_percentage?: string;
  }): Promise<MarketData[]> {
    const cacheKey = `market_${JSON.stringify(params)}`;
    
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Check rate limits
    await this.checkRateLimit();

    // Use Analyzer persona to process market data
    const result = await this.framework.processTask({
      command: '/analyze',
      input: `Fetch and analyze CoinGecko market data:
        - Currency: ${params.vs_currency || 'usd'}
        - Category: ${params.category || 'all'}
        - Include sparkline data: ${params.sparkline || false}
        - Process price changes and trends`,
      context: {
        analysis: 'market-data',
        source: 'coingecko-mcp'
      }
    });

    // Mock CoinGecko MCP response
    const marketData = this.mockMarketData(params);
    
    // Cache the result
    if (this.config.enableCache) {
      this.setCache(cacheKey, marketData);
    }

    this.emit('market:data', marketData);
    return marketData;
  }

  async getTrending(): Promise<TrendingCoin[]> {
    const cacheKey = 'trending';
    
    // Check cache
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    await this.checkRateLimit();

    // Use Analyzer persona for trending analysis
    const result = await this.framework.processTask({
      input: `Analyze trending cryptocurrencies:
        - Identify top trending coins
        - Calculate momentum scores
        - Detect unusual activity
        - Provide trend insights`,
      context: {
        analysis: 'trending-coins',
        realtime: true
      }
    });

    // Mock trending data
    const trending = this.mockTrendingData();
    
    if (this.config.enableCache) {
      this.setCache(cacheKey, trending);
    }

    this.emit('trending:update', trending);
    return trending;
  }

  async getGlobalData(): Promise<any> {
    const cacheKey = 'global';
    
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    await this.checkRateLimit();

    const result = await this.framework.processTask({
      input: `Fetch global cryptocurrency market data:
        - Total market cap
        - Total volume
        - Market dominance
        - DeFi statistics`,
      context: {
        analysis: 'global-metrics'
      }
    });

    const globalData = {
      data: {
        active_cryptocurrencies: 10000,
        markets: 800,
        total_market_cap: {
          usd: 1750000000000,
          btc: 40000000
        },
        total_volume: {
          usd: 85000000000,
          btc: 2000000
        },
        market_cap_percentage: {
          btc: 48.5,
          eth: 18.2,
          bnb: 3.8,
          sol: 2.5,
          xrp: 2.1
        },
        market_cap_change_percentage_24h_usd: 2.5,
        updated_at: Date.now() / 1000
      }
    };

    if (this.config.enableCache) {
      this.setCache(cacheKey, globalData);
    }

    this.emit('global:update', globalData);
    return globalData;
  }

  async getPriceHistory(coinId: string, params: {
    vs_currency?: string;
    days?: string;
    interval?: string;
  }): Promise<any> {
    const cacheKey = `history_${coinId}_${JSON.stringify(params)}`;
    
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    await this.checkRateLimit();

    const result = await this.framework.processTask({
      input: `Fetch price history for ${coinId}:
        - Time range: ${params.days || '7'} days
        - Interval: ${params.interval || 'daily'}
        - Include volume data`,
      context: {
        analysis: 'price-history',
        coin: coinId
      }
    });

    // Generate mock historical data
    const days = parseInt(params.days || '7');
    const prices: number[][] = [];
    const volumes: number[][] = [];
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < days * 24; i++) {
      const timestamp = startTime + i * 60 * 60 * 1000;
      const price = 45000 + Math.random() * 5000;
      const volume = 1000000000 + Math.random() * 500000000;
      prices.push([timestamp, price]);
      volumes.push([timestamp, volume]);
    }

    const historyData = {
      prices,
      market_caps: prices.map(([t, p]) => [t, p * 21000000]),
      total_volumes: volumes
    };

    if (this.config.enableCache) {
      this.setCache(cacheKey, historyData);
    }

    return historyData;
  }

  async searchCoins(query: string): Promise<any> {
    await this.checkRateLimit();

    const result = await this.framework.processTask({
      input: `Search for cryptocurrency: ${query}
        - Find matching coins by name or symbol
        - Include market data
        - Rank by relevance`,
      context: {
        search: 'coins',
        query
      }
    });

    // Mock search results
    const searchResults = {
      coins: [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          market_cap_rank: 1,
          thumb: 'https://example.com/btc.png'
        }
      ]
    };

    return searchResults;
  }

  // Helper methods
  private async checkRateLimit(): Promise<void> {
    if (Date.now() > this.requestResetTime) {
      this.requestCount = 0;
      this.requestResetTime = Date.now() + 60000;
    }

    if (this.requestCount >= this.config.maxRequestsPerMinute) {
      const waitTime = this.requestResetTime - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestCount++;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  private mockMarketData(params: any): MarketData[] {
    const coins = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', rank: 1, basePrice: 45000 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', rank: 2, basePrice: 2500 },
      { id: 'binancecoin', symbol: 'bnb', name: 'BNB', rank: 3, basePrice: 300 },
      { id: 'solana', symbol: 'sol', name: 'Solana', rank: 4, basePrice: 100 },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', rank: 5, basePrice: 0.6 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', rank: 6, basePrice: 0.5 },
      { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', rank: 7, basePrice: 35 },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot', rank: 8, basePrice: 7 }
    ];

    return coins.slice(0, params.per_page || 10).map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.basePrice * (0.95 + Math.random() * 0.1),
      market_cap: coin.basePrice * (21000000 - coin.rank * 1000000) * (0.95 + Math.random() * 0.1),
      market_cap_rank: coin.rank,
      total_volume: coin.basePrice * 1000000 * (50 + Math.random() * 50),
      price_change_percentage_24h: (Math.random() - 0.5) * 20,
      price_change_percentage_7d: (Math.random() - 0.5) * 30,
      sparkline_in_7d: params.sparkline ? {
        price: Array(168).fill(0).map(() => coin.basePrice * (0.9 + Math.random() * 0.2))
      } : undefined,
      last_updated: new Date().toISOString()
    }));
  }

  private mockTrendingData(): TrendingCoin[] {
    const trending = [
      { id: 'pepe', symbol: 'PEPE', name: 'Pepe', rank: 45 },
      { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', rank: 20 },
      { id: 'worldcoin', symbol: 'WLD', name: 'Worldcoin', rank: 65 }
    ];

    return trending.map((coin, index) => ({
      item: {
        id: coin.id,
        coin_id: index + 1,
        name: coin.name,
        symbol: coin.symbol,
        market_cap_rank: coin.rank,
        thumb: `https://example.com/${coin.id}.png`,
        price_btc: 0.000001 * (index + 1),
        score: index
      }
    }));
  }

  // Real-time subscriptions
  subscribeToPrice(coinIds: string[], callback: (data: any) => void): void {
    // Set up WebSocket or polling for real-time prices
    const interval = setInterval(async () => {
      const data = await this.getMarketData({
        ids: coinIds,
        sparkline: false
      });
      callback(data);
    }, 5000);

    this.on('unsubscribe', () => clearInterval(interval));
  }

  unsubscribe(): void {
    this.emit('unsubscribe');
    this.removeAllListeners();
  }
}