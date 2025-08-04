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

app.get('/api/market/overview', async (_req, res) => {
  try {
    const overview = await alphaTerminal.getMarketOverview();
    res.json(overview);
  } catch (error) {
    logger.error('Failed to get market overview', error);
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
});

app.get(['/api/market/data/:symbol', '/api/market/data'], async (req, res) => {
  try {
    const dataService = new CryptoDataService({ logger });
    const symbols = req.params.symbol ? [req.params.symbol] : undefined;
    const data = await dataService.getMarketData(symbols);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get market data', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

app.get('/api/market/metrics', async (_req, res) => {
  try {
    const dataService = new CryptoDataService({ logger });
    const metrics = await dataService.getMarketMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get market metrics', error);
    res.status(500).json({ error: 'Failed to fetch market metrics' });
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

// WebSocket handling
const dataService = new CryptoDataService({ logger });
const connectedClients = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on('subscribe', async (data: { channel: string; symbols?: string[] }) => {
    const { channel, symbols } = data;
    
    // Track subscriptions
    if (!connectedClients.has(socket.id)) {
      connectedClients.set(socket.id, new Set());
    }
    connectedClients.get(socket.id)!.add(channel);
    
    socket.join(channel);
    logger.info(`Socket ${socket.id} subscribed to ${channel}`);

    // Send initial data
    try {
      switch (channel) {
        case 'market-data':
          const marketData = await dataService.getMarketData(symbols);
          socket.emit('market-data', marketData);
          break;
        case 'market-metrics':
          const metrics = await dataService.getMarketMetrics();
          socket.emit('market-metrics', metrics);
          break;
        case 'anomalies':
          const anomalies = await dataService.detectMarketAnomalies();
          socket.emit('anomalies', anomalies);
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