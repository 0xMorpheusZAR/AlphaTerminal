/**
 * @fileoverview Enhanced WebSocket service for real-time data streaming
 * @module WebSocketService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { RateLimitService } from './RateLimitService';
import { CacheService } from './CacheService';
import jwt from 'jsonwebtoken';

/**
 * WebSocket configuration
 */
export interface WebSocketConfig extends ServiceConfig {
  cors?: {
    origin: string | string[];
    methods?: string[];
    credentials?: boolean;
  };
  pingTimeout?: number;
  pingInterval?: number;
  maxHttpBufferSize?: number;
  transports?: string[];
  authentication?: {
    enabled: boolean;
    secret?: string;
    timeout?: number;
  };
  rooms?: {
    maxRoomsPerClient: number;
    maxClientsPerRoom: number;
  };
}

/**
 * Client metadata
 */
interface ClientMetadata {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
  subscriptions: Map<string, SubscriptionOptions>;
  authenticated: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Subscription options
 */
interface SubscriptionOptions {
  channel: string;
  filters?: Record<string, any>;
  throttle?: number;
  aggregation?: 'none' | 'batch' | 'sample';
  batchSize?: number;
  sampleRate?: number;
}

/**
 * Channel handler
 */
interface ChannelHandler {
  validate?: (data: any) => boolean;
  transform?: (data: any) => any;
  authorize?: (socket: Socket, options: SubscriptionOptions) => Promise<boolean>;
  onSubscribe?: (socket: Socket, options: SubscriptionOptions) => Promise<void>;
  onUnsubscribe?: (socket: Socket, options: SubscriptionOptions) => Promise<void>;
}

/**
 * Enhanced WebSocket service
 */
export class WebSocketService extends BaseService {
  private io?: SocketIOServer;
  private httpServer?: HTTPServer;
  private clients: Map<string, ClientMetadata> = new Map();
  private channels: Map<string, Set<string>> = new Map(); // channel -> client ids
  private channelHandlers: Map<string, ChannelHandler> = new Map();
  private broadcastQueue: Map<string, any[]> = new Map();
  private wsConfig: WebSocketConfig;
  private rateLimitService?: RateLimitService;
  private cacheService?: CacheService;
  
  constructor(
    config: WebSocketConfig,
    logger: Logger,
    httpServer?: HTTPServer,
    rateLimitService?: RateLimitService,
    cacheService?: CacheService
  ) {
    super('WebSocketService', config, logger);
    this.dependencies = [];
    this.wsConfig = config;
    this.httpServer = httpServer;
    this.rateLimitService = rateLimitService;
    this.cacheService = cacheService;
    
    if (rateLimitService) {
      this.dependencies.push('RateLimitService');
    }
    if (cacheService) {
      this.dependencies.push('CacheService');
    }
  }
  
  /**
   * Initialize WebSocket service
   */
  protected async onInitialize(): Promise<void> {
    if (!this.httpServer) {
      throw new Error('HTTP server required for WebSocket service');
    }
    
    // Create Socket.IO server
    this.io = new SocketIOServer(this.httpServer, {
      cors: this.wsConfig.cors,
      pingTimeout: this.wsConfig.pingTimeout || 60000,
      pingInterval: this.wsConfig.pingInterval || 25000,
      maxHttpBufferSize: this.wsConfig.maxHttpBufferSize || 1e6,
      transports: this.wsConfig.transports || ['websocket', 'polling']
    });
    
    // Set up middleware
    this.setupMiddleware();
    
    // Set up connection handler
    this.io.on('connection', this.handleConnection.bind(this));
    
    // Set up broadcast queue processor
    setInterval(() => {
      this.processBroadcastQueue();
    }, 100); // Process every 100ms
    
    // Set up cleanup interval
    setInterval(() => {
      this.cleanupInactiveClients();
    }, 60000); // Every minute
    
    // Register default channel handlers
    this.registerDefaultHandlers();
  }
  
  /**
   * Start WebSocket service
   */
  protected async onStart(): Promise<void> {
    this.logger.info('WebSocket service started');
  }
  
  /**
   * Stop WebSocket service
   */
  protected async onStop(): Promise<void> {
    if (this.io) {
      // Disconnect all clients
      for (const [, client] of this.clients) {
        const socket = this.io.sockets.sockets.get(client.id);
        if (socket) {
          socket.disconnect(true);
        }
      }
      
      // Close server
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          this.logger.info('WebSocket server closed');
          resolve();
        });
      });
    }
    
    this.clients.clear();
    this.channels.clear();
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    return {
      status: 'healthy',
      details: {
        connected: this.clients.size,
        channels: this.channels.size,
        engine: this.io?.engine?.clientsCount || 0
      }
    };
  }
  
  /**
   * Set up middleware
   */
  private setupMiddleware(): void {
    // Authentication middleware
    if (this.wsConfig.authentication?.enabled) {
      this.io!.use(async (socket, next) => {
        try {
          const token = socket.handshake.auth.token;
          
          if (!token) {
            return next(new Error('Authentication required'));
          }
          
          // Verify token
          const decoded = jwt.verify(
            token,
            this.wsConfig.authentication!.secret!
          ) as any;
          
          socket.data.userId = decoded.userId;
          socket.data.authenticated = true;
          
          next();
        } catch (error) {
          next(new Error('Invalid authentication'));
        }
      });
    }
    
    // Rate limiting middleware
    if (this.rateLimitService) {
      this.io!.use(async (socket, next) => {
        const key = socket.handshake.address;
        const allowed = await this.rateLimitService!.getInfo(key, 'websocket');
        
        if (allowed && allowed.remaining <= 0) {
          return next(new Error('Rate limit exceeded'));
        }
        
        next();
      });
    }
  }
  
  /**
   * Handle new connection
   */
  private handleConnection(socket: Socket): void {
    this.logger.info(`New WebSocket connection: ${socket.id}`);
    
    // Create client metadata
    const client: ClientMetadata = {
      id: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set(),
      subscriptions: new Map(),
      authenticated: socket.data.authenticated || false,
      userId: socket.data.userId,
      metadata: {}
    };
    
    this.clients.set(socket.id, client);
    
    // Set up event handlers
    socket.on('subscribe', (options: SubscriptionOptions) => {
      this.handleSubscribe(socket, options);
    });
    
    socket.on('unsubscribe', (channel: string) => {
      this.handleUnsubscribe(socket, channel);
    });
    
    socket.on('message', (data: any) => {
      this.handleMessage(socket, data);
    });
    
    socket.on('join', (room: string) => {
      this.handleJoinRoom(socket, room);
    });
    
    socket.on('leave', (room: string) => {
      this.handleLeaveRoom(socket, room);
    });
    
    socket.on('ping', () => {
      socket.emit('pong', Date.now());
    });
    
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(socket, reason);
    });
    
    // Send welcome message
    socket.emit('welcome', {
      id: socket.id,
      server: 'AlphaTerminal WebSocket v4.0',
      timestamp: new Date()
    });
  }
  
  /**
   * Handle subscription
   */
  private async handleSubscribe(socket: Socket, options: SubscriptionOptions): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    try {
      // Validate channel
      const handler = this.channelHandlers.get(options.channel);
      if (!handler) {
        socket.emit('error', { message: `Unknown channel: ${options.channel}` });
        return;
      }
      
      // Authorize
      if (handler.authorize) {
        const authorized = await handler.authorize(socket, options);
        if (!authorized) {
          socket.emit('error', { message: 'Unauthorized for channel' });
          return;
        }
      }
      
      // Add subscription
      client.subscriptions.set(options.channel, options);
      
      // Add to channel
      if (!this.channels.has(options.channel)) {
        this.channels.set(options.channel, new Set());
      }
      this.channels.get(options.channel)!.add(socket.id);
      
      // Call handler
      if (handler.onSubscribe) {
        await handler.onSubscribe(socket, options);
      }
      
      // Send confirmation
      socket.emit('subscribed', {
        channel: options.channel,
        timestamp: new Date()
      });
      
      this.logger.debug(`Client ${socket.id} subscribed to ${options.channel}`);
      
      // Send cached data if available
      if (this.cacheService) {
        const cachedData = await this.cacheService.get(`channel:${options.channel}:latest`);
        if (cachedData) {
          socket.emit(options.channel, cachedData);
        }
      }
    } catch (error) {
      this.logger.error('Subscription error:', error);
      socket.emit('error', { message: 'Subscription failed' });
    }
  }
  
  /**
   * Handle unsubscription
   */
  private async handleUnsubscribe(socket: Socket, channel: string): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    // Remove subscription
    client.subscriptions.delete(channel);
    
    // Remove from channel
    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(socket.id);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
      }
    }
    
    // Call handler
    const handler = this.channelHandlers.get(channel);
    if (handler?.onUnsubscribe) {
      await handler.onUnsubscribe(socket, { channel });
    }
    
    // Send confirmation
    socket.emit('unsubscribed', {
      channel,
      timestamp: new Date()
    });
    
    this.logger.debug(`Client ${socket.id} unsubscribed from ${channel}`);
  }
  
  /**
   * Handle message
   */
  private async handleMessage(socket: Socket, data: any): Promise<void> {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    client.lastActivity = new Date();
    
    // Process message based on type
    this.emit('message', {
      socketId: socket.id,
      userId: client.userId,
      data
    });
  }
  
  /**
   * Handle join room
   */
  private handleJoinRoom(socket: Socket, room: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    // Check room limits
    if (client.rooms.size >= (this.wsConfig.rooms?.maxRoomsPerClient || 10)) {
      socket.emit('error', { message: 'Room limit exceeded' });
      return;
    }
    
    socket.join(room);
    client.rooms.add(room);
    
    socket.emit('joined', { room, timestamp: new Date() });
    this.logger.debug(`Client ${socket.id} joined room ${room}`);
  }
  
  /**
   * Handle leave room
   */
  private handleLeaveRoom(socket: Socket, room: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    socket.leave(room);
    client.rooms.delete(room);
    
    socket.emit('left', { room, timestamp: new Date() });
    this.logger.debug(`Client ${socket.id} left room ${room}`);
  }
  
  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;
    
    // Remove from all channels
    for (const [channel] of client.subscriptions) {
      const channelClients = this.channels.get(channel);
      if (channelClients) {
        channelClients.delete(socket.id);
        if (channelClients.size === 0) {
          this.channels.delete(channel);
        }
      }
    }
    
    // Remove client
    this.clients.delete(socket.id);
    
    this.logger.info(`Client disconnected: ${socket.id} (${reason})`);
  }
  
  /**
   * Broadcast to channel
   */
  async broadcast(channel: string, data: any, options?: {
    room?: string;
    except?: string[];
    volatile?: boolean;
  }): Promise<void> {
    const handler = this.channelHandlers.get(channel);
    
    // Validate data
    if (handler?.validate && !handler.validate(data)) {
      this.logger.warn(`Invalid data for channel ${channel}`);
      return;
    }
    
    // Transform data
    const transformedData = handler?.transform ? handler.transform(data) : data;
    
    // Cache latest data
    if (this.cacheService) {
      await this.cacheService.set(`channel:${channel}:latest`, transformedData, 300);
    }
    
    // Add to broadcast queue
    if (!this.broadcastQueue.has(channel)) {
      this.broadcastQueue.set(channel, []);
    }
    this.broadcastQueue.get(channel)!.push({ data: transformedData, options });
  }
  
  /**
   * Process broadcast queue
   */
  private processBroadcastQueue(): void {
    for (const [channel, queue] of this.broadcastQueue) {
      if (queue.length === 0) continue;
      
      const channelClients = this.channels.get(channel);
      if (!channelClients || channelClients.size === 0) {
        queue.length = 0;
        continue;
      }
      
      // Process queue
      while (queue.length > 0) {
        const { data, options } = queue.shift()!;
        
        for (const clientId of channelClients) {
          if (options?.except?.includes(clientId)) continue;
          
          const socket = this.io!.sockets.sockets.get(clientId);
          if (!socket) continue;
          
          const client = this.clients.get(clientId);
          if (!client) continue;
          
          const subscription = client.subscriptions.get(channel);
          if (!subscription) continue;
          
          // Apply filters
          if (subscription.filters && !this.matchFilters(data, subscription.filters)) {
            continue;
          }
          
          // Check throttle
          if (subscription.throttle) {
            const lastSent = client.metadata[`lastSent:${channel}`] || 0;
            if (Date.now() - lastSent < subscription.throttle) {
              continue;
            }
            client.metadata[`lastSent:${channel}`] = Date.now();
          }
          
          // Send to client
          if (options?.room) {
            socket.to(options.room).emit(channel, data);
          } else if (options?.volatile) {
            socket.volatile.emit(channel, data);
          } else {
            socket.emit(channel, data);
          }
        }
      }
    }
  }
  
  /**
   * Match filters
   */
  private matchFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) return false;
    }
    return true;
  }
  
  /**
   * Register channel handler
   */
  registerChannel(channel: string, handler: ChannelHandler): void {
    this.channelHandlers.set(channel, handler);
    this.logger.info(`Registered channel handler: ${channel}`);
  }
  
  /**
   * Register default handlers
   */
  private registerDefaultHandlers(): void {
    // Market data channel
    this.registerChannel('market', {
      validate: (data) => data && typeof data === 'object',
      transform: (data) => ({
        ...data,
        timestamp: new Date(),
        source: 'AlphaTerminal'
      })
    });
    
    // Price updates channel
    this.registerChannel('prices', {
      validate: (data) => Array.isArray(data) || (data && data.symbol),
      authorize: async (socket) => socket.data.authenticated
    });
    
    // Orders channel
    this.registerChannel('orders', {
      authorize: async (socket) => socket.data.authenticated,
      onSubscribe: async (socket) => {
        socket.emit('orders:snapshot', []); // Send initial snapshot
      }
    });
  }
  
  /**
   * Clean up inactive clients
   */
  private cleanupInactiveClients(): void {
    const timeout = this.wsConfig.authentication?.timeout || 3600000; // 1 hour
    const now = Date.now();
    
    for (const [id, client] of this.clients) {
      if (now - client.lastActivity.getTime() > timeout) {
        const socket = this.io!.sockets.sockets.get(id);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }
  
  /**
   * Get client info
   */
  getClient(socketId: string): ClientMetadata | undefined {
    return this.clients.get(socketId);
  }
  
  /**
   * Get channel info
   */
  getChannel(channel: string): Set<string> | undefined {
    return this.channels.get(channel);
  }
  
  /**
   * Get all connected clients
   */
  getClients(): Map<string, ClientMetadata> {
    return new Map(this.clients);
  }
}