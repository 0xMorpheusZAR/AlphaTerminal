/**
 * @fileoverview WebSocket handler aligned with frontend expectations
 * @module WebSocketHandler
 * @version 4.0.0
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from 'winston';
import { 
    CoinGeckoProService, 
    MarketDataAggregator 
} from '../services/MarketDataExtensions';

/**
 * WebSocket event handler configuration
 */
export interface WebSocketConfig {
    updateIntervals: {
        marketData: number;
        comprehensiveData: number;
        priceUpdate: number;
        derivativesData: number;
        nftData: number;
        defiData: number;
        trendingData: number;
        exchangesData: number;
    };
}

/**
 * WebSocket handler for real-time data streaming
 */
export class WebSocketHandler {
    private io: SocketIOServer;
    private logger: Logger;
    private coinGeckoService: CoinGeckoProService;
    private marketAggregator: MarketDataAggregator;
    private updateTimers: Map<string, any> = new Map();
    private config: WebSocketConfig;

    constructor(
        io: SocketIOServer,
        logger: Logger,
        coinGeckoService: CoinGeckoProService,
        marketAggregator: MarketDataAggregator,
        config?: Partial<WebSocketConfig>
    ) {
        this.io = io;
        this.logger = logger;
        this.coinGeckoService = coinGeckoService;
        this.marketAggregator = marketAggregator;
        
        // Default configuration aligned with frontend expectations
        this.config = {
            updateIntervals: {
                marketData: 10000,        // 10 seconds
                comprehensiveData: 15000, // 15 seconds
                priceUpdate: 5000,        // 5 seconds
                derivativesData: 30000,   // 30 seconds
                nftData: 60000,          // 60 seconds
                defiData: 30000,         // 30 seconds
                trendingData: 300000,    // 5 minutes
                exchangesData: 60000     // 60 seconds
            },
            ...config
        };

        this.setupEventHandlers();
    }

    /**
     * Setup Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            this.logger.info(`New WebSocket connection: ${socket.id}`);
            
            // Handle subscriptions to different channels
            socket.on('subscribe', async (channel: string) => {
                socket.join(channel);
                this.logger.info(`Socket ${socket.id} subscribed to ${channel}`);
                
                // Send initial data for the channel
                await this.sendInitialData(socket, channel);
                
                // Start updates for this channel if not already running
                this.startChannelUpdates(channel);
            });

            socket.on('unsubscribe', (channel: string) => {
                socket.leave(channel);
                this.logger.info(`Socket ${socket.id} unsubscribed from ${channel}`);
            });

            socket.on('disconnect', () => {
                this.logger.info(`Socket ${socket.id} disconnected`);
            });

            // Send welcome message
            socket.emit('connected', {
                message: 'Connected to AlphaTerminal WebSocket',
                timestamp: new Date()
            });
        });
    }

    /**
     * Send initial data when client subscribes
     */
    private async sendInitialData(socket: Socket, channel: string): Promise<void> {
        try {
            switch (channel) {
                case 'market-data':
                    const marketData = await (this.marketAggregator as any).getMarketOverview();
                    socket.emit('market-data', marketData);
                    break;

                case 'comprehensive-data':
                    const comprehensiveData = await this.marketAggregator.getComprehensiveMarketData();
                    socket.emit('comprehensive-data', comprehensiveData);
                    break;

                case 'derivatives-data':
                    const derivatives = await this.coinGeckoService.getDerivativesExchanges();
                    socket.emit('derivatives-data', derivatives);
                    break;

                case 'nft-data':
                    const nfts = await (this.coinGeckoService as any).getNFTList({ per_page: 50 });
                    socket.emit('nft-data', nfts);
                    break;

                case 'defi-data':
                    const defi = await (this.coinGeckoService as any).getDefiMarkets({ per_page: 50 });
                    socket.emit('defi-data', defi);
                    break;

                case 'trending-data':
                    const trending = await this.coinGeckoService.getTrending();
                    socket.emit('trending-data', trending);
                    break;

                case 'exchanges-data':
                    const exchanges = await this.coinGeckoService.getExchanges(50, 1);
                    socket.emit('exchanges-data', exchanges);
                    break;
            }
        } catch (error) {
            this.logger.error(`Failed to send initial data for ${channel}:`, error);
        }
    }

    /**
     * Start periodic updates for a channel
     */
    private startChannelUpdates(channel: string): void {
        // Don't start if already running
        if (this.updateTimers.has(channel)) {
            return;
        }

        const interval = this.config.updateIntervals[channel as keyof typeof this.config.updateIntervals];
        if (!interval) {
            this.logger.warn(`No update interval configured for channel: ${channel}`);
            return;
        }

        const timer = setInterval(async () => {
            await this.broadcastChannelUpdate(channel);
        }, interval);

        this.updateTimers.set(channel, timer);
        this.logger.info(`Started updates for channel: ${channel} (interval: ${interval}ms)`);
    }

    /**
     * Broadcast update to all clients in a channel
     */
    private async broadcastChannelUpdate(channel: string): Promise<void> {
        try {
            let data: any;

            switch (channel) {
                case 'market-data':
                    data = await (this.marketAggregator as any).getMarketOverview();
                    break;

                case 'comprehensive-data':
                    data = await this.marketAggregator.getComprehensiveMarketData();
                    break;

                case 'price-update':
                    // Get top coins price updates
                    const topCoins = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano'];
                    data = await (this.coinGeckoService as any).getSimplePrice({
                        ids: topCoins,
                        vs_currencies: ['usd'],
                        include_24hr_change: true
                    });
                    break;

                case 'derivatives-data':
                    data = await this.coinGeckoService.getDerivativesExchanges();
                    break;

                case 'nft-data':
                    data = await (this.coinGeckoService as any).getNFTList({ per_page: 50 });
                    break;

                case 'defi-data':
                    data = await (this.coinGeckoService as any).getDefiMarkets({ per_page: 50 });
                    break;

                case 'trending-data':
                    data = await this.coinGeckoService.getTrending();
                    break;

                case 'exchanges-data':
                    data = await this.coinGeckoService.getExchanges(50, 1);
                    break;

                default:
                    this.logger.warn(`Unknown channel: ${channel}`);
                    return;
            }

            // Emit to all clients in the channel
            this.io.to(channel).emit(channel, data);
            this.logger.debug(`Broadcasted update to channel: ${channel}`);
        } catch (error) {
            this.logger.error(`Failed to broadcast update for ${channel}:`, error);
        }
    }

    /**
     * Stop all update timers
     */
    public stopAllUpdates(): void {
        for (const [channel, timer] of this.updateTimers) {
            clearInterval(timer);
            this.logger.info(`Stopped updates for channel: ${channel}`);
        }
        this.updateTimers.clear();
    }

    /**
     * Send custom event to specific clients
     */
    public sendToClient(socketId: string, event: string, data: any): void {
        this.io.to(socketId).emit(event, data);
    }

    /**
     * Broadcast to all connected clients
     */
    public broadcast(event: string, data: any): void {
        this.io.emit(event, data);
    }
}

export default WebSocketHandler;