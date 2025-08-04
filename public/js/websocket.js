// ==================== ALPHATERMINAL WEBSOCKET MANAGER ====================

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Set();
        this.eventHandlers = new Map();
        
        this.initialize();
    }

    initialize() {
        console.log('🔌 Initializing WebSocket Manager...');
        this.connect();
    }

    connect() {
        try {
            this.socket = io();
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Failed to connect to WebSocket:', error);
            this.handleReconnect();
        }
    }

    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            this.resubscribeToChannels();
            this.emit('connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.emit('disconnected', reason);
            
            if (reason === 'io server disconnect') {
                // Server disconnected, attempt to reconnect
                this.handleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔥 WebSocket connection error:', error);
            this.handleReconnect();
        });

        // Data event listeners
        this.setupDataEventListeners();
    }

    setupDataEventListeners() {
        // Market data events
        this.socket.on('market-data', (data) => {
            console.log('📊 Market data received');
            this.emit('market-data', data);
        });

        this.socket.on('comprehensive-data', (data) => {
            console.log('📈 Comprehensive data received');
            this.emit('comprehensive-data', data);
        });

        this.socket.on('price-update', (data) => {
            console.log('💰 Price update received');
            this.emit('price-update', data);
        });

        this.socket.on('derivatives-data', (data) => {
            console.log('📋 Derivatives data received');
            this.emit('derivatives-data', data);
        });

        this.socket.on('nft-data', (data) => {
            console.log('🖼️ NFT data received'); 
            this.emit('nft-data', data);
        });

        this.socket.on('defi-data', (data) => {
            console.log('🏦 DeFi data received');
            this.emit('defi-data', data);
        });

        this.socket.on('trending-data', (data) => {
            console.log('📈 Trending data received');
            this.emit('trending-data', data);
        });

        this.socket.on('exchanges-data', (data) => {
            console.log('🏢 Exchange data received');
            this.emit('exchanges-data', data);
        });

        // System events
        this.socket.on('system-status', (data) => {
            this.emit('system-status', data);
        });

        this.socket.on('api-status', (data) => {
            this.emit('api-status', data);
        });
    }

    subscribe(channel, params = {}) {
        if (!this.socket || !this.isConnected) {
            console.warn(`⚠️ Cannot subscribe to ${channel} - not connected`);
            this.subscriptions.add({ channel, params });
            return;
        }

        console.log(`📡 Subscribing to channel: ${channel}`);
        this.socket.emit('subscribe', { channel, params });
        this.subscriptions.add({ channel, params });
    }

    unsubscribe(channel) {
        if (!this.socket) return;

        console.log(`📡 Unsubscribing from channel: ${channel}`);
        this.socket.emit('unsubscribe', { channel });
        
        // Remove from subscriptions
        this.subscriptions = new Set(
            [...this.subscriptions].filter(sub => sub.channel !== channel)
        );
    }

    resubscribeToChannels() {
        console.log('🔄 Resubscribing to channels...');
        this.subscriptions.forEach(({ channel, params }) => {
            this.socket.emit('subscribe', { channel, params });
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.emit('max-reconnect-attempts');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('connection-dot');
        const statusText = document.getElementById('connection-status');

        if (statusDot) {
            statusDot.className = `status-dot ${connected ? '' : 'error'}`;
        }

        if (statusText) {
            statusText.textContent = connected ? 'CONNECTED' : 'DISCONNECTED';
        }

        // Update market status indicator
        const marketStatus = document.getElementById('market-status');
        if (marketStatus) {
            marketStatus.className = `status-indicator ${connected ? '' : 'error'}`;
        }
    }

    // Event emitter functionality
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    // Public methods for sending data
    sendCommand(command) {
        if (!this.socket || !this.isConnected) {
            console.warn('⚠️ Cannot send command - not connected');
            return;
        }

        this.socket.emit('command', { command });
    }

    // Utility methods
    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: Array.from(this.subscriptions)
        };
    }

    destroy() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.subscriptions.clear();
        this.eventHandlers.clear();
    }
}

// Export globally
window.WebSocketManager = WebSocketManager;