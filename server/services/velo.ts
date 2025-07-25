import WebSocket from 'ws';

export interface VeloNewsItem {
  id: number;
  time: number;
  effectiveTime: number;
  headline: string;
  source: string;
  priority: number;
  coins: string[];
  summary?: string;
  link?: string;
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
  private baseUrl = 'https://api.velodata.app';
  private wsUrl = 'wss://api.velodata.app/stream/news';
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
      // Response is directly an array of news items
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching Velo news:', error);
      return [];
    }
  }

  async getHistoricalNews(hours: number = 48): Promise<VeloNewsItem[]> {
    // Calculate timestamp for 48 hours ago (in milliseconds)
    const since = Date.now() - (hours * 60 * 60 * 1000);
    const endpoint = `/news?since=${since}&limit=1000`;
    
    try {
      const response = await this.makeRequest(endpoint);
      const news = Array.isArray(response) ? response : [];
      
      // Sort by time in descending order (newest first)
      return news.sort((a: VeloNewsItem, b: VeloNewsItem) => b.time - a.time);
    } catch (error) {
      console.error('Error fetching historical Velo news:', error);
      return [];
    }
  }

  async getNewsByPriority(priority: number, limit: number = 20): Promise<VeloNewsItem[]> {
    const endpoint = `/news?priority=${priority}&limit=${limit}`;
    
    try {
      const response = await this.makeRequest(endpoint);
      return Array.isArray(response) ? response : [];
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
      title: veloNews.headline,
      content: veloNews.summary,
      source: veloNews.source,
      sourceUrl: veloNews.link,
      priority: veloNews.priority,
      coins: veloNews.coins,
      effectivePrice: null,
      publishedAt: new Date(veloNews.time),
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
      console.log('⚠️  WebSocket streaming disabled - no API key');
      return;
    }

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
        // Send authentication if needed
        this.ws?.send(JSON.stringify({ type: 'auth', token: this.apiKey }));
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const messageStr = data.toString();
          
          // Handle control messages
          if (['connected', 'heartbeat', 'closed'].includes(messageStr)) {
            console.log(`Velo WebSocket: ${messageStr}`);
            return;
          }
          
          // Parse JSON messages
          const message = JSON.parse(messageStr);
          
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
        
        // Don't attempt to reconnect if no API key or if we got a 404
        if (!this.apiKey) {
          return;
        }
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.streamCallbacks.size > 0 && this.apiKey) {
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
      return this.generateMockNews();
    }
    return [];
  }

  private generateMockNews(): VeloNewsItem[] {
    const now = Date.now();
    const mockNews: VeloNewsItem[] = [
      {
        id: 1,
        time: now - 3600000, // 1 hour ago
        effectiveTime: now - 3600000,
        headline: 'Bitcoin Surges Past $45,000 as ETF Approval Rumors Intensify',
        source: 'Velo',
        priority: 1,
        coins: ['BTC'],
        summary: '# Bitcoin ETF Rumors\n\nBitcoin price has broken through the $45,000 resistance level amid growing speculation about potential spot ETF approvals.',
        link: 'https://velodata.app/news/1',
      },
      {
        id: 2,
        time: now - 7200000, // 2 hours ago
        effectiveTime: now - 7200000,
        headline: 'Ethereum Layer-2 TVL Reaches All-Time High of $50 Billion',
        source: 'Velo',
        priority: 2,
        coins: ['ETH', 'ARB', 'OP'],
        summary: '# Layer-2 Milestone\n\nThe total value locked in Ethereum Layer-2 solutions has hit a new record as users seek cheaper transaction fees.',
        link: 'https://velodata.app/news/2',
      },
      {
        id: 3,
        time: now - 14400000, // 4 hours ago
        effectiveTime: now - 14400000,
        headline: 'Solana Network Experiences Brief Outage, Now Fully Operational',
        source: 'Velo',
        priority: 1,
        coins: ['SOL'],
        summary: '# Solana Recovery\n\nThe Solana blockchain experienced a 2-hour network disruption but has since recovered with validators back online.',
        link: 'https://velodata.app/news/3',
      },
      {
        id: 4,
        time: now - 21600000, // 6 hours ago
        effectiveTime: now - 21600000,
        headline: 'DeFi Protocol Aave V3 Launches on Scroll Mainnet',
        source: 'Velo',
        priority: 2,
        coins: ['AAVE', 'SCROLL'],
        summary: '# Aave V3 Expansion\n\nAave has expanded to the Scroll zkEVM network, bringing lending and borrowing capabilities to the Layer-2 solution.',
        link: 'https://velodata.app/news/4',
      },
      {
        id: 5,
        time: now - 28800000, // 8 hours ago
        effectiveTime: now - 28800000,
        headline: 'XRP Price Jumps 15% Following Favorable Court Ruling',
        source: 'Velo',
        priority: 1,
        coins: ['XRP'],
        summary: '# XRP Legal Victory\n\nRipple\'s XRP token saw significant gains after a court decision favored the company in its ongoing SEC lawsuit.',
        link: 'https://velodata.app/news/5',
      },
    ];
    
    return mockNews;
  }
}

export const veloService = new VeloService();