import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface WebSocketConfig {
  url: string;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  timeout: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface OrderBookData {
  symbol: string;
  bids: Array<[number, number]>; // [price, quantity]
  asks: Array<[number, number]>;
  timestamp: number;
}

export interface TradeData {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export class WebSocketManager extends EventEmitter {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private subscriptions: Map<string, Set<string>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageBuffer: any[] = [];
  private isConnected: boolean = false;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      ...config,
    };
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.config.url, {
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      timeout: this.config.timeout,
      transports: ['websocket'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
      this.isConnected = true;
      this.emit('connected');
      this.startHeartbeat();
      this.resubscribeAll();
      this.flushMessageBuffer();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      this.stopHeartbeat();
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      this.emit('error', error);
    });

    // Market data handlers
    this.socket.on('market:update', (data: MarketData) => {
      this.emit(`market:${data.symbol}`, data);
      this.emit('market:update', data);
    });

    this.socket.on('orderbook:update', (data: OrderBookData) => {
      this.emit(`orderbook:${data.symbol}`, data);
      this.emit('orderbook:update', data);
    });

    this.socket.on('trades:update', (data: TradeData) => {
      this.emit(`trades:${data.symbol}`, data);
      this.emit('trades:update', data);
    });

    // Batch updates for performance
    this.socket.on('market:batch', (batch: MarketData[]) => {
      batch.forEach(data => {
        this.emit(`market:${data.symbol}`, data);
      });
      this.emit('market:batch', batch);
    });

    this.socket.on('pong', () => {
      this.emit('pong');
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // 30 second heartbeat
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  subscribe(channel: string, symbols: string[]): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    const channelSubs = this.subscriptions.get(channel)!;
    symbols.forEach(symbol => channelSubs.add(symbol));

    if (this.isConnected && this.socket) {
      this.socket.emit('subscribe', { channel, symbols });
    } else {
      // Buffer the subscription request
      this.messageBuffer.push({ type: 'subscribe', channel, symbols });
    }
  }

  unsubscribe(channel: string, symbols: string[]): void {
    const channelSubs = this.subscriptions.get(channel);
    if (!channelSubs) return;

    symbols.forEach(symbol => channelSubs.delete(symbol));
    
    if (channelSubs.size === 0) {
      this.subscriptions.delete(channel);
    }

    if (this.isConnected && this.socket) {
      this.socket.emit('unsubscribe', { channel, symbols });
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((symbols, channel) => {
      if (this.socket?.connected) {
        this.socket.emit('subscribe', { 
          channel, 
          symbols: Array.from(symbols) 
        });
      }
    });
  }

  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0) {
      const message = this.messageBuffer.shift();
      if (message.type === 'subscribe') {
        this.subscribe(message.channel, message.symbols);
      }
    }
  }

  sendMessage(event: string, data: any): void {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Not connected, buffering message');
      this.messageBuffer.push({ type: 'message', event, data });
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
    this.messageBuffer = [];
  }

  isConnectedStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();