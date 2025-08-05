# CoinGecko API Reference for AlphaTerminal

## Authentication

```javascript
// Pro API Key
const COINGECKO_API_KEY = 'CG-MVg68aVqeVyu8fzagC9E1hPj';

// Headers for Pro API
headers: {
  'x-cg-pro-api-key': COINGECKO_API_KEY
}
```

## Key Endpoints Used in AlphaTerminal

### 1. Global Market Data
```javascript
GET /api/v3/global
// Returns global cryptocurrency market data
{
  "data": {
    "active_cryptocurrencies": 12000,
    "markets": 700,
    "total_market_cap": { "usd": 2500000000000 },
    "total_volume": { "usd": 150000000000 },
    "market_cap_percentage": { "btc": 48.5, "eth": 18.2 }
  }
}
```

### 2. Market Ticker Data
```javascript
GET /api/v3/coins/markets
// Parameters:
{
  "vs_currency": "usd",
  "ids": "bitcoin,ethereum,binancecoin", // comma-separated
  "order": "market_cap_desc",
  "per_page": 100,
  "page": 1,
  "sparkline": true,
  "price_change_percentage": "1h,24h,7d"
}
```

### 3. Trending Coins
```javascript
GET /api/v3/search/trending
// Returns trending cryptocurrencies
{
  "coins": [
    {
      "item": {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "market_cap_rank": 1,
        "price_btc": 1,
        "score": 0
      }
    }
  ]
}
```

### 4. Coin Historical Data
```javascript
GET /api/v3/coins/{id}/market_chart
// Parameters:
{
  "vs_currency": "usd",
  "days": 7, // 1, 7, 14, 30, 90, 180, 365, max
  "interval": "daily" // daily, hourly
}
// Returns:
{
  "prices": [[timestamp, price]],
  "market_caps": [[timestamp, market_cap]],
  "total_volumes": [[timestamp, volume]]
}
```

### 5. Coin Details
```javascript
GET /api/v3/coins/{id}
// Parameters:
{
  "localization": false,
  "tickers": true,
  "market_data": true,
  "community_data": false,
  "developer_data": false,
  "sparkline": true
}
```

### 6. OHLC Data
```javascript
GET /api/v3/coins/{id}/ohlc
// Parameters:
{
  "vs_currency": "usd",
  "days": 7 // 1, 7, 14, 30, 90, 180, 365
}
// Returns: [[timestamp, open, high, low, close]]
```

### 7. Exchange Data
```javascript
GET /api/v3/exchanges
// Returns exchange list with volumes

GET /api/v3/exchanges/{id}/tickers
// Returns tickers for specific exchange
```

### 8. Derivatives
```javascript
GET /api/v3/derivatives/exchanges
// Returns derivatives exchange data

GET /api/v3/derivatives/exchanges/{id}
// Returns specific derivatives exchange data
```

### 9. DeFi Data
```javascript
GET /api/v3/global/decentralized_finance_defi
// Returns global DeFi statistics
{
  "data": {
    "defi_market_cap": "123456789",
    "eth_market_cap": "234567890",
    "defi_to_eth_ratio": "52.34",
    "trading_volume_24h": "12345678",
    "defi_dominance": "4.56"
  }
}
```

### 10. Categories
```javascript
GET /api/v3/coins/categories
// Returns cryptocurrency categories with market data
[
  {
    "id": "decentralized-finance-defi",
    "name": "Decentralized Finance (DeFi)",
    "market_cap": 123456789,
    "market_cap_change_24h": 2.5,
    "volume_24h": 12345678
  }
]
```

## Rate Limits

### Pro API Limits
- 500 calls/minute
- 50,000 calls/month (with provided key)
- Use caching to minimize API calls

### Best Practices
1. **Cache responses** for at least 60 seconds
2. **Batch requests** when possible
3. **Use specific coin IDs** instead of fetching all
4. **Implement exponential backoff** for rate limit errors

## Error Handling

```javascript
try {
  const response = await coinGeckoAPI.get(endpoint);
  return response.data;
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limited - wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000));
    return getCachedData(key);
  }
  if (error.response?.status === 401) {
    // API key issue
    console.error('Invalid API key');
  }
  // Return cached data as fallback
  return cache.get(key)?.data || null;
}
```

## WebSocket (Pro Feature)

```javascript
// WebSocket connection for real-time data
const ws = new WebSocket('wss://api.coingecko.com/api/v3/coins/markets/ws');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Handle price updates
});
```

## Integration with AlphaTerminal

### Current Implementation
1. **Market Overview Panel**: Uses `/global` endpoint
2. **Price Ticker**: Uses `/coins/markets` with sparklines
3. **Top Movers**: Filters `/coins/markets` by price change
4. **Trending Section**: Uses `/search/trending`
5. **Market Heatmap**: Uses `/coins/markets` with categorization
6. **Chart Data**: Uses `/coins/{id}/market_chart` for historical

### Caching Strategy
```javascript
const CACHE_DURATIONS = {
  'market-overview': 60000,    // 1 minute
  'ticker': 30000,            // 30 seconds
  'trending': 300000,         // 5 minutes
  'historical': 600000,       // 10 minutes
  'coin-details': 120000      // 2 minutes
};
```

### MCP Integration
The CoinGecko MCP server provides:
- Simplified access to common endpoints
- Built-in caching
- Error handling and fallbacks
- Type-safe responses

## Example Usage

```javascript
// Fetch top 10 coins by market cap
const topCoins = await coinGeckoAPI.get('/coins/markets', {
  params: {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 10,
    page: 1,
    sparkline: true,
    price_change_percentage: '24h'
  }
});

// Get Bitcoin price history for 7 days
const btcHistory = await coinGeckoAPI.get('/coins/bitcoin/market_chart', {
  params: {
    vs_currency: 'usd',
    days: 7,
    interval: 'hourly'
  }
});

// Get real-time trending coins
const trending = await coinGeckoAPI.get('/search/trending');
```

## API Response Types

```typescript
interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
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
  roi: null | {
    times: number;
    currency: string;
    percentage: number;
  };
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
}

interface GlobalData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ongoing_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: { [key: string]: number };
  total_volume: { [key: string]: number };
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}
```