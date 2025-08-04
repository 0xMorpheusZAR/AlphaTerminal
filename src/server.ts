import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import dotenv from 'dotenv';
import { alphaTerminal } from './AlphaTerminal';
import { CryptoDataService } from './services/CryptoDataService';
import { MarketService } from './services/MarketService';
import { WhaleService } from './services/WhaleService';
import { TradingService } from './services/TradingService';
import { CoinGeckoProService } from './services/CoinGeckoProService';
import { MarketDataAggregator } from './services/MarketDataAggregator';
import marketRoutes from './routes/market.routes';
import defiRoutes from './routes/defi.routes';
import whaleRoutes from './routes/whale.routes';
import portfolioRoutes from './routes/portfolio.routes';
import tradingRoutes from './routes/trading.routes';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  let rateLimit = rateLimitMap.get(ip);
  if (!rateLimit || now > rateLimit.resetTime) {
    rateLimit = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, rateLimit);
  }

  rateLimit.count++;
  
  if (rateLimit.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  
  next();
});

// Initialize AlphaTerminal
alphaTerminal.initialize().catch(error => {
  logger.error('Failed to initialize AlphaTerminal', error);
  process.exit(1);
});


// API Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Mount route modules
app.use('/api/market', marketRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/whale', whaleRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trading', tradingRoutes);

// Legacy routes for backward compatibility
app.get('/api/market/overview', async (_req, res) => {
  try {
    const overview = await alphaTerminal.getMarketOverview();
    res.json(overview);
  } catch (error) {
    logger.error('Failed to get market overview', error);
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
});

app.post('/api/analyze/token', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) {
      res.status(400).json({ error: 'Symbol is required' });
      return;
    }
    
    const analysis = await alphaTerminal.analyzeToken(symbol);
    res.json(analysis);
  } catch (error) {
    logger.error('Failed to analyze token', error);
    res.status(500).json({ error: 'Failed to analyze token' });
  }
});

app.post('/api/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ error: 'Command is required' });
      return;
    }
    
    const result = await alphaTerminal.executeCommand(command);
    res.json(result);
  } catch (error) {
    logger.error('Failed to execute command', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// ==================== COMPREHENSIVE MARKET DATA API ====================

// Get complete market data with all CoinGecko Pro features
app.get('/api/v2/market/comprehensive', async (_req, res) => {
  try {
    const data = await marketDataAggregator.getComprehensiveMarketData();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get comprehensive market data', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comprehensive market data' });
  }
});

// CoinGecko Pro API endpoints
app.get('/api/v2/coingecko/prices', async (req, res) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;
    const idsArray = typeof ids === 'string' ? ids.split(',') : ['bitcoin', 'ethereum'];
    const currenciesArray = typeof vs_currencies === 'string' ? vs_currencies.split(',') : ['usd'];
    
    const prices = await coinGeckoProService.getSimplePrices(idsArray, currenciesArray);
    res.json({ success: true, data: prices });
  } catch (error) {
    logger.error('Failed to get CoinGecko prices', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prices' });
  }
});

app.get('/api/v2/coingecko/markets', async (req, res) => {
  try {
    const { 
      vs_currency = 'usd', 
      ids,
      category,
      order = 'market_cap_desc',
      per_page = 100,
      page = 1,
      sparkline = false
    } = req.query;
    
    const options = {
      ids: typeof ids === 'string' ? ids.split(',') : undefined,
      category: category as string,
      order: order as string,
      perPage: Number(per_page),
      page: Number(page),
      sparkline: sparkline === 'true'
    };
    
    const markets = await coinGeckoProService.getCoinsMarkets(vs_currency as string, options);
    res.json({ success: true, data: markets });
  } catch (error) {
    logger.error('Failed to get CoinGecko markets', error);
    res.status(500).json({ success: false, error: 'Failed to fetch markets' });
  }
});

app.get('/api/v2/coingecko/exchanges', async (req, res) => {
  try {
    const { per_page = 50, page = 1 } = req.query;
    const exchanges = await coinGeckoProService.getExchanges(Number(per_page), Number(page));
    res.json({ success: true, data: exchanges });
  } catch (error) {
    logger.error('Failed to get exchanges', error);
    res.status(500).json({ success: false, error: 'Failed to fetch exchanges' });
  }
});

app.get('/api/v2/coingecko/derivatives', async (req, res) => {
  try {
    const { include_tickers } = req.query;
    const derivatives = await coinGeckoProService.getDerivatives(include_tickers as string);
    res.json({ success: true, data: derivatives });
  } catch (error) {
    logger.error('Failed to get derivatives', error);
    res.status(500).json({ success: false, error: 'Failed to fetch derivatives' });
  }
});

app.get('/api/v2/coingecko/nfts', async (req, res) => {
  try {
    const { order, per_page = 50, page = 1 } = req.query;
    const nfts = await coinGeckoProService.getNFTsList(
      order as string,
      undefined,
      Number(per_page),
      Number(page)
    );
    res.json({ success: true, data: nfts });
  } catch (error) {
    logger.error('Failed to get NFTs', error);
    res.status(500).json({ success: false, error: 'Failed to fetch NFTs' });
  }
});

app.get('/api/v2/coingecko/trending', async (_req, res) => {
  try {
    const trending = await coinGeckoProService.getTrending();
    res.json({ success: true, data: trending });
  } catch (error) {
    logger.error('Failed to get trending', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trending data' });
  }
});

app.get('/api/v2/coingecko/global', async (_req, res) => {
  try {
    const global = await coinGeckoProService.getGlobalData();
    res.json({ success: true, data: global });
  } catch (error) {
    logger.error('Failed to get global data', error);
    res.status(500).json({ success: false, error: 'Failed to fetch global data' });
  }
});

app.get('/api/v2/coingecko/defi/networks', async (_req, res) => {
  try {
    const networks = await coinGeckoProService.getOnChainNetworks();
    res.json({ success: true, data: networks });
  } catch (error) {
    logger.error('Failed to get DeFi networks', error);
    res.status(500).json({ success: false, error: 'Failed to fetch DeFi networks' });
  }
});

app.get('/api/v2/coingecko/defi/dexes', async (req, res) => {
  try {
    const { network_id, page = 1 } = req.query;
    const dexes = await coinGeckoProService.getOnChainDEXes(network_id as string, Number(page));
    res.json({ success: true, data: dexes });
  } catch (error) {
    logger.error('Failed to get DeFi DEXes', error);
    res.status(500).json({ success: false, error: 'Failed to fetch DeFi DEXes' });
  }
});

// API status and monitoring
app.get('/api/v2/coingecko/status', async (_req, res) => {
  try {
    const status = await coinGeckoProService.getAPIKeyStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Failed to get API status', error);
    res.status(500).json({ success: false, error: 'Failed to fetch API status' });
  }
});

app.get('/api/system/metrics', (_req, res) => {
  const metrics = alphaTerminal.getSystemMetrics();
  res.json(metrics);
});

app.get('/api/system/diagnostics', async (_req, res) => {
  try {
    const diagnostics = await alphaTerminal.runDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    logger.error('Failed to run diagnostics', error);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

// Initialize enhanced services
const coinGeckoProService = new CoinGeckoProService({
  apiKey: process.env.COINGECKO_API_KEY!,
  logger
});

const marketDataAggregator = new MarketDataAggregator(coinGeckoProService, logger);

// WebSocket handling
const dataService = new CryptoDataService({ logger });
const marketService = new MarketService();
const whaleService = new WhaleService();
const tradingService = new TradingService();
const connectedClients = new Map<string, Set<string>>();

// Initialize market data aggregator
marketDataAggregator.initialize().catch(error => {
  logger.error('Failed to initialize market data aggregator:', error);
});

// Set up real-time data streaming
marketDataAggregator.on('dataUpdate', (updateEvent) => {
  logger.debug(`Broadcasting data update: ${updateEvent.type}`);
  
  switch (updateEvent.type) {
    case 'price':
      io.to('market-data').emit('market-data', updateEvent.data);
      io.to('comprehensive-data').emit('price-update', updateEvent.data);
      break;
      
    case 'derivatives':
      io.to('derivatives-data').emit('derivatives-data', updateEvent.data);
      break;
      
    case 'nft':
      io.to('nft-data').emit('nft-data', updateEvent.data);
      break;
      
    case 'defi':
      io.to('defi-data').emit('defi-data', updateEvent.data);
      break;
      
    case 'market_cap':
      io.to('market-metrics').emit('market-metrics', updateEvent.data);
      break;
  }
});

io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on('subscribe', async (data: { channel: string; params?: any }) => {
    const { channel, params } = data;
    
    // Track subscriptions
    if (!connectedClients.has(socket.id)) {
      connectedClients.set(socket.id, new Set());
    }
    connectedClients.get(socket.id)!.add(channel);
    
    socket.join(channel);
    logger.info(`Socket ${socket.id} subscribed to ${channel}`);

    // Send initial data based on channel
    try {
      switch (channel) {
        case 'market-data':
          const marketData = await dataService.getMarketData(params?.symbols);
          socket.emit('market-data', marketData);
          break;
          
        case 'market-metrics':
          const metrics = await dataService.getMarketMetrics();
          socket.emit('market-metrics', metrics);
          break;
          
        case 'comprehensive-data':
          const comprehensiveData = await marketDataAggregator.getComprehensiveMarketData();
          socket.emit('comprehensive-data', comprehensiveData);
          break;
          
        case 'derivatives-data':
          const derivatives = await coinGeckoProService.getDerivatives();
          socket.emit('derivatives-data', derivatives);
          break;
          
        case 'nft-data':
          const nfts = await coinGeckoProService.getNFTsList();
          socket.emit('nft-data', nfts.slice(0, 20));
          break;
          
        case 'trending-data':
          const trending = await coinGeckoProService.getTrending();
          socket.emit('trending-data', trending);
          break;
          
        case 'defi-data':
          const networks = await coinGeckoProService.getOnChainNetworks();
          const dexes = await coinGeckoProService.getOnChainDEXes();
          socket.emit('defi-data', { networks, dexes: dexes.data || [] });
          break;
          
        case 'exchanges-data':
          const exchanges = await coinGeckoProService.getExchanges(50, 1);
          socket.emit('exchanges-data', exchanges);
          break;
          
        case 'anomalies':
          const anomalies = await dataService.detectMarketAnomalies();
          socket.emit('anomalies', anomalies);
          break;
          
        case 'orderbook':
          if (params?.symbol) {
            const orderbook = await marketService.getOrderBook(params.symbol, 20);
            socket.emit('orderbook', orderbook);
          }
          break;
          
        case 'trades':
          if (params?.symbol) {
            const trades = await marketService.getTradeHistory(params.symbol, 50);
            socket.emit('trades', trades);
          }
          break;
          
        case 'whale-transactions':
          const whaleData = await whaleService.getRecentWhaleTransactions();
          socket.emit('whale-transactions', whaleData);
          break;
          
        case 'trading-signals':
          const signals = await tradingService.getLatestSignals();
          socket.emit('trading-signals', signals);
          break;
          
        case 'technical-indicators':
          if (params?.symbol) {
            const indicators = await marketService.getTechnicalIndicators(params.symbol);
            socket.emit('technical-indicators', indicators);
          }
          break;
      }
    } catch (error) {
      logger.error(`Failed to send initial data for ${channel}`, error);
      socket.emit('error', { channel, error: 'Failed to fetch data' });
    }
  });

  socket.on('unsubscribe', (data: { channel: string }) => {
    const { channel } = data;
    socket.leave(channel);
    
    const channels = connectedClients.get(socket.id);
    if (channels) {
      channels.delete(channel);
    }
    
    logger.info(`Socket ${socket.id} unsubscribed from ${channel}`);
  });

  socket.on('command', async (data: { command: string }) => {
    try {
      const result = await alphaTerminal.executeCommand(data.command);
      socket.emit('command-result', result);
    } catch (error) {
      logger.error('Command execution failed', error);
      socket.emit('command-error', { error: 'Command execution failed' });
    }
  });

  socket.on('place-order', async (data: any) => {
    try {
      // Simulate order placement
      const order = {
        id: `order_${Date.now()}`,
        ...data,
        status: 'pending',
        timestamp: new Date()
      };
      socket.emit('order-placed', order);
      
      // Simulate order execution after delay
      setTimeout(() => {
        order.status = 'filled';
        socket.emit('order-update', order);
      }, Math.random() * 3000 + 1000);
    } catch (error) {
      logger.error('Order placement failed', error);
      socket.emit('order-error', { error: 'Order placement failed' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Socket ${socket.id} disconnected`);
    connectedClients.delete(socket.id);
  });
});

// Real-time data broadcasting
const BROADCAST_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000');

setInterval(async () => {
  try {
    // Broadcast market data updates
    const marketData = await dataService.getMarketData();
    io.to('market-data').emit('market-data', marketData);

    // Broadcast metrics updates
    const metrics = await dataService.getMarketMetrics();
    io.to('market-metrics').emit('market-metrics', metrics);

    // Broadcast anomalies
    const anomalies = await dataService.detectMarketAnomalies();
    io.to('anomalies').emit('anomalies', anomalies);

  } catch (error) {
    logger.error('Failed to broadcast updates', error);
  }
}, BROADCAST_INTERVAL);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close WebSocket connections
    io.close(() => {
      logger.info('WebSocket server closed');
      
      // Shutdown AlphaTerminal
      alphaTerminal.shutdown();
      
      process.exit(0);
    });
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');
// const WS_PORT = parseInt(process.env.WS_PORT || '3001');

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server available on same port`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io };