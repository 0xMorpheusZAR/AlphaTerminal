import axios, { AxiosInstance } from 'axios';
import { cacheConfig, cacheKeys } from './cache-manager';
import { coinGeckoRateLimiter } from './api-rate-limiter';

export interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  hash: string;
  from: {
    address: string;
    owner?: string;
    owner_type?: string;
  };
  to: {
    address: string;
    owner?: string;
    owner_type?: string;
  };
  timestamp: number;
  amount: number;
  amount_usd: number;
  transaction_count: number;
  transaction_type: string;
}

export class WhaleAlertService {
  private apiKey: string;
  private baseUrl = 'https://api.whale-alert.io/v1';
  private axios: AxiosInstance;

  constructor() {
    this.apiKey = process.env.WHALE_ALERT_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  Whale Alert API key not found. Using mock data.');
    }

    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        api_key: this.apiKey
      }
    });
  }

  async getRecentTransactions(
    minValue: number = 1000000, // $1M USD minimum
    limit: number = 100
  ): Promise<WhaleTransaction[]> {
    if (!this.apiKey) {
      return this.getMockWhaleTransactions();
    }

    const cacheKey = `whale_transactions:${minValue}:${limit}`;
    
    return cacheConfig.marketData.get(
      cacheKey,
      async () => {
        try {
          const response = await this.axios.get('/transactions', {
            params: {
              min_value: minValue,
              limit: limit,
              cursor: undefined
            }
          });

          return response.data.transactions || [];
        } catch (error) {
          console.error('[Whale Alert] Error fetching transactions:', error);
          return this.getMockWhaleTransactions();
        }
      },
      60 // 1 minute cache
    );
  }

  async getTransactionsBySymbol(
    symbol: string,
    minValue: number = 1000000
  ): Promise<WhaleTransaction[]> {
    const allTransactions = await this.getRecentTransactions(minValue);
    return allTransactions.filter(tx => 
      tx.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  async getExchangeFlows(): Promise<{
    exchange: string;
    netFlow: number;
    inflow: number;
    outflow: number;
    symbol: string;
  }[]> {
    const transactions = await this.getRecentTransactions(500000); // $500k minimum
    const flows = new Map<string, { inflow: number; outflow: number; symbol: string }>();

    transactions.forEach(tx => {
      // Track flows to/from known exchanges
      if (tx.to.owner_type === 'exchange') {
        const exchange = tx.to.owner || 'Unknown Exchange';
        const current = flows.get(exchange) || { inflow: 0, outflow: 0, symbol: tx.symbol };
        current.inflow += tx.amount;
        flows.set(exchange, current);
      }
      
      if (tx.from.owner_type === 'exchange') {
        const exchange = tx.from.owner || 'Unknown Exchange';
        const current = flows.get(exchange) || { inflow: 0, outflow: 0, symbol: tx.symbol };
        current.outflow += tx.amount;
        flows.set(exchange, current);
      }
    });

    return Array.from(flows.entries()).map(([exchange, data]) => ({
      exchange,
      netFlow: data.inflow - data.outflow,
      inflow: data.inflow,
      outflow: data.outflow,
      symbol: data.symbol
    })).sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
  }

  formatTransaction(tx: WhaleTransaction): {
    amount: string;
    symbol: string;
    usdValue: string;
    type: 'buy' | 'sell' | 'transfer';
    from: string;
    to: string;
    time: string;
    exchange?: string;
  } {
    const type = tx.to.owner_type === 'exchange' ? 'sell' : 
                 tx.from.owner_type === 'exchange' ? 'buy' : 'transfer';
    
    const exchange = tx.to.owner || tx.from.owner;
    
    return {
      amount: this.formatAmount(tx.amount),
      symbol: tx.symbol.toUpperCase(),
      usdValue: this.formatUSD(tx.amount_usd),
      type,
      from: this.formatAddress(tx.from),
      to: this.formatAddress(tx.to),
      time: this.getRelativeTime(tx.timestamp),
      exchange: exchange
    };
  }

  private formatAmount(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  }

  private formatUSD(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  }

  private formatAddress(addr: { address: string; owner?: string }): string {
    if (addr.owner) return addr.owner;
    return `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`;
  }

  private getRelativeTime(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  private getMockWhaleTransactions(): WhaleTransaction[] {
    const now = Date.now() / 1000;
    
    return [
      {
        id: '1',
        blockchain: 'bitcoin',
        symbol: 'btc',
        hash: 'mock_hash_1',
        from: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          owner: 'Unknown Wallet',
          owner_type: 'unknown'
        },
        to: {
          address: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
          owner: 'Binance',
          owner_type: 'exchange'
        },
        timestamp: now - 120,
        amount: 2500,
        amount_usd: 112500000,
        transaction_count: 1,
        transaction_type: 'transfer'
      },
      {
        id: '2',
        blockchain: 'ethereum',
        symbol: 'eth',
        hash: 'mock_hash_2',
        from: {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E123',
          owner: 'Coinbase',
          owner_type: 'exchange'
        },
        to: {
          address: '0xA910f92ADb5fA8CA78cE9d7C5e7e26A3b844Bc9e',
          owner: 'Unknown Wallet',
          owner_type: 'unknown'
        },
        timestamp: now - 900,
        amount: 50000,
        amount_usd: 125000000,
        transaction_count: 1,
        transaction_type: 'transfer'
      },
      {
        id: '3',
        blockchain: 'tron',
        symbol: 'usdt',
        hash: 'mock_hash_3',
        from: {
          address: 'TN3W4H6NVAUtu8gJz5X9xN7nJBM3Kz5Tz9',
          owner: 'Unknown Wallet',
          owner_type: 'unknown'
        },
        to: {
          address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          owner: 'Unknown Wallet',
          owner_type: 'unknown'
        },
        timestamp: now - 1680,
        amount: 10000000,
        amount_usd: 10000000,
        transaction_count: 1,
        transaction_type: 'transfer'
      }
    ];
  }
}

export const whaleAlertService = new WhaleAlertService();