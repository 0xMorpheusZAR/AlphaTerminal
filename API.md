# AlphaTerminal API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Primary API Providers](#primary-api-providers)
3. [Additional API Providers](#additional-api-providers)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Authentication](#authentication)
6. [Rate Limiting](#rate-limiting)
7. [Error Handling](#error-handling)
8. [Live Data Indicators](#live-data-indicators)
9. [Integration Examples](#integration-examples)

## Overview

AlphaTerminal integrates with multiple cryptocurrency and financial data providers to deliver comprehensive market analytics. This document provides detailed information about each API provider, their endpoints, authentication methods, and usage guidelines.

### API Status Dashboard
- **CoinGecko Pro**: ✅ Active (500 req/min)
- **Whale Alert**: ✅ Active (60 req/min)
- **Velo**: ✅ Active (100 req/min)
- **DefiLlama**: ✅ Active (300 req/min)
- **OpenAI**: ✅ Active (60 req/min)
- **Magic MCP**: ✅ Active

## Primary API Providers

### 1. CoinGecko Pro API
**Base URL**: `https://pro-api.coingecko.com/api/v3`  
**Authentication**: API Key (Header: `X-Cg-Pro-Api-Key`)  
**Rate Limit**: 500 requests/minute (Pro tier)

#### Key Endpoints:

##### Market Data
```
GET /coins/markets
Parameters:
  - vs_currency: string (usd, eur, btc)
  - ids: string (comma-separated coin ids)
  - order: string (market_cap_desc, volume_desc, etc.)
  - per_page: number (1-250)
  - page: number
  - sparkline: boolean
  - price_change_percentage: string (1h,24h,7d,30d,1y)
  - locale: string
  - precision: string (full or custom)

Response: Array of coin market data including price, volume, market cap, etc.
```

##### Coin Details
```
GET /coins/{id}
Parameters:
  - localization: boolean
  - tickers: boolean
  - market_data: boolean
  - community_data: boolean
  - developer_data: boolean
  - sparkline: boolean

Response: Comprehensive coin information
```

##### Historical Data
```
GET /coins/{id}/market_chart
Parameters:
  - vs_currency: string
  - days: string (1, 7, 14, 30, 90, 180, 365, max)
  - interval: string (daily)
  - precision: string

Response: Price, market cap, and volume history
```

##### OHLC Data
```
GET /coins/{id}/ohlc
Parameters:
  - vs_currency: string
  - days: string (1, 7, 14, 30, 90, 180, 365)

Response: Open, High, Low, Close candlestick data
```

##### Global Market Data
```
GET /global
Response: Total market cap, volume, dominance percentages

GET /global/decentralized_finance_defi
Response: DeFi market cap, dominance, volume
```

##### Trending Coins
```
GET /search/trending
Response: Top 7 trending coins, NFTs, and categories
```

##### Categories
```
GET /coins/categories
Parameters:
  - order: string (market_cap_desc, market_cap_asc, name_desc, name_asc)

Response: All coin categories with market data
```

### 2. Whale Alert API
**Base URL**: `https://api.whale-alert.io/v1`  
**Authentication**: API Key (Query parameter: `api_key`)  
**Rate Limit**: 60 requests/minute

#### Key Endpoints:

##### Recent Transactions
```
GET /transactions
Parameters:
  - start: number (timestamp)
  - end: number (timestamp)
  - min_value: number (USD)
  - limit: number (max 100)
  - cursor: string (pagination)

Response: Large crypto transactions across all blockchains
```

##### Transaction Status
```
GET /transaction/{blockchain}/{hash}
Response: Detailed transaction information
```

##### Blockchain Status
```
GET /status
Parameters:
  - blockchain: string

Response: Blockchain synchronization status
```

### 3. Velo API
**Base URL**: `https://api.velo.com/v1`  
**Authentication**: Bearer Token (Header: `Authorization: Bearer {token}`)  
**Rate Limit**: 100 requests/minute

#### Key Endpoints:

##### News Feed
```
GET /news
Parameters:
  - limit: number (1-100)
  - offset: number
  - tags: string (comma-separated)
  - sources: string (comma-separated)
  - sentiment: string (positive, negative, neutral)
  - start_date: string (ISO 8601)
  - end_date: string (ISO 8601)

Response: Cryptocurrency news articles with sentiment
```

##### News Article Details
```
GET /news/{id}
Response: Full article content and metadata
```

##### News Sources
```
GET /sources
Response: List of available news sources
```

##### Trending Topics
```
GET /trending
Parameters:
  - timeframe: string (1h, 24h, 7d)
  - limit: number

Response: Trending topics and keywords
```

### 4. DefiLlama API
**Base URL**: `https://api.llama.fi`  
**Authentication**: API Key (Header: `Authorization`)  
**Rate Limit**: 300 requests/minute

#### Key Endpoints:

##### TVL Overview
```
GET /protocols
Response: All DeFi protocols with TVL data
```

##### Protocol Details
```
GET /protocol/{name}
Response: Historical TVL, chains, token data
```

##### Chain TVL
```
GET /chains
Response: TVL breakdown by blockchain
```

##### Stablecoin Data
```
GET /stablecoins
Parameters:
  - includePrices: boolean

Response: All stablecoins with market cap and prices
```

##### Yields/APY
```
GET /pools
Response: Yield farming opportunities across protocols
```

##### Protocol Revenue
```
GET /revenue/protocols
Response: Protocol fees and revenue data
```

##### DEX Volumes
```
GET /dexs/{protocol}
Response: DEX trading volumes and statistics
```

### 5. OpenAI API
**Base URL**: `https://api.openai.com/v1`  
**Authentication**: API Key (Header: `Authorization: Bearer {key}`)  
**Rate Limit**: 60 requests/minute

#### Key Endpoints:

##### Chat Completions (GPT-4)
```
POST /chat/completions
Body:
{
  "model": "gpt-4" | "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "response_format": { "type": "json_object" }
}

Response: AI-generated analysis and insights
```

##### Text Embeddings
```
POST /embeddings
Body:
{
  "model": "text-embedding-ada-002",
  "input": "text to embed"
}

Response: Vector embeddings for similarity analysis
```

### 6. Magic MCP API
**Base URL**: `https://api.21st.dev/magic/v1`  
**Authentication**: API Key (Header: `X-API-Key`)  
**Rate Limit**: Varies by plan

#### Key Endpoints:

##### Generate UI Component
```
POST /generate
Body:
{
  "prompt": "Create a price alert widget",
  "framework": "react",
  "styling": "tailwind",
  "typescript": true
}

Response: Generated component code
```

##### Refine Component
```
POST /refine
Body:
{
  "code": "existing component code",
  "refinements": "add animation and dark mode"
}

Response: Updated component code
```

## Additional API Providers

### 7. Dune Analytics API
**Base URL**: `https://api.dune.com/api/v1`  
**Authentication**: API Key (Header: `X-Dune-API-Key`)

#### Key Endpoints:
- `GET /query/{query_id}/results` - Execute saved queries
- `POST /query/{query_id}/execute` - Trigger query execution
- `GET /execution/{execution_id}/status` - Check execution status
- `GET /execution/{execution_id}/results` - Get execution results

### 8. Etherscan Family APIs
**Base URLs**:
- Ethereum: `https://api.etherscan.io/api`
- BSC: `https://api.bscscan.com/api`
- Polygon: `https://api.polygonscan.com/api`
- Arbitrum: `https://api.arbiscan.io/api`

**Authentication**: API Key (Query parameter: `apikey`)

#### Common Endpoints:
- Account balance and transactions
- Token transfers and balances
- Contract verification and source code
- Gas prices and estimates
- Block and uncle information

### 9. The Graph Protocol
**Base URL**: `https://api.thegraph.com/subgraphs/name/{subgraph}`  
**Authentication**: API Key (Header: `Authorization`)

#### Query Structure:
```graphql
query {
  pairs(first: 10, orderBy: volumeUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    volumeUSD
    reserveUSD
  }
}
```

### 10. Blockchain RPC Endpoints

#### Ethereum
- **Alchemy**: `https://eth-mainnet.g.alchemy.com/v2/{api-key}`
- **Infura**: `https://mainnet.infura.io/v3/{api-key}`
- **Public**: `https://eth.llamarpc.com`

#### Other Chains
- **BSC**: `https://bsc-dataseed.binance.org/`
- **Polygon**: `https://polygon-rpc.com/`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`
- **Optimism**: `https://mainnet.optimism.io`
- **Avalanche**: `https://api.avax.network/ext/bc/C/rpc`

## Authentication

### API Key Management
```typescript
// Best practice: Use environment variables
const apiKeys = {
  coinGecko: process.env.COINGECKO_PRO_API_KEY,
  whaleAlert: process.env.WHALE_ALERT_API_KEY,
  openAI: process.env.OPENAI_API_KEY,
  // ... other keys
};

// Header-based authentication
const headers = {
  'X-Cg-Pro-Api-Key': apiKeys.coinGecko,
  'Authorization': `Bearer ${apiKeys.openAI}`
};

// Query parameter authentication
const params = {
  api_key: apiKeys.whaleAlert
};
```

## Rate Limiting

### Implementation Strategy
```typescript
import { RateLimiter } from 'limiter';

const rateLimiters = {
  coinGecko: new RateLimiter({ tokensPerInterval: 500, interval: 'minute' }),
  whaleAlert: new RateLimiter({ tokensPerInterval: 60, interval: 'minute' }),
  openAI: new RateLimiter({ tokensPerInterval: 60, interval: 'minute' }),
  velo: new RateLimiter({ tokensPerInterval: 100, interval: 'minute' }),
  defiLlama: new RateLimiter({ tokensPerInterval: 300, interval: 'minute' })
};

// Usage
async function makeApiRequest(service: string, requestFn: () => Promise<any>) {
  const limiter = rateLimiters[service];
  const remainingRequests = await limiter.removeTokens(1);
  
  if (remainingRequests < 0) {
    throw new Error(`Rate limit exceeded for ${service}`);
  }
  
  return await requestFn();
}
```

### Rate Limit Headers
Monitor these response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (429 responses)

## Error Handling

### Common Error Codes
```typescript
enum ApiErrorCode {
  RATE_LIMIT_EXCEEDED = 429,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

// Error handling middleware
async function handleApiError(error: any, service: string) {
  const status = error.response?.status;
  
  switch (status) {
    case ApiErrorCode.RATE_LIMIT_EXCEEDED:
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.log(`Rate limit hit for ${service}, retrying after ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      break;
      
    case ApiErrorCode.UNAUTHORIZED:
      console.error(`Invalid API key for ${service}`);
      // Fall back to mock data
      break;
      
    case ApiErrorCode.SERVER_ERROR:
    case ApiErrorCode.BAD_GATEWAY:
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      console.error(`${service} is temporarily unavailable`);
      // Use cached data if available
      break;
      
    default:
      console.error(`Unknown error from ${service}:`, error.message);
  }
}
```

## Live Data Indicators

### Dashboard Integration
Each dashboard should display live data status:

```typescript
interface LiveDataStatus {
  service: string;
  status: 'live' | 'cached' | 'mock' | 'error';
  lastUpdate: Date;
  latency: number;
  apiKeyValid: boolean;
}

// Component example
function LiveDataIndicator({ status }: { status: LiveDataStatus }) {
  const statusColors = {
    live: 'bg-green-500',
    cached: 'bg-yellow-500',
    mock: 'bg-gray-500',
    error: 'bg-red-500'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${statusColors[status.status]} animate-pulse`} />
      <span className="text-xs text-gray-500">
        {status.status === 'live' ? 'Live' : status.status === 'cached' ? 'Cached' : 'Mock'} Data
      </span>
      <span className="text-xs text-gray-400">
        {formatDistanceToNow(status.lastUpdate)} ago
      </span>
    </div>
  );
}
```

### Service Health Monitoring
```typescript
class ApiHealthMonitor {
  private healthStatus: Map<string, LiveDataStatus> = new Map();
  
  async checkHealth(service: string, testEndpoint: string): Promise<LiveDataStatus> {
    const start = Date.now();
    
    try {
      await axios.get(testEndpoint, { timeout: 5000 });
      
      const status: LiveDataStatus = {
        service,
        status: 'live',
        lastUpdate: new Date(),
        latency: Date.now() - start,
        apiKeyValid: true
      };
      
      this.healthStatus.set(service, status);
      return status;
      
    } catch (error) {
      const status: LiveDataStatus = {
        service,
        status: error.response?.status === 401 ? 'error' : 'mock',
        lastUpdate: new Date(),
        latency: Date.now() - start,
        apiKeyValid: error.response?.status !== 401
      };
      
      this.healthStatus.set(service, status);
      return status;
    }
  }
  
  async checkAllServices() {
    const services = [
      { name: 'coinGecko', endpoint: 'https://pro-api.coingecko.com/api/v3/ping' },
      { name: 'whaleAlert', endpoint: 'https://api.whale-alert.io/v1/status' },
      { name: 'velo', endpoint: 'https://api.velo.com/v1/health' },
      { name: 'defiLlama', endpoint: 'https://api.llama.fi/protocols' },
    ];
    
    return Promise.all(
      services.map(s => this.checkHealth(s.name, s.endpoint))
    );
  }
}
```

## Integration Examples

### 1. Fetching Live Market Data
```typescript
async function getLiveMarketData() {
  const cacheKey = 'market_data_overview';
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return { data: cached.data, source: 'cached' };
  }
  
  try {
    // Fetch from CoinGecko
    const response = await coinGeckoClient.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        sparkline: true,
        price_change_percentage: '1h,24h,7d,30d'
      }
    });
    
    // Cache the data
    await cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return { data: response.data, source: 'live' };
    
  } catch (error) {
    console.error('Failed to fetch live data:', error);
    
    // Fall back to mock data
    return { data: getMockMarketData(), source: 'mock' };
  }
}
```

### 2. Real-time Whale Tracking
```typescript
async function trackWhaleTransactions() {
  const minValue = 1000000; // $1M USD
  
  try {
    const response = await whaleAlertClient.get('/transactions', {
      params: {
        min_value: minValue,
        limit: 100,
        start: Math.floor(Date.now() / 1000) - 3600 // Last hour
      }
    });
    
    // Process and emit via WebSocket
    const transactions = response.data.transactions;
    transactions.forEach(tx => {
      wsServer.emit('whale_transaction', {
        ...tx,
        timestamp: new Date(tx.timestamp * 1000),
        formattedAmount: formatCurrency(tx.amount_usd)
      });
    });
    
    return transactions;
    
  } catch (error) {
    handleApiError(error, 'whaleAlert');
    return [];
  }
}
```

### 3. AI-Powered Sentiment Analysis
```typescript
async function analyzeSentiment(texts: string[]) {
  try {
    const response = await openAIClient.post('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze crypto market sentiment. Return JSON with score (0-100), sentiment (bullish/bearish/neutral), and key topics.'
        },
        {
          role: 'user',
          content: texts.join('\n\n')
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    return JSON.parse(response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return {
      score: 50,
      sentiment: 'neutral',
      topics: [],
      source: 'fallback'
    };
  }
}
```

### 4. DeFi Protocol Monitoring
```typescript
async function getDefiMetrics() {
  try {
    const [protocols, chains, yields] = await Promise.all([
      defiLlamaClient.get('/protocols'),
      defiLlamaClient.get('/chains'),
      defiLlamaClient.get('/pools')
    ]);
    
    // Process and combine data
    const metrics = {
      totalTvl: chains.data.reduce((sum, chain) => sum + chain.tvl, 0),
      topProtocols: protocols.data
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 10),
      topYields: yields.data
        .filter(pool => pool.apy > 0 && pool.tvlUsd > 1000000)
        .sort((a, b) => b.apy - a.apy)
        .slice(0, 20),
      timestamp: Date.now()
    };
    
    return metrics;
    
  } catch (error) {
    handleApiError(error, 'defiLlama');
    return getMockDefiMetrics();
  }
}
```

## Best Practices

### 1. Caching Strategy
- Cache market data for 30 seconds
- Cache coin details for 5 minutes
- Cache historical data for 1 hour
- Cache static data (categories, etc.) for 24 hours

### 2. Error Recovery
- Implement exponential backoff for retries
- Fall back to cached data when possible
- Use mock data as last resort
- Log all API errors for monitoring

### 3. Performance Optimization
- Batch similar requests when possible
- Use WebSocket connections for real-time data
- Implement request deduplication
- Compress large responses

### 4. Security
- Never expose API keys in client-side code
- Use environment variables for all secrets
- Implement request signing where supported
- Monitor for unusual API usage patterns

## API Response Caching

```typescript
class ApiCache {
  private cache = new Map<string, CachedResponse>();
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<{ data: T; cached: boolean }> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
      return { data: cached.data as T, cached: true };
    }
    
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return { data, cached: false };
    } catch (error) {
      if (cached) {
        // Return stale data if available
        return { data: cached.data as T, cached: true };
      }
      throw error;
    }
  }
}
```

## Monitoring and Alerts

### Setup monitoring for:
1. API response times
2. Error rates by service
3. Rate limit usage
4. Cache hit rates
5. Data freshness

### Alert thresholds:
- Response time > 5 seconds
- Error rate > 5%
- Rate limit usage > 80%
- Cache hit rate < 50%
- Data staleness > 5 minutes

## Support and Resources

### API Documentation Links
- [CoinGecko Pro API Docs](https://www.coingecko.com/en/api/documentation)
- [Whale Alert API Docs](https://docs.whale-alert.io/)
- [Velo API Docs](https://docs.velo.org/developers)
- [DefiLlama API Docs](https://defillama.com/docs/api)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Magic MCP Docs](https://docs.21st.dev/magic)

### Community Support
- Discord: [AlphaTerminal Discord](https://discord.gg/alphaterminal)
- GitHub Issues: [Report Issues](https://github.com/0xMorpheusZAR/AlphaTerminal/issues)
- Email: support@alphaterminal.io

---

*Last Updated: January 2025*  
*Version: 2.0.0*