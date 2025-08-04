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

// Mock data for demonstration
const mockPersonas = ['architect', 'frontend', 'backend', 'security', 'performance', 'analyzer', 'qa'];
let activePersonas = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activePersonas: activePersonas,
    timestamp: new Date()
  });
});

app.post('/api/analyze/token-failures', async (req, res) => {
  const { threshold = 90 } = req.body;
  
  // Simulate persona invocation
  simulatePersonaActivity(['analyzer', 'backend'], 'Analyzing token failures');
  
  setTimeout(() => {
    res.json({
      analysis: 'token-failures',
      threshold,
      result: {
        tokensFailed: [
          { symbol: 'LUNA', decline: 99.9, fromATH: '$119.18', current: '$0.0001' },
          { symbol: 'FTT', decline: 98.5, fromATH: '$84.18', current: '$1.26' },
          { symbol: 'CEL', decline: 97.2, fromATH: '$8.05', current: '$0.22' }
        ],
        personasUsed: ['analyzer', 'backend'],
        confidence: 0.95
      }
    });
  }, 2000);
});

app.post('/api/analyze/defi-protocols', async (req, res) => {
  simulatePersonaActivity(['analyzer', 'backend', 'performance'], 'Analyzing DeFi protocols');
  
  setTimeout(() => {
    res.json({
      analysis: 'defi-protocols',
      result: {
        protocols: [
          { name: 'Uniswap', tvl: 5.2e9, revenue24h: 2.5e6, users: 125000 },
          { name: 'Aave', tvl: 8.7e9, revenue24h: 1.8e6, users: 85000 },
          { name: 'Compound', tvl: 3.1e9, revenue24h: 0.9e6, users: 45000 }
        ],
        personasUsed: ['analyzer', 'backend', 'performance']
      }
    });
  }, 2500);
});

app.post('/api/analyze/liquidity-spikes', async (req, res) => {
  simulatePersonaActivity(['analyzer', 'performance'], 'Detecting liquidity spikes');
  
  setTimeout(() => {
    res.json({
      analysis: 'liquidity-spikes',
      result: {
        spikes: [
          { pool: 'PEPE/WETH', volumeIncrease: '524%', tvl: '$8.2M' },
          { pool: 'ARB/USDC', volumeIncrease: '312%', tvl: '$12.5M' },
          { pool: 'MATIC/ETH', volumeIncrease: '298%', tvl: '$6.7M' }
        ],
        alerts: ['High volume on meme tokens', 'Arbitrage opportunities detected'],
        personasUsed: ['analyzer', 'performance']
      }
    });
  }, 2000);
});

app.post('/api/simulate/monte-carlo', async (req, res) => {
  const { token, timeframe, simulations } = req.body;
  simulatePersonaActivity(['analyzer', 'performance', 'backend'], `Running Monte Carlo for ${token}`);
  
  setTimeout(() => {
    res.json({
      simulation: 'monte-carlo',
      parameters: { token, timeframe, simulations },
      result: {
        expectedValue: 48500,
        standardDeviation: 5200,
        var95: 42100,
        probabilities: {
          above50k: 0.42,
          above45k: 0.68,
          below40k: 0.15
        },
        personasUsed: ['analyzer', 'performance', 'backend']
      }
    });
  }, 3000);
});

app.get('/api/commands', (req, res) => {
  res.json({
    commands: [
      '/build', '/design', '/analyze', '/troubleshoot',
      '/improve', '/test', '/document', '/explain',
      '/secure', '/optimize'
    ]
  });
});

app.post('/api/execute-command', async (req, res) => {
  const { command, input } = req.body;
  const relevantPersonas = getPersonasForCommand(command);
  
  simulatePersonaActivity(relevantPersonas, `Executing ${command}: ${input}`);
  
  setTimeout(() => {
    res.json({
      command,
      input,
      success: true,
      result: {
        message: `Successfully executed ${command}`,
        personasInvoked: relevantPersonas,
        executionTime: Math.floor(Math.random() * 3000) + 1000
      }
    });
  }, 2000);
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('task:execute', async (data) => {
    simulatePersonaActivity(['architect', 'frontend', 'backend'], 'Processing custom task');
    
    setTimeout(() => {
      socket.emit('task:result', {
        success: true,
        personasInvoked: ['architect', 'frontend', 'backend'],
        result: 'Task completed successfully'
      });
    }, 2000);
  });

  // Handle dashboard subscriptions
  socket.on('dashboard:subscribe', async (options) => {
    console.log('Client subscribed to dashboard updates');
    
    // Send initial market data
    const initialData = generateDashboardData();
    socket.emit('market:initial', initialData);
    
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
    console.log('Client disconnected:', socket.id);
  });
});

// Helper functions
function simulatePersonaActivity(personas, task) {
  personas.forEach((persona, index) => {
    setTimeout(() => {
      activePersonas.push(persona);
      io.emit('persona:update', { persona, task });
      
      // Clear after 3 seconds
      setTimeout(() => {
        activePersonas = activePersonas.filter(p => p !== persona);
      }, 3000);
    }, index * 500);
  });
}

function getPersonasForCommand(command) {
  const commandPersonas = {
    '/build': ['architect', 'frontend', 'backend'],
    '/design': ['architect', 'frontend'],
    '/analyze': ['analyzer', 'performance'],
    '/secure': ['security', 'backend'],
    '/optimize': ['performance', 'backend'],
    '/test': ['qa', 'analyzer'],
    '/document': ['scribe'],
    '/explain': ['mentor']
  };
  
  return commandPersonas[command] || ['analyzer'];
}

// Helper functions for CoinGecko MCP
function generateCoinGeckoMarketData(count = 20, includeSparkline = true) {
  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', rank: 1, basePrice: 45000 },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', rank: 2, basePrice: 2500 },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', rank: 3, basePrice: 300 },
    { id: 'solana', symbol: 'SOL', name: 'Solana', rank: 4, basePrice: 100 },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', rank: 5, basePrice: 0.6 },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', rank: 6, basePrice: 0.5 },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', rank: 7, basePrice: 35 },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', rank: 8, basePrice: 7 },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', rank: 9, basePrice: 0.8 },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', rank: 10, basePrice: 15 }
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

function generateLiveMarketUpdate() {
  const assets = generateCoinGeckoMarketData(10, false);
  
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

// Velo Data Generation Functions
function generateVeloFuturesData() {
  const exchanges = ['binance', 'bybit', 'okx', 'deribit'];
  const products = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'BTC-0329', 'ETH-0329'];
  
  const futuresData = [];
  
  exchanges.forEach(exchange => {
    products.forEach(product => {
      const basePrice = getBasePrice(product.split('-')[0]) || 100;
      const isPerp = product.includes('PERP');
      
      futuresData.push({
        exchange,
        product,
        type: isPerp ? 'perpetual' : 'dated',
        mark_price: basePrice * (0.995 + Math.random() * 0.01),
        index_price: basePrice,
        last_price: basePrice * (0.994 + Math.random() * 0.012),
        bid: basePrice * (0.993 + Math.random() * 0.01),
        ask: basePrice * (0.995 + Math.random() * 0.01),
        volume_24h: Math.random() * 500000000,
        open_interest: Math.random() * 1000000000,
        funding_rate: isPerp ? (Math.random() - 0.5) * 0.001 : null,
        next_funding_time: isPerp ? new Date(Date.now() + 3600000).toISOString() : null,
        basis: !isPerp ? (Math.random() - 0.5) * 0.02 : null,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  return futuresData;
}

function generateVeloOptionsData() {
  const strikes = [40000, 42000, 44000, 45000, 46000, 48000, 50000];
  const expiries = ['2024-01-26', '2024-02-23', '2024-03-29'];
  const optionsData = [];
  
  strikes.forEach(strike => {
    expiries.forEach(expiry => {
      ['call', 'put'].forEach(optionType => {
        const btcPrice = 45000;
        const timeToExpiry = (new Date(expiry).getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
        const moneyness = strike / btcPrice;
        
        // Simple Black-Scholes approximation for IV
        const baseIV = 0.6 + (Math.abs(1 - moneyness) * 2);
        const iv = baseIV + (Math.random() - 0.5) * 0.1;
        
        optionsData.push({
          exchange: 'deribit',
          product: `BTC-${expiry}-${strike}-${optionType.toUpperCase()}`,
          type: optionType,
          strike,
          expiry,
          underlying_price: btcPrice,
          mark_price: Math.random() * 2000 + 500,
          bid: Math.random() * 2000 + 400,
          ask: Math.random() * 2000 + 600,
          volume_24h: Math.random() * 10000000,
          open_interest: Math.random() * 50000000,
          implied_volatility: iv,
          delta: optionType === 'call' ? 0.5 + (Math.random() - 0.5) * 0.8 : -0.5 + (Math.random() - 0.5) * 0.8,
          gamma: Math.random() * 0.0001,
          theta: -(Math.random() * 50),
          vega: Math.random() * 100,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
  
  return optionsData;
}

function generateVeloFundingRates() {
  const exchanges = ['binance', 'bybit', 'okx', 'deribit', 'bitmex'];
  const products = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'AVAX-PERP', 'MATIC-PERP'];
  
  const fundingData = [];
  
  exchanges.forEach(exchange => {
    products.forEach(product => {
      // Generate historical funding rates for last 7 days
      const historicalRates = [];
      for (let i = 0; i < 21; i++) { // 3 funding periods per day
        historicalRates.push({
          timestamp: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
          rate: (Math.random() - 0.5) * 0.002
        });
      }
      
      fundingData.push({
        exchange,
        product,
        current_rate: (Math.random() - 0.5) * 0.001,
        predicted_rate: (Math.random() - 0.5) * 0.001,
        next_funding_time: new Date(Date.now() + (8 - (Date.now() / 1000 / 60 / 60) % 8) * 60 * 60 * 1000).toISOString(),
        avg_rate_7d: historicalRates.reduce((sum, r) => sum + r.rate, 0) / historicalRates.length,
        historical_rates: historicalRates,
        open_interest: Math.random() * 500000000,
        volume_24h: Math.random() * 1000000000
      });
    });
  });
  
  return fundingData;
}

function generateVeloHistoricalData(type, exchange, product, timeRange) {
  const dataPoints = [];
  const intervals = timeRange === '1d' ? 288 : timeRange === '7d' ? 168 : 30; // 5min, 1h, 1d candles
  const basePrice = getBasePrice(product.split('-')[0]) || 100;
  
  for (let i = intervals; i >= 0; i--) {
    const timestamp = Date.now() - i * (timeRange === '1d' ? 5 * 60 * 1000 : timeRange === '7d' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    const randomWalk = (Math.random() - 0.5) * 0.02;
    
    const open = basePrice * (1 + randomWalk);
    const close = open * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    dataPoints.push({
      timestamp: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.random() * 10000000,
      funding_rate: type === 'futures' ? (Math.random() - 0.5) * 0.001 : undefined,
      open_interest: type === 'futures' ? Math.random() * 100000000 : undefined
    });
  }
  
  return {
    type,
    exchange,
    product,
    timeRange,
    dataPoints
  };
}

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
    const dashboardData = generateDashboardData();
    
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
    tickers: generateTickerData()
  });
});

// Velo Data Endpoints
app.get('/api/velo/futures', async (req, res) => {
  simulatePersonaActivity(['backend', 'analyzer'], 'Fetching Velo futures data');
  
  setTimeout(() => {
    const futuresData = generateVeloFuturesData();
    res.json({
      success: true,
      data: futuresData,
      source: 'velo-api'
    });
  }, 1200);
});

app.get('/api/velo/options', async (req, res) => {
  simulatePersonaActivity(['backend', 'analyzer'], 'Fetching Velo options data');
  
  setTimeout(() => {
    const optionsData = generateVeloOptionsData();
    res.json({
      success: true,
      data: optionsData,
      source: 'velo-api'
    });
  }, 1200);
});

app.get('/api/velo/funding-rates', async (req, res) => {
  simulatePersonaActivity(['analyzer', 'performance'], 'Analyzing funding rates');
  
  setTimeout(() => {
    const fundingData = generateVeloFundingRates();
    res.json({
      success: true,
      data: fundingData,
      source: 'velo-api'
    });
  }, 1000);
});

app.post('/api/velo/historical', async (req, res) => {
  const { type, exchange, product, timeRange } = req.body;
  simulatePersonaActivity(['backend', 'performance'], `Fetching Velo historical ${type} data`);
  
  setTimeout(() => {
    const historicalData = generateVeloHistoricalData(type, exchange, product, timeRange);
    res.json({
      success: true,
      data: historicalData,
      source: 'velo-api'
    });
  }, 1500);
});

// Serve the Bloomberg-style dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bloomberg-dashboard.html'));
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
✨ SuperClaude AlphaTerminal is running!
🌐 Server: http://localhost:${PORT}
📡 WebSocket: ws://localhost:${PORT}

Visit http://localhost:${PORT} to access the web interface.

Available features:
- Token Failure Analysis
- DeFi Protocol Metrics
- Liquidity Spike Detection
- Monte Carlo Simulations
- Command Execution with Automatic Persona Selection

The system will automatically invoke the appropriate AI personas
based on the task requirements.
  `);
});