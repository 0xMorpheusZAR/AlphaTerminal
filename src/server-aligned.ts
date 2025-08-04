/**
 * @fileoverview AlphaTerminal server with frontend-backend alignment
 * @module ServerAligned
 * @version 4.0.0
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import dotenv from 'dotenv';

// Import services
import { 
    CoinGeckoProService, 
    MarketDataAggregator 
} from './services/MarketDataExtensions';

// Import aligned components
import { createAPIRoutes } from './routes/api.routes';
import { WebSocketHandler } from './websocket/websocket-handler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:']
        }
    }
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const coinGeckoService = new CoinGeckoProService({
    apiKey: process.env.COINGECKO_PRO_API_KEY || '',
    timeout: 10000
});

const marketAggregator = new MarketDataAggregator(
    coinGeckoService,
    logger
);

// Initialize WebSocket handler
const websocketHandler = new WebSocketHandler(
    io,
    logger,
    coinGeckoService,
    marketAggregator
);

// API Routes
const apiRoutes = createAPIRoutes(coinGeckoService, marketAggregator, logger);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Fallback route for React app
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
});

// Start server
const PORT = process.env.PORT || 3337;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   █████╗ ██╗     ██████╗ ██╗  ██╗ █████╗                    ║
║  ██╔══██╗██║     ██╔══██╗██║  ██║██╔══██╗                   ║
║  ███████║██║     ██████╔╝███████║███████║                   ║
║  ██╔══██║██║     ██╔═══╝ ██╔══██║██╔══██║                   ║
║  ██║  ██║███████╗██║     ██║  ██║██║  ██║                   ║
║  ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝                   ║
║                                                               ║
║  TERMINAL v4.0 - Frontend-Backend Aligned                     ║
║                                                               ║
║  🚀 Server running at http://localhost:${PORT}              ║
║  🔌 WebSocket server ready                                    ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                               ║
║  API Endpoints:                                               ║
║  - GET /api/market/global                                     ║
║  - GET /api/market/overview                                   ║
║  - GET /api/defi/protocols                                    ║
║  - GET /api/derivatives/exchanges                             ║
║  - GET /api/nfts/list                                         ║
║                                                               ║
║  WebSocket Events:                                            ║
║  - market-data                                                ║
║  - comprehensive-data                                         ║
║  - derivatives-data                                           ║
║  - nft-data                                                   ║
║  - defi-data                                                  ║
║  - trending-data                                              ║
║  - exchanges-data                                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    websocketHandler.stopAllUpdates();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    websocketHandler.stopAllUpdates();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

export default server;