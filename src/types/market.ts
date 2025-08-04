export interface DetailedMarketData extends CryptoData {
  rank: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  roi?: number;
  fullyDilutedValuation?: number;
  maxSupply?: number;
  priceChange1h?: number;
  priceChange30d?: number;
  priceChange1y?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: Date;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  total: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
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
  volume: {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface WhaleTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  token: string;
  timestamp: Date;
  type: 'transfer' | 'swap' | 'mint' | 'burn';
  isWhale: boolean;
}

export interface DeFiMetrics {
  protocol: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  fees24h: number;
  users24h: number;
  chains: string[];
  category: 'dex' | 'lending' | 'yield' | 'derivatives' | 'insurance' | 'other';
}

export interface Portfolio {
  id: string;
  userId: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPercentage: number;
  lastUpdated: Date;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  allocation: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: 'momentum' | 'arbitrage' | 'market-making' | 'mean-reversion' | 'trend-following';
  status: 'active' | 'paused' | 'backtesting';
  pairs: string[];
  parameters: Record<string, any>;
  performance: StrategyPerformance;
}

export interface StrategyPerformance {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalPnl: number;
  avgPnlPerTrade: number;
}

export interface MarketSentiment {
  fearGreedIndex: number;
  socialSentiment: {
    twitter: number;
    reddit: number;
    overall: number;
  };
  newssSentiment: 'bullish' | 'bearish' | 'neutral';
  whaleActivity: 'accumulating' | 'distributing' | 'neutral';
}

import { CryptoData } from './index';