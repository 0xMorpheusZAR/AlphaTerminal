/**
 * AlphaTerminal Bloomberg - Quick Start Server
 * Simplified server to run the Bloomberg dashboard
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

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

// Serve the Bloomberg dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlphaTerminal | Bloomberg-Style Crypto Dashboard</title>
    <style>
      :root {
        --bloomberg-black: 10 10 10;
        --bloomberg-darker: 5 5 5;
        --bloomberg-dark: 15 15 15;
        --bloomberg-amber: 255 176 0;
        --bloomberg-green: 0 255 0;
        --bloomberg-red: 255 0 0;
        --bloomberg-blue: 0 170 255;
        --bloomberg-gray: 128 128 128;
        --bloomberg-border: 40 40 40;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'JetBrains Mono', monospace;
        background: rgb(var(--bloomberg-black));
        color: white;
        overflow: hidden;
      }

      /* Ticker Bar */
      .ticker-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: rgb(var(--bloomberg-darker));
        border-bottom: 1px solid rgb(var(--bloomberg-border));
        display: flex;
        align-items: center;
        z-index: 1000;
      }

      .ticker-logo {
        padding: 0 24px;
        border-right: 1px solid rgb(var(--bloomberg-border));
      }

      .ticker-logo span {
        color: rgb(var(--bloomberg-amber));
        font-weight: bold;
        font-size: 18px;
      }

      .ticker-content {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .ticker-items {
        display: flex;
        gap: 32px;
        padding: 0 24px;
        animation: scroll 60s linear infinite;
        white-space: nowrap;
      }

      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      .ticker-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ticker-symbol {
        font-weight: 600;
      }

      .ticker-price {
        font-family: monospace;
      }

      .ticker-change {
        font-size: 14px;
      }

      .positive { color: rgb(var(--bloomberg-green)); }
      .negative { color: rgb(var(--bloomberg-red)); }

      /* Navigation Tabs */
      .nav-tabs {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        height: 48px;
        background: rgb(var(--bloomberg-dark));
        border-bottom: 1px solid rgb(var(--bloomberg-border));
        display: flex;
        align-items: center;
        padding: 0 24px;
        gap: 2px;
        z-index: 999;
      }

      .nav-tab {
        padding: 12px 24px;
        font-size: 14px;
        color: rgb(var(--bloomberg-gray));
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }

      .nav-tab:hover {
        color: rgb(var(--bloomberg-amber));
      }

      .nav-tab.active {
        color: rgb(var(--bloomberg-amber));
        border-bottom-color: rgb(var(--bloomberg-amber));
        background: rgba(var(--bloomberg-black), 0.5);
      }

      /* Main Content */
      .main-content {
        margin-top: 108px;
        height: calc(100vh - 108px);
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 16px;
      }

      /* Widgets */
      .widget {
        background: rgb(var(--bloomberg-black));
        border: 1px solid rgb(var(--bloomberg-border));
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .widget-header {
        background: rgb(var(--bloomberg-dark));
        padding: 12px 16px;
        border-bottom: 1px solid rgb(var(--bloomberg-border));
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .widget-title {
        color: rgb(var(--bloomberg-amber));
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .widget-content {
        flex: 1;
        padding: 16px;
        overflow: auto;
      }

      /* Market Overview Widget */
      .market-overview {
        grid-column: span 1;
        grid-row: span 1;
      }

      .metric-card {
        padding: 12px;
        margin-bottom: 12px;
        background: rgba(var(--bloomberg-dark), 0.5);
        border: 1px solid rgb(var(--bloomberg-border));
        border-radius: 4px;
      }

      .metric-label {
        font-size: 12px;
        color: rgb(var(--bloomberg-gray));
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: bold;
        margin-top: 4px;
      }

      /* Chart Widget */
      .chart-widget {
        grid-column: span 2;
        grid-row: span 2;
      }

      .chart-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgb(var(--bloomberg-gray));
      }

      /* Order Book Widget */
      .orderbook-widget {
        grid-column: span 1;
        grid-row: span 2;
      }

      .orderbook-table {
        width: 100%;
        font-size: 12px;
      }

      .orderbook-table th {
        text-align: right;
        padding: 8px;
        color: rgb(var(--bloomberg-gray));
        font-weight: normal;
        border-bottom: 1px solid rgb(var(--bloomberg-border));
      }

      .orderbook-table td {
        text-align: right;
        padding: 4px 8px;
      }

      /* Loading Animation */
      .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(var(--bloomberg-amber), 0.3);
        border-radius: 50%;
        border-top-color: rgb(var(--bloomberg-amber));
        animation: spin 1s ease-in-out infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Live Badge */
      .live-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        font-size: 11px;
        color: rgb(var(--bloomberg-green));
        border: 1px solid rgb(var(--bloomberg-green));
        border-radius: 12px;
      }

      .live-dot {
        width: 6px;
        height: 6px;
        background: rgb(var(--bloomberg-green));
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Ticker Bar -->
    <div class="ticker-bar">
      <div class="ticker-logo">
        <span>ALPHA</span>
      </div>
      <div class="ticker-content">
        <div class="ticker-items">
          ${generateTickerItems()}
          ${generateTickerItems()} <!-- Duplicate for seamless loop -->
        </div>
      </div>
      <div style="padding: 0 24px; display: flex; align-items: center; gap: 8px;">
        <div class="live-dot"></div>
        <span style="color: rgb(var(--bloomberg-gray)); font-size: 14px;">MARKET OPEN</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <div class="nav-tab active">SPOT</div>
      <div class="nav-tab">FUTURES</div>
      <div class="nav-tab">OPTIONS</div>
      <div class="nav-tab">FUNDING</div>
      <div class="nav-tab">DEFI</div>
      <div class="nav-tab">NFTS</div>
      <div class="nav-tab">NEWS</div>
      <div class="nav-tab">ANALYTICS</div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Market Overview Widget -->
      <div class="widget market-overview">
        <div class="widget-header">
          <h3 class="widget-title">MARKET OVERVIEW</h3>
          <div class="live-badge">
            <div class="live-dot"></div>
            LIVE
          </div>
        </div>
        <div class="widget-content">
          <div class="metric-card">
            <div class="metric-label">Total Market Cap</div>
            <div class="metric-value">$2.48T</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">24H Volume</div>
            <div class="metric-value">$98.7B</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">BTC Dominance</div>
            <div class="metric-value">48.5%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Fear & Greed</div>
            <div class="metric-value" style="color: rgb(var(--bloomberg-amber));">65</div>
          </div>
        </div>
      </div>

      <!-- Chart Widget -->
      <div class="widget chart-widget">
        <div class="widget-header">
          <h3 class="widget-title">BTC-USD | $65,432.21 <span class="positive">+2.45%</span></h3>
          <div style="display: flex; gap: 8px;">
            <button style="padding: 4px 8px; background: rgb(var(--bloomberg-amber)); color: black; border: none; border-radius: 2px; font-size: 12px; cursor: pointer;">1H</button>
            <button style="padding: 4px 8px; background: transparent; color: rgb(var(--bloomberg-gray)); border: 1px solid rgb(var(--bloomberg-border)); border-radius: 2px; font-size: 12px; cursor: pointer;">4H</button>
            <button style="padding: 4px 8px; background: transparent; color: rgb(var(--bloomberg-gray)); border: 1px solid rgb(var(--bloomberg-border)); border-radius: 2px; font-size: 12px; cursor: pointer;">1D</button>
          </div>
        </div>
        <div class="widget-content">
          <div class="chart-placeholder">
            <div style="text-align: center;">
              <div class="loading"></div>
              <p style="margin-top: 16px;">Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Book Widget -->
      <div class="widget orderbook-widget">
        <div class="widget-header">
          <h3 class="widget-title">ORDER BOOK</h3>
          <div class="live-badge">
            <div class="live-dot"></div>
            LIVE
          </div>
        </div>
        <div class="widget-content">
          <table class="orderbook-table">
            <thead>
              <tr>
                <th>PRICE</th>
                <th>SIZE</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderBookRows('ask')}
              <tr>
                <td colspan="3" style="text-align: center; padding: 12px; color: rgb(var(--bloomberg-amber));">
                  MID: $65,432.21
                </td>
              </tr>
              ${generateOrderBookRows('bid')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Additional widgets can be added here -->
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      // Initialize WebSocket connection
      const socket = io();
      
      socket.on('connect', () => {
        console.log('Connected to AlphaTerminal Bloomberg');
      });

      // Handle real-time updates
      socket.on('market-update', (data) => {
        console.log('Market update:', data);
      });

      // Tab switching
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
        });
      });
    </script>
</body>
</html>
  `.trim());
});

// API endpoints
app.get('/api/market/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      metrics: {
        totalMarketCap: 2480000000000,
        totalVolume24h: 98700000000,
        btcDominance: 48.5,
        ethDominance: 18.2,
        fearGreedIndex: 65,
        activeCoins: 25847,
        marketCapChange24h: 2.45,
        volumeChange24h: -3.21
      },
      topCryptos: [
        { symbol: 'BTC', name: 'Bitcoin', price: 65432.21, priceChange24h: 2.45, marketCap: 1280000000000 },
        { symbol: 'ETH', name: 'Ethereum', price: 3456.78, priceChange24h: 3.21, marketCap: 415000000000 },
        { symbol: 'BNB', name: 'Binance Coin', price: 567.89, priceChange24h: -1.23, marketCap: 87000000000 },
      ]
    }
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send initial data
  socket.emit('connected', { 
    message: 'Welcome to AlphaTerminal Bloomberg',
    timestamp: new Date()
  });
  
  // Simulate real-time updates
  const interval = setInterval(() => {
    socket.emit('market-update', {
      symbol: 'BTC-USD',
      price: 65432.21 + (Math.random() - 0.5) * 100,
      change: (Math.random() - 0.5) * 5,
      volume: 98700000000 + (Math.random() - 0.5) * 1000000000,
      timestamp: new Date()
    });
  }, 2000);
  
  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected:', socket.id);
  });
});

// Helper functions for HTML generation
function generateTickerItems() {
  const items = [
    { symbol: 'BTC', price: 65432.21, change: 2.45 },
    { symbol: 'ETH', price: 3456.78, change: 3.21 },
    { symbol: 'BNB', price: 567.89, change: -1.23 },
    { symbol: 'XRP', price: 0.6543, change: 1.87 },
    { symbol: 'SOL', price: 145.67, change: 5.43 },
    { symbol: 'ADA', price: 0.4567, change: -2.34 },
    { symbol: 'AVAX', price: 38.90, change: 4.12 },
    { symbol: 'DOGE', price: 0.1234, change: -0.98 },
    { symbol: 'DOT', price: 7.89, change: 2.76 },
    { symbol: 'MATIC', price: 0.8901, change: -1.45 }
  ];
  
  return items.map(item => `
    <div class="ticker-item">
      <span class="ticker-symbol">${item.symbol}</span>
      <span class="ticker-price">$${item.price.toLocaleString()}</span>
      <span class="ticker-change ${item.change >= 0 ? 'positive' : 'negative'}">
        ${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}%
      </span>
    </div>
  `).join('');
}

function generateOrderBookRows(type) {
  const rows = [];
  const basePrice = 65432.21;
  
  for (let i = 0; i < 5; i++) {
    const offset = (i + 1) * 10;
    const price = type === 'ask' ? basePrice + offset : basePrice - offset;
    const size = (Math.random() * 10).toFixed(4);
    const total = (parseFloat(size) * price).toFixed(2);
    
    rows.push(`
      <tr>
        <td style="color: ${type === 'ask' ? 'rgb(var(--bloomberg-red))' : 'rgb(var(--bloomberg-green))'}">
          $${price.toFixed(2)}
        </td>
        <td>${size}</td>
        <td>${total}</td>
      </tr>
    `);
  }
  
  return type === 'ask' ? rows.reverse().join('') : rows.join('');
}

// Start server
const PORT = process.env.PORT || 3337;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   AlphaTerminal Bloomberg Dashboard                           ║
║   Professional Crypto Analytics Platform                      ║
║                                                               ║
║   🚀 Server running at http://localhost:${PORT}              ║
║   🔌 WebSocket ready for real-time updates                    ║
║   📊 Bloomberg-style UI active                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});