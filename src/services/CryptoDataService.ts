import { EventEmitter } from 'events';

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
  last_updated: string;
}

export class CryptoDataService extends EventEmitter {
  private isInitialized: boolean = false;
  private marketCache: MarketData[] = [];
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('📊 Initializing Crypto Data Service...');
    
    // Load initial market data
    await this.refreshMarketData();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.refreshMarketData();
    }, 60000); // Update every minute

    this.isInitialized = true;
    console.log('✅ Crypto Data Service initialized');
  }

  async getMarketData(limit: number = 100): Promise<MarketData[]> {
    if (this.marketCache.length === 0) {
      await this.refreshMarketData();
    }
    
    return this.marketCache.slice(0, limit);
  }

  async getTrendingCoins(): Promise<any[]> {
    // Mock trending data
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', rank: 1 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', rank: 2 },
      { id: 'solana', symbol: 'sol', name: 'Solana', rank: 4 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', rank: 6 }
    ];
  }

  async getGlobalMetrics(): Promise<any> {
    return {
      total_market_cap: 1750000000000,
      total_volume: 85000000000,
      bitcoin_dominance: 48.5,
      active_cryptocurrencies: 10547,
      markets: 892
    };
  }

  private async refreshMarketData(): Promise<void> {
    // Generate mock market data
    const coins = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', basePrice: 45000 },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', basePrice: 2500 },
      { id: 'binancecoin', symbol: 'BNB', name: 'BNB', basePrice: 300 },
      { id: 'solana', symbol: 'SOL', name: 'Solana', basePrice: 100 },
      { id: 'ripple', symbol: 'XRP', name: 'XRP', basePrice: 0.6 },
      { id: 'cardano', symbol: 'ADA', name: 'Cardano', basePrice: 0.5 },
      { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', basePrice: 35 },
      { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', basePrice: 7 },
      { id: 'polygon', symbol: 'MATIC', name: 'Polygon', basePrice: 0.8 },
      { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', basePrice: 15 }
    ];

    this.marketCache = coins.map((coin, index) => {
      const currentPrice = coin.basePrice * (0.95 + Math.random() * 0.1);
      const change24h = (Math.random() - 0.5) * 20;
      const change7d = (Math.random() - 0.5) * 30;

      return {
        id: coin.id,
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        current_price: currentPrice,
        market_cap: currentPrice * (21000000 - index * 1000000),
        market_cap_rank: index + 1,
        total_volume: currentPrice * 1000000 * (50 + Math.random() * 50),
        price_change_percentage_24h: change24h,
        price_change_percentage_7d: change7d,
        last_updated: new Date().toISOString()
      };
    });

    this.emit('data:updated', this.marketCache);
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      cacheSize: this.marketCache.length,
      lastUpdate: this.marketCache.length > 0 ? this.marketCache[0].last_updated : null
    };
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}