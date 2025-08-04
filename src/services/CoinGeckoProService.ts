import axios, { AxiosInstance } from 'axios';
import winston from 'winston';

// Comprehensive CoinGecko Pro API Types
export interface CoinGeckoProConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  logger?: winston.Logger;
}

export interface ProPriceData {
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
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_200d: number;
  price_change_percentage_1y: number;
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
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface ExchangeData {
  id: string;
  name: string;
  year_established: number;
  country: string;
  description: string;
  url: string;
  image: string;
  has_trading_incentive: boolean;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

export interface DerivativeData {
  market: string;
  symbol: string;
  index_id: string;
  price: string;
  price_percentage_change_24h: number;
  contract_type: string;
  index: number;
  basis: number;
  spread: number;
  funding_rate: number;
  open_interest_usd: number;
  volume_24h: number;
  last_traded_at: number;
  expired_at: number;
}

export interface NFTCollectionData {
  id: string;
  contract_address: string;
  name: string;
  description: string;
  image: {
    small: string;
    large: string;
  };
  banner_image: string;
  floor_price: {
    native_currency: number;
    usd: number;
  };
  market_cap: {
    native_currency: number;
    usd: number;
  };
  volume_24h: {
    native_currency: number;
    usd: number;
  };
  floor_price_in_usd_24h_percentage_change: number;
  number_of_unique_addresses: number;
  number_of_unique_addresses_24h_percentage_change: number;
  volume_in_usd_24h_percentage_change: number;
  total_supply: number;
}

export interface OnChainDEXData {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    network_id: number;
    exchange_id: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_native_currency: string;
    price_change_percentage_24h: number;
    transactions_24h: {
      buys: number;
      sells: number;
    };
    volume_usd_24h: string;
    reserve_in_usd: string;
  };
}

export interface GlobalMarketData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ongoing_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface TrendingData {
  coins: Array<{
    item: {
      id: string;
      coin_id: number;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      small: string;
      large: string;
      slug: string;
      price_btc: number;
      score: number;
      data: {
        price: number;
        price_btc: string;
        price_change_percentage_24h: Record<string, number>;
        market_cap: string;
        market_cap_btc: string;
        total_volume: string;
        total_volume_btc: string;
        sparkline: string;
        content: any;
      };
    };
  }>;
  nfts: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    nft_contract_id: number;
    native_currency_symbol: string;
    floor_price_in_native_currency: number;
    floor_price_24h_percentage_change: number;
    data: {
      floor_price: string;
      floor_price_in_usd_24h_percentage_change: string;
      h24_volume: string;
      h24_average_sale_price: string;
      sparkline: string;
      content: any;
    };
  }>;
  categories: Array<{
    id: number;
    name: string;
    market_cap_1h_change: number;
    slug: string;
    coins_count: number;
    data: {
      market_cap: number;
      market_cap_btc: number;
      total_volume: number;
      total_volume_btc: number;
      market_cap_change_percentage_24h: Record<string, number>;
      sparkline: string;
    };
  }>;
}

export class CoinGeckoProService {
  private client: AxiosInstance;
  private logger: winston.Logger;
  private baseUrl: string;
  private rateLimiter: {
    requests: number;
    window: number;
    current: number;
    resetTime: number;
  };

  constructor(config: CoinGeckoProConfig) {
    this.baseUrl = config.baseUrl || 'https://pro-api.coingecko.com/api/v3';
    this.logger = config.logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-cg-pro-api-key': config.apiKey
      }
    });

    // Pro API rate limits - adjust based on your plan
    this.rateLimiter = {
      requests: 500, // Pro plan limit
      window: 60000, // 1 minute
      current: 0,
      resetTime: Date.now() + 60000
    };

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      // Rate limiting check
      const now = Date.now();
      if (now > this.rateLimiter.resetTime) {
        this.rateLimiter.current = 0;
        this.rateLimiter.resetTime = now + this.rateLimiter.window;
      }

      if (this.rateLimiter.current >= this.rateLimiter.requests) {
        throw new Error('Rate limit exceeded');
      }

      this.rateLimiter.current++;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('CoinGecko Pro API error:', error.message);
        throw error;
      }
    );
  }

  // ==================== CORE PRICE & MARKET DATA ====================

  async getSimplePrices(
    ids: string[],
    vsCurrencies: string[] = ['usd'],
    includeMarketCap = true,
    include24hrVol = true,
    include24hrChange = true,
    includeLastUpdatedAt = true
  ): Promise<Record<string, any>> {
    const params = {
      ids: ids.join(','),
      vs_currencies: vsCurrencies.join(','),
      include_market_cap: includeMarketCap,
      include_24hr_vol: include24hrVol,
      include_24hr_change: include24hrChange,
      include_last_updated_at: includeLastUpdatedAt
    };

    const response = await this.client.get('/simple/price', { params });
    return response.data;
  }

  async getCoinsMarkets(
    vsCurrency = 'usd',
    options: {
      ids?: string[];
      category?: string;
      order?: string;
      perPage?: number;
      page?: number;
      sparkline?: boolean;
      priceChangePercentage?: string;
      locale?: string;
      precision?: string;
    } = {}
  ): Promise<ProPriceData[]> {
    const params = {
      vs_currency: vsCurrency,
      ...options,
      ids: options.ids?.join(','),
      price_change_percentage: options.priceChangePercentage
    };

    const response = await this.client.get('/coins/markets', { params });
    return response.data;
  }

  async getCoinById(
    id: string,
    options: {
      localization?: boolean;
      tickers?: boolean;
      marketData?: boolean;
      communityData?: boolean;
      developerData?: boolean;
      sparkline?: boolean;
    } = {}
  ): Promise<any> {
    const params = {
      localization: options.localization || false,
      tickers: options.tickers || false,
      market_data: options.marketData || true,
      community_data: options.communityData || false,
      developer_data: options.developerData || false,
      sparkline: options.sparkline || false
    };

    const response = await this.client.get(`/coins/${id}`, { params });
    return response.data;
  }

  async getCoinHistory(id: string, date: string, localization = false): Promise<any> {
    const params = { date, localization };
    const response = await this.client.get(`/coins/${id}/history`, { params });
    return response.data;
  }

  async getCoinMarketChart(
    id: string,
    vsCurrency = 'usd',
    days: string | number,
    interval?: string
  ): Promise<{
    prices: [number, number][];
    market_caps: [number, number][];
    total_volumes: [number, number][];
  }> {
    const params = { vs_currency: vsCurrency, days, interval };
    const response = await this.client.get(`/coins/${id}/market_chart`, { params });
    return response.data;
  }

  async getCoinMarketChartRange(
    id: string,
    vsCurrency = 'usd',
    from: number,
    to: number
  ): Promise<{
    prices: [number, number][];
    market_caps: [number, number][];
    total_volumes: [number, number][];
  }> {
    const params = { vs_currency: vsCurrency, from, to };
    const response = await this.client.get(`/coins/${id}/market_chart/range`, { params });
    return response.data;
  }

  // ==================== EXCHANGE DATA ====================

  async getExchanges(perPage = 100, page = 1): Promise<ExchangeData[]> {
    const params = { per_page: perPage, page };
    const response = await this.client.get('/exchanges', { params });
    return response.data;
  }

  async getExchangeById(id: string): Promise<any> {
    const response = await this.client.get(`/exchanges/${id}`);
    return response.data;
  }

  async getExchangeTickers(
    id: string,
    options: {
      coinIds?: string[];
      includeExchangeLogo?: boolean;
      page?: number;
      depth?: boolean;
      order?: string;
    } = {}
  ): Promise<any> {
    const params = {
      coin_ids: options.coinIds?.join(','),
      include_exchange_logo: options.includeExchangeLogo,
      page: options.page || 1,
      depth: options.depth,
      order: options.order
    };

    const response = await this.client.get(`/exchanges/${id}/tickers`, { params });
    return response.data;
  }

  async getExchangeVolumeChart(id: string, days: number): Promise<number[][]> {
    const params = { days };
    const response = await this.client.get(`/exchanges/${id}/volume_chart`, { params });
    return response.data;
  }

  // ==================== DERIVATIVES ====================

  async getDerivatives(includeTickers?: string): Promise<DerivativeData[]> {
    const params = includeTickers ? { include_tickers: includeTickers } : {};
    const response = await this.client.get('/derivatives', { params });
    return response.data;
  }

  async getDerivativesExchanges(
    order?: string,
    perPage = 100,
    page = 1
  ): Promise<any[]> {
    const params = { order, per_page: perPage, page };
    const response = await this.client.get('/derivatives/exchanges', { params });
    return response.data;
  }

  async getDerivativesExchangeById(id: string, includeTickers?: string): Promise<any> {
    const params = includeTickers ? { include_tickers: includeTickers } : {};
    const response = await this.client.get(`/derivatives/exchanges/${id}`, { params });
    return response.data;
  }

  // ==================== NFT DATA ====================

  async getNFTsList(
    order?: string,
    assetPlatformId?: string,
    perPage = 100,
    page = 1
  ): Promise<any[]> {
    const params = {
      order,
      asset_platform_id: assetPlatformId,
      per_page: perPage,
      page
    };

    const response = await this.client.get('/nfts/list', { params });
    return response.data;
  }

  async getNFTById(id: string): Promise<NFTCollectionData> {
    const response = await this.client.get(`/nfts/${id}`);
    return response.data;
  }

  async getNFTByContract(assetPlatformId: string, contractAddress: string): Promise<any> {
    const response = await this.client.get(`/nfts/${assetPlatformId}/contract/${contractAddress}`);
    return response.data;
  }

  // ==================== ON-CHAIN DEX DATA ====================

  async getOnChainNetworks(): Promise<any[]> {
    const response = await this.client.get('/onchain/networks');
    return response.data;
  }

  async getOnChainDEXes(networkId?: string, page = 1): Promise<any> {
    const params = { network_id: networkId, page };
    const response = await this.client.get('/onchain/dexes', { params });
    return response.data;
  }

  async getOnChainPools(
    networkId?: string,
    dexId?: string,
    page = 1
  ): Promise<any> {
    const params = { network_id: networkId, dex_id: dexId, page };
    const response = await this.client.get('/onchain/pools', { params });
    return response.data;
  }

  async getOnChainTokens(
    networkId?: string,
    address?: string,
    page = 1
  ): Promise<any> {
    const params = { network_id: networkId, address, page };
    const response = await this.client.get('/onchain/tokens', { params });
    return response.data;
  }

  async getOnChainOHLCV(
    networkId: string,
    poolAddress: string,
    timeframe = '1h',
    aggregate = '1',
    beforeTimestamp?: number,
    currency = 'usd',
    token = 'base',
    limit = 100
  ): Promise<any> {
    const params = {
      network_id: networkId,
      pool_address: poolAddress,
      timeframe,
      aggregate,
      before_timestamp: beforeTimestamp,
      currency,
      token,
      limit
    };

    const response = await this.client.get('/onchain/ohlcv', { params });
    return response.data;
  }

  // ==================== GLOBAL & TRENDING ====================

  async getGlobalData(): Promise<{ data: GlobalMarketData }> {
    const response = await this.client.get('/global');
    return response.data;
  }

  async getTrending(): Promise<TrendingData> {
    const response = await this.client.get('/search/trending');
    return response.data;
  }

  async searchCoins(query: string): Promise<any> {
    const params = { query };
    const response = await this.client.get('/search', { params });
    return response.data;
  }

  // ==================== CATEGORIES & ASSET PLATFORMS ====================

  async getCoinsCategories(order?: string): Promise<any[]> {
    const params = order ? { order } : {};
    const response = await this.client.get('/coins/categories', { params });
    return response.data;
  }

  async getCategoriesList(): Promise<any[]> {
    const response = await this.client.get('/coins/categories/list');
    return response.data;
  }

  async getAssetPlatforms(filter?: string): Promise<any[]> {
    const params = filter ? { filter } : {};
    const response = await this.client.get('/asset_platforms', { params });
    return response.data;
  }

  // ==================== COMPANIES & EXCHANGE RATES ====================

  async getCompaniesTreasury(coinId: string): Promise<any> {
    const response = await this.client.get(`/companies/${coinId}`);
    return response.data;
  }

  async getExchangeRates(): Promise<any> {
    const response = await this.client.get('/exchange_rates');
    return response.data;
  }

  // ==================== API KEY MONITORING ====================

  async getAPIKeyStatus(): Promise<{
    credits_left: number;
    credits_total: number;
    current_usage: {
      monthly: number;
      daily: number;
    };
    rate_limit_request_per_minute: number;
  }> {
    const response = await this.client.get('/key');
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  async healthCheck(): Promise<boolean> {
    try {
      await this.getAPIKeyStatus();
      return true;
    } catch (error) {
      this.logger.error('CoinGecko Pro health check failed:', error);
      return false;
    }
  }

  getRemainingCredits(): Promise<number> {
    return this.getAPIKeyStatus().then(status => status.credits_left);
  }

  getCurrentUsage(): Promise<{ monthly: number; daily: number }> {
    return this.getAPIKeyStatus().then(status => status.current_usage);
  }
}