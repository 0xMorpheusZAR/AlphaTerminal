export interface VeloNewsItem {
  id: string;
  title: string;
  content?: string;
  source: string;
  source_url?: string;
  priority: number;
  coins: string[];
  effective_price?: number;
  published_at: string;
  created_at: string;
}

export interface VeloMarketData {
  symbol: string;
  price: number;
  volume_24h: number;
  change_24h: number;
  timestamp: string;
}

export class VeloService {
  private apiKey: string;
  private baseUrl = 'https://api.velo.io/v1'; // Placeholder URL

  constructor() {
    this.apiKey = process.env.VELO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  Velo API key not found. API calls will return mock data.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      console.log('📰 Returning mock Velo news data (no API key)');
      return this.getMockData(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Velo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getNews(limit: number = 50, coins?: string[]): Promise<VeloNewsItem[]> {
    let endpoint = `/news?limit=${limit}`;
    
    if (coins && coins.length > 0) {
      endpoint += `&coins=${coins.join(',')}`;
    }
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response.news || [];
    } catch (error) {
      console.error('Error fetching Velo news:', error);
      return [];
    }
  }

  async getNewsByPriority(priority: number, limit: number = 20): Promise<VeloNewsItem[]> {
    const endpoint = `/news?priority=${priority}&limit=${limit}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response.news || [];
    } catch (error) {
      console.error('Error fetching Velo news by priority:', error);
      return [];
    }
  }

  async getMarketData(symbols: string[]): Promise<VeloMarketData[]> {
    const endpoint = `/market/data?symbols=${symbols.join(',')}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response.market_data || [];
    } catch (error) {
      console.error('Error fetching Velo market data:', error);
      return [];
    }
  }

  async getEffectivePrice(symbol: string, timestamp: string): Promise<number | null> {
    const endpoint = `/market/effective-price?symbol=${symbol}&timestamp=${timestamp}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data?.price || response.price || null;
    } catch (error) {
      console.error('Error fetching effective price:', error);
      return null;
    }
  }

  async getCrossExchangeData(symbol: string): Promise<any> {
    const endpoint = `/market/cross-exchange?symbol=${symbol}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching cross-exchange data:', error);
      return null;
    }
  }

  async getFuturesData(symbols: string[]): Promise<any[]> {
    const endpoint = `/futures/data?symbols=${symbols.join(',')}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response.futures || [];
    } catch (error) {
      console.error('Error fetching futures data:', error);
      return [];
    }
  }

  async getOptionsData(symbols: string[]): Promise<any[]> {
    const endpoint = `/options/data?symbols=${symbols.join(',')}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return response.data || response.options || [];
    } catch (error) {
      console.error('Error fetching options data:', error);
      return [];
    }
  }

  // Helper method to format news items for database storage
  formatNewsForStorage(veloNews: VeloNewsItem): any {
    return {
      title: veloNews.title,
      content: veloNews.content,
      source: veloNews.source,
      sourceUrl: veloNews.source_url,
      priority: veloNews.priority,
      coins: veloNews.coins,
      effectivePrice: veloNews.effective_price?.toString(),
      publishedAt: new Date(veloNews.published_at),
    };
  }

  // Helper method to determine priority level text
  getPriorityText(priority: number): string {
    switch (priority) {
      case 1: return 'HIGH';
      case 2: return 'NORMAL';
      default: return 'LOW';
    }
  }

  // Helper method to get BloFin trading URL
  getBloFinTradingUrl(symbol: string): string {
    return `https://www.blofin.com/en/futures/${symbol.toLowerCase()}usdt`;
  }

  private getMockData(endpoint: string): any {
    if (endpoint.includes('/news')) {
      return {
        data: this.generateMockNews(),
        news: this.generateMockNews()
      };
    }
    return { data: [] };
  }

  private generateMockNews(): VeloNewsItem[] {
    const mockNews: VeloNewsItem[] = [
      {
        id: '1',
        title: 'Bitcoin Surges Past $45,000 as ETF Approval Rumors Intensify',
        content: 'Bitcoin price has broken through the $45,000 resistance level amid growing speculation about potential spot ETF approvals.',
        source: 'CryptoNews',
        source_url: 'https://example.com/news/1',
        priority: 1,
        coins: ['BTC'],
        effective_price: 45000,
        published_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        title: 'Ethereum Layer-2 TVL Reaches All-Time High of $50 Billion',
        content: 'The total value locked in Ethereum Layer-2 solutions has hit a new record as users seek cheaper transaction fees.',
        source: 'DeFi Daily',
        source_url: 'https://example.com/news/2',
        priority: 2,
        coins: ['ETH', 'ARB', 'OP'],
        effective_price: 2500,
        published_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '3',
        title: 'Solana Network Experiences Brief Outage, Now Fully Operational',
        content: 'The Solana blockchain experienced a 2-hour network disruption but has since recovered with validators back online.',
        source: 'Chain Watch',
        source_url: 'https://example.com/news/3',
        priority: 1,
        coins: ['SOL'],
        effective_price: 95,
        published_at: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: '4',
        title: 'DeFi Protocol Aave V3 Launches on Scroll Mainnet',
        content: 'Aave has expanded to the Scroll zkEVM network, bringing lending and borrowing capabilities to the Layer-2 solution.',
        source: 'Protocol News',
        source_url: 'https://example.com/news/4',
        priority: 2,
        coins: ['AAVE', 'SCROLL'],
        published_at: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
        created_at: new Date(Date.now() - 21600000).toISOString(),
      },
      {
        id: '5',
        title: 'XRP Price Jumps 15% Following Favorable Court Ruling',
        content: 'Ripple\'s XRP token saw significant gains after a court decision favored the company in its ongoing SEC lawsuit.',
        source: 'Legal Crypto',
        source_url: 'https://example.com/news/5',
        priority: 1,
        coins: ['XRP'],
        effective_price: 0.52,
        published_at: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
        created_at: new Date(Date.now() - 28800000).toISOString(),
      },
    ];
    
    return mockNews;
  }
}

export const veloService = new VeloService();
