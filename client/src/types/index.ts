export interface Token {
  id: string;
  symbol: string;
  name: string;
  coingeckoId?: string;
  currentPrice?: string;
  allTimeHigh?: string;
  allTimeHighDate?: string;
  marketCap?: string;
  volume24h?: string;
  priceChange1h?: string;
  priceChange24h?: string;
  priceChange7d?: string;
  priceChange30d?: string;
  priceChange1y?: string;
  declineFromAth?: string;
  sector?: string;
  riskLevel?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenUnlock {
  id: string;
  tokenId: string;
  unlockDate: string;
  unlockAmount?: string;
  unlockValue?: string;
  unlockType?: string;
  description?: string;
  createdAt?: string;
}

export interface DefiProtocol {
  id: string;
  name: string;
  tokenId?: string;
  tvl?: string;
  revenue24h?: string;
  revenue7d?: string;
  revenue30d?: string;
  revenue1y?: string;
  peRatio?: string;
  category?: string;
  defillama?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  priority: number;
  coins: string[];
  effectivePrice?: string;
  publishedAt: string;
  createdAt?: string;
}

export interface MonteCarloSimulation {
  id: string;
  tokenId: string;
  bearishPrice?: string;
  basePrice?: string;
  bullishPrice?: string;
  targetDate: string;
  volatility?: string;
  driftRate?: string;
  simulationRuns?: number;
  parameters?: any;
  createdAt?: string;
}

export interface HyperliquidMetrics {
  id: string;
  marketShare?: string;
  annualRevenue?: string;
  activeUsers?: number;
  volume30d?: string;
  tvl?: string;
  date: string;
  createdAt?: string;
}

export interface DashboardStats {
  failedTokens: number;
  pendingUnlocks: number;
  totalRevenue: number;
  totalUnlockValue: number;
  activeTracking: number;
  hyperliquid?: {
    marketShare: number;
    annualRevenue: number;
    activeUsers: number;
    volume30d: number;
    tvl: number;
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface SectorData {
  sector: string;
  count: number;
  percentage: number;
}
