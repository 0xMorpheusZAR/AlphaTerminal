import WebSocket from 'ws';

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
  private baseUrl = 'https://api.velodata.app/v1';
  private wsUrl = 'wss://api.velodata.app/v1/news/stream';
  private ws: WebSocket | null = null;
  private streamCallbacks: Set<(data: any) => void> = new Set();

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

  async getHistoricalNews(hours: number = 48): Promise<VeloNewsItem[]> {
    // Calculate timestamp for 48 hours ago
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const endpoint = `/news?since=${since}&limit=1000`;
    
    try {
      const response = await this.makeRequest(endpoint);
      const news = response.data || response.news || [];
      
      // Sort by published_at in descending order (newest first)
      return news.sort((a: VeloNewsItem, b: VeloNewsItem) => 
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
    } catch (error) {
      console.error('Error fetching historical Velo news:', error);
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

  // WebSocket streaming methods
  async startNewsStream(onMessage: (data: any) => void): Promise<void> {
    if (!this.apiKey) {
      console.warn('Cannot start news stream without API key');
      return;
    }

    // Temporarily disable WebSocket connection until we get the correct endpoint
    console.log('WebSocket streaming temporarily disabled - using REST API polling');
    return;

    /*
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      this.streamCallbacks.add(onMessage);
      return;
    }

    this.streamCallbacks.add(onMessage);

    try {
      this.ws = new WebSocket(this.wsUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      this.ws.on('open', () => {
        console.log('Velo WebSocket connected');
        this.ws?.send(JSON.stringify({ action: 'subscribe', channel: 'news' }));
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Broadcast to all callbacks
          this.streamCallbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('Error in stream callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('Velo WebSocket error:', error);
      });

      this.ws.on('close', () => {
        console.log('Velo WebSocket disconnected');
        this.ws = null;
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.streamCallbacks.size > 0) {
            console.log('Attempting to reconnect Velo WebSocket...');
            this.streamCallbacks.forEach(callback => {
              this.startNewsStream(callback);
            });
          }
        }, 5000);
      });

    } catch (error) {
      console.error('Error starting news stream:', error);
    }
    */
  }

  stopNewsStream(onMessage: (data: any) => void): void {
    this.streamCallbacks.delete(onMessage);
    
    if (this.streamCallbacks.size === 0 && this.ws) {
      this.ws.close();
      this.ws = null;
    }
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
