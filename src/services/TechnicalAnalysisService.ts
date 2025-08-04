import { TechnicalIndicators, OHLCV } from '../types/market';

export class TechnicalAnalysisService {
  constructor() {
    // Service is now independent
  }

  async calculateIndicators(symbol: string, indicators: string[]): Promise<TechnicalIndicators> {
    // Generate mock price history for calculations
    const history = this.generateMockHistory(symbol);

    const prices = history.map(h => h.close);
    const volumes = history.map(h => h.volume);

    const result: any = {};

    if (indicators.includes('rsi')) {
      result.rsi = this.calculateRSI(prices);
    }

    if (indicators.includes('macd')) {
      result.macd = this.calculateMACD(prices);
    }

    if (indicators.includes('bollinger')) {
      result.bollinger = this.calculateBollingerBands(prices);
    }

    if (indicators.includes('ema')) {
      result.ema = this.calculateEMAs(prices);
    }

    if (indicators.includes('volume')) {
      result.volume = this.analyzeVolume(volumes);
    }

    return result as TechnicalIndicators;
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Number(rsi.toFixed(2));
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    // Calculate signal line (9-period EMA of MACD)
    const macdValues = [];
    for (let i = 26; i < prices.length; i++) {
      const ema12Val = this.calculateEMA(prices.slice(0, i + 1), 12);
      const ema26Val = this.calculateEMA(prices.slice(0, i + 1), 26);
      macdValues.push(ema12Val - ema26Val);
    }

    const signal = this.calculateEMA(macdValues, 9);
    const histogram = macd - signal;

    return {
      macd: Number(macd.toFixed(4)),
      signal: Number(signal.toFixed(4)),
      histogram: Number(histogram.toFixed(4))
    };
  }

  private calculateBollingerBands(prices: number[], period: number = 20): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => 
      sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: Number((sma + 2 * stdDev).toFixed(2)),
      middle: Number(sma.toFixed(2)),
      lower: Number((sma - 2 * stdDev).toFixed(2))
    };
  }

  private calculateEMAs(prices: number[]): {
    ema12: number;
    ema26: number;
    ema50: number;
    ema200: number;
  } {
    return {
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      ema50: this.calculateEMA(prices, 50),
      ema200: this.calculateEMA(prices, 200)
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return Number(ema.toFixed(2));
  }

  private analyzeVolume(volumes: number[]): {
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recentVolumes = volumes.slice(-20);
    const average = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;

    // Compare recent average with older average
    const olderVolumes = volumes.slice(-40, -20);
    const olderAverage = olderVolumes.reduce((sum, vol) => sum + vol, 0) / olderVolumes.length;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (average > olderAverage * 1.1) {
      trend = 'increasing';
    } else if (average < olderAverage * 0.9) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return {
      average: Number(average.toFixed(0)),
      trend
    };
  }

  async detectPatterns(symbol: string): Promise<any[]> {
    const history = this.generateMockHistory(symbol, 168); // 7 days of hourly data

    const patterns = [];

    // Detect simple patterns
    if (this.detectBullFlag(history)) {
      patterns.push({ type: 'bull_flag', confidence: 0.75, action: 'buy' });
    }

    if (this.detectBearFlag(history)) {
      patterns.push({ type: 'bear_flag', confidence: 0.75, action: 'sell' });
    }

    if (this.detectDoubleTop(history)) {
      patterns.push({ type: 'double_top', confidence: 0.7, action: 'sell' });
    }

    if (this.detectDoubleBottom(history)) {
      patterns.push({ type: 'double_bottom', confidence: 0.7, action: 'buy' });
    }

    return patterns;
  }

  private detectBullFlag(history: OHLCV[]): boolean {
    // Simplified bull flag detection
    if (history.length < 20) return false;

    const recentHigh = Math.max(...history.slice(-20).map(h => h.high));
    const recentLow = Math.min(...history.slice(-20).map(h => h.low));
    const range = recentHigh - recentLow;

    // Check for upward trend followed by consolidation
    const midPoint = history[history.length - 10].close;
    const currentPrice = history[history.length - 1].close;

    return currentPrice > midPoint && range < currentPrice * 0.05;
  }

  private detectBearFlag(history: OHLCV[]): boolean {
    // Simplified bear flag detection
    if (history.length < 20) return false;

    const recentHigh = Math.max(...history.slice(-20).map(h => h.high));
    const recentLow = Math.min(...history.slice(-20).map(h => h.low));
    const range = recentHigh - recentLow;

    // Check for downward trend followed by consolidation
    const midPoint = history[history.length - 10].close;
    const currentPrice = history[history.length - 1].close;

    return currentPrice < midPoint && range < currentPrice * 0.05;
  }

  private detectDoubleTop(history: OHLCV[]): boolean {
    // Simplified double top detection
    if (history.length < 30) return false;

    const highs = history.slice(-30).map(h => h.high);
    const peaks = this.findPeaks(highs);

    if (peaks.length >= 2) {
      const lastTwoPeaks = peaks.slice(-2);
      const peakDiff = Math.abs(highs[lastTwoPeaks[0]] - highs[lastTwoPeaks[1]]);
      const avgPeak = (highs[lastTwoPeaks[0]] + highs[lastTwoPeaks[1]]) / 2;

      return peakDiff < avgPeak * 0.02; // Peaks within 2% of each other
    }

    return false;
  }

  private detectDoubleBottom(history: OHLCV[]): boolean {
    // Simplified double bottom detection
    if (history.length < 30) return false;

    const lows = history.slice(-30).map(h => h.low);
    const troughs = this.findTroughs(lows);

    if (troughs.length >= 2) {
      const lastTwoTroughs = troughs.slice(-2);
      const troughDiff = Math.abs(lows[lastTwoTroughs[0]] - lows[lastTwoTroughs[1]]);
      const avgTrough = (lows[lastTwoTroughs[0]] + lows[lastTwoTroughs[1]]) / 2;

      return troughDiff < avgTrough * 0.02; // Troughs within 2% of each other
    }

    return false;
  }

  private findPeaks(data: number[]): number[] {
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private findTroughs(data: number[]): number[] {
    const troughs = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        troughs.push(i);
      }
    }
    return troughs;
  }

  private generateMockHistory(symbol: string, points: number = 720): OHLCV[] {
    const basePrice = this.getBasePrice(symbol);
    const ohlcv: OHLCV[] = [];
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    
    for (let i = points; i > 0; i--) {
      const timestamp = new Date(now - i * hourMs);
      const volatility = 0.02;
      const trend = Math.sin(i / 24) * 0.01; // Daily cycle
      
      const open = i === points ? basePrice : ohlcv[ohlcv.length - 1].close;
      const change = (Math.random() - 0.5) * volatility + trend;
      const high = open * (1 + Math.abs(change) + Math.random() * volatility);
      const low = open * (1 - Math.abs(change) - Math.random() * volatility);
      const close = open * (1 + change);
      const volume = Math.random() * 1000000000;
      
      ohlcv.push({ timestamp, open, high, low, close, volume });
    }
    
    return ohlcv;
  }

  private getBasePrice(symbol: string): number {
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
    return basePrices[symbol.toUpperCase()] || 100;
  }
}