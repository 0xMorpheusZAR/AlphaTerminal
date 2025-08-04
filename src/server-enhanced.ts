/**
 * @fileoverview Enhanced AlphaTerminal server with advanced architecture
 * @module ServerEnhanced
 * @version 4.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';

// Import services
import { ServiceRegistry, ServiceState } from './services/ServiceRegistry';
import { CacheService } from './services/CacheService';
import { RateLimitService } from './services/RateLimitService';
import { WebSocketService } from './services/WebSocketService';
import { DatabaseService } from './services/DatabaseService';
import { CircuitBreakerService } from './services/CircuitBreakerService';
import { DataAggregationService } from './services/DataAggregationService';
import { CoinGeckoProService } from './services/CoinGeckoProService';
import { MarketDataAggregator } from './services/MarketDataAggregator';

// Load environment variables
dotenv.config();

/**
 * Enhanced server configuration
 */
interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  corsOrigins: string[];
  apiKeys: {
    coinGecko: string;
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
    database?: {
      type: 'postgres' | 'mysql' | 'sqlite';
      url: string;
    };
  };
  features: {
    cache: boolean;
    rateLimit: boolean;
    websocket: boolean;
    database: boolean;
    monitoring: boolean;
  };
}

/**
 * Enhanced AlphaTerminal Server
 */
export class AlphaTerminalServer {
  private app: express.Application;
  private httpServer: http.Server;
  private logger: winston.Logger;
  private serviceRegistry: ServiceRegistry;
  private config: ServerConfig;
  private isShuttingDown: boolean = false;
  
  constructor(config: Partial<ServerConfig> = {}) {
    // Initialize configuration
    this.config = this.initializeConfig(config);
    
    // Initialize logger
    this.logger = this.createLogger();
    
    // Initialize express app
    this.app = express();
    this.httpServer = http.createServer(this.app);
    
    // Initialize service registry
    this.serviceRegistry = ServiceRegistry.getInstance(this.logger);
    
    // Setup server
    this.setupMiddleware();
    this.setupServices();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }
  
  /**
   * Initialize server configuration
   */
  private initializeConfig(config: Partial<ServerConfig>): ServerConfig {
    return {
      port: config.port || parseInt(process.env.PORT || '3337'),
      host: config.host || process.env.HOST || '0.0.0.0',
      environment: config.environment || process.env.NODE_ENV || 'production',
      corsOrigins: config.corsOrigins || [
        'http://localhost:3000',
        'http://localhost:3337',
        'https://alphaterminal.com'
      ],
      apiKeys: {
        coinGecko: process.env.COINGECKO_PRO_API_KEY || '',
        redis: process.env.REDIS_URL ? {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD
        } : undefined,
        database: process.env.DATABASE_URL ? {
          type: (process.env.DATABASE_TYPE as any) || 'postgres',
          url: process.env.DATABASE_URL
        } : undefined,
        ...config.apiKeys
      },
      features: {
        cache: config.features?.cache ?? true,
        rateLimit: config.features?.rateLimit ?? true,
        websocket: config.features?.websocket ?? true,
        database: config.features?.database ?? false,
        monitoring: config.features?.monitoring ?? true,
        ...config.features
      }
    };
  }
  
  /**
   * Create Winston logger
   */
  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );
    
    return winston.createLogger({
      level: this.config.environment === 'production' ? 'info' : 'debug',
      format: logFormat,
      defaultMeta: { service: 'alpha-terminal' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });
  }
  
  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:']
        }
      }
    }));
    
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    if (this.config.features.monitoring) {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => this.logger.info(message.trim())
        }
      }));
    }
    
    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Request ID
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }
  
  /**
   * Setup services
   */
  private async setupServices(): Promise<void> {
    try {
      // Cache Service
      if (this.config.features.cache) {
        const cacheService = new CacheService({
          name: 'CacheService',
          enabled: true,
          config: {},
          redis: this.config.apiKeys.redis,
          memory: {
            max: 500,
            ttl: 300,
            updateAgeOnGet: true
          },
          defaultTTL: 300,
          keyPrefix: 'alpha'
        }, this.logger);
        
        this.serviceRegistry.register(cacheService);
      }
      
      // Rate Limit Service
      if (this.config.features.rateLimit) {
        const cacheService = this.serviceRegistry.has('CacheService') 
          ? this.serviceRegistry.get<CacheService>('CacheService')
          : undefined;
        
        const rateLimitService = new RateLimitService({
          name: 'RateLimitService',
          enabled: true,
          config: {},
          strategies: {
            api: {
              type: 'sliding-window',
              windowMs: 60000,
              maxRequests: 100
            },
            websocket: {
              type: 'fixed-window',
              windowMs: 60000,
              maxRequests: 10
            },
            heavy: {
              type: 'token-bucket',
              windowMs: 60000,
              maxRequests: 10,
              burst: 5,
              refillRate: 1
            }
          }
        }, this.logger, cacheService!);
        
        this.serviceRegistry.register(rateLimitService);
      }
      
      // Database Service
      if (this.config.features.database && this.config.apiKeys.database) {
        const databaseService = new DatabaseService({
          name: 'DatabaseService',
          enabled: true,
          config: {},
          type: this.config.apiKeys.database.type,
          database: 'alphaterminal',
          synchronize: this.config.environment !== 'production',
          logging: this.config.environment !== 'production',
          entities: ['src/entities/**/*.ts'],
          migrations: ['src/migrations/**/*.ts']
        }, this.logger);
        
        this.serviceRegistry.register(databaseService);
      }
      
      // Circuit Breaker Service
      const circuitBreakerService = new CircuitBreakerService({
        name: 'CircuitBreakerService',
        enabled: true,
        config: {},
        breakers: {
          coingecko: {
            failureThreshold: 5,
            resetTimeout: 60000,
            timeout: 5000
          },
          external: {
            failureThreshold: 3,
            resetTimeout: 30000,
            timeout: 3000
          }
        }
      }, this.logger);
      
      this.serviceRegistry.register(circuitBreakerService);
      
      // WebSocket Service
      if (this.config.features.websocket) {
        const rateLimitService = this.serviceRegistry.has('RateLimitService')
          ? this.serviceRegistry.get<RateLimitService>('RateLimitService')
          : undefined;
        
        const cacheService = this.serviceRegistry.has('CacheService')
          ? this.serviceRegistry.get<CacheService>('CacheService')
          : undefined;
        
        const websocketService = new WebSocketService({
          name: 'WebSocketService',
          enabled: true,
          config: {},
          cors: {
            origin: this.config.corsOrigins,
            credentials: true
          },
          authentication: {
            enabled: false
          }
        }, this.logger, this.httpServer, rateLimitService, cacheService);
        
        this.serviceRegistry.register(websocketService);
      }
      
      // Data Aggregation Service
      const cacheService = this.serviceRegistry.has('CacheService')
        ? this.serviceRegistry.get<CacheService>('CacheService')
        : undefined;
      
      const websocketService = this.serviceRegistry.has('WebSocketService')
        ? this.serviceRegistry.get<WebSocketService>('WebSocketService')
        : undefined;
      
      const dataAggregationService = new DataAggregationService({
        name: 'DataAggregationService',
        enabled: true,
        config: {},
        aggregators: {
          ohlcv: {
            type: 'time-series',
            interval: 60000,
            operations: [
              { field: 'price', operation: 'avg', alias: 'avgPrice' },
              { field: 'volume', operation: 'sum', alias: 'totalVolume' }
            ]
          },
          stats: {
            type: 'statistical',
            operations: [
              { field: 'price', operation: 'min' },
              { field: 'price', operation: 'max' },
              { field: 'price', operation: 'avg' },
              { field: 'price', operation: 'stddev' }
            ]
          }
        },
        transformers: {
          priceFormatter: {
            type: 'map',
            mapFunction: (item: any) => ({
              ...item,
              price: parseFloat(item.price).toFixed(2),
              timestamp: new Date(item.timestamp).toISOString()
            })
          }
        },
        pipelines: {
          marketData: {
            source: 'coingecko',
            stages: [
              { type: 'transformer', name: 'priceFormatter' },
              { type: 'aggregator', name: 'stats' }
            ],
            destination: 'websocket'
          }
        }
      }, this.logger, cacheService, websocketService);
      
      this.serviceRegistry.register(dataAggregationService);
      
      // CoinGecko Service
      const coinGeckoService = new CoinGeckoProService({
        apiKey: this.config.apiKeys.coinGecko,
        timeout: 10000,
        maxRetries: 3,
        cacheEnabled: true
      });
      
      // Market Data Aggregator
      const marketDataAggregator = new MarketDataAggregator(
        coinGeckoService,
        this.logger,
        cacheService
      );
      
      // Store in registry
      (this.serviceRegistry as any).marketDataAggregator = marketDataAggregator;
      
      // Initialize all services
      await this.serviceRegistry.initializeAll();
      await this.serviceRegistry.startAll();
      
      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services:', error);
      throw error;
    }
  }
  
  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const router = express.Router();
    
    // Health check
    router.get('/health', async (req: Request, res: Response) => {
      const health = await this.serviceRegistry.healthCheckAll();
      
      const overallStatus = Object.values(health).every(h => h.status === 'healthy')
        ? 'healthy'
        : Object.values(health).some(h => h.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';
      
      res.status(overallStatus === 'healthy' ? 200 : 503).json({
        status: overallStatus,
        timestamp: new Date(),
        services: health
      });
    });
    
    // Market overview
    router.get('/market/overview', this.createRateLimitedRoute('api'), async (req: Request, res: Response) => {
      try {
        const aggregator = (this.serviceRegistry as any).marketDataAggregator;
        if (!aggregator) {
          throw new Error('Market data aggregator not available');
        }
        
        const data = await aggregator.getMarketOverview();
        
        res.json({
          success: true,
          data,
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error('Market overview error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch market overview'
        });
      }
    });
    
    // Market data
    router.get('/market/data', this.createRateLimitedRoute('api'), async (req: Request, res: Response) => {
      try {
        const { symbols, metrics } = req.query;
        const aggregator = (this.serviceRegistry as any).marketDataAggregator;
        
        if (!aggregator) {
          throw new Error('Market data aggregator not available');
        }
        
        const data = await aggregator.getMarketData({
          symbols: symbols ? String(symbols).split(',') : undefined,
          metrics: metrics ? String(metrics).split(',') : undefined
        });
        
        res.json({
          success: true,
          data,
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error('Market data error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch market data'
        });
      }
    });
    
    // Apply routes
    this.app.use('/api', router);
    
    // Fallback to serve React app
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }
  
  /**
   * Create rate limited route
   */
  private createRateLimitedRoute(strategy: string) {
    if (!this.config.features.rateLimit) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }
    
    const rateLimitService = this.serviceRegistry.get<RateLimitService>('RateLimitService');
    return rateLimitService.createMiddleware(strategy);
  }
  
  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.path
      });
    });
    
    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error:', err);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: this.config.environment === 'production' 
          ? 'An unexpected error occurred'
          : err.message,
        requestId: req.id
      });
    });
  }
  
  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // Stop accepting new connections
      this.httpServer.close(() => {
        this.logger.info('HTTP server closed');
      });
      
      // Stop all services
      try {
        await this.serviceRegistry.stopAll();
        this.logger.info('All services stopped');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
  }
  
  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        this.logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   █████╗ ██╗     ██████╗ ██╗  ██╗ █████╗                    ║
║  ██╔══██╗██║     ██╔══██╗██║  ██║██╔══██╗                   ║
║  ███████║██║     ██████╔╝███████║███████║                   ║
║  ██╔══██║██║     ██╔═══╝ ██╔══██║██╔══██║                   ║
║  ██║  ██║███████╗██║     ██║  ██║██║  ██║                   ║
║  ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝                   ║
║                                                               ║
║  TERMINAL v4.0 - Enhanced Architecture                        ║
║                                                               ║
║  🚀 Server running at http://${this.config.host}:${this.config.port}        ║
║  🌍 Environment: ${this.config.environment.padEnd(28)}     ║
║  📊 Features:                                                 ║
║     Cache: ${this.config.features.cache ? '✓' : '✗'}  Rate Limit: ${this.config.features.rateLimit ? '✓' : '✗'}  WebSocket: ${this.config.features.websocket ? '✓' : '✗'}       ║
║     Database: ${this.config.features.database ? '✓' : '✗'}  Monitoring: ${this.config.features.monitoring ? '✓' : '✗'}                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        resolve();
      });
    });
  }
  
  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await this.setupGracefulShutdown();
  }
}

// Create and start server if run directly
if (require.main === module) {
  const server = new AlphaTerminalServer();
  
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Export for use as module
export default AlphaTerminalServer;