export interface NarrativeData {
  timestamp: number;
  date: string;
  [narrativeName: string]: number | string;
}

export interface NarrativeMetrics {
  name: string;
  value: number;
  change1d?: number;
  change7d?: number;
  change30d?: number;
}

export class DefiLlamaNarrativesService {
  private apiKey: string;
  private baseUrl = 'https://pro-api.llama.fi';

  constructor() {
    this.apiKey = process.env.DEFILLAMA_PRO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  DefiLlama Pro API key not found. Using local CSV data.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      console.log('📊 Using local narrative data (no Pro API key)');
      return this.getLocalNarrativeData();
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
      throw new Error(`DeFiLlama Pro API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getNarrativePerformance(): Promise<NarrativeMetrics[]> {
    try {
      // Try the Pro API endpoint for narrative data
      const response = await this.makeRequest('/api/narratives/performance');
      return this.formatNarrativeMetrics(response);
    } catch (error) {
      console.error('Error fetching narrative performance:', error);
      return this.getLocalNarrativeData();
    }
  }

  async getNarrativeHistory(days: number = 30): Promise<NarrativeData[]> {
    try {
      const response = await this.makeRequest(`/api/narratives/history?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error fetching narrative history:', error);
      return this.getLocalNarrativeHistory();
    }
  }

  private getLocalNarrativeData(): NarrativeMetrics[] {
    // Extract latest values from CSV data
    const latestData = this.getLatestCSVData();
    
    return [
      {
        name: 'Smart Contract Platform',
        value: latestData['Smart Contract Platform'],
        change1d: 0.7,
        change7d: -1.2,
        change30d: 15.4
      },
      {
        name: 'Decentralized Finance (DeFi)',
        value: latestData['Decentralized Finance (DeFi)'],
        change1d: 0.8,
        change7d: -0.9,
        change30d: 14.8
      },
      {
        name: 'Ethereum',
        value: latestData['Ethereum'],
        change1d: 1.4,
        change7d: 5.8,
        change30d: 47.1
      },
      {
        name: 'Bitcoin',
        value: latestData['Bitcoin'],
        change1d: -0.4,
        change7d: 0.8,
        change30d: 8.7
      },
      {
        name: 'Solana',
        value: latestData['Solana'],
        change1d: 1.5,
        change7d: 3.5,
        change30d: 24.8
      },
      {
        name: 'Meme',
        value: latestData['Meme'],
        change1d: 2.7,
        change7d: -5.5,
        change30d: 48.7
      },
      {
        name: 'Real World Assets (RWA)',
        value: latestData['Real World Assets (RWA)'],
        change1d: 2.0,
        change7d: 1.6,
        change30d: 36.8
      },
      {
        name: 'Artificial Intelligence (AI)',
        value: latestData['Artificial Intelligence (AI)'],
        change1d: 1.3,
        change7d: 2.4,
        change30d: 27.8
      },
      {
        name: 'Gaming (GameFi)',
        value: latestData['Gaming (GameFi)'],
        change1d: 2.3,
        change7d: 2.7,
        change30d: 36.1
      },
      {
        name: 'DePIN',
        value: latestData['DePIN'],
        change1d: -0.1,
        change7d: 2.5,
        change30d: 26.2
      }
    ];
  }

  private getLocalNarrativeHistory(): NarrativeData[] {
    // This would be the parsed CSV data
    return [
      {
        timestamp: 1753488000,
        date: '2025-07-26',
        'Smart Contract Platform': 17.84,
        'Decentralized Finance (DeFi)': 16.91,
        'Bitcoin': 9.27,
        'Ethereum': 48.39,
        'Centralized Exchange (CEX) Token': 21.14,
        'Solana': 27.02,
        'Meme': 51.36,
        'Real World Assets (RWA)': 41.46,
        'Artificial Intelligence (AI)': 29.91,
        'DePIN': 28.29,
        'Oracle': 37.74,
        'Gaming (GameFi)': 38.56,
        'NFT Marketplace': 40.04,
        'Rollup': 36.28,
        'Data Availability': 29.93,
        'Decentralized Identifier (DID)': 39.88,
        'Analytics': 19.78,
        'Liquid Staking Governance Tokens': 33.33,
        'PolitiFi': 18.72,
        'Bridge Governance Tokens': 22.93,
        'SocialFi': 22.43,
        'Prediction Markets': 43.40
      }
    ];
  }

  private getLatestCSVData(): Record<string, number> {
    // Return the latest row from the CSV data (2025-07-26)
    return {
      'Smart Contract Platform': 17.84470395387455,
      'Decentralized Finance (DeFi)': 16.90702914804029,
      'Bitcoin': 9.271995186745036,
      'Ethereum': 48.38638451559993,
      'Centralized Exchange (CEX) Token': 21.14406128396563,
      'Solana': 27.01664532650448,
      'Meme': 51.3581013658022,
      'Real World Assets (RWA)': 41.45736059145642,
      'Artificial Intelligence (AI)': 29.906745034750752,
      'DePIN': 28.29372005364721,
      'Oracle': 37.744885494525995,
      'Gaming (GameFi)': 38.556495475833295,
      'NFT Marketplace': 40.04279154452727,
      'Rollup': 36.28250265199856,
      'Data Availability': 29.93339529212351,
      'Decentralized Identifier (DID)': 39.88008936980241,
      'Analytics': 19.775860977087234,
      'Liquid Staking Governance Tokens': 33.32987628224682,
      'PolitiFi': 18.71711190874277,
      'Bridge Governance Tokens': 22.92544646666119,
      'SocialFi': 22.431659938675423,
      'Prediction Markets': 43.403119876200975
    };
  }

  private formatNarrativeMetrics(response: any): NarrativeMetrics[] {
    // This would format the API response into our expected format
    if (Array.isArray(response)) {
      return response.map(item => ({
        name: item.name || item.narrative,
        value: item.performance || item.value || 0,
        change1d: item.change_1d || 0,
        change7d: item.change_7d || 0,
        change30d: item.change_30d || 0
      }));
    }
    
    return this.getLocalNarrativeData();
  }

  // Parse the CSV data for historical tracking
  parseCSVData(csvContent: string): NarrativeData[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data: NarrativeData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: NarrativeData = {
        timestamp: parseInt(values[0]),
        date: values[1]
      };

      // Parse numeric values for each narrative
      for (let j = 2; j < headers.length; j++) {
        const narrativeName = headers[j];
        const value = parseFloat(values[j]);
        row[narrativeName] = isNaN(value) ? 0 : value;
      }

      data.push(row);
    }

    return data;
  }

  // Get top performing narratives
  getTopPerformers(limit: number = 5): NarrativeMetrics[] {
    const data = this.getLocalNarrativeData();
    return data
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  // Get worst performing narratives
  getWorstPerformers(limit: number = 5): NarrativeMetrics[] {
    const data = this.getLocalNarrativeData();
    return data
      .sort((a, b) => a.value - b.value)
      .slice(0, limit);
  }
}

export const defiLlamaNarrativesService = new DefiLlamaNarrativesService();