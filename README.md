# Token Tracker - Cryptocurrency Analytics Platform

![Token Tracker](https://img.shields.io/badge/Token%20Tracker-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue)

## 🚀 Overview

Token Tracker is a comprehensive cryptocurrency analytics platform designed to help traders and investors identify market trends, track token failures, monitor unlock schedules, and analyze DeFi protocol performance. Built with modern web technologies, it provides real-time data visualization and actionable insights.

## ✨ Key Features

### 📊 Token Failure Analysis
- **90%+ Decline Tracking**: Automatically identifies tokens that have declined 90% or more from their all-time high
- **Risk Level Classification**: Categorizes tokens by risk levels (LOW, MEDIUM, HIGH, VERY_HIGH, EXTREME)
- **Historical Data**: Tracks price movements and market cap changes over time
- **Sector Analysis**: Groups failed tokens by categories (DeFi, Gaming, Layer 2, NFTs, etc.)

### 🔓 Token Unlock Schedule
- **Upcoming Unlocks**: Monitors scheduled token unlock events
- **Impact Assessment**: Estimates potential price impact of unlock events
- **Notification System**: Alerts for significant unlock events
- **Calendar View**: Visual timeline of upcoming unlocks

### 💰 DeFi Revenue Analytics
- **Protocol Tracking**: Monitors TVL and revenue for major DeFi protocols
- **P/E Ratio Analysis**: Calculates price-to-earnings ratios for DeFi tokens
- **Revenue Trends**: 24h, 7d, and 30d revenue tracking
- **Chain Distribution**: Analysis by blockchain (Ethereum, BSC, Polygon, etc.)

### 🎲 Monte Carlo Simulations
- **Price Predictions**: Statistical modeling for future price movements
- **Risk Assessment**: Probability distributions and confidence intervals
- **Multiple Scenarios**: Runs thousands of simulations for accuracy
- **Visual Charts**: Interactive visualization of simulation results

### 📰 Real-Time News Feed
- **10-Second Refresh**: Ultra-fast news updates from Velo API
- **Priority Filtering**: High, normal, and low priority news categorization
- **Coin-Specific News**: Filter news by specific cryptocurrencies
- **Trading Integration**: Direct links to BloFin trading platform

### 📈 Success Stories
- **Hyperliquid Case Study**: Detailed analysis of successful exchange metrics
- **Performance Tracking**: Volume, users, revenue, and TVL metrics
- **Market Share Analysis**: Competitive positioning data
- **Growth Trends**: Historical performance visualization

### 🔥 Advanced Analytics (NEW)
Powered by CoinGecko Pro MCP integration:

1. **Market Cap Heat Map** - Real-time visualization of top 50 cryptocurrencies
2. **BTC vs ETH Performance** - Historical comparison since 2015 with dominance overlay
3. **Dynamic Candlestick Charts** - 30-day OHLC data with volume for any cryptocurrency
4. **Sector Rotation Dashboard** - Track which crypto narratives are trending
5. **Liquidity Spike Monitor** - Identify DEX pools with explosive volume growth

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium React components
- **Chart.js** - Data visualization
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database queries
- **WebSocket** - Real-time updates

### External APIs
- **CoinGecko Pro** - Cryptocurrency market data
- **Velo Data** - Real-time crypto news
- **Dune Analytics** - On-chain metrics
- **DefiLlama** - DeFi protocol data

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database (optional - app works with in-memory storage)
- API keys for external services (optional - app works with mock data)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/token-tracker.git
cd token-tracker
```

### 2. Install Dependencies
```bash
npm install
```

**Note for Windows users**: When running the development server, use:
```bash
set NODE_ENV=development && npx tsx server/index.ts
```

### 3. Environment Setup
Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration:

```env
# Database (Optional - leave empty for in-memory storage)
DATABASE_URL=postgresql://user:password@localhost:5432/token_tracker

# API Keys (Optional - app works with mock data)
COINGECKO_API_KEY=your_coingecko_api_key
VELO_API_KEY=your_velo_api_key
DEFILLAMA_API_KEY=your_defillama_api_key
DUNE_API_KEY=your_dune_api_key

# Server
PORT=5000
NODE_ENV=development
```

### 4. Database Setup (Optional)
If you have a PostgreSQL database configured:
```bash
# Push schema to database
npm run db:push
```

**Note**: If no database is configured, the app will use in-memory storage with mock data.

### 5. Start Development Server

**Linux/macOS**:
```bash
npm run dev
```

**Windows**:
```bash
set NODE_ENV=development && npx tsx server/index.ts
```

The application will be available at:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

## 📁 Project Structure

```
token-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   └── types/        # TypeScript types
│   └── index.html
├── server/                # Backend Express application
│   ├── services/         # External API integrations
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle ORM schemas
├── API_DOCUMENTATION.md  # Detailed API reference
├── README.md            # This file
└── package.json         # Dependencies and scripts
```

## 🔌 API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API reference.

### Key Endpoints:
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/tokens/failed` - Failed tokens (90%+ decline)
- `GET /api/unlocks/upcoming` - Upcoming token unlocks
- `GET /api/news` - Real-time crypto news
- `POST /api/monte-carlo/simulate` - Run price simulations
- `GET /api/hyperliquid/metrics` - Exchange performance data

## 🎨 Features in Detail

### Token Failure Analysis
The platform continuously monitors cryptocurrency tokens and identifies those that have experienced significant declines from their all-time highs. This helps investors:
- Avoid potential "dead" projects
- Identify recovery opportunities
- Understand market cycles
- Learn from historical failures

### Smart Unlock Tracking
Token unlocks can significantly impact price. Our platform:
- Tracks vesting schedules
- Calculates unlock volumes
- Estimates market impact
- Provides advance warnings

### DeFi Analytics
Comprehensive DeFi protocol analysis including:
- Total Value Locked (TVL)
- Protocol revenues
- User metrics
- Chain distribution
- P/E ratios for valuation

### Monte Carlo Engine
Advanced statistical modeling that:
- Runs 1000+ price simulations
- Accounts for historical volatility
- Provides probability distributions
- Generates confidence intervals

## 🔧 Configuration

### Mock Data Mode
The application supports two mock data modes:

1. **No Database**: When DATABASE_URL is not set, the app uses in-memory storage
2. **No API Keys**: When API keys are not configured, external APIs return mock data

This allows for:
- Development without infrastructure dependencies
- Testing and demonstration
- Offline functionality
- Zero-cost development

### Database Configuration
The application supports two storage modes:

1. **PostgreSQL** (Production): Configure `DATABASE_URL` with your PostgreSQL connection string
2. **In-Memory** (Development): Leave `DATABASE_URL` empty to use mock storage

The app uses Drizzle ORM for database operations when PostgreSQL is configured.

### API Rate Limits
- CoinGecko: 500 calls/minute (Pro tier)
- Velo: 100 calls/minute
- Dune: 1000 executions/month

### MCP (Model Context Protocol) Integration
The project includes optional MCP server integration for CoinGecko:

1. **Setup MCP Configuration**:
```bash
cp .mcp.json.example .mcp.json
```

2. **Configure your CoinGecko Pro API key** in `.mcp.json`

3. **Use with Claude Code**: The MCP server provides enhanced AI assistance when using Claude Code for development

For more information about MCP, visit: https://modelcontextprotocol.io/

## 📊 Performance

- **Page Load**: < 2 seconds
- **API Response**: < 500ms average
- **Real-time Updates**: 10-second intervals
- **Database Queries**: Optimized with indexes

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **API Key Errors**
   - Application works without API keys (mock data)
   - Check key formatting if provided
   - Verify API tier limits

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version (>= 18)
   - Verify TypeScript version

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Maintain code style consistency

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for market data
- [DefiLlama](https://defillama.com/) for DeFi analytics
- [Dune Analytics](https://dune.com/) for on-chain data
- [shadcn/ui](https://ui.shadcn.com/) for UI components

## 📞 Support

- **Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/token-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/token-tracker/discussions)

## 🚦 Status

- ✅ Token Failure Tracking
- ✅ Unlock Schedule Monitoring
- ✅ DeFi Revenue Analytics
- ✅ Monte Carlo Simulations
- ✅ Real-time News Feed
- ✅ Hyperliquid Analytics
- ✅ Mock Data Support
- 🔄 WebSocket Real-time Updates (In Progress)
- 📅 Mobile App (Planned)

---

Built with ❤️ by the Token Tracker Team