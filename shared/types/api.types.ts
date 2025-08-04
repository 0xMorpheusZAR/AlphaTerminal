// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
  rateLimit?: RateLimitMeta;
  cache?: CacheMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface CacheMeta {
  hit: boolean;
  ttl?: number;
  key?: string;
}

// Request Types
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilteredRequest extends PaginatedRequest {
  filters?: Record<string, any>;
  search?: string;
}

export interface TimeRangeRequest {
  startDate?: string | Date;
  endDate?: string | Date;
  timeframe?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

export interface TokenMetrics extends MarketData {
  id: string;
  name: string;
  rank: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  fdv?: number;
}

export interface HistoricalData {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Whale Data Types
export interface WhaleTransaction {
  id: string;
  hash: string;
  blockchain: string;
  symbol: string;
  from: WalletInfo;
  to: WalletInfo;
  amount: number;
  amountUSD: number;
  timestamp: number;
  type: 'transfer' | 'mint' | 'burn' | 'swap';
}

export interface WalletInfo {
  address: string;
  label?: string;
  type?: 'exchange' | 'wallet' | 'contract' | 'unknown';
}

export interface ExchangeFlow {
  exchange: string;
  symbol: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  period: string;
}

// DeFi Types
export interface DeFiProtocol {
  id: string;
  name: string;
  symbol?: string;
  category: string;
  chains: string[];
  tvl: number;
  tvlChange24h: number;
  mcapTvl?: number;
  volume24h?: number;
  fees24h?: number;
  revenue24h?: number;
}

export interface LiquidityPool {
  id: string;
  protocol: string;
  pair: string;
  tvl: number;
  apy: number;
  volume24h: number;
  fees24h: number;
  il?: number; // Impermanent Loss
  rewards?: string[];
}

// Sentiment Types
export interface SentimentData {
  overall: SentimentScore;
  sources: {
    twitter?: SentimentScore;
    reddit?: SentimentScore;
    news?: SentimentScore;
  };
  keywords: string[];
  trendingTopics: TrendingTopic[];
}

export interface SentimentScore {
  score: number; // 0-100
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
  volume?: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: number;
  change24h?: number;
  emoji?: string;
}

// Analytics Types
export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  beta: number;
  correlation: number;
  maxDrawdown: number;
  var95: number; // Value at Risk
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema: {
    ema12: number;
    ema26: number;
    ema50: number;
    ema200: number;
  };
}

// Monte Carlo Simulation Types
export interface SimulationParams {
  tokenId: string;
  days: number;
  simulations: number;
  distribution: 'normal' | 'lognormal' | 'student-t';
  confidenceIntervals: number[];
  includeVolatilityClustering?: boolean;
  includeJumpDiffusion?: boolean;
}

export interface SimulationResult {
  id: string;
  tokenId: string;
  params: SimulationParams;
  results: {
    paths: number[][];
    percentiles: Record<number, number[]>;
    statistics: {
      mean: number;
      median: number;
      stdDev: number;
      skewness: number;
      kurtosis: number;
    };
    probabilities: {
      priceTargets: Array<{
        target: number;
        probability: number;
      }>;
    };
  };
  metadata: {
    executionTime: number;
    timestamp: string;
    modelAccuracy?: number;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'pro' | 'admin';
  preferences?: UserPreferences;
  apiKeys?: UserApiKeys;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
  };
  defaultCurrency: string;
  favoriteTokens: string[];
}

export interface UserApiKeys {
  coinGecko?: boolean;
  velo?: boolean;
  whaleAlert?: boolean;
  openAI?: boolean;
}

// WebSocket Types
export interface WSMessage<T = any> {
  type: WSMessageType;
  channel?: string;
  data: T;
  timestamp: string;
}

export enum WSMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  UPDATE = 'update',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

export interface WSSubscription {
  channel: string;
  params?: Record<string, any>;
}