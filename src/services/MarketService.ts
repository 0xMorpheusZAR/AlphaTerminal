import { CryptoDataService } from './CryptoDataService';
import { DetailedMarketData, OrderBook, TradeHistory, OHLCV, MarketSentiment, TechnicalIndicators } from '../types/market';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';
import winston from 'winston';

export class MarketService {
  private cryptoDataService: CryptoDataService;
  private technicalService: TechnicalAnalysisService;
  private logger: winston.Logger;

  constructor() {
    this.cryptoDataService = new CryptoDataService();
    this.technicalService = new TechnicalAnalysisService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    this.logger.debug('MarketService initialized');
  }

  async getMarketData(params: {
    limit: number;
    offset: number;
    sort: string;
  }): Promise<DetailedMarketData[]> {
    const data = await this.cryptoDataService.getMarketData();
    
    // Sort data based on parameter
    const sorted = this.sortMarketData(data, params.sort);
    
    // Apply pagination
    return sorted.slice(params.offset, params.offset + params.limit).map((crypto, index) => ({
      ...crypto,
      rank: params.offset + index + 1,
      ath: crypto.price * (1 + Math.random() * 2), // Mock ATH
      athDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      atl: crypto.price * (Math.random() * 0.5),
      atlDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      roi: Math.random() * 10 - 5,
      fullyDilutedValuation: crypto.marketCap * (1 + Math.random() * 0.5),
      maxSupply: crypto.totalSupply * (1 + Math.random() * 0.2),
      priceChange1h: (Math.random() - 0.5) * 5,
      priceChange30d: (Math.random() - 0.5) * 50,
      priceChange1y: (Math.random() - 0.5) * 200
    }));
  }

  private sortMarketData(data: any[], sortBy: string): any[] {
    switch (sortBy) {
      case 'volume':
        return data.sort((a, b) => b.volume24h - a.volume24h);
      case 'price_change':
        return data.sort((a, b) => b.priceChange24h - a.priceChange24h);
      case 'market_cap':
      default:
        return data.sort((a, b) => b.marketCap - a.marketCap);
    }
  }

  async getCryptoDetails(symbol: string): Promise<DetailedMarketData | null> {
    const data = await this.cryptoDataService.getMarketData([symbol]);
    if (!data || data.length === 0) return null;

    const crypto = data[0];
    return {
      ...crypto,
      rank: Math.floor(Math.random() * 100) + 1,
      ath: crypto.price * (1 + Math.random() * 3),
      athDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      atl: crypto.price * (Math.random() * 0.3),
      atlDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      roi: Math.random() * 20 - 10,
      fullyDilutedValuation: crypto.marketCap * (1 + Math.random() * 0.5),
      maxSupply: crypto.totalSupply * (1 + Math.random() * 0.2),
      priceChange1h: (Math.random() - 0.5) * 5,
      priceChange30d: (Math.random() - 0.5) * 50,
      priceChange1y: (Math.random() - 0.5) * 200
    };
  }

  async getPriceHistory(symbol: string, params: {
    interval: string;
    from?: Date;
    to?: Date;
  }): Promise<OHLCV[]> {
    const to = params.to || new Date();
    const from = params.from || new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days default
    
    const intervalMs = this.getIntervalMs(params.interval);
    const dataPoints = Math.floor((to.getTime() - from.getTime()) / intervalMs);
    
    // Generate mock OHLCV data
    const basePrice = (await this.getCryptoDetails(symbol))?.price || 100;
    const ohlcv: OHLCV[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(from.getTime() + i * intervalMs);
      const volatility = 0.02;
      const trend = Math.sin(i / 10) * 0.01;
      
      const open = i === 0 ? basePrice : ohlcv[i - 1].close;
      const change = (Math.random() - 0.5) * volatility + trend;
      const high = open * (1 + Math.abs(change) + Math.random() * volatility);
      const low = open * (1 - Math.abs(change) - Math.random() * volatility);
      const close = open * (1 + change);
      const volume = Math.random() * 1000000000;
      
      ohlcv.push({ timestamp, open, high, low, close, volume });
    }
    
    return ohlcv;
  }

  private getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    };
    return intervals[interval] || intervals['1h'];
  }

  async getOrderBook(symbol: string, depth: number): Promise<OrderBook> {
    const currentPrice = (await this.getCryptoDetails(symbol))?.price || 100;
    
    const generateOrders = (side: 'bid' | 'ask', count: number) => {
      const orders = [];
      const spread = currentPrice * 0.001; // 0.1% spread
      
      for (let i = 0; i < count; i++) {
        const offset = (i + 1) * spread;
        const price = side === 'bid' 
          ? currentPrice - offset 
          : currentPrice + offset;
        const quantity = Math.random() * 10 + 0.1;
        
        orders.push({
          price: Number(price.toFixed(2)),
          quantity: Number(quantity.toFixed(4)),
          total: Number((price * quantity).toFixed(2))
        });
      }
      
      return orders;
    };
    
    return {
      symbol,
      bids: generateOrders('bid', depth),
      asks: generateOrders('ask', depth),
      timestamp: new Date()
    };
  }

  async getTradeHistory(symbol: string, limit: number): Promise<TradeHistory[]> {
    const currentPrice = (await this.getCryptoDetails(symbol))?.price || 100;
    const trades: TradeHistory[] = [];
    
    for (let i = 0; i < limit; i++) {
      const minutesAgo = i * 0.5;
      const priceVariation = (Math.random() - 0.5) * 0.01 * currentPrice;
      const price = currentPrice + priceVariation;
      const quantity = Math.random() * 5 + 0.01;
      
      trades.push({
        id: `trade_${Date.now()}_${i}`,
        symbol,
        price: Number(price.toFixed(2)),
        quantity: Number(quantity.toFixed(4)),
        total: Number((price * quantity).toFixed(2)),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date(Date.now() - minutesAgo * 60 * 1000)
      });
    }
    
    return trades;
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    const fearGreedIndex = Math.floor(Math.random() * 100);
    
    return {
      fearGreedIndex,
      socialSentiment: {
        twitter: Math.random() * 100 - 50,
        reddit: Math.random() * 100 - 50,
        overall: Math.random() * 100 - 50
      },
      newssSentiment: fearGreedIndex > 60 ? 'bullish' : fearGreedIndex < 40 ? 'bearish' : 'neutral',
      whaleActivity: Math.random() > 0.6 ? 'accumulating' : Math.random() < 0.4 ? 'distributing' : 'neutral'
    };
  }

  async generateHeatmap(category: string): Promise<any> {
    const data = await this.cryptoDataService.getMarketData();
    
    // Filter by category if needed
    let filtered = data;
    if (category !== 'all') {
      // Mock category filtering
      filtered = data.slice(0, 20);
    }
    
    return filtered.map(crypto => ({
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price,
      change24h: crypto.priceChange24h,
      volume24h: crypto.volume24h,
      marketCap: crypto.marketCap,
      category,
      intensity: Math.abs(crypto.priceChange24h) / 10 // Normalize for visualization
    }));
  }

  async getTrendingCryptos(): Promise<any[]> {
    const data = await this.cryptoDataService.getMarketData();
    
    // Mock trending logic based on volume and price change
    return data
      .map(crypto => ({
        ...crypto,
        trendingScore: crypto.volume24h * Math.abs(crypto.priceChange24h)
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10)
      .map((crypto, index) => ({
        rank: index + 1,
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        priceChange24h: crypto.priceChange24h,
        volume24h: crypto.volume24h,
        searches24h: Math.floor(Math.random() * 100000),
        socialMentions: Math.floor(Math.random() * 50000)
      }));
  }

  async getMarketMovers(type: 'gainers' | 'losers', timeframe: string): Promise<any[]> {
    const data = await this.cryptoDataService.getMarketData();
    
    const sorted = type === 'gainers'
      ? data.sort((a, b) => b.priceChange24h - a.priceChange24h)
      : data.sort((a, b) => a.priceChange24h - b.priceChange24h);
    
    return sorted.slice(0, 10).map((crypto, index) => ({
      rank: index + 1,
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price,
      priceChange: this.getPriceChangeForTimeframe(crypto, timeframe),
      volume24h: crypto.volume24h,
      marketCap: crypto.marketCap
    }));
  }

  private getPriceChangeForTimeframe(crypto: any, timeframe: string): number {
    switch (timeframe) {
      case '1h':
        return (Math.random() - 0.5) * 10;
      case '7d':
        return crypto.priceChange7d;
      case '24h':
      default:
        return crypto.priceChange24h;
    }
  }

  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    return await this.technicalService.calculateIndicators(symbol, ['rsi', 'macd', 'bollinger', 'ema', 'volume']);
  }
}