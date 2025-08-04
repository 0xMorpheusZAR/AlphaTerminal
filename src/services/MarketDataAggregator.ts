import { EventEmitter } from 'events';
import winston from 'winston';
import { CoinGeckoProService, ProPriceData, DerivativeData, NFTCollectionData, TrendingData, GlobalMarketData } from './CoinGeckoProService';

export interface ComprehensiveMarketData {
  // Core market data
  marketOverview: {
    topCryptos: ProPriceData[];
    globalMetrics: GlobalMarketData;
    trending: TrendingData;
    marketCapDominance: Record<string, number>;
    fearGreedIndex: number;
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
  };

  // Exchange data
  exchanges: {
    spotExchanges: any[];
    derivativesExchanges: any[];
    volumeLeaders: any[];
    trustScoreRankings: any[];
  };

  // DeFi & On-chain data
  defi: {
    networks: any[];
    dexes: any[];
    topPools: any[];
    totalValueLocked: number;
    defiDominance: Record<string, number>;
  };

  // Derivatives & Options
  derivatives: {
    futures: DerivativeData[];
    perpetuals: DerivativeData[];
    options: any[];
    totalOpenInterest: number;
    fundingRates: Record<string, number>;
  };

  // NFT market data
  nfts: {
    collections: NFTCollectionData[];
    totalMarketCap: number;
    volume24h: number;
    floorPriceMovers: any[];
  };

  // Categories & Sectors
  sectors: {
    categoryPerformance: any[];
    sectorAllocation: Record<string, number>;
    emergingCategories: any[];
  };

  // Market analytics
  analytics: {
    volatilityIndex: number;
    correlationMatrix: Record<string, Record<string, number>>;
    riskMetrics: any;
    liquidityMetrics: any;
  };

  timestamp: Date;
}

export interface DataUpdateEvent {
  type: 'price' | 'volume' | 'market_cap' | 'derivatives' | 'nft' | 'defi';
  data: any;
  timestamp: Date;
}

export class MarketDataAggregator extends EventEmitter {
  private coinGeckoPro: CoinGeckoProService;
  private logger: winston.Logger;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private updateIntervals: Map<string, NodeJS.Timeout>;
  private isRunning: boolean = false;

  // Update frequencies (in milliseconds)
  private readonly UPDATE_FREQUENCIES = {
    PRICES: 20000,        // 20 seconds (Pro API limit)
    MARKET_DATA: 45000,   // 45 seconds (Pro API limit)
    EXCHANGES: 300000,    // 5 minutes
    DERIVATIVES: 60000,   // 1 minute
    DEFI: 120000,         // 2 minutes
    NFTS: 300000,         // 5 minutes
    GLOBAL: 60000,        // 1 minute
    TRENDING: 180000,     // 3 minutes
  };

  constructor(
    coinGeckoProService: CoinGeckoProService,
    logger?: winston.Logger
  ) {
    super();
    this.coinGeckoPro = coinGeckoProService;
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.cache = new Map();
    this.updateIntervals = new Map();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Market Data Aggregator...');

    // Verify CoinGecko Pro API access
    const isHealthy = await this.coinGeckoPro.healthCheck();
    if (!isHealthy) {
      throw new Error('CoinGecko Pro API is not accessible');
    }

    // Log API status
    const apiStatus = await this.coinGeckoPro.getAPIKeyStatus();
    this.logger.info(`CoinGecko Pro API Status: ${apiStatus.credits_left}/${apiStatus.credits_total} credits remaining`);

    // Initialize data with first fetch
    await this.performInitialDataLoad();

    // Start real-time updates
    this.startRealTimeUpdates();
    this.isRunning = true;

    this.logger.info('Market Data Aggregator initialized successfully');
  }

  private async performInitialDataLoad(): Promise<void> {
    this.logger.info('Performing initial data load...');

    try {
      // Load all data types in parallel
      await Promise.all([
        this.updatePriceData(),
        this.updateMarketData(),
        this.updateExchangeData(),
        this.updateDerivativesData(),
        this.updateDeFiData(),
        this.updateNFTData(),
        this.updateGlobalData(),
        this.updateTrendingData(),
      ]);

      this.logger.info('Initial data load completed');
    } catch (error) {
      this.logger.error('Initial data load failed:', error);
      throw error;
    }
  }

  private startRealTimeUpdates(): void {
    // Price updates (highest frequency)
    this.updateIntervals.set('prices', setInterval(async () => {
      try {
        await this.updatePriceData();
        this.emit('dataUpdate', {
          type: 'price',
          data: this.getCachedData('prices'),
          timestamp: new Date()
        } as DataUpdateEvent);
      } catch (error) {
        this.logger.error('Price update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.PRICES));

    // Market data updates
    this.updateIntervals.set('market', setInterval(async () => {
      try {
        await this.updateMarketData();
        this.emit('dataUpdate', {
          type: 'market_cap',
          data: this.getCachedData('market'),
          timestamp: new Date()
        } as DataUpdateEvent);
      } catch (error) {
        this.logger.error('Market data update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.MARKET_DATA));

    // Other update intervals...
    this.setupAdditionalUpdateIntervals();
  }

  private setupAdditionalUpdateIntervals(): void {
    // Exchange data
    this.updateIntervals.set('exchanges', setInterval(async () => {
      try {
        await this.updateExchangeData();
      } catch (error) {
        this.logger.error('Exchange data update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.EXCHANGES));

    // Derivatives data
    this.updateIntervals.set('derivatives', setInterval(async () => {
      try {
        await this.updateDerivativesData();
        this.emit('dataUpdate', {
          type: 'derivatives',
          data: this.getCachedData('derivatives'),
          timestamp: new Date()
        } as DataUpdateEvent);
      } catch (error) {
        this.logger.error('Derivatives update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.DERIVATIVES));

    // DeFi data
    this.updateIntervals.set('defi', setInterval(async () => {
      try {
        await this.updateDeFiData();
        this.emit('dataUpdate', {
          type: 'defi',
          data: this.getCachedData('defi'),
          timestamp: new Date()
        } as DataUpdateEvent);
      } catch (error) {
        this.logger.error('DeFi update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.DEFI));

    // NFT data
    this.updateIntervals.set('nfts', setInterval(async () => {
      try {
        await this.updateNFTData();
        this.emit('dataUpdate', {
          type: 'nft',
          data: this.getCachedData('nfts'),
          timestamp: new Date()
        } as DataUpdateEvent);
      } catch (error) {
        this.logger.error('NFT update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.NFTS));

    // Global & trending data
    this.updateIntervals.set('global', setInterval(async () => {
      try {
        await Promise.all([
          this.updateGlobalData(),
          this.updateTrendingData()
        ]);
      } catch (error) {
        this.logger.error('Global data update failed:', error);
      }
    }, this.UPDATE_FREQUENCIES.GLOBAL));
  }

  // ==================== DATA UPDATE METHODS ====================

  private async updatePriceData(): Promise<void> {
    const topCoins = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'ripple', 'polkadot', 'dogecoin', 'avalanche-2', 'polygon'];
    
    const marketData = await this.coinGeckoPro.getCoinsMarkets('usd', {
      ids: topCoins,
      order: 'market_cap_desc',
      perPage: 100,
      page: 1,
      sparkline: true,
      priceChangePercentage: '1h,24h,7d,14d,30d,200d,1y'
    });

    this.setCachedData('prices', marketData, this.UPDATE_FREQUENCIES.PRICES);
  }

  private async updateMarketData(): Promise<void> {
    const marketData = await this.coinGeckoPro.getCoinsMarkets('usd', {
      order: 'market_cap_desc',
      perPage: 250,
      page: 1,
      sparkline: false,
      priceChangePercentage: '1h,24h,7d'
    });

    this.setCachedData('market', marketData, this.UPDATE_FREQUENCIES.MARKET_DATA);
  }

  private async updateExchangeData(): Promise<void> {
    const [spotExchanges, derivativesExchanges] = await Promise.all([
      this.coinGeckoPro.getExchanges(50, 1),
      this.coinGeckoPro.getDerivativesExchanges('name', 50, 1)
    ]);

    const exchangeData = {
      spotExchanges,
      derivativesExchanges,
      volumeLeaders: spotExchanges.slice(0, 10),
      trustScoreRankings: spotExchanges.sort((a, b) => b.trust_score - a.trust_score).slice(0, 10)
    };

    this.setCachedData('exchanges', exchangeData, this.UPDATE_FREQUENCIES.EXCHANGES);
  }

  private async updateDerivativesData(): Promise<void> {
    const [derivatives, derivativesExchanges] = await Promise.all([
      this.coinGeckoPro.getDerivatives('unexpired'),
      this.coinGeckoPro.getDerivativesExchanges('open_interest_btc', 25, 1)
    ]);

    const futures = derivatives.filter(d => d.contract_type === 'futures');
    const perpetuals = derivatives.filter(d => d.contract_type === 'perpetual');
    
    const totalOpenInterest = derivatives.reduce((sum, d) => sum + (d.open_interest_usd || 0), 0);
    
    const fundingRates: Record<string, number> = {};
    perpetuals.forEach(p => {
      if (p.funding_rate) {
        fundingRates[p.symbol] = p.funding_rate;
      }
    });

    const derivativesData = {
      futures,
      perpetuals,
      options: [], // Options data not available in CoinGecko
      totalOpenInterest,
      fundingRates,
      exchanges: derivativesExchanges
    };

    this.setCachedData('derivatives', derivativesData, this.UPDATE_FREQUENCIES.DERIVATIVES);
  }

  private async updateDeFiData(): Promise<void> {
    try {
      const [networks, dexes, pools] = await Promise.all([
        this.coinGeckoPro.getOnChainNetworks(),
        this.coinGeckoPro.getOnChainDEXes(undefined, 1),
        this.coinGeckoPro.getOnChainPools(undefined, undefined, 1)
      ]);

      // Calculate approximate TVL from pool data
      let totalValueLocked = 0;
      if (pools.data) {
        totalValueLocked = pools.data.reduce((sum: number, pool: any) => {
          const reserveUsd = parseFloat(pool.attributes?.reserve_in_usd || '0');
          return sum + reserveUsd;
        }, 0);
      }

      const defiData = {
        networks: networks || [],
        dexes: dexes.data || [],
        topPools: pools.data?.slice(0, 20) || [],
        totalValueLocked,
        defiDominance: this.calculateDeFiDominance(dexes.data || [])
      };

      this.setCachedData('defi', defiData, this.UPDATE_FREQUENCIES.DEFI);
    } catch (error) {
      // DeFi endpoints might be limited, use fallback data
      this.logger.warn('DeFi data update failed, using fallback:', error);
      this.setCachedData('defi', {
        networks: [],
        dexes: [],
        topPools: [],
        totalValueLocked: 0,
        defiDominance: {}
      }, this.UPDATE_FREQUENCIES.DEFI);
    }
  }

  private async updateNFTData(): Promise<void> {
    try {
      const nftsList = await this.coinGeckoPro.getNFTsList('market_cap_usd_desc', undefined, 50, 1);
      
      let totalMarketCap = 0;
      let volume24h = 0;

      // Get detailed data for top collections
      const collections = await Promise.all(
        nftsList.slice(0, 20).map(async (nft) => {
          try {
            const details = await this.coinGeckoPro.getNFTById(nft.id);
            if (details.market_cap?.usd) totalMarketCap += details.market_cap.usd;
            if (details.volume_24h?.usd) volume24h += details.volume_24h.usd;
            return details;
          } catch (err) {
            return null;
          }
        })
      );

      const validCollections = collections.filter(c => c !== null);
      const floorPriceMovers = validCollections
        .filter(c => c.floor_price_in_usd_24h_percentage_change)
        .sort((a, b) => Math.abs(b.floor_price_in_usd_24h_percentage_change) - Math.abs(a.floor_price_in_usd_24h_percentage_change))
        .slice(0, 10);

      const nftData = {
        collections: validCollections,
        totalMarketCap,
        volume24h,
        floorPriceMovers
      };

      this.setCachedData('nfts', nftData, this.UPDATE_FREQUENCIES.NFTS);
    } catch (error) {
      this.logger.warn('NFT data update failed:', error);
      this.setCachedData('nfts', {
        collections: [],
        totalMarketCap: 0,
        volume24h: 0,
        floorPriceMovers: []
      }, this.UPDATE_FREQUENCIES.NFTS);
    }
  }

  private async updateGlobalData(): Promise<void> {
    const globalData = await this.coinGeckoPro.getGlobalData();
    this.setCachedData('global', globalData.data, this.UPDATE_FREQUENCIES.GLOBAL);
  }

  private async updateTrendingData(): Promise<void> {
    const trendingData = await this.coinGeckoPro.getTrending();
    this.setCachedData('trending', trendingData, this.UPDATE_FREQUENCIES.TRENDING);
  }

  // ==================== PUBLIC API METHODS ====================

  async getComprehensiveMarketData(): Promise<ComprehensiveMarketData> {
    const prices = this.getCachedData('prices') || [];
    const globalData = this.getCachedData('global') || {};
    const trending = this.getCachedData('trending') || { coins: [], nfts: [], categories: [] };
    const exchanges = this.getCachedData('exchanges') || { spotExchanges: [], derivativesExchanges: [] };
    const derivatives = this.getCachedData('derivatives') || { futures: [], perpetuals: [], totalOpenInterest: 0, fundingRates: {} };
    const defi = this.getCachedData('defi') || { networks: [], dexes: [], topPools: [], totalValueLocked: 0, defiDominance: {} };
    const nfts = this.getCachedData('nfts') || { collections: [], totalMarketCap: 0, volume24h: 0, floorPriceMovers: [] };

    return {
      marketOverview: {
        topCryptos: prices.slice(0, 50),
        globalMetrics: globalData,
        trending,
        marketCapDominance: globalData.market_cap_percentage || {},
        fearGreedIndex: this.calculateFearGreedIndex(prices),
        marketSentiment: this.calculateMarketSentiment(prices, trending)
      },
      exchanges,
      defi,
      derivatives,
      nfts,
      sectors: {
        categoryPerformance: trending.categories || [],
        sectorAllocation: this.calculateSectorAllocation(prices),
        emergingCategories: []
      },
      analytics: {
        volatilityIndex: this.calculateVolatilityIndex(prices),
        correlationMatrix: {},
        riskMetrics: this.calculateRiskMetrics(prices),
        liquidityMetrics: this.calculateLiquidityMetrics(exchanges.spotExchanges)
      },
      timestamp: new Date()
    };
  }

  // ==================== UTILITY METHODS ====================

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private calculateFearGreedIndex(prices: ProPriceData[]): number {
    if (!prices.length) return 50;
    
    const avgChange24h = prices.reduce((sum, p) => sum + (p.price_change_percentage_24h || 0), 0) / prices.length;
    
    // Simple fear/greed calculation based on average price changes
    const baseIndex = 50;
    const changeMultiplier = 10;
    
    return Math.max(0, Math.min(100, baseIndex + (avgChange24h * changeMultiplier)));
  }

  private calculateMarketSentiment(prices: ProPriceData[], trending: TrendingData): 'bullish' | 'bearish' | 'neutral' {
    if (!prices.length) return 'neutral';

    const avgChange = prices.reduce((sum, p) => sum + (p.price_change_percentage_24h || 0), 0) / prices.length;
    
    if (avgChange > 2) return 'bullish';
    if (avgChange < -2) return 'bearish';
    return 'neutral';
  }

  private calculateDeFiDominance(dexes: any[]): Record<string, number> {
    const dominance: Record<string, number> = {};
    
    dexes.forEach(dex => {
      const name = dex.attributes?.name || 'Unknown';
      const volume = parseFloat(dex.attributes?.volume_usd_24h || '0');
      dominance[name] = volume;
    });

    return dominance;
  }

  private calculateSectorAllocation(prices: ProPriceData[]): Record<string, number> {
    // Simplified sector allocation based on market caps
    const allocation: Record<string, number> = {};
    const totalMarketCap = prices.reduce((sum, p) => sum + (p.market_cap || 0), 0);

    prices.forEach(price => {
      const percentage = ((price.market_cap || 0) / totalMarketCap) * 100;
      allocation[price.symbol.toUpperCase()] = percentage;
    });

    return allocation;
  }

  private calculateVolatilityIndex(prices: ProPriceData[]): number {
    if (!prices.length) return 0;

    const volatilities = prices.map(p => Math.abs(p.price_change_percentage_24h || 0));
    return volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
  }

  private calculateRiskMetrics(prices: ProPriceData[]): any {
    return {
      averageVolatility: this.calculateVolatilityIndex(prices),
      maxDrawdown: Math.min(...prices.map(p => p.price_change_percentage_24h || 0)),
      correlationRisk: 'medium' // Simplified
    };
  }

  private calculateLiquidityMetrics(exchanges: any[]): any {
    if (!exchanges.length) return { totalVolume: 0, avgSpread: 0 };

    const totalVolume = exchanges.reduce((sum, ex) => sum + (ex.trade_volume_24h_btc || 0), 0);
    
    return {
      totalVolume,
      avgSpread: 0.1, // Simplified
      liquidityScore: Math.min(100, totalVolume / 1000)
    };
  }

  // ==================== LIFECYCLE METHODS ====================

  stop(): void {
    this.logger.info('Stopping Market Data Aggregator...');
    
    this.updateIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    
    this.updateIntervals.clear();
    this.isRunning = false;
    
    this.logger.info('Market Data Aggregator stopped');
  }

  isHealthy(): boolean {
    return this.isRunning && this.cache.size > 0;
  }

  getAPIStatus(): Promise<any> {
    return this.coinGeckoPro.getAPIKeyStatus();
  }
}