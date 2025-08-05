import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { marketDataRouter } from './routes/market-data';
import { portfolioRouter } from './routes/portfolio';
import { newsRouter } from './routes/news';
import { authRouter } from './routes/auth';
import { WebSocketHandler } from './websocket/websocket-handler';
import { CoinGeckoService } from './services/coingecko-service';
import { RedisCache } from './services/redis-cache';
import { logger } from './utils/logger';

// Load environment variables
config();

// Initialize services
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
});

// Initialize cache and services
const cache = new RedisCache({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const coinGeckoService = new CoinGeckoService(
  process.env.COINGECKO_PRO_API_KEY!,
  cache
);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for WebSocket
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API Routes
app.use('/api/market', marketDataRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/news', newsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  const metrics = {
    websocket: {
      connected: io.engine.clientsCount,
      rooms: io.of('/').adapter.rooms.size,
    },
    cache: await cache.getStats(),
    api: {
      requestsPerMinute: 0, // Implement with prometheus
    },
  };
  res.json(metrics);
});

// Initialize WebSocket handler
const wsHandler = new WebSocketHandler(io, coinGeckoService);
wsHandler.initialize();

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  logger.info(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   AlphaTerminal API Gateway                                   ║
    ║   Bloomberg-Style Crypto Analytics Platform                   ║
    ║                                                               ║
    ║   🚀 Server running at http://${HOST}:${PORT}               ║
    ║   🔌 WebSocket ready for connections                          ║
    ║   📊 Real-time market data streaming enabled                  ║
    ║   🔐 API Key: ${process.env.COINGECKO_PRO_API_KEY ? '✓ Configured' : '✗ Missing'}              ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket connections
  io.close(() => {
    logger.info('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close cache connection
  await cache.disconnect();
  
  process.exit(0);
});

export { app, server, io };