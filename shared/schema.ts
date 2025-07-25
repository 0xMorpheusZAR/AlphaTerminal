import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  coingeckoId: text("coingecko_id").unique(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  allTimeHigh: decimal("all_time_high", { precision: 20, scale: 8 }),
  allTimeHighDate: timestamp("all_time_high_date"),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 20, scale: 2 }),
  priceChange1h: decimal("price_change_1h", { precision: 10, scale: 4 }),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 4 }),
  priceChange7d: decimal("price_change_7d", { precision: 10, scale: 4 }),
  priceChange30d: decimal("price_change_30d", { precision: 10, scale: 4 }),
  priceChange1y: decimal("price_change_1y", { precision: 10, scale: 4 }),
  declineFromAth: decimal("decline_from_ath", { precision: 10, scale: 4 }),
  sector: text("sector"),
  riskLevel: text("risk_level"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const tokenUnlocks = pgTable("token_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  unlockDate: timestamp("unlock_date").notNull(),
  unlockAmount: decimal("unlock_amount", { precision: 20, scale: 8 }),
  unlockValue: decimal("unlock_value", { precision: 20, scale: 2 }),
  unlockType: text("unlock_type"), // 'investor', 'team', 'ecosystem', etc.
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const defiProtocols = pgTable("defi_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tokenId: varchar("token_id").references(() => tokens.id),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  revenue24h: decimal("revenue_24h", { precision: 20, scale: 2 }),
  revenue7d: decimal("revenue_7d", { precision: 20, scale: 2 }),
  revenue30d: decimal("revenue_30d", { precision: 20, scale: 2 }),
  revenue1y: decimal("revenue_1y", { precision: 20, scale: 2 }),
  peRatio: decimal("pe_ratio", { precision: 10, scale: 2 }),
  category: text("category"),
  defillama: text("defillama_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const newsItems = pgTable("news_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  source: text("source"),
  sourceUrl: text("source_url"),
  priority: integer("priority").default(2), // 1=High, 2=Normal, 3+=Low
  coins: text("coins").array(), // Array of coin symbols
  effectivePrice: decimal("effective_price", { precision: 20, scale: 8 }),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const monteCarloSimulations = pgTable("monte_carlo_simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => tokens.id),
  bearishPrice: decimal("bearish_price", { precision: 20, scale: 8 }),
  basePrice: decimal("base_price", { precision: 20, scale: 8 }),
  bullishPrice: decimal("bullish_price", { precision: 20, scale: 8 }),
  targetDate: timestamp("target_date").notNull(),
  volatility: decimal("volatility", { precision: 10, scale: 4 }),
  driftRate: decimal("drift_rate", { precision: 10, scale: 4 }),
  simulationRuns: integer("simulation_runs").default(10000),
  parameters: jsonb("parameters"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const hyperliquidMetrics = pgTable("hyperliquid_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketShare: decimal("market_share", { precision: 10, scale: 2 }),
  annualRevenue: decimal("annual_revenue", { precision: 20, scale: 2 }),
  activeUsers: integer("active_users"),
  volume30d: decimal("volume_30d", { precision: 20, scale: 2 }),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const tokensRelations = relations(tokens, ({ many }) => ({
  unlocks: many(tokenUnlocks),
  protocols: many(defiProtocols),
  simulations: many(monteCarloSimulations),
}));

export const tokenUnlocksRelations = relations(tokenUnlocks, ({ one }) => ({
  token: one(tokens, {
    fields: [tokenUnlocks.tokenId],
    references: [tokens.id],
  }),
}));

export const defiProtocolsRelations = relations(defiProtocols, ({ one }) => ({
  token: one(tokens, {
    fields: [defiProtocols.tokenId],
    references: [tokens.id],
  }),
}));

export const monteCarloSimulationsRelations = relations(monteCarloSimulations, ({ one }) => ({
  token: one(tokens, {
    fields: [monteCarloSimulations.tokenId],
    references: [tokens.id],
  }),
}));

// Insert schemas
export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenUnlockSchema = createInsertSchema(tokenUnlocks).omit({
  id: true,
  createdAt: true,
});

export const insertDefiProtocolSchema = createInsertSchema(defiProtocols).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsItemSchema = createInsertSchema(newsItems).omit({
  id: true,
  createdAt: true,
});

export const insertMonteCarloSimulationSchema = createInsertSchema(monteCarloSimulations).omit({
  id: true,
  createdAt: true,
});

export const insertHyperliquidMetricsSchema = createInsertSchema(hyperliquidMetrics).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

export type InsertTokenUnlock = z.infer<typeof insertTokenUnlockSchema>;
export type TokenUnlock = typeof tokenUnlocks.$inferSelect;

export type InsertDefiProtocol = z.infer<typeof insertDefiProtocolSchema>;
export type DefiProtocol = typeof defiProtocols.$inferSelect;

export type InsertNewsItem = z.infer<typeof insertNewsItemSchema>;
export type NewsItem = typeof newsItems.$inferSelect;

export type InsertMonteCarloSimulation = z.infer<typeof insertMonteCarloSimulationSchema>;
export type MonteCarloSimulation = typeof monteCarloSimulations.$inferSelect;

export type InsertHyperliquidMetrics = z.infer<typeof insertHyperliquidMetricsSchema>;
export type HyperliquidMetrics = typeof hyperliquidMetrics.$inferSelect;
