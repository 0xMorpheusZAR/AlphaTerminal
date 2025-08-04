import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import winston from 'winston';
import { CryptoData, MarketMetrics } from '../types';

interface DataProvider {
  name: string;
  client: AxiosInstance;
  priority: number;
  rateLimit: {
    requests: number;
    window: number;
    current: number;
    resetTime: number;
  };
}

export class CryptoDataService extends EventEmitter {
  private providers: Map<string, DataProvider>;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number;
  private logger: winston.Logger;

  constructor(config?: {
    cacheTTL?: number;
    logger?: winston.Logger;
  }) {
    super();
    this.providers = new Map();
    this.cache = new Map();
    this.cacheTTL = config?.cacheTTL || 60000; // 1 minute default
    this.logger = config?.logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // CoinGecko Provider
    if (process.env.COINGECKO_API_KEY) {
      this.addProvider({
        name: 'coingecko',
        baseUrl: 'https://pro-api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY,
        priority: 1,
        rateLimit: { requests: 500, window: 60000 }
      });
    }

    // Binance Provider
    if (process.env.BINANCE_API_KEY) {
      this.addProvider({
        name: 'binance',
        baseUrl: 'https://api.binance.com/api/v3',
        apiKey: process.env.BINANCE_API_KEY,
        priority: 2,
        rateLimit: { requests: 1200, window: 60000 }
      });
    }

    // Mock Provider (for development)
    if (process.env.ENABLE_MOCK_DATA === 'true') {
      this.addProvider({
        name: 'mock',
        baseUrl: 'http://localhost:3000/mock',
        priority: 99,
        rateLimit: { requests: 10000, window: 60000 }
      });
    }
  }

  private addProvider(config: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    priority: number;
    rateLimit: { requests: number; window: number };
  }): void {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      if (config.name === 'coingecko') {
        headers['x-cg-pro-api-key'] = config.apiKey;
      } else if (config.name === 'binance') {
        headers['X-MBX-APIKEY'] = config.apiKey;
      }
    }

    const provider: DataProvider = {
      name: config.name,
      client: axios.create({
        baseURL: config.baseUrl,
        headers,
        timeout: 10000
      }),
      priority: config.priority,
      rateLimit: {
        ...config.rateLimit,
        current: 0,
        resetTime: Date.now() + config.rateLimit.window
      }
    };

    this.providers.set(config.name, provider);
    this.logger.info(`Data provider ${config.name} initialized`);
  }

  async getMarketData(symbols?: string[]): Promise<CryptoData[]> {
    const cacheKey = `market_data_${symbols?.join(',') || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Try providers in priority order
      const sortedProviders = Array.from(this.providers.values())
        .sort((a, b) => a.priority - b.priority);

      for (const provider of sortedProviders) {
        if (!this.checkRateLimit(provider)) continue;

        try {
          const data = await this.fetchMarketDataFromProvider(provider, symbols);
          this.setCache(cacheKey, data);
          return data;
        } catch (error) {
          this.logger.error(`Provider ${provider.name} failed`, error);
          continue;
        }
      }

      // If all providers fail, return mock data in development
      if (process.env.ENABLE_MOCK_DATA === 'true') {
        return this.generateMockMarketData(symbols);
      }

      throw new Error('All data providers failed');
    } catch (error) {
      this.logger.error('Failed to fetch market data', error);
      throw error;
    }
  }

  private async fetchMarketDataFromProvider(
    provider: DataProvider,
    symbols?: string[]
  ): Promise<CryptoData[]> {
    this.incrementRateLimit(provider);

    switch (provider.name) {
      case 'coingecko':
        return await this.fetchFromCoinGecko(provider, symbols);
      case 'binance':
        return await this.fetchFromBinance(provider, symbols);
      case 'mock':
        return this.generateMockMarketData(symbols);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  private async fetchFromCoinGecko(
    provider: DataProvider,
    symbols?: string[]
  ): Promise<CryptoData[]> {
    const ids = symbols?.join(',') || 'bitcoin,ethereum,binancecoin,cardano,solana';
    const response = await provider.client.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: ids,
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false
      }
    });

    return response.data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      priceChange24h: coin.price_change_percentage_24h,
      priceChange7d: coin.price_change_percentage_7d_in_currency,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      lastUpdated: new Date(coin.last_updated)
    }));
  }

  private async fetchFromBinance(
    provider: DataProvider,
    symbols?: string[]
  ): Promise<CryptoData[]> {
    const response = await provider.client.get('/ticker/24hr');
    const tickers = response.data;

    // Filter by symbols if provided
    let filtered = tickers;
    if (symbols && symbols.length > 0) {
      const symbolSet = new Set(symbols.map(s => s.toUpperCase()));
      filtered = tickers.filter((t: any) => {
        const base = t.symbol.replace('USDT', '').replace('BUSD', '');
        return symbolSet.has(base);
      });
    }

    return filtered
      .filter((t: any) => t.symbol.endsWith('USDT'))
      .map((ticker: any) => ({
        symbol: ticker.symbol.replace('USDT', ''),
        name: ticker.symbol.replace('USDT', ''),
        price: parseFloat(ticker.lastPrice),
        marketCap: parseFloat(ticker.quoteVolume) * parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        priceChange24h: parseFloat(ticker.priceChangePercent),
        priceChange7d: 0, // Binance doesn't provide 7d change
        circulatingSupply: 0, // Not available from Binance ticker
        totalSupply: 0,
        lastUpdated: new Date()
      }));
  }

  private generateMockMarketData(symbols?: string[]): CryptoData[] {
    const defaultSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'MATIC'];
    const useSymbols = symbols || defaultSymbols;

    return useSymbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      name: this.getTokenName(symbol),
      price: this.randomPrice(symbol),
      marketCap: this.randomMarketCap(symbol),
      volume24h: this.randomVolume(),
      priceChange24h: (Math.random() - 0.5) * 20,
      priceChange7d: (Math.random() - 0.5) * 40,
      circulatingSupply: Math.random() * 1000000000,
      totalSupply: Math.random() * 2000000000,
      lastUpdated: new Date()
    }));
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      BNB: 'Binance Coin',
      SOL: 'Solana',
      ADA: 'Cardano',
      XRP: 'Ripple',
      DOT: 'Polkadot',
      DOGE: 'Dogecoin',
      AVAX: 'Avalanche',
      MATIC: 'Polygon'
    };
    return names[symbol.toUpperCase()] || symbol;
  }

  private randomPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      BTC: 45000,
      ETH: 3000,
      BNB: 400,
      SOL: 100,
      ADA: 0.5,
      XRP: 0.8,
      DOT: 10,
      DOGE: 0.1,
      AVAX: 40,
      MATIC: 1.5
    };
    const base = basePrices[symbol.toUpperCase()] || 1;
    return base * (0.9 + Math.random() * 0.2);
  }

  private randomMarketCap(symbol: string): number {
    const baseMarketCaps: Record<string, number> = {
      BTC: 900000000000,
      ETH: 400000000000,
      BNB: 80000000000,
      SOL: 40000000000,
      ADA: 20000000000,
      XRP: 30000000000,
      DOT: 15000000000,
      DOGE: 12000000000,
      AVAX: 18000000000,
      MATIC: 14000000000
    };
    const base = baseMarketCaps[symbol.toUpperCase()] || 1000000000;
    return base * (0.9 + Math.random() * 0.2);
  }

  private randomVolume(): number {
    return Math.random() * 10000000000;
  }

  async getMarketMetrics(): Promise<MarketMetrics> {
    const cacheKey = 'market_metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const marketData = await this.getMarketData();
      const totalMarketCap = marketData.reduce((sum, coin) => sum + coin.marketCap, 0);
      const totalVolume24h = marketData.reduce((sum, coin) => sum + coin.volume24h, 0);
      
      const btc = marketData.find(coin => coin.symbol === 'BTC');
      const eth = marketData.find(coin => coin.symbol === 'ETH');
      
      const metrics: MarketMetrics = {
        totalMarketCap,
        totalVolume24h,
        btcDominance: btc ? (btc.marketCap / totalMarketCap) * 100 : 0,
        ethDominance: eth ? (eth.marketCap / totalMarketCap) * 100 : 0,
        fearGreedIndex: Math.floor(Math.random() * 100), // Mock for now
        altcoinSeason: totalMarketCap > 0 && btc ? btc.marketCap / totalMarketCap < 0.4 : false
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      this.logger.error('Failed to calculate market metrics', error);
      throw error;
    }
  }

  async detectMarketAnomalies(): Promise<any[]> {
    const marketData = await this.getMarketData();
    const anomalies: any[] = [];

    for (const coin of marketData) {
      // Detect unusual price movements
      if (Math.abs(coin.priceChange24h) > 20) {
        anomalies.push({
          type: 'price_spike',
          symbol: coin.symbol,
          severity: Math.abs(coin.priceChange24h) > 30 ? 'high' : 'medium',
          change: coin.priceChange24h,
          message: `${coin.symbol} ${coin.priceChange24h > 0 ? 'surged' : 'dropped'} ${Math.abs(coin.priceChange24h).toFixed(2)}% in 24h`
        });
      }

      // Detect unusual volume
      const avgVolume = marketData.reduce((sum, c) => sum + c.volume24h, 0) / marketData.length;
      if (coin.volume24h > avgVolume * 5) {
        anomalies.push({
          type: 'volume_spike',
          symbol: coin.symbol,
          severity: coin.volume24h > avgVolume * 10 ? 'high' : 'medium',
          volume: coin.volume24h,
          message: `${coin.symbol} trading volume is ${(coin.volume24h / avgVolume).toFixed(1)}x average`
        });
      }
    }

    return anomalies;
  }

  async predictPriceMovements(symbol: string, timeframe: string = '24h'): Promise<any> {
    // Mock prediction using simple technical analysis
    const marketData = await this.getMarketData([symbol]);
    const coin = marketData[0];
    
    if (!coin) throw new Error(`Symbol ${symbol} not found`);

    const prediction = {
      symbol,
      currentPrice: coin.price,
      predictedPrice: coin.price * (1 + (Math.random() - 0.5) * 0.1),
      confidence: Math.random() * 0.3 + 0.5, // 50-80% confidence
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      indicators: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 10,
        volume: coin.volume24h > 1000000000 ? 'high' : 'normal',
        momentum: coin.priceChange24h > 0 ? 'positive' : 'negative'
      },
      timeframe
    };

    return prediction;
  }

  private checkRateLimit(provider: DataProvider): boolean {
    const now = Date.now();
    
    // Reset counter if window expired
    if (now > provider.rateLimit.resetTime) {
      provider.rateLimit.current = 0;
      provider.rateLimit.resetTime = now + provider.rateLimit.window;
    }

    return provider.rateLimit.current < provider.rateLimit.requests;
  }

  private incrementRateLimit(provider: DataProvider): void {
    provider.rateLimit.current++;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
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
  }

  clearCache(): void {
    this.cache.clear();
  }
}