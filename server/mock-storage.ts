import { 
  type Token, 
  type InsertToken,
  type TokenUnlock,
  type InsertTokenUnlock,
  type DefiProtocol,
  type InsertDefiProtocol,
  type NewsItem,
  type InsertNewsItem,
  type MonteCarloSimulation,
  type InsertMonteCarloSimulation,
  type HyperliquidMetrics,
  type InsertHyperliquidMetrics
} from "@shared/schema";
import { IStorage } from "./storage";
import { nanoid } from "nanoid";

export class MockStorage implements IStorage {
  private tokens: Map<string, Token> = new Map();
  private tokenUnlocks: Map<string, TokenUnlock> = new Map();
  private defiProtocols: Map<string, DefiProtocol> = new Map();
  private newsItems: Map<string, NewsItem> = new Map();
  private monteCarloSimulations: Map<string, MonteCarloSimulation> = new Map();
  private hyperliquidMetrics: Map<string, HyperliquidMetrics> = new Map();

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add some mock failed tokens
    const failedTokens = [
      { id: 'luna', symbol: 'LUNA', name: 'Terra Luna Classic', currentPrice: 0.0001, ath: 119.18, athChangePercentage: -99.99, riskLevel: 'EXTREME', sector: 'DeFi' },
      { id: 'ftt', symbol: 'FTT', name: 'FTX Token', currentPrice: 1.5, ath: 84.18, athChangePercentage: -98.2, riskLevel: 'EXTREME', sector: 'Exchange' },
      { id: 'celr', symbol: 'CELR', name: 'Celer Network', currentPrice: 0.012, ath: 0.20, athChangePercentage: -94, riskLevel: 'VERY_HIGH', sector: 'Layer 2' },
    ];

    failedTokens.forEach(token => {
      const id = nanoid();
      this.tokens.set(id, {
        id,
        ...token,
        marketCap: token.currentPrice * 1000000000,
        fullyDilutedValuation: token.currentPrice * 1200000000,
        totalVolume: token.currentPrice * 50000000,
        high24h: token.currentPrice * 1.05,
        low24h: token.currentPrice * 0.95,
        priceChange24h: token.currentPrice * 0.02,
        priceChangePercentage24h: 2,
        priceChangePercentage7d: -5,
        priceChangePercentage30d: -15,
        priceChangePercentage1y: -90,
        marketCapChange24h: 1000000,
        marketCapChangePercentage24h: 2,
        circulatingSupply: 1000000000,
        totalSupply: 1200000000,
        maxSupply: 1500000000,
        atl: token.currentPrice * 0.5,
        atlChangePercentage: 100,
        atlDate: new Date('2023-01-01'),
        athDate: new Date('2021-11-10'),
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Add mock news
    const newsData = [
      { title: 'Bitcoin Surges Past $45,000', priority: 'HIGH', coins: ['bitcoin'] },
      { title: 'Ethereum Layer 2 Solutions See Record Volume', priority: 'NORMAL', coins: ['ethereum'] },
      { title: 'DeFi Protocol Hacked for $10M', priority: 'HIGH', coins: [] },
    ];

    newsData.forEach(news => {
      const id = nanoid();
      this.newsItems.set(id, {
        id,
        ...news,
        url: 'https://example.com/news/' + id,
        publishedAt: new Date(),
        createdAt: new Date(),
      });
    });
  }

  // Token methods
  async getTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async getToken(id: string): Promise<Token | undefined> {
    return this.tokens.get(id);
  }

  async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
  }

  async createToken(token: InsertToken): Promise<Token> {
    const id = nanoid();
    const newToken: Token = {
      ...token,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tokens.set(id, newToken);
    return newToken;
  }

  async updateToken(id: string, token: Partial<InsertToken>): Promise<Token> {
    const existing = this.tokens.get(id);
    if (!existing) throw new Error('Token not found');
    
    const updated = {
      ...existing,
      ...token,
      updatedAt: new Date(),
    };
    this.tokens.set(id, updated);
    return updated;
  }

  async getFailedTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.athChangePercentage <= -90);
  }

  // Token unlock methods
  async getTokenUnlocks(tokenId?: string): Promise<TokenUnlock[]> {
    const unlocks = Array.from(this.tokenUnlocks.values());
    return tokenId ? unlocks.filter(u => u.tokenId === tokenId) : unlocks;
  }

  async createTokenUnlock(unlock: InsertTokenUnlock): Promise<TokenUnlock> {
    const id = nanoid();
    const newUnlock: TokenUnlock = {
      ...unlock,
      id,
      createdAt: new Date(),
    };
    this.tokenUnlocks.set(id, newUnlock);
    return newUnlock;
  }

  async getUpcomingUnlocks(): Promise<TokenUnlock[]> {
    const now = new Date();
    return Array.from(this.tokenUnlocks.values())
      .filter(u => u.unlockDate > now)
      .sort((a, b) => a.unlockDate.getTime() - b.unlockDate.getTime());
  }

  // DeFi protocol methods
  async getDefiProtocols(): Promise<DefiProtocol[]> {
    return Array.from(this.defiProtocols.values());
  }

  async getDefiProtocol(id: string): Promise<DefiProtocol | undefined> {
    return this.defiProtocols.get(id);
  }

  async createDefiProtocol(protocol: InsertDefiProtocol): Promise<DefiProtocol> {
    const id = nanoid();
    const newProtocol: DefiProtocol = {
      ...protocol,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.defiProtocols.set(id, newProtocol);
    return newProtocol;
  }

  async updateDefiProtocol(id: string, protocol: Partial<InsertDefiProtocol>): Promise<DefiProtocol> {
    const existing = this.defiProtocols.get(id);
    if (!existing) throw new Error('Protocol not found');
    
    const updated = {
      ...existing,
      ...protocol,
      updatedAt: new Date(),
    };
    this.defiProtocols.set(id, updated);
    return updated;
  }

  // News methods
  async getNewsItems(limit?: number): Promise<NewsItem[]> {
    const items = Array.from(this.newsItems.values())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return limit ? items.slice(0, limit) : items;
  }

  async createNewsItem(news: InsertNewsItem): Promise<NewsItem> {
    const id = nanoid();
    const newItem: NewsItem = {
      ...news,
      id,
      createdAt: new Date(),
    };
    this.newsItems.set(id, newItem);
    return newItem;
  }

  async getNewsByCoins(coins: string[]): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values())
      .filter(n => n.coins.some(c => coins.includes(c)));
  }

  // Monte Carlo methods
  async getMonteCarloSimulations(tokenId?: string): Promise<MonteCarloSimulation[]> {
    const sims = Array.from(this.monteCarloSimulations.values());
    return tokenId ? sims.filter(s => s.tokenId === tokenId) : sims;
  }

  async createMonteCarloSimulation(simulation: InsertMonteCarloSimulation): Promise<MonteCarloSimulation> {
    const id = nanoid();
    const newSim: MonteCarloSimulation = {
      ...simulation,
      id,
      createdAt: new Date(),
    };
    this.monteCarloSimulations.set(id, newSim);
    return newSim;
  }

  async getLatestSimulation(tokenId: string): Promise<MonteCarloSimulation | undefined> {
    const sims = await this.getMonteCarloSimulations(tokenId);
    return sims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  // Hyperliquid methods
  async getHyperliquidMetrics(): Promise<HyperliquidMetrics | undefined> {
    // Return the latest metrics
    const metrics = Array.from(this.hyperliquidMetrics.values());
    return metrics.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }

  async createHyperliquidMetrics(metrics: InsertHyperliquidMetrics): Promise<HyperliquidMetrics> {
    const id = nanoid();
    const newMetrics: HyperliquidMetrics = {
      ...metrics,
      id,
      createdAt: new Date(),
    };
    this.hyperliquidMetrics.set(id, newMetrics);
    return newMetrics;
  }

  async updateHyperliquidMetrics(metrics: Partial<InsertHyperliquidMetrics>): Promise<HyperliquidMetrics> {
    // Find today's metrics or create new
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = Array.from(this.hyperliquidMetrics.values())
      .find(m => m.date.getTime() === today.getTime());
    
    if (existing) {
      const updated = { ...existing, ...metrics };
      this.hyperliquidMetrics.set(existing.id, updated);
      return updated;
    } else {
      return this.createHyperliquidMetrics({
        date: today,
        totalVolume24h: 0,
        uniqueUsers: 0,
        totalDeposits: 0,
        netDeposits: 0,
        cumulativeUsers: 0,
        openInterest: 0,
        ...metrics
      });
    }
  }

}