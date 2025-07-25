export interface DuneQueryResult {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at?: string;
  execution_ended_at?: string;
  result?: {
    rows: any[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
      datapoint_count: number;
    };
  };
}

export interface HyperliquidMetric {
  date: string;
  volume_24h: number;
  daily_active_users: number;
  new_users: number;
  total_trades: number;
  liquidations: number;
  market_share: number;
  revenue: number;
  tvl: number;
}

export class DuneService {
  private apiKey: string;
  private baseUrl = 'https://api.dune.com/api/v1';

  constructor() {
    this.apiKey = process.env.DUNE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  Dune Analytics API key not found. API calls will return mock data.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      console.log('📊 Returning mock Dune Analytics data (no API key)');
      return this.getMockData(endpoint);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Dune-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Dune API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async executeQuery(queryId: number, parameters: Record<string, any> = {}): Promise<string> {
    const endpoint = `/query/${queryId}/execute`;
    const body = Object.keys(parameters).length > 0 ? { query_parameters: parameters } : {};

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.execution_id;
  }

  async getQueryResults(executionId: string): Promise<DuneQueryResult> {
    const endpoint = `/execution/${executionId}/results`;
    return this.makeRequest(endpoint);
  }

  async getLatestQueryResults(queryId: number, limit: number = 1000): Promise<any[]> {
    const endpoint = `/query/${queryId}/results?limit=${limit}`;
    const response = await this.makeRequest(endpoint);
    return response.result?.rows || [];
  }

  // Hyperliquid specific methods
  async getHyperliquidVolumeData(): Promise<any[]> {
    // Example query ID for Hyperliquid volume data
    const queryId = 3456789; // Replace with actual query ID
    try {
      return await this.getLatestQueryResults(queryId);
    } catch (error) {
      console.error('Error fetching Hyperliquid volume data:', error);
      return [];
    }
  }

  async getHyperliquidUserMetrics(): Promise<any[]> {
    // Example query ID for Hyperliquid user metrics
    const queryId = 3456790; // Replace with actual query ID
    try {
      return await this.getLatestQueryResults(queryId);
    } catch (error) {
      console.error('Error fetching Hyperliquid user metrics:', error);
      return [];
    }
  }

  async getHyperliquidLiquidations(): Promise<any[]> {
    // Example query ID for Hyperliquid liquidations
    const queryId = 3456791; // Replace with actual query ID
    try {
      return await this.getLatestQueryResults(queryId);
    } catch (error) {
      console.error('Error fetching Hyperliquid liquidations:', error);
      return [];
    }
  }

  async getHyperliquidTVL(): Promise<any[]> {
    // Example query ID for Hyperliquid TVL
    const queryId = 3456792; // Replace with actual query ID
    try {
      return await this.getLatestQueryResults(queryId);
    } catch (error) {
      console.error('Error fetching Hyperliquid TVL:', error);
      return [];
    }
  }

  async getHyperliquidRevenue(): Promise<any[]> {
    // Example query ID for Hyperliquid revenue
    const queryId = 3456793; // Replace with actual query ID
    try {
      return await this.getLatestQueryResults(queryId);
    } catch (error) {
      console.error('Error fetching Hyperliquid revenue:', error);
      return [];
    }
  }

  async getHyperliquidAllMetrics(): Promise<HyperliquidMetric[]> {
    try {
      const [volumeData, userMetrics, liquidations, tvlData, revenueData] = await Promise.allSettled([
        this.getHyperliquidVolumeData(),
        this.getHyperliquidUserMetrics(),
        this.getHyperliquidLiquidations(),
        this.getHyperliquidTVL(),
        this.getHyperliquidRevenue(),
      ]);

      // Combine and format the data
      const metrics: HyperliquidMetric[] = [];
      
      // Process and combine the data from different queries
      // This is a simplified example - actual implementation would depend on query structure
      
      return metrics;
    } catch (error) {
      console.error('Error fetching all Hyperliquid metrics:', error);
      return [];
    }
  }

  // Generic query execution with polling
  async executeQueryAndWait(queryId: number, parameters: Record<string, any> = {}, maxWaitTime: number = 300000): Promise<any[]> {
    const executionId = await this.executeQuery(queryId, parameters);
    
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getQueryResults(executionId);
      
      if (result.state === 'QUERY_STATE_COMPLETED') {
        return result.result?.rows || [];
      } else if (result.state === 'QUERY_STATE_FAILED') {
        throw new Error('Query execution failed');
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Query execution timed out');
  }

  // Helper method to format data for storage
  formatHyperliquidMetrics(rawData: any[]): HyperliquidMetric {
    // This would format the raw Dune data into our standardized format
    // Implementation depends on actual query structure
    const latest = rawData[0] || {};
    
    return {
      date: latest.date || new Date().toISOString(),
      volume_24h: latest.volume_24h || 0,
      daily_active_users: latest.daily_active_users || 0,
      new_users: latest.new_users || 0,
      total_trades: latest.total_trades || 0,
      liquidations: latest.liquidations || 0,
      market_share: latest.market_share || 0,
      revenue: latest.revenue || 0,
      tvl: latest.tvl || 0,
    };
  }

  private getMockData(endpoint: string): any {
    if (endpoint.includes('/query/') && endpoint.includes('/results')) {
      return {
        state: 'QUERY_STATE_COMPLETED',
        result: {
          rows: this.generateMockHyperliquidMetrics(),
          metadata: {
            column_names: ['date', 'volume_24h', 'daily_active_users', 'new_users', 'total_trades', 'liquidations', 'market_share', 'revenue', 'tvl'],
            result_set_bytes: 12345,
            total_row_count: 30,
            datapoint_count: 270
          }
        }
      };
    }
    return { state: 'QUERY_STATE_PENDING' };
  }

  private generateMockHyperliquidMetrics(): HyperliquidMetric[] {
    const today = new Date();
    const metrics: HyperliquidMetric[] = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        volume_24h: 1000000000 + Math.random() * 500000000,
        daily_active_users: 50000 + Math.floor(Math.random() * 20000),
        new_users: 1000 + Math.floor(Math.random() * 500),
        total_trades: 100000 + Math.floor(Math.random() * 50000),
        liquidations: Math.floor(Math.random() * 100),
        market_share: 8 + Math.random() * 4,
        revenue: 1000000 + Math.random() * 500000,
        tvl: 500000000 + Math.random() * 200000000,
      });
    }
    
    return metrics.reverse();
  }
}

export const duneService = new DuneService();
