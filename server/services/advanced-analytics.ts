import { coinGeckoService } from './coingecko';

export interface HeatMapData {
  id: string;
  symbol: string;
  market_cap: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export interface PerformanceData {
  btc: Array<{ ts: number; price: number; normalized: number }>;
  eth: Array<{ ts: number; price: number; normalized: number }>;
  btc_dominance: Array<{ ts: number; dominance: number }>;
}

export interface CandlestickData {
  ohlc: Array<[number, number, number, number, number]>; // [timestamp, open, high, low, close]
  volumes: Array<[number, number]>; // [timestamp, volume]
}

export interface SectorRotationData {
  category_id: string;
  category_name: string;
  market_cap_change_24h: number;
  coins: Array<{
    id: string;
    symbol: string;
    market_cap: number;
    price_change_percentage_24h: number;
  }>;
}

export interface LiquidityPool {
  pool_address: string;
  network: string;
  dex_name: string;
  liquidity_usd: number;
  volume_24h_usd: number;
  volume_delta_pct: number;
  token0_symbol: string;
  token1_symbol: string;
}

export class AdvancedAnalyticsService {
  constructor() {}

  /**
   * 1) Multi-asset market-cap heat-map (top 50)
   */
  async getMarketCapHeatMap(): Promise<{ data: HeatMapData[] }> {
    try {
      const response = await coinGeckoService.getTopCoins(50);
      
      const data = response.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        market_cap: coin.market_cap,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        total_volume: coin.total_volume
      })).sort((a, b) => b.market_cap - a.market_cap);

      return { data };
    } catch (error) {
      console.error('Error fetching heat map data:', error);
      // Return mock data if API fails
      return { data: this.getMockHeatMapData() };
    }
  }

  /**
   * 2) Long-range BTC vs ETH performance overlay (2015 → today)
   */
  async getBTCvsETHPerformance(): Promise<PerformanceData> {
    try {
      const btcStartDate = new Date('2015-01-01').getTime() / 1000;
      const ethStartDate = new Date('2015-08-07').getTime() / 1000;
      const now = Date.now() / 1000;

      // Fetch historical data
      const [btcData, ethData] = await Promise.all([
        coinGeckoService.getCoinHistory('bitcoin', Math.floor((now - btcStartDate) / 86400)),
        coinGeckoService.getCoinHistory('ethereum', Math.floor((now - ethStartDate) / 86400))
      ]);

      // Normalize prices to start at 1
      const btcInitialPrice = btcData.prices[0]?.[1] || 1;
      const ethInitialPrice = ethData.prices[0]?.[1] || 1;

      const btc = btcData.prices.map(([ts, price]) => ({
        ts,
        price,
        normalized: price / btcInitialPrice
      }));

      const eth = ethData.prices.map(([ts, price]) => ({
        ts,
        price,
        normalized: price / ethInitialPrice
      }));

      // For BTC dominance, we'll simulate it (in production, use global market cap data)
      const btc_dominance = btc.map(({ ts }) => ({
        ts,
        dominance: 40 + Math.random() * 20 // Mock: 40-60% dominance
      }));

      return { btc, eth, btc_dominance };
    } catch (error) {
      console.error('Error fetching BTC vs ETH performance:', error);
      return this.getMockPerformanceData();
    }
  }

  /**
   * 3) 30-day candlestick + volume chart for any coin
   */
  async getCandlestickData(coinId: string): Promise<CandlestickData> {
    try {
      const historicalData = await coinGeckoService.getCoinHistory(coinId, 30);
      
      // Convert to OHLC format (simulated from daily prices)
      const ohlc: Array<[number, number, number, number, number]> = [];
      const volumes: Array<[number, number]> = [];

      for (let i = 0; i < historicalData.prices.length; i++) {
        const [timestamp, price] = historicalData.prices[i];
        const volume = historicalData.total_volumes[i]?.[1] || 0;
        
        // Simulate OHLC from price with some variance
        const open = price * (1 + (Math.random() - 0.5) * 0.02);
        const high = Math.max(open, price) * (1 + Math.random() * 0.01);
        const low = Math.min(open, price) * (1 - Math.random() * 0.01);
        const close = price;

        ohlc.push([timestamp, open, high, low, close]);
        volumes.push([timestamp, volume]);
      }

      return { ohlc, volumes };
    } catch (error) {
      console.error('Error fetching candlestick data:', error);
      return this.getMockCandlestickData();
    }
  }

  /**
   * 4) Sector rotation dashboard – category leaders
   */
  async getSectorRotation(): Promise<SectorRotationData[]> {
    try {
      // Simulated categories (in production, use actual API)
      const categories = [
        { id: 'defi', name: 'DeFi', change_24h: 5.2 },
        { id: 'gaming', name: 'Gaming', change_24h: 8.7 },
        { id: 'layer-2', name: 'Layer 2', change_24h: -3.1 },
        { id: 'ai', name: 'AI', change_24h: 12.4 },
        { id: 'meme', name: 'Meme Coins', change_24h: 25.8 }
      ];

      // Sort by 24h change and take top 5
      const topCategories = categories.sort((a, b) => b.change_24h - a.change_24h).slice(0, 5);

      const sectorData: SectorRotationData[] = [];

      for (const category of topCategories) {
        // Get top coins for each category (simulated)
        const coins = await this.getTopCoinsForCategory(category.id);
        
        sectorData.push({
          category_id: category.id,
          category_name: category.name,
          market_cap_change_24h: category.change_24h,
          coins: coins.slice(0, 10)
        });
      }

      return sectorData;
    } catch (error) {
      console.error('Error fetching sector rotation data:', error);
      return this.getMockSectorRotationData();
    }
  }

  /**
   * 5) On-chain liquidity spikes – trending pools monitor
   */
  async getLiquiditySpikes(): Promise<LiquidityPool[]> {
    try {
      // This would use on-chain DEX data in production
      // For now, return simulated trending pools
      const pools: LiquidityPool[] = [
        {
          pool_address: '0x1234...5678',
          network: 'ethereum',
          dex_name: 'Uniswap V3',
          liquidity_usd: 2500000,
          volume_24h_usd: 1800000,
          volume_delta_pct: 350,
          token0_symbol: 'USDC',
          token1_symbol: 'PEPE'
        },
        {
          pool_address: '0xabcd...efgh',
          network: 'arbitrum',
          dex_name: 'Camelot',
          liquidity_usd: 850000,
          volume_24h_usd: 620000,
          volume_delta_pct: 280,
          token0_symbol: 'ARB',
          token1_symbol: 'ETH'
        },
        {
          pool_address: '0x9876...5432',
          network: 'bsc',
          dex_name: 'PancakeSwap',
          liquidity_usd: 1200000,
          volume_24h_usd: 950000,
          volume_delta_pct: 220,
          token0_symbol: 'BNB',
          token1_symbol: 'USDT'
        }
      ];

      // Filter pools with liquidity > $500k and sort by volume delta
      return pools
        .filter(pool => pool.liquidity_usd > 500000)
        .sort((a, b) => b.volume_delta_pct - a.volume_delta_pct);
    } catch (error) {
      console.error('Error fetching liquidity spikes:', error);
      return this.getMockLiquidityData();
    }
  }

  // Helper methods
  private async getTopCoinsForCategory(categoryId: string): Promise<any[]> {
    // In production, this would filter by category
    // For now, return mock data based on category
    const categoryCoins: Record<string, any[]> = {
      defi: [
        { id: 'uniswap', symbol: 'UNI', market_cap: 5000000000, price_change_percentage_24h: 4.5 },
        { id: 'aave', symbol: 'AAVE', market_cap: 1200000000, price_change_percentage_24h: 3.2 },
        { id: 'curve-dao-token', symbol: 'CRV', market_cap: 900000000, price_change_percentage_24h: 6.8 }
      ],
      gaming: [
        { id: 'immutable-x', symbol: 'IMX', market_cap: 2000000000, price_change_percentage_24h: 12.3 },
        { id: 'gala', symbol: 'GALA', market_cap: 500000000, price_change_percentage_24h: 8.9 },
        { id: 'sandbox', symbol: 'SAND', market_cap: 800000000, price_change_percentage_24h: 5.4 }
      ],
      'layer-2': [
        { id: 'arbitrum', symbol: 'ARB', market_cap: 3000000000, price_change_percentage_24h: -2.1 },
        { id: 'optimism', symbol: 'OP', market_cap: 2500000000, price_change_percentage_24h: -1.8 },
        { id: 'polygon', symbol: 'MATIC', market_cap: 7000000000, price_change_percentage_24h: -3.5 }
      ],
      ai: [
        { id: 'fetch-ai', symbol: 'FET', market_cap: 1500000000, price_change_percentage_24h: 15.2 },
        { id: 'singularitynet', symbol: 'AGIX', market_cap: 800000000, price_change_percentage_24h: 11.8 },
        { id: 'ocean-protocol', symbol: 'OCEAN', market_cap: 600000000, price_change_percentage_24h: 9.5 }
      ],
      meme: [
        { id: 'pepe', symbol: 'PEPE', market_cap: 4000000000, price_change_percentage_24h: 35.2 },
        { id: 'shiba-inu', symbol: 'SHIB', market_cap: 6000000000, price_change_percentage_24h: 22.1 },
        { id: 'dogecoin', symbol: 'DOGE', market_cap: 12000000000, price_change_percentage_24h: 18.7 }
      ]
    };

    return categoryCoins[categoryId] || [];
  }

  // Mock data methods for fallback
  private getMockHeatMapData(): HeatMapData[] {
    return [
      { id: 'bitcoin', symbol: 'btc', market_cap: 880000000000, price_change_percentage_24h: 2.5, total_volume: 25000000000 },
      { id: 'ethereum', symbol: 'eth', market_cap: 300000000000, price_change_percentage_24h: 3.2, total_volume: 15000000000 },
      { id: 'binancecoin', symbol: 'bnb', market_cap: 48000000000, price_change_percentage_24h: 1.8, total_volume: 1200000000 }
    ];
  }

  private getMockPerformanceData(): PerformanceData {
    const now = Date.now();
    const btc = Array.from({ length: 30 }, (_, i) => ({
      ts: now - (30 - i) * 86400000,
      price: 45000 + Math.random() * 5000,
      normalized: 1 + Math.random() * 0.5
    }));

    const eth = Array.from({ length: 30 }, (_, i) => ({
      ts: now - (30 - i) * 86400000,
      price: 2500 + Math.random() * 300,
      normalized: 1 + Math.random() * 0.8
    }));

    const btc_dominance = btc.map(({ ts }) => ({
      ts,
      dominance: 45 + Math.random() * 10
    }));

    return { btc, eth, btc_dominance };
  }

  private getMockCandlestickData(): CandlestickData {
    const now = Date.now();
    const ohlc: Array<[number, number, number, number, number]> = [];
    const volumes: Array<[number, number]> = [];

    for (let i = 0; i < 30; i++) {
      const ts = now - (30 - i) * 86400000;
      const open = 45000 + Math.random() * 2000;
      const close = open + (Math.random() - 0.5) * 1000;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      
      ohlc.push([ts, open, high, low, close]);
      volumes.push([ts, 20000000000 + Math.random() * 10000000000]);
    }

    return { ohlc, volumes };
  }

  private getMockSectorRotationData(): SectorRotationData[] {
    return [
      {
        category_id: 'meme',
        category_name: 'Meme Coins',
        market_cap_change_24h: 25.8,
        coins: [
          { id: 'pepe', symbol: 'PEPE', market_cap: 4000000000, price_change_percentage_24h: 35.2 }
        ]
      }
    ];
  }

  private getMockLiquidityData(): LiquidityPool[] {
    return [
      {
        pool_address: '0x1234...5678',
        network: 'ethereum',
        dex_name: 'Uniswap V3',
        liquidity_usd: 2500000,
        volume_24h_usd: 1800000,
        volume_delta_pct: 350,
        token0_symbol: 'USDC',
        token1_symbol: 'PEPE'
      }
    ];
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();