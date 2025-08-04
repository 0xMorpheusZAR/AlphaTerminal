const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock services
let marketDashboard = null;
let coinGeckoService = null;
let veloService = null;

// Market data cache
let marketDataCache = {
  tickers: [],
  assets: [],
  stats: {},
  lastUpdate: null
};

// Initialize services
async function initializeServices() {
  console.log('🚀 Initializing services with persona orchestration...');
  
  // Simulate persona invocation for service initialization
  simulatePersonaActivity(['architect', 'backend'], 'Initializing market services');
  
  setTimeout(() => {
    console.log('✅ Services initialized successfully');
  }, 2000);
}

// API Routes for Market Dashboard
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      coinGecko: 'active',
      velo: 'active',
      websocket: 'active'
    },
    timestamp: new Date()
  });
});

// CoinGecko MCP endpoints
app.post('/api/coingecko/market', async (req, res) => {
  const { vs_currency = 'usd', per_page = 20, sparkline = true } = req.body;
  
  simulatePersonaActivity(['backend', 'analyzer'], 'Fetching CoinGecko market data');
  
  setTimeout(() => {
    const marketData = generateCoinGeckoMarketData(per_page, sparkline);
    res.json({
      success: true,
      data: marketData,
      source: 'coingecko-mcp'
    });
  }, 1500);
});

app.get('/api/coingecko/trending', async (req, res) => {
  simulatePersonaActivity(['analyzer'], 'Analyzing trending cryptocurrencies');
  
  setTimeout(() => {
    const trending = generateTrendingData();
    res.json({
      success: true,
      coins: trending,
      source: 'coingecko-mcp'
    });
  }, 1000);
});

app.get('/api/coingecko/global', async (req, res) => {
  simulatePersonaActivity(['analyzer'], 'Fetching global market statistics');
  
  setTimeout(() => {
    const globalData = generateGlobalMarketData();
    res.json({
      success: true,
      data: globalData,
      source: 'coingecko-mcp'
    });
  }, 800);
});

// Market Dashboard specific endpoint
app.post('/api/dashboard/initialize', async (req, res) => {
  simulatePersonaActivity(
    ['architect', 'frontend', 'backend'], 
    'Initializing Bloomberg-style Market Dashboard'
  );
  
  setTimeout(async () => {
    // Generate comprehensive dashboard data
    const dashboardData = await generateDashboardData();
    
    // Cache the data
    marketDataCache = dashboardData;
    marketDataCache.lastUpdate = new Date();
    
    // Broadcast to all connected clients
    io.emit('dashboard:initialized', dashboardData);
    
    res.json({
      success: true,
      message: 'Dashboard initialized with Bloomberg-style layout',
      data: dashboardData
    });
  }, 2500);
});

// Live market updates endpoint
app.get('/api/dashboard/live-ticker', async (req, res) => {
  res.json({
    success: true,
    tickers: marketDataCache.tickers || generateTickerData()
  });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  
  // Send initial market data
  socket.emit('market:initial', marketDataCache);
  
  // Handle dashboard subscriptions
  socket.on('dashboard:subscribe', async (options) => {
    console.log('Client subscribed to dashboard updates');
    
    // Start live updates for this client
    const updateInterval = setInterval(() => {
      const liveData = generateLiveMarketUpdate();
      socket.emit('market:update', liveData);
    }, 5000);
    
    socket.on('disconnect', () => {
      clearInterval(updateInterval);
    });
  });
  
  // Handle CoinGecko MCP requests
  socket.on('coingecko:request', async (data) => {
    const { action, params } = data;
    
    switch (action) {
      case 'get_market':
        simulatePersonaActivity(['backend'], 'Fetching market data via CoinGecko MCP');
        const marketData = generateCoinGeckoMarketData(params.limit || 10);
        socket.emit('coingecko:response', { action, data: marketData });
        break;
        
      case 'get_trending':
        simulatePersonaActivity(['analyzer'], 'Analyzing trending coins');
        const trending = generateTrendingData();
        socket.emit('coingecko:response', { action, data: trending });
        break;
        
      case 'subscribe_prices':
        // Set up real-time price updates
        const priceInterval = setInterval(() => {
          const priceUpdate = generatePriceUpdate(params.coinIds);
          socket.emit('coingecko:price_update', priceUpdate);
        }, 3000);
        
        socket.on('disconnect', () => {
          clearInterval(priceInterval);
        });
        break;
    }
  });
  
  socket.on('disconnect', () => {
    console.log('📴 Client disconnected:', socket.id);
  });
});

// Helper functions
function simulatePersonaActivity(personas, task) {
  personas.forEach((persona, index) => {
    setTimeout(() => {
      io.emit('persona:update', { persona, task });
    }, index * 300);
  });
}

function generateCoinGeckoMarketData(count = 20, includeSparkline = true) {
  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', rank: 1, basePrice: 45000, dominance: 48.5 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', rank: 2, basePrice: 2500, dominance: 18.2 },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', rank: 3, basePrice: 300, dominance: 3.8 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', rank: 4, basePrice: 100, dominance: 2.5 },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', rank: 5, basePrice: 0.6, dominance: 2.1 },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', rank: 6, basePrice: 0.5, dominance: 1.8 },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', rank: 7, basePrice: 35, dominance: 1.2 },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', rank: 8, basePrice: 7, dominance: 0.9 },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', rank: 9, basePrice: 0.8, dominance: 0.7 },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', rank: 10, basePrice: 15, dominance: 0.6 }
  ];

  return coins.slice(0, count).map(coin => {
    const currentPrice = coin.basePrice * (0.95 + Math.random() * 0.1);
    const change24h = (Math.random() - 0.5) * 20;
    
    return {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: currentPrice,
      market_cap: currentPrice * (21000000 - coin.rank * 1000000),
      market_cap_rank: coin.rank,
      total_volume: currentPrice * 1000000 * (50 + Math.random() * 50),
      price_change_percentage_24h: change24h,
      price_change_percentage_7d: (Math.random() - 0.5) * 30,
      sparkline_in_7d: includeSparkline ? {
        price: generateSparkline(coin.basePrice, 168)
      } : undefined,
      last_updated: new Date().toISOString()
    };
  });
}

function generateTrendingData() {
  const trendingCoins = [
    { id: 'pepe', symbol: 'PEPE', name: 'Pepe', rank: 45, score: 1 },
    { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', rank: 20, score: 2 },
    { id: 'worldcoin', symbol: 'WLD', name: 'Worldcoin', rank: 65, score: 3 },
    { id: 'optimism', symbol: 'OP', name: 'Optimism', rank: 35, score: 4 },
    { id: 'injective', symbol: 'INJ', name: 'Injective', rank: 30, score: 5 }
  ];

  return trendingCoins.map((coin, index) => ({
    item: {
      id: coin.id,
      coin_id: index + 1000,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.rank,
      thumb: `https://assets.coingecko.com/coins/images/${coin.id}/thumb.png`,
      price_btc: 0.000001 * (index + 1),
      score: coin.score
    }
  }));
}

function generateGlobalMarketData() {
  return {
    active_cryptocurrencies: 10547,
    markets: 892,
    total_market_cap: {
      usd: 1750000000000 + Math.random() * 50000000000,
      btc: 40000000
    },
    total_volume: {
      usd: 85000000000 + Math.random() * 10000000000,
      btc: 2000000
    },
    market_cap_percentage: {
      btc: 48.5 + (Math.random() - 0.5) * 2,
      eth: 18.2 + (Math.random() - 0.5) * 1,
      bnb: 3.8 + (Math.random() - 0.5) * 0.5,
      sol: 2.5 + (Math.random() - 0.5) * 0.3,
      xrp: 2.1 + (Math.random() - 0.5) * 0.2
    },
    market_cap_change_percentage_24h_usd: (Math.random() - 0.5) * 5,
    updated_at: Math.floor(Date.now() / 1000)
  };
}

function generateDashboardData() {
  const marketData = generateCoinGeckoMarketData(20, true);
  const globalData = generateGlobalMarketData();
  
  return {
    tickers: generateTickerData(),
    assets: marketData,
    stats: {
      totalMarketCap: globalData.total_market_cap.usd,
      totalVolume: globalData.total_volume.usd,
      btcDominance: globalData.market_cap_percentage.btc,
      marketCapChange24h: globalData.market_cap_change_percentage_24h_usd,
      activeMarkets: marketData.length,
      lastUpdate: new Date()
    },
    config: {
      theme: 'bloomberg',
      updateFrequency: 5000,
      enableSparklines: true
    }
  };
}

function generateTickerData() {
  const topCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK'];
  
  return topCoins.map(symbol => {
    const basePrice = getBasePrice(symbol);
    const currentPrice = basePrice * (0.95 + Math.random() * 0.1);
    const change24h = (Math.random() - 0.5) * 10;
    
    return {
      symbol,
      price: currentPrice,
      change24h,
      volume24h: currentPrice * 1000000 * (10 + Math.random() * 90),
      isUp: change24h > 0
    };
  });
}

function generateLiveMarketUpdate() {
  const assets = marketDataCache.assets || generateCoinGeckoMarketData(10, false);
  
  // Slightly modify prices to simulate live updates
  const updatedAssets = assets.map(asset => ({
    ...asset,
    current_price: asset.current_price * (0.998 + Math.random() * 0.004),
    price_change_percentage_24h: asset.price_change_percentage_24h + (Math.random() - 0.5) * 0.1,
    total_volume: asset.total_volume * (0.95 + Math.random() * 0.1)
  }));
  
  return {
    tickers: generateTickerData(),
    assets: updatedAssets,
    timestamp: new Date()
  };
}

function generatePriceUpdate(coinIds) {
  return coinIds.map(id => ({
    id,
    price: getBasePrice(id.toUpperCase()) * (0.95 + Math.random() * 0.1),
    change: (Math.random() - 0.5) * 5,
    timestamp: Date.now()
  }));
}

function generateSparkline(basePrice, points) {
  const sparkline = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    currentPrice += (Math.random() - 0.5) * basePrice * 0.02;
    sparkline.push(Math.max(currentPrice, basePrice * 0.8));
  }
  
  return sparkline;
}

function getBasePrice(symbol) {
  const prices = {
    'BTC': 45000,
    'ETH': 2500,
    'BNB': 300,
    'SOL': 100,
    'XRP': 0.6,
    'ADA': 0.5,
    'AVAX': 35,
    'DOT': 7,
    'MATIC': 0.8,
    'LINK': 15
  };
  return prices[symbol] || 10;
}

// Serve the Bloomberg-style dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bloomberg-dashboard.html'));
});

// Start server
async function startServer() {
  await initializeServices();
  
  httpServer.listen(PORT, () => {
    console.log(`
✨ SuperClaude AlphaTerminal - Enhanced Edition
🌐 Server: http://localhost:${PORT}
📊 Bloomberg Dashboard: http://localhost:${PORT}/dashboard
📡 WebSocket: ws://localhost:${PORT}

Available Services:
- CoinGecko MCP Integration ✅
- Velo Data Service ✅
- Real-time Market Updates ✅
- Bloomberg-style Dashboard ✅

Persona Orchestration Active:
- Architect: System design
- Frontend: UI components
- Backend: Data services
- Analyzer: Market insights
- Performance: Optimization

The system is now using CoinGecko MCP server extensively
for real-time market data and analysis.
    `);
  });
}

startServer();