import { 
  tokens, 
  tokenUnlocks, 
  defiProtocols, 
  newsItems, 
  monteCarloSimulations, 
  hyperliquidMetrics,
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
import { db } from "./db";
import { eq, desc, gte, sql, and } from "drizzle-orm";

export interface IStorage {
  // Token methods
  getTokens(): Promise<Token[]>;
  getToken(id: string): Promise<Token | undefined>;
  getTokenBySymbol(symbol: string): Promise<Token | undefined>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: string, token: Partial<InsertToken>): Promise<Token>;
  getFailedTokens(): Promise<Token[]>;
  
  // Token unlock methods
  getTokenUnlocks(tokenId?: string): Promise<TokenUnlock[]>;
  createTokenUnlock(unlock: InsertTokenUnlock): Promise<TokenUnlock>;
  getUpcomingUnlocks(): Promise<TokenUnlock[]>;
  
  // DeFi protocol methods
  getDefiProtocols(): Promise<DefiProtocol[]>;
  getDefiProtocol(id: string): Promise<DefiProtocol | undefined>;
  createDefiProtocol(protocol: InsertDefiProtocol): Promise<DefiProtocol>;
  updateDefiProtocol(id: string, protocol: Partial<InsertDefiProtocol>): Promise<DefiProtocol>;
  
  // News methods
  getNewsItems(limit?: number): Promise<NewsItem[]>;
  createNewsItem(news: InsertNewsItem): Promise<NewsItem>;
  getNewsByCoins(coins: string[]): Promise<NewsItem[]>;
  
  // Monte Carlo methods
  getMonteCarloSimulations(tokenId?: string): Promise<MonteCarloSimulation[]>;
  createMonteCarloSimulation(simulation: InsertMonteCarloSimulation): Promise<MonteCarloSimulation>;
  
  // Hyperliquid methods
  getHyperliquidMetrics(): Promise<HyperliquidMetrics | undefined>;
  createHyperliquidMetrics(metrics: InsertHyperliquidMetrics): Promise<HyperliquidMetrics>;
  updateHyperliquidMetrics(metrics: Partial<InsertHyperliquidMetrics>): Promise<HyperliquidMetrics>;
}

export class DatabaseStorage implements IStorage {
  // Token methods
  async getTokens(): Promise<Token[]> {
    return await db.select().from(tokens).where(eq(tokens.isActive, true)).orderBy(desc(tokens.marketCap));
  }

  async getToken(id: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token || undefined;
  }

  async getTokenBySymbol(symbol: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.symbol, symbol));
    return token || undefined;
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const [token] = await db.insert(tokens).values(insertToken).returning();
    return token;
  }

  async updateToken(id: string, insertToken: Partial<InsertToken>): Promise<Token> {
    const [token] = await db
      .update(tokens)
      .set({ ...insertToken, updatedAt: sql`now()` })
      .where(eq(tokens.id, id))
      .returning();
    return token;
  }

  async getFailedTokens(): Promise<Token[]> {
    return await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.isActive, true),
          gte(tokens.declineFromAth, sql`-90`)
        )
      )
      .orderBy(desc(tokens.declineFromAth));
  }

  // Token unlock methods
  async getTokenUnlocks(tokenId?: string): Promise<TokenUnlock[]> {
    const query = db.select().from(tokenUnlocks);
    
    if (tokenId) {
      return await query.where(eq(tokenUnlocks.tokenId, tokenId)).orderBy(tokenUnlocks.unlockDate);
    }
    
    return await query.orderBy(tokenUnlocks.unlockDate);
  }

  async createTokenUnlock(unlock: InsertTokenUnlock): Promise<TokenUnlock> {
    const [tokenUnlock] = await db.insert(tokenUnlocks).values(unlock).returning();
    return tokenUnlock;
  }

  async getUpcomingUnlocks(): Promise<TokenUnlock[]> {
    return await db
      .select()
      .from(tokenUnlocks)
      .where(gte(tokenUnlocks.unlockDate, sql`now()`))
      .orderBy(tokenUnlocks.unlockDate)
      .limit(50);
  }

  // DeFi protocol methods
  async getDefiProtocols(): Promise<DefiProtocol[]> {
    return await db.select().from(defiProtocols).orderBy(desc(defiProtocols.tvl));
  }

  async getDefiProtocol(id: string): Promise<DefiProtocol | undefined> {
    const [protocol] = await db.select().from(defiProtocols).where(eq(defiProtocols.id, id));
    return protocol || undefined;
  }

  async createDefiProtocol(protocol: InsertDefiProtocol): Promise<DefiProtocol> {
    const [defiProtocol] = await db.insert(defiProtocols).values(protocol).returning();
    return defiProtocol;
  }

  async updateDefiProtocol(id: string, protocol: Partial<InsertDefiProtocol>): Promise<DefiProtocol> {
    const [defiProtocol] = await db
      .update(defiProtocols)
      .set({ ...protocol, updatedAt: sql`now()` })
      .where(eq(defiProtocols.id, id))
      .returning();
    return defiProtocol;
  }

  // News methods
  async getNewsItems(limit: number = 50): Promise<NewsItem[]> {
    return await db
      .select()
      .from(newsItems)
      .orderBy(desc(newsItems.publishedAt))
      .limit(limit);
  }

  async createNewsItem(news: InsertNewsItem): Promise<NewsItem> {
    const [newsItem] = await db.insert(newsItems).values(news).returning();
    return newsItem;
  }

  async getNewsByCoins(coins: string[]): Promise<NewsItem[]> {
    return await db
      .select()
      .from(newsItems)
      .where(sql`${newsItems.coins} && ${coins}`)
      .orderBy(desc(newsItems.publishedAt))
      .limit(20);
  }

  // Monte Carlo methods
  async getMonteCarloSimulations(tokenId?: string): Promise<MonteCarloSimulation[]> {
    const query = db.select().from(monteCarloSimulations);
    
    if (tokenId) {
      return await query
        .where(eq(monteCarloSimulations.tokenId, tokenId))
        .orderBy(desc(monteCarloSimulations.createdAt));
    }
    
    return await query.orderBy(desc(monteCarloSimulations.createdAt));
  }

  async createMonteCarloSimulation(simulation: InsertMonteCarloSimulation): Promise<MonteCarloSimulation> {
    const [monteCarloSimulation] = await db.insert(monteCarloSimulations).values(simulation).returning();
    return monteCarloSimulation;
  }

  // Hyperliquid methods
  async getHyperliquidMetrics(): Promise<HyperliquidMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(hyperliquidMetrics)
      .orderBy(desc(hyperliquidMetrics.date))
      .limit(1);
    return metrics || undefined;
  }

  async createHyperliquidMetrics(metrics: InsertHyperliquidMetrics): Promise<HyperliquidMetrics> {
    const [hyperliquidMetric] = await db.insert(hyperliquidMetrics).values(metrics).returning();
    return hyperliquidMetric;
  }

  async updateHyperliquidMetrics(metrics: Partial<InsertHyperliquidMetrics>): Promise<HyperliquidMetrics> {
    const [hyperliquidMetric] = await db
      .update(hyperliquidMetrics)
      .set(metrics)
      .where(eq(hyperliquidMetrics.date, sql`CURRENT_DATE`))
      .returning();
    return hyperliquidMetric;
  }
}

export const storage = new DatabaseStorage();
