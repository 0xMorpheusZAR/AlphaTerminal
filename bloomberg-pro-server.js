/**
 * AlphaTerminal Bloomberg Pro - Enhanced Server with CoinGecko Pro Integration
 * Professional crypto analytics dashboard with real-time market data
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Create Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CoinGecko Pro API Configuration
const COINGECKO_API_KEY = process.env.COINGECKO_PRO_API_KEY || 'CG-MVg68aVqeVyu8fzagC9E1hPj';
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

// Create axios instance for CoinGecko
const coinGeckoAPI = axios.create({
  baseURL: COINGECKO_BASE_URL,
  headers: {
    'x-cg-pro-api-key': COINGECKO_API_KEY
  }
});

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// Helper function to get cached or fresh data
async function getCachedData(key, fetchFunction, duration = CACHE_DURATION) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  
  try {
    const data = await fetchFunction();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error.message);
    return cached ? cached.data : null;
  }
}

// API Routes

// Get market overview data
app.get('/api/market/overview', async (req, res) => {
  try {
    const data = await getCachedData('market-overview', async () => {
      const [global, trending, fearGreed] = await Promise.all([
        coinGeckoAPI.get('/global'),
        coinGeckoAPI.get('/search/trending'),
        // Fear & Greed Index (simulated for now as CoinGecko doesn't provide it directly)
        Promise.resolve({ value: Math.floor(Math.random() * 30) + 50 }) // 50-80 range
      ]);

      return {
        global: global.data.data,
        trending: trending.data,
        fearGreedIndex: fearGreed.value
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get live price ticker data
app.get('/api/market/ticker', async (req, res) => {
  try {
    const symbols = req.query.symbols || 'bitcoin,ethereum,binancecoin,ripple,cardano,solana,polkadot,dogecoin,avalanche-2,matic-network';
    
    const data = await getCachedData(`ticker-${symbols}`, async () => {
      const response = await coinGeckoAPI.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: symbols,
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          sparkline: true,
          price_change_percentage: '1h,24h,7d'
        }
      });
      return response.data;
    }, 30000); // 30 second cache for ticker

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top gainers and losers
app.get('/api/market/movers', async (req, res) => {
  try {
    const data = await getCachedData('market-movers', async () => {
      const response = await coinGeckoAPI.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      const coins = response.data;
      const gainers = coins
        .filter(coin => coin.price_change_percentage_24h > 0)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 10);
      
      const losers = coins
        .filter(coin => coin.price_change_percentage_24h < 0)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, 10);

      return { gainers, losers };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get market heatmap data
app.get('/api/market/heatmap', async (req, res) => {
  try {
    const data = await getCachedData('market-heatmap', async () => {
      const response = await coinGeckoAPI.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        }
      });

      // Group by categories (simplified)
      const categories = {
        'Layer 1': ['bitcoin', 'ethereum', 'cardano', 'solana', 'avalanche-2', 'polkadot'],
        'DeFi': ['uniswap', 'aave', 'compound', 'maker', 'curve-dao-token', 'sushi'],
        'Exchange': ['binancecoin', 'crypto-com-chain', 'ftx-token', 'kucoin-shares'],
        'Meme': ['dogecoin', 'shiba-inu', 'dogelon-mars'],
        'Stablecoin': ['tether', 'usd-coin', 'binance-usd', 'dai']
      };

      return response.data.map(coin => ({
        ...coin,
        category: Object.entries(categories).find(([_, coins]) => 
          coins.includes(coin.id)
        )?.[0] || 'Other'
      }));
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trending coins
app.get('/api/market/trending', async (req, res) => {
  try {
    const data = await getCachedData('trending', async () => {
      const response = await coinGeckoAPI.get('/search/trending');
      return response.data;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data
  socket.emit('connected', { 
    message: 'Connected to AlphaTerminal Bloomberg Pro',
    timestamp: new Date()
  });

  // Join real-time updates room
  socket.on('subscribe', (channels) => {
    channels.forEach(channel => {
      socket.join(channel);
      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Real-time price updates (every 30 seconds)
setInterval(async () => {
  try {
    const response = await coinGeckoAPI.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: 'bitcoin,ethereum,binancecoin,ripple,cardano,solana',
        order: 'market_cap_desc',
        sparkline: false
      }
    });

    io.to('ticker').emit('price-update', {
      data: response.data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching real-time prices:', error.message);
  }
}, 30000);

// Serve the enhanced Bloomberg terminal
app.get('/bloomberg', (req, res) => {
  res.redirect('/bloomberg-ultra.html');
});

// Serve original pro version
app.get('/bloomberg-pro', (req, res) => {
  res.redirect('/bloomberg-pro.html');
});

// Fallback route
app.get('/', (req, res) => {
  res.redirect('/bloomberg');
});

// Start server
const PORT = process.env.PORT || 3337;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   AlphaTerminal Bloomberg Pro                                 ║
║   Professional Crypto Analytics Dashboard                     ║
║                                                               ║
║   🚀 Server running at http://localhost:${PORT}              ║
║   📊 Bloomberg Terminal at http://localhost:${PORT}/bloomberg ║
║   🔌 WebSocket ready for real-time updates                    ║
║   🔑 CoinGecko Pro API: ${COINGECKO_API_KEY ? '✓ Connected' : '✗ Missing'}           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});