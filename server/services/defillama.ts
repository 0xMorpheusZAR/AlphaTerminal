export interface DefiLlamaProtocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  category: string;
  chains: string[];
  module: string;
  twitter?: string;
  forkedFrom?: string[];
  oracles?: string[];
  listedAt: number;
  methodology?: string;
  slug: string;
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  tokenBreakdowns?: Record<string, number>;
  mcap?: number;
}

export interface DefiLlamaRevenue {
  date: string;
  totalDataChart: [number, number][];
  totalDataChartBreakdown: Record<string, [number, number][]>;
  protocols: Record<string, {
    revenue: number;
    revenue24h?: number;
    revenue7d?: number;
    revenue30d?: number;
  }>;
}

export interface DefiLlamaTVL {
  date: string;
  totalLiquidityUSD: number;
  ethereum: number;
  bsc: number;
  polygon: number;
  // ... other chains
}

export class DefiLlamaService {
  private baseUrl = 'https://api.llama.fi';

  constructor() {
    // DefiLlama API doesn't require authentication for most endpoints
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DefiLlama API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllProtocols(): Promise<DefiLlamaProtocol[]> {
    const endpoint = '/protocols';
    return this.makeRequest(endpoint);
  }

  async getProtocol(slug: string): Promise<any> {
    const endpoint = `/protocol/${slug}`;
    return this.makeRequest(endpoint);
  }

  async getTVL(): Promise<DefiLlamaTVL[]> {
    const endpoint = '/v2/historicalChainTvl';
    return this.makeRequest(endpoint);
  }

  async getProtocolTVL(protocol: string): Promise<any> {
    const endpoint = `/tvl/${protocol}`;
    return this.makeRequest(endpoint);
  }

  async getRevenue(): Promise<any> {
    const endpoint = '/overview/dexs';
    return this.makeRequest(endpoint);
  }

  async getProtocolRevenue(protocol: string): Promise<any> {
    const endpoint = `/summary/dexs/${protocol}`;
    return this.makeRequest(endpoint);
  }

  async getDexVolume(): Promise<any> {
    const endpoint = '/overview/dexs';
    return this.makeRequest(endpoint);
  }

  async getProtocolDexVolume(protocol: string): Promise<any> {
    const endpoint = `/summary/dexs/${protocol}`;
    return this.makeRequest(endpoint);
  }

  async getYieldPools(): Promise<any> {
    const endpoint = '/pools';
    return this.makeRequest(endpoint);
  }

  async getStablecoins(): Promise<any> {
    const endpoint = '/stablecoins?includePrices=true';
    return this.makeRequest(endpoint);
  }

  async getBridges(): Promise<any> {
    const endpoint = '/bridges';
    return this.makeRequest(endpoint);
  }

  async getTopProtocolsByTVL(limit: number = 50): Promise<DefiLlamaProtocol[]> {
    const protocols = await this.getAllProtocols();
    return protocols
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);
  }

  async getProtocolsByCategory(category: string): Promise<DefiLlamaProtocol[]> {
    const protocols = await this.getAllProtocols();
    return protocols.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  async getCashCowProtocols(): Promise<any[]> {
    try {
      // Get protocols with revenue data
      const revenueData = await this.getRevenue();
      const protocols = await this.getAllProtocols();
      
      // Combine TVL and revenue data
      const cashCows = protocols
        .filter(p => p.tvl && p.tvl > 100000000) // TVL > $100M
        .map(protocol => {
          const revenue = revenueData.protocols?.[protocol.slug];
          return {
            ...protocol,
            revenue: revenue?.revenue || 0,
            revenue24h: revenue?.revenue24h || 0,
            revenue7d: revenue?.revenue7d || 0,
            revenue30d: revenue?.revenue30d || 0,
          };
        })
        .filter(p => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue);

      return cashCows;
    } catch (error) {
      console.error('Error fetching cash cow protocols:', error);
      return [];
    }
  }

  // Helper method to calculate P/E ratios
  calculatePERatio(marketCap: number, annualRevenue: number): number | null {
    if (!marketCap || !annualRevenue || annualRevenue <= 0) return null;
    return marketCap / annualRevenue;
  }

  // Helper method to calculate annual revenue run rate
  calculateAnnualRunRate(dailyRevenue: number): number {
    return dailyRevenue * 365;
  }

  // Helper method to get revenue growth
  calculateRevenueGrowth(current: number, previous: number): number {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // Format protocol data for our database
  formatProtocolForStorage(protocol: DefiLlamaProtocol, revenueData?: any): any {
    const revenue24h = revenueData?.revenue24h || 0;
    const revenue7d = revenueData?.revenue7d || 0;
    const revenue30d = revenueData?.revenue30d || 0;
    const annualRevenue = this.calculateAnnualRunRate(revenue24h);

    return {
      name: protocol.name,
      tvl: protocol.tvl?.toString(),
      revenue24h: revenue24h.toString(),
      revenue7d: revenue7d.toString(),
      revenue30d: revenue30d.toString(),
      revenue1y: annualRevenue.toString(),
      peRatio: protocol.mcap ? this.calculatePERatio(protocol.mcap, annualRevenue)?.toString() : null,
      category: protocol.category,
      defillama: protocol.slug,
    };
  }
}

export const defiLlamaService = new DefiLlamaService();
