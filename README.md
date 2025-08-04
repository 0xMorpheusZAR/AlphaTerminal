# AlphaTerminal - Bloomberg-Style Crypto Market Dashboard

A sophisticated cryptocurrency market analysis platform built with the SuperClaude Framework v3.0, featuring AI-powered persona orchestration and real-time market data visualization.

![AlphaTerminal Dashboard](https://img.shields.io/badge/UI-Bloomberg%20Terminal%20Style-brightgreen)
![Status](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🖥️ Dashboard Interface

The AlphaTerminal features a professional Bloomberg Terminal-inspired interface with:

- **Black Background & Green Text**: Classic terminal aesthetic
- **Grid Layout**: Multi-widget dashboard with responsive design
- **Real-time Updates**: WebSocket-powered live data streaming
- **Interactive Command Terminal**: Execute commands directly in the browser
- **Market Heatmap**: Visual representation of market performance
- **Professional Trading Tools**: Order book, trade history, and analytics

### Dashboard Widgets

1. **Market Overview** - Real-time prices for top cryptocurrencies
2. **Price Charts** - Interactive candlestick charts (TradingView-ready)
3. **Market Heatmap** - Color-coded performance visualization
4. **Command Terminal** - Bloomberg-style command interface
5. **News & Alerts** - Real-time anomaly detection and notifications
6. **Order Book** - Live bid/ask spreads
7. **Trade History** - Recent market transactions

## Features

### Core Capabilities
- **AI Persona Orchestration**: 11 specialized AI personas for different aspects of crypto analysis
- **Real-time Market Data**: Multi-provider integration (CoinGecko, Binance, custom APIs)
- **Bloomberg-Style Terminal**: Professional trading interface with customizable dashboards
- **WebSocket Streaming**: Live market updates and price feeds
- **Advanced Analytics**: Market anomaly detection, price predictions, and risk assessment

### AI Personas
- **System Architect**: Design and system planning
- **Frontend Developer**: UI/UX implementation
- **Backend Developer**: Server-side logic and APIs
- **Security Specialist**: Security auditing and compliance
- **Performance Engineer**: Optimization and scaling
- **QA Engineer**: Testing and quality assurance
- **Data Analyst**: Market analysis and trends
- **Trading Specialist**: Trading strategies and execution
- **Data Engineer**: Data pipeline management
- **UX Designer**: Interface design
- **DevOps Engineer**: Deployment and infrastructure

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/alpha-terminal.git
cd alpha-terminal
npm install
cp .env.example .env

# Run in development mode
npm run dev

# Access the dashboard
open http://localhost:3333
```

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git

### Detailed Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/alpha-terminal.git
cd alpha-terminal

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys (optional - mock data available)
# nano .env

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

Edit `.env` file with your API keys and preferences:

```env
# API Keys
COINGECKO_API_KEY=your_coingecko_api_key
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key

# Server Configuration
PORT=3000
WS_PORT=3001

# Features
ENABLE_MOCK_DATA=true  # For development without API keys
```

## Usage

### Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Access the Dashboard

Open your browser and navigate to:
- Dashboard: `http://localhost:3000`
- API Documentation: `http://localhost:3000/api-docs`

### Terminal Commands

The system supports various commands through the web terminal:

```bash
# Market commands
market overview          # Get market overview
market heatmap          # Display market heatmap

# Trading commands
trade analyze BTC       # Analyze Bitcoin
portfolio status        # Get portfolio status

# System commands
system status           # Get system status
help                   # Show available commands
```

### API Endpoints

```bash
GET  /api/market/overview     # Market overview with metrics
GET  /api/market/data/:symbol # Market data for specific symbol
GET  /api/market/metrics      # Global market metrics
POST /api/analyze/token       # Analyze specific token
POST /api/command             # Execute terminal command
GET  /api/system/metrics      # System performance metrics
GET  /api/system/diagnostics  # Run system diagnostics
```

### WebSocket Channels

Subscribe to real-time data streams:

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000');

// Subscribe to channels
socket.emit('subscribe', { channel: 'market-data' });
socket.emit('subscribe', { channel: 'market-metrics' });
socket.emit('subscribe', { channel: 'anomalies' });

// Receive updates
socket.on('market-data', (data) => {
  console.log('Market data update:', data);
});
```

## Development

### Project Structure

```
alpha-terminal/
├── src/
│   ├── core/               # SuperClaude Framework core
│   ├── personas/           # AI persona definitions
│   ├── services/           # Data services and integrations
│   ├── types/              # TypeScript type definitions
│   ├── AlphaTerminal.ts    # Main application class
│   ├── server.ts           # Express/Socket.IO server
│   └── index.ts            # Entry point
├── public/                 # Static files and frontend
├── examples/               # Usage examples
├── tests/                  # Test suites
└── config/                 # Configuration files
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
```

### Adding New Personas

Create a new persona in `src/personas/index.ts`:

```typescript
['your-persona', {
  id: 'your-persona',
  name: 'Your Persona Name',
  role: 'Description of role',
  capabilities: ['capability1', 'capability2'],
  specializations: ['spec1', 'spec2'],
  confidenceFactors: {
    contextMatch: 0.9,
    capabilityMatch: 0.85,
    specializationMatch: 0.8,
    historicalPerformance: 0.95
  }
}]
```

## Performance Optimization

- **Caching**: Configurable TTL for API responses
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Connection Pooling**: Efficient WebSocket connection management
- **Parallel Processing**: Multiple personas can work concurrently

## Security

- **API Key Management**: Secure storage of API credentials
- **Rate Limiting**: Protection against abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS Configuration**: Configurable CORS policies
- **Helmet.js**: Security headers for Express

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with the SuperClaude Framework v3.0
- Inspired by Bloomberg Terminal's professional trading interface
- Powered by real-time cryptocurrency market data providers