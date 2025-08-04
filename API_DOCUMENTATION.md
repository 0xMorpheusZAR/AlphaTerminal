# Token Tracker API Documentation

## Overview

Token Tracker is a comprehensive cryptocurrency analytics platform that provides real-time market data, token failure analysis, unlock schedules, DeFi protocol revenue tracking, and news aggregation. This document details all available API endpoints.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API does not require authentication for public endpoints. The application integrates with external services using API keys configured in the environment:

- `COINGECKO_API_KEY` - For cryptocurrency market data (optional, uses mock data if not provided)
- `VELO_API_KEY` - For real-time crypto news (optional, uses mock data if not provided)
- `DEFILLAMA_API_KEY` - For DeFi protocol data (optional, public endpoints available)
- `DUNE_API_KEY` - For on-chain analytics (optional, uses mock data if not provided)

**Note**: When API keys are not configured, the application automatically falls back to realistic mock data, allowing full functionality in development mode.

## API Endpoints

### Advanced Analytics

These endpoints provide sophisticated market analysis using CoinGecko Pro data.

#### 1. Multi-Asset Market Cap Heat Map
```http
GET /api/analytics/heatmap
```

Returns top 50 cryptocurrencies with market cap and 24h price change data for heat map visualization.

**Response:**
```json
{
  "data": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "market_cap": 880000000000,
      "price_change_percentage_24h": 2.5,
      "total_volume": 25000000000
    }
  ]
}
```

#### 2. BTC vs ETH Performance Overlay
```http
GET /api/analytics/btc-eth-performance
```

Returns historical performance data for Bitcoin and Ethereum since 2015, normalized for comparison.

**Response:**
```json
{
  "btc": [
    {
      "ts": 1420070400000,
      "price": 45000,
      "normalized": 1.5
    }
  ],
  "eth": [
    {
      "ts": 1438905600000,
      "price": 2500,
      "normalized": 1.8
    }
  ],
  "btc_dominance": [
    {
      "ts": 1420070400000,
      "dominance": 45.5
    }
  ]
}
```

#### 3. Candlestick Chart Data
```http
GET /api/analytics/candlestick/:coinId
```

Returns 30-day OHLC and volume data for any cryptocurrency.

**Parameters:**
- `coinId` - CoinGecko coin ID (e.g., "bitcoin", "ethereum")

**Response:**
```json
{
  "ohlc": [
    [1704067200000, 45000, 46000, 44500, 45500]
  ],
  "volumes": [
    [1704067200000, 25000000000]
  ]
}
```

#### 4. Sector Rotation Dashboard
```http
GET /api/analytics/sector-rotation
```

Returns top performing cryptocurrency sectors with their leading coins.

**Response:**
```json
[
  {
    "category_id": "defi",
    "category_name": "DeFi",
    "market_cap_change_24h": 5.2,
    "coins": [
      {
        "id": "uniswap",
        "symbol": "UNI",
        "market_cap": 5000000000,
        "price_change_percentage_24h": 4.5
      }
    ]
  }
]
```

#### 5. On-Chain Liquidity Spikes
```http
GET /api/analytics/liquidity-spikes
```

Returns trending liquidity pools with significant volume increases.

**Response:**
```json
[
  {
    "pool_address": "0x1234...5678",
    "network": "ethereum",
    "dex_name": "Uniswap V3",
    "liquidity_usd": 2500000,
    "volume_24h_usd": 1800000,
    "volume_delta_pct": 350,
    "token0_symbol": "USDC",
    "token1_symbol": "PEPE"
  }
]
```

### Dashboard

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

Returns aggregated statistics for the dashboard overview.

**Response:**
```json
{
  "failedTokens": 156,
  "pendingUnlocks": 23,
  "totalMarketCap": 1234567890000,
  "avgDeclineFromATH": -85.5,
  "totalUnlockValue": 450000000,
  "upcomingUnlocksCount": 12
}
```

### Token Management

#### Get All Tokens
```http
GET /api/tokens
```

Returns all tracked tokens with their current market data.

**Response:**
```json
[
  {
    "id": "1",
    "symbol": "BTC",
    "name": "Bitcoin",
    "coingeckoId": "bitcoin",
    "currentPrice": "45000",
    "allTimeHigh": "69000",
    "allTimeHighDate": "2021-11-10T00:00:00Z",
    "marketCap": "880000000000",
    "volume24h": "30000000000",
    "priceChange24h": "2.5",
    "declineFromAth": "-34.78",
    "riskLevel": "MEDIUM",
    "isActive": true
  }
]
```

#### Get Failed Tokens
```http
GET /api/tokens/failed
```

Returns tokens that have declined 90% or more from their all-time high.

**Response:**
```json
[
  {
    "id": "6",
    "symbol": "LUNA",
    "name": "Terra Luna Classic",
    "declineFromAth": "-99.99",
    "riskLevel": "EXTREME",
    "currentPrice": "0.0001",
    "allTimeHigh": "119.18"
  }
]
```

#### Get Token by ID
```http
GET /api/tokens/:id
```

Returns detailed information for a specific token.

**Parameters:**
- `id` (path) - Token ID

#### Sync Tokens from CoinGecko
```http
POST /api/tokens/sync
```

Synchronizes token data with CoinGecko API. Returns the count of synced tokens.

**Response:**
```json
{
  "message": "Synced 250 tokens",
  "tokens": [...]
}
```

### Token Unlocks

#### Get Token Unlocks
```http
GET /api/unlocks?tokenId={tokenId}
```

Returns token unlock events, optionally filtered by token.

**Query Parameters:**
- `tokenId` (optional) - Filter by specific token ID

**Response:**
```json
[
  {
    "id": "1",
    "tokenId": "2",
    "unlockDate": "2024-03-15T00:00:00Z",
    "amount": "1000000",
    "percentOfSupply": "5.5",
    "description": "Team tokens unlock",
    "priceImpact": "MEDIUM",
    "notificationSent": false
  }
]
```

#### Get Upcoming Unlocks
```http
GET /api/unlocks/upcoming
```

Returns unlock events scheduled for the next 30 days.

#### Create Token Unlock
```http
POST /api/unlocks
```

Creates a new token unlock event.

**Request Body:**
```json
{
  "tokenId": "2",
  "unlockDate": "2024-03-15T00:00:00Z",
  "amount": "1000000",
  "percentOfSupply": "5.5",
  "description": "Team tokens unlock",
  "priceImpact": "MEDIUM"
}
```

### News

#### Get News Items
```http
GET /api/news?limit={limit}&priority={priority}
```

Returns cryptocurrency news items from Velo API.

**Query Parameters:**
- `limit` (optional, default: 50) - Number of news items to return
- `priority` (optional) - Filter by priority (1=High, 2=Normal, 3=Low)

**Response:**
```json
[
  {
    "id": "1",
    "title": "Bitcoin Surges Past $45,000",
    "content": "Bitcoin price has broken through...",
    "source": "CryptoNews",
    "sourceUrl": "https://example.com/news/1",
    "priority": 1,
    "coins": ["BTC"],
    "effectivePrice": "45000",
    "publishedAt": "2024-01-25T10:30:00Z"
  }
]
```

#### Sync News
```http
POST /api/news/sync
```

Fetches and stores the latest news from Velo API.

### DeFi Protocols

#### Get DeFi Protocols
```http
GET /api/defi/protocols
```

Returns DeFi protocol data including TVL and revenue metrics.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Uniswap",
    "slug": "uniswap",
    "tvl": "5000000000",
    "revenue24h": "3000000",
    "revenue7d": "21000000",
    "revenue30d": "90000000",
    "peRatio": "45.5",
    "category": "DEX",
    "chain": "ethereum"
  }
]
```

#### Sync DeFi Data
```http
POST /api/defi/sync
```

Synchronizes DeFi protocol data from DefiLlama.

### Monte Carlo Simulations

#### Run Monte Carlo Simulation
```http
POST /api/monte-carlo/simulate
```

Runs a Monte Carlo simulation for price prediction.

**Request Body:**
```json
{
  "tokenId": "1",
  "days": 30,
  "simulations": 1000,
  "volatility": 0.3
}
```

**Response:**
```json
{
  "id": "1",
  "tokenId": "1",
  "currentPrice": 45000,
  "meanPrice": 48000,
  "medianPrice": 47500,
  "percentile5": 38000,
  "percentile95": 58000,
  "probability_above_current": 0.65,
  "maxPrice": 72000,
  "minPrice": 28000,
  "standardDeviation": 5000
}
```

#### Get Simulation Results
```http
GET /api/monte-carlo/:tokenId
```

Returns the latest Monte Carlo simulation results for a token.

### Hyperliquid Analytics

#### Get Hyperliquid Metrics
```http
GET /api/hyperliquid/metrics
```

Returns performance metrics for the Hyperliquid exchange.

**Response:**
```json
[
  {
    "date": "2024-01-25",
    "volume24h": 1500000000,
    "dailyActiveUsers": 65000,
    "newUsers": 1500,
    "totalTrades": 150000,
    "liquidations": 45,
    "marketShare": 12.5,
    "revenue": 1500000,
    "tvl": 650000000
  }
]
```

#### Sync Hyperliquid Data
```http
POST /api/hyperliquid/sync
```

Fetches latest Hyperliquid metrics from Dune Analytics.

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": true,
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `404` - Resource Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (external API error)

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Default: 100 requests per minute per IP
- Sync endpoints: 10 requests per hour

## WebSocket Support

Real-time updates are available via WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Handle real-time updates
});
```

### WebSocket Events

- `price_update` - Real-time price updates
- `news_item` - New news items
- `unlock_alert` - Token unlock notifications

## Mock Data Mode

When API keys are not configured, the application returns realistic mock data for development and testing purposes. Mock data is indicated by console warnings and maintains the same response structure as live data.

## Examples

### Fetch Failed Tokens and Their Details

```bash
# Get all failed tokens
curl http://localhost:5000/api/tokens/failed

# Get details for a specific failed token
curl http://localhost:5000/api/tokens/6
```

### Monitor Upcoming Token Unlocks

```bash
# Get all upcoming unlocks
curl http://localhost:5000/api/unlocks/upcoming

# Create unlock notification
curl -X POST http://localhost:5000/api/unlocks \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "2",
    "unlockDate": "2024-03-15",
    "amount": "1000000",
    "percentOfSupply": "5.5"
  }'
```

### Real-time News Monitoring

```bash
# Get high-priority news
curl http://localhost:5000/api/news?priority=1&limit=10

# Sync latest news
curl -X POST http://localhost:5000/api/news/sync
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Fetch failed tokens
async function getFailedTokens() {
  const response = await axios.get(`${API_BASE}/tokens/failed`);
  return response.data;
}

// Run Monte Carlo simulation
async function runSimulation(tokenId: string) {
  const response = await axios.post(`${API_BASE}/monte-carlo/simulate`, {
    tokenId,
    days: 30,
    simulations: 1000
  });
  return response.data;
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:5000/api'

# Fetch DeFi protocols
def get_defi_protocols():
    response = requests.get(f'{API_BASE}/defi/protocols')
    return response.json()

# Sync token data
def sync_tokens():
    response = requests.post(f'{API_BASE}/tokens/sync')
    return response.json()
```

## Best Practices

1. **Caching**: Implement client-side caching for frequently accessed data
2. **Error Handling**: Always handle potential errors and rate limit responses
3. **Pagination**: Use limit parameters for large datasets
4. **Webhooks**: Subscribe to WebSocket events for real-time updates
5. **API Keys**: Store API keys securely and never expose them in client-side code

## Support

For API support, feature requests, or bug reports, please open an issue in the GitHub repository.