export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  price_change_percentage_1y_in_currency: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

export interface CoinGeckoHistorical {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export class CoinGeckoService {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coingecko.com/api/v3';

  constructor() {
    this.apiKey = process.env.COINGECKO_PRO_API_KEY || process.env.COINGECKO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  CoinGecko API key not found. API calls will return mock data.');
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.apiKey) {
      console.log('📊 Returning mock CoinGecko data (no API key)');
      return this.getMockData(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'X-Cg-Pro-Api-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getTopCoins(limit: number = 250): Promise<CoinGeckoPrice[]> {
    const endpoint = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y`;
    return this.makeRequest(endpoint);
  }

  async getCoinById(id: string): Promise<any> {
    const endpoint = `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return this.makeRequest(endpoint);
  }

  async getCoinPrice(id: string): Promise<any> {
    const endpoint = `/simple/price?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
    return this.makeRequest(endpoint);
  }

  async getCoinHistory(id: string, days: number = 365): Promise<CoinGeckoHistorical> {
    const endpoint = `/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    return this.makeRequest(endpoint);
  }

  async searchCoins(query: string): Promise<any> {
    const endpoint = `/search?query=${encodeURIComponent(query)}`;
    return this.makeRequest(endpoint);
  }

  async getGlobalData(): Promise<any> {
    const endpoint = '/global';
    return this.makeRequest(endpoint);
  }

  async getTrendingCoins(): Promise<any> {
    const endpoint = '/search/trending';
    return this.makeRequest(endpoint);
  }

  // Helper method to calculate decline from ATH
  calculateDeclineFromATH(currentPrice: number, ath: number): number {
    if (!ath || ath === 0) return 0;
    return ((currentPrice - ath) / ath) * 100;
  }

  // Helper method to determine risk level
  determineRiskLevel(declineFromATH: number): string {
    if (declineFromATH <= -95) return 'EXTREME';
    if (declineFromATH <= -90) return 'VERY_HIGH';
    if (declineFromATH <= -80) return 'HIGH';
    if (declineFromATH <= -60) return 'MEDIUM';
    return 'LOW';
  }

  // Helper method to categorize tokens by sector
  categorizeBySector(coinId: string, categories: string[]): string {
    // Simple categorization based on common patterns
    const categoryMap: { [key: string]: string } = {
      'decentralized-finance-defi': 'DeFi',
      'gaming': 'Gaming',
      'layer-2': 'Layer 2',
      'scaling': 'Layer 2',
      'non-fungible-tokens-nft': 'NFTs',
      'metaverse': 'Metaverse',
      'meme-token': 'Meme',
      'exchange-based-tokens': 'Exchange',
      'lending-borrowing': 'DeFi',
      'yield-farming': 'DeFi',
    };

    for (const category of categories || []) {
      if (categoryMap[category]) {
        return categoryMap[category];
      }
    }

    return 'Others';
  }

  private getMockData(endpoint: string): any {
    // Mock data for different endpoints
    if (endpoint.includes('/coins/markets')) {
      return this.getMockMarketData();
    } else if (endpoint.includes('/coins/') && endpoint.includes('/market_chart')) {
      return this.getMockHistoricalData();
    } else if (endpoint.includes('/simple/price')) {
      return { bitcoin: { usd: 45000, usd_market_cap: 880000000000, usd_24h_vol: 30000000000, usd_24h_change: 2.5 } };
    } else {
      return this.getMockCoinData();
    }
  }

  private getMockMarketData(): CoinGeckoPrice[] {
    const mockTokens = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, marketCap: 880000000000, ath: 69000, athDate: '2021-11-10', change24h: 2.5 },
      { symbol: 'ETH', name: 'Ethereum', price: 2500, marketCap: 300000000000, ath: 4878, athDate: '2021-11-10', change24h: 3.2 },
      { symbol: 'BNB', name: 'BNB', price: 320, marketCap: 48000000000, ath: 690, athDate: '2021-05-10', change24h: 1.8 },
      { symbol: 'SOL', name: 'Solana', price: 95, marketCap: 41000000000, ath: 260, athDate: '2021-11-06', change24h: -1.2 },
      { symbol: 'XRP', name: 'XRP', price: 0.52, marketCap: 29000000000, ath: 3.84, athDate: '2018-01-04', change24h: 0.8 },
      { symbol: 'LUNA', name: 'Terra Luna Classic', price: 0.0001, marketCap: 600000000, ath: 119.18, athDate: '2022-04-05', change24h: -5.2 },
      { symbol: 'FTT', name: 'FTX Token', price: 1.5, marketCap: 500000000, ath: 84.18, athDate: '2021-09-09', change24h: -2.1 },
      { symbol: 'CELR', name: 'Celer Network', price: 0.012, marketCap: 120000000, ath: 0.20, athDate: '2021-09-09', change24h: -8.5 },
    ];

    return mockTokens.map((token, index) => ({
      id: token.symbol.toLowerCase(),
      symbol: token.symbol.toLowerCase(),
      name: token.name,
      current_price: token.price,
      market_cap: token.marketCap,
      market_cap_rank: index + 1,
      fully_diluted_valuation: token.marketCap * 1.2,
      total_volume: token.marketCap * 0.05,
      high_24h: token.price * 1.05,
      low_24h: token.price * 0.95,
      price_change_24h: token.price * (token.change24h / 100),
      price_change_percentage_24h: token.change24h,
      price_change_percentage_7d_in_currency: token.change24h * 2.5,
      price_change_percentage_30d_in_currency: token.change24h * 5,
      price_change_percentage_1y_in_currency: ((token.price - token.ath) / token.ath) * 100,
      market_cap_change_24h: token.marketCap * (token.change24h / 100),
      market_cap_change_percentage_24h: token.change24h,
      circulating_supply: token.marketCap / token.price,
      total_supply: (token.marketCap / token.price) * 1.2,
      max_supply: (token.marketCap / token.price) * 1.5,
      ath: token.ath,
      ath_change_percentage: ((token.price - token.ath) / token.ath) * 100,
      ath_date: token.athDate,
      atl: token.price * 0.1,
      atl_change_percentage: ((token.price - (token.price * 0.1)) / (token.price * 0.1)) * 100,
      atl_date: '2020-03-13T02:22:55.114Z',
      roi: null,
      last_updated: new Date().toISOString(),
    }));
  }

  private getMockHistoricalData(): CoinGeckoHistorical {
    const now = Date.now();
    const days = 30;
    const interval = 24 * 60 * 60 * 1000; // 1 day
    
    const prices: [number, number][] = [];
    const marketCaps: [number, number][] = [];
    const volumes: [number, number][] = [];
    
    for (let i = 0; i < days; i++) {
      const timestamp = now - (i * interval);
      const price = 45000 + (Math.random() - 0.5) * 5000;
      const marketCap = price * 19000000; // Approximate BTC supply
      const volume = marketCap * 0.05 * (0.8 + Math.random() * 0.4);
      
      prices.unshift([timestamp, price]);
      marketCaps.unshift([timestamp, marketCap]);
      volumes.unshift([timestamp, volume]);
    }
    
    return { prices, market_caps: marketCaps, total_volumes: volumes };
  }

  private getMockCoinData(): any {
    return {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      market_data: {
        current_price: { usd: 45000 },
        market_cap: { usd: 880000000000 },
        total_volume: { usd: 30000000000 },
        price_change_percentage_24h: 2.5,
        ath: { usd: 69000 },
        ath_date: { usd: '2021-11-10T14:24:11.849Z' },
      },
      community_data: {
        twitter_followers: 5800000,
        reddit_subscribers: 4500000,
      },
      developer_data: {
        stars: 70000,
        forks: 32000,
        total_issues: 8000,
        closed_issues: 7500,
      },
    };
  }
}

export const coinGeckoService = new CoinGeckoService();
