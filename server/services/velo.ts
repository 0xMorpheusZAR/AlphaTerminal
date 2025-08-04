import axios, { AxiosInstance } from 'axios';
import { cacheConfig } from './cache-manager';

export interface VeloNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timestamp: number;
  url: string;
  tags: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export class VeloService {
  private apiKey: string;
  private baseUrl = 'https://api.velo.com/v1'; // Update with actual Velo API URL
  private axios: AxiosInstance;

  constructor() {
    this.apiKey = process.env.VELO_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  Velo API key not found. Using mock data.');
    }

    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getNews(limit: number = 20): Promise<VeloNewsItem[]> {
    if (!this.apiKey) {
      return this.getMockNews();
    }

    const cacheKey = `velo_news:${limit}`;
    
    return cacheConfig.newsData.get(
      cacheKey,
      async () => {
        try {
          const response = await this.axios.get('/news', {
            params: { limit }
          });
          
          return response.data.data || [];
        } catch (error) {
          console.error('[Velo] Error fetching news:', error);
          return this.getMockNews();
        }
      },
      60 // 1 minute cache
    );
  }

  async getNewsByTags(tags: string[], limit: number = 20): Promise<VeloNewsItem[]> {
    if (!this.apiKey) {
      return this.getMockNews().filter(item => 
        item.tags.some(tag => tags.includes(tag))
      );
    }

    const cacheKey = `velo_news_tags:${tags.join(',')}:${limit}`;
    
    return cacheConfig.newsData.get(
      cacheKey,
      async () => {
        try {
          const response = await this.axios.get('/news', {
            params: { tags: tags.join(','), limit }
          });
          
          return response.data.data || [];
        } catch (error) {
          console.error('[Velo] Error fetching news by tags:', error);
          return this.getMockNews();
        }
      },
      60
    );
  }

  private getMockNews(): VeloNewsItem[] {
    const now = Date.now();
    
    return [
      {
        id: '1',
        headline: 'Bitcoin ETF Approval Drives Market Optimism',
        summary: 'The recent approval of Bitcoin ETFs has led to significant institutional interest and market optimism.',
        source: 'CryptoNews',
        timestamp: now - 300000,
        url: 'https://example.com/news/1',
        tags: ['bitcoin', 'etf', 'institutional'],
        sentiment: 'positive'
      },
      {
        id: '2',
        headline: 'Ethereum 2.0 Staking Reaches New Milestone',
        summary: 'Over 25 million ETH is now staked on the Ethereum network, showing strong validator participation.',
        source: 'DeFi Daily',
        timestamp: now - 600000,
        url: 'https://example.com/news/2',
        tags: ['ethereum', 'staking', 'defi'],
        sentiment: 'positive'
      },
      {
        id: '3',
        headline: 'Regulatory Concerns Impact DeFi Protocols',
        summary: 'New regulatory proposals raise questions about the future of decentralized finance protocols.',
        source: 'Regulatory Watch',
        timestamp: now - 900000,
        url: 'https://example.com/news/3',
        tags: ['defi', 'regulation', 'compliance'],
        sentiment: 'negative'
      },
      {
        id: '4',
        headline: 'Solana Ecosystem Sees Record Activity',
        summary: 'Solana network activity hits all-time high with growing NFT and DeFi applications.',
        source: 'Chain Analytics',
        timestamp: now - 1200000,
        url: 'https://example.com/news/4',
        tags: ['solana', 'nft', 'defi'],
        sentiment: 'positive'
      },
      {
        id: '5',
        headline: 'Market Analysis: Crypto Winter May Be Over',
        summary: 'Technical analysts suggest the prolonged bear market may be coming to an end.',
        source: 'Market Watch',
        timestamp: now - 1500000,
        url: 'https://example.com/news/5',
        tags: ['market', 'analysis', 'bullish'],
        sentiment: 'positive'
      }
    ];
  }
}

export const veloService = new VeloService();