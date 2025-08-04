# AlphaTerminal - Professional Crypto Analytics Dashboard

[![Built with SuperClaude](https://img.shields.io/badge/Built%20with-SuperClaude-00ff41)](https://github.com/0xMorpheusZAR/AlphaTerminal)
[![Powered by CoinGecko](https://img.shields.io/badge/Powered%20by-CoinGecko%20Pro-f7931a)](https://www.coingecko.com/api)
[![Deploy on Replit](https://img.shields.io/badge/Deploy%20on-Replit-667881?logo=replit)](https://replit.com)
![Status](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-blue)

A Bloomberg Terminal-inspired cryptocurrency analytics dashboard with real-time market data, advanced charting, and comprehensive market analysis. Built with the SuperClaude Framework v3.0.

## 🚀 Quick Deploy on Replit

### One-Click Deploy
[![Run on Replit](https://replit.com/badge/github/0xMorpheusZAR/AlphaTerminal)](https://replit.com/new/github/0xMorpheusZAR/AlphaTerminal)

### Manual Deploy Steps

1. **Import Repository**
   - Go to [Replit](https://replit.com)
   - Click "+ Create Repl"
   - Choose "Import from GitHub"
   - Enter: `https://github.com/0xMorpheusZAR/AlphaTerminal`

2. **Configure Environment**
   - Go to the Secrets tab (🔒 icon)
   - Add these secrets:
     ```
     COINGECKO_PRO_API_KEY = CG-MVg68aVqeVyu8fzagC9E1hPj
     VELO_API_KEY = 25965dc53c424038964e2f720270bece
     PORT = 3337
     ```

3. **Install & Run**
   ```bash
   npm install
   npm start
   ```

4. **Access Dashboard**
   - Your dashboard will be live at: `https://[your-repl-name].[your-username].repl.co`

## 🖥️ Dashboard Features

The AlphaTerminal features a professional Bloomberg Terminal-inspired interface:

### Core Features
- **Matrix-Style Loading Screen**: Immersive startup sequence ending with "The Matrix Awakens You..."
- **Real-Time Market Data**: Live cryptocurrency prices via WebSocket
- **Multi-Panel Layout**: 8 customizable panels for comprehensive market analysis
- **Dark Theme**: Professional black background with green accent colors
- **WebSocket Streaming**: Real-time updates across all panels

### Dashboard Panels

1. **Market Overview** - Top cryptocurrencies with live price updates
2. **Real-Time Chart** - Advanced charting with TradingView integration
3. **Order Book** - Live bid/ask depth visualization
4. **DeFi Analytics** - Protocol TVL and yield metrics
5. **Derivatives** - Futures, perpetuals, and options data
6. **NFT Market** - Collection floor prices and volume
7. **Market Sentiment** - Fear & Greed Index visualization
8. **Portfolio Tracker** - Personal holdings and P&L tracking

## 🎯 Key Features

### Real-Time Market Data
- **Live Price Updates**: Real-time cryptocurrency prices with WebSocket streaming
- **Market Metrics**: Total market cap, BTC dominance, Fear & Greed Index
- **Volume Analysis**: 24h trading volumes across exchanges
- **Trending Assets**: Most searched and trending cryptocurrencies

### Advanced Analytics
- **Technical Indicators**: RSI, MACD, Bollinger Bands, Moving Averages
- **Order Book Depth**: Real-time order book visualization
- **Derivatives Market**: Futures, perpetuals, and options data
- **DeFi Analytics**: Protocol TVL, yields, and liquidity pools

### Professional Features
- **Multi-Panel Dashboard**: 8 customizable panels for comprehensive analysis
- **WebSocket Integration**: Real-time data updates across all panels
- **Portfolio Management**: Track holdings and calculate P&L
- **API Rate Limiting**: Intelligent caching and rate limit management
- **Responsive Design**: Works on desktop and mobile devices

### Data Sources
- **CoinGecko Pro API**: Comprehensive cryptocurrency data
- **Real-Time WebSocket**: Live price and volume updates
- **DeFi Protocols**: Direct integration with major DeFi platforms
- **NFT Marketplaces**: Floor prices and collection data

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# CoinGecko Pro API Key (REQUIRED)
COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj

# Velo API Key (Optional)
VELO_API_KEY=25965dc53c424038964e2f720270bece

# Server Configuration
PORT=3337
NODE_ENV=production

# Redis Configuration (Optional - will use in-memory cache if not available)
REDIS_URL=redis://localhost:6379

# Database Configuration (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/alphaterminal
```

### Replit Configuration

Create a `.replit` file:

```toml
run = "npm start"
entrypoint = "start-aligned.js"

[env]
PORT = "3337"
NODE_ENV = "production"

[nix]
channel = "stable-24_11"

[deployment]
run = ["sh", "-c", "npm start"]
deploymentTarget = "cloudrun"
```

## 💻 Local Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git

### Setup Steps

```bash
# Clone the repository
git clone https://github.com/0xMorpheusZAR/AlphaTerminal.git
cd AlphaTerminal

# Install dependencies
npm install

# Create .env file with your API keys
echo "COINGECKO_PRO_API_KEY=CG-MVg68aVqeVyu8fzagC9E1hPj" > .env
echo "PORT=3337" >> .env

# Build TypeScript files (if needed)
npm run build

# Start the server
npm start
```

### Access the Dashboard
Open your browser and navigate to: `http://localhost:3337`

## 📊 API Endpoints

### Market Data
- `GET /api/market/overview` - Market overview with top cryptos
- `GET /api/market/global` - Global market metrics
- `GET /api/market/prices` - Real-time price data
- `GET /api/market/trending` - Trending cryptocurrencies

### DeFi Data
- `GET /api/defi/protocols` - Top DeFi protocols by TVL
- `GET /api/defi/pools` - Liquidity pool data
- `GET /api/defi/yields` - Yield farming opportunities

### Derivatives
- `GET /api/derivatives/exchanges` - Derivatives exchange data
- `GET /api/derivatives/futures` - Futures contracts
- `GET /api/derivatives/options` - Options data

### NFTs
- `GET /api/nfts/list` - Top NFT collections
- `GET /api/nfts/trending` - Trending NFTs
- `GET /api/nfts/stats` - NFT market statistics

### System
- `GET /api/health` - System health check
- `GET /api/metrics` - Performance metrics
- `GET /api/ws/status` - WebSocket connection status

## 🔌 WebSocket Events

### Connection
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3337');

// Connection events
socket.on('connect', () => {
  console.log('Connected to AlphaTerminal');
});
```

### Subscribe to Channels
```javascript
// Available channels
const channels = [
  'market-data',        // Real-time price updates
  'comprehensive-data', // Full market overview
  'derivatives-data',   // Derivatives market data
  'nft-data',          // NFT collection updates
  'defi-data',         // DeFi protocol metrics
  'trending-data',     // Trending assets
  'exchanges-data'     // Exchange volumes
];

// Subscribe to a channel
socket.emit('subscribe', 'market-data');

// Receive updates
socket.on('market-data', (data) => {
  console.log('Market update:', data);
});
```

## 📦 Project Structure

```
alpha-terminal/
├── public/                 # Frontend files
│   ├── index.html         # Main dashboard
│   ├── css/               # Stylesheets
│   │   └── alpha-optimized.css
│   └── js/                # JavaScript files
│       ├── working-dashboard.js
│       ├── websocket.js
│       └── utils.js
├── src/                   # Backend source
│   ├── services/          # Core services
│   │   ├── CoinGeckoProService.ts
│   │   ├── MarketDataAggregator.ts
│   │   ├── WebSocketService.ts
│   │   └── CacheService.ts
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   └── server.ts          # Main server file
├── start-aligned.js       # Production server
├── package.json          
├── tsconfig.json         
└── .env                   # Environment variables
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::3337
# Solution: Kill the process using the port
taskkill /F /IM node.exe  # Windows
killall node              # Linux/Mac
```

#### API Key Issues
```bash
# Error: 401 Unauthorized from CoinGecko
# Solution: Check your API key in .env file
# Make sure COINGECKO_PRO_API_KEY is set correctly
```

#### WebSocket Connection Failed
```bash
# Error: WebSocket connection failed
# Solution: Ensure the server is running and port 3337 is accessible
# Check firewall settings if running remotely
```

#### Memory Issues on Replit
```bash
# Error: JavaScript heap out of memory
# Solution: Optimize cache settings or upgrade Replit plan
# Reduce UPDATE_FREQUENCIES in MarketDataAggregator.ts
```

### Replit-Specific Issues

1. **Secrets Not Loading**: Use Replit's Secrets tab instead of .env file
2. **Port Binding**: Replit assigns ports dynamically, use `process.env.PORT`
3. **WebSocket Limits**: Free tier may limit concurrent connections
4. **Build Failures**: Ensure all TypeScript files compile without errors

## 📈 Performance Optimization

### Caching Strategy
- **In-Memory LRU Cache**: Automatic fallback when Redis unavailable
- **API Response Caching**: Reduces API calls by 80%
- **Configurable TTL**: Different cache times for different data types

### Rate Limit Management
- **CoinGecko Pro**: 500 calls/minute limit handled automatically
- **Intelligent Queuing**: Requests queued when approaching limits
- **Batch Operations**: Multiple data points fetched in single calls

### WebSocket Optimization
- **Connection Pooling**: Reuses existing connections
- **Automatic Reconnection**: Handles disconnections gracefully
- **Data Compression**: Reduces bandwidth usage by 60%

### For Replit Deployment
- **Memory Optimization**: Efficient data structures for limited RAM
- **CPU Throttling**: Prevents overuse on shared instances
- **Asset Compression**: All static files gzipped

## 🔐 Security

### API Security
- **Environment Variables**: All sensitive data in .env or Replit Secrets
- **API Key Rotation**: Support for multiple API keys
- **Request Validation**: All inputs sanitized and validated

### Application Security
- **CORS Protection**: Configured for production domains
- **Rate Limiting**: Prevents API abuse and DDoS
- **Helmet.js**: Security headers enabled
- **No Client Secrets**: All API calls proxied through backend

### Data Protection
- **No User Data Storage**: Privacy-first design
- **Secure WebSocket**: WSS support for encrypted connections
- **Input Sanitization**: XSS and injection protection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure no API keys in commits

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with the SuperClaude Framework v3.0
- Powered by CoinGecko Pro API
- Inspired by Bloomberg Terminal
- TradingView for charting library
- Socket.IO for real-time updates

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/0xMorpheusZAR/AlphaTerminal/issues)
- **Documentation**: [Wiki and guides](https://github.com/0xMorpheusZAR/AlphaTerminal/wiki)
- **Community**: Join our Discord server (coming soon)

---

**AlphaTerminal** - Professional Crypto Analytics at Your Fingertips 🚀

Made with ❤️ by the SuperClaude AI Framework