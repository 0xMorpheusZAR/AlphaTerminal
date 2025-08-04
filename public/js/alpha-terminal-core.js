/**
 * @fileoverview AlphaTerminal Core - Clean, unified architecture
 * @author AlphaTerminal Team
 * @version 3.0.0
 */

'use strict';

/**
 * Configuration constants for AlphaTerminal
 * @const {Object}
 */
const ALPHA_CONFIG = {
    API: {
        BASE_URL: '/api',
        ENDPOINTS: {
            MARKET_OVERVIEW: '/market/overview',
            MARKET_DATA: '/market/data',
            HEALTH: '/health'
        },
        TIMEOUT: 10000
    },
    
    UI: {
        ANIMATION_DURATION: 300,
        LOADING_DELAY: 800,
        FINAL_MESSAGE_DELAY: 2000,
        PANEL_DEPLOY_DELAY: 150
    },
    
    LOADING_MESSAGES: [
        'Initializing quantum encryption...',
        'Connecting to satellite networks...',
        'Loading CoinGecko Pro API...',
        'Establishing secure channels...',
        'Synchronizing market data...',
        'Calibrating neural networks...',
        'Activating trading algorithms...',
        'System ready. Welcome to the Matrix.',
        'The Matrix Awakens You...'
    ],
    
    SELECTORS: {
        LOADING_SCREEN: '#loading-screen',
        LOADING_STATUS: '#loading-status',
        APP_CONTAINER: '#app',
        DASHBOARD_GRID: '#dashboard-grid',
        DASHBOARD_PANELS: '.dashboard-panel'
    }
};

/**
 * Base class for AlphaTerminal components
 * @abstract
 */
class AlphaComponent {
    constructor(name) {
        this.name = name;
        this.initialized = false;
        this.destroyed = false;
        
        this.bindMethods();
    }
    
    /**
     * Bind methods to maintain context
     * @protected
     */
    bindMethods() {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(method => method !== 'constructor' && typeof this[method] === 'function');
            
        methods.forEach(method => {
            this[method] = this[method].bind(this);
        });
    }
    
    /**
     * Initialize component
     * @abstract
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.warn(`Component ${this.name} already initialized`);
            return;
        }
        
        try {
            await this.onInitialize();
            this.initialized = true;
            console.log(`✅ ${this.name} initialized successfully`);
        } catch (error) {
            console.error(`❌ Failed to initialize ${this.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Override in subclasses
     * @abstract
     * @protected
     */
    async onInitialize() {
        throw new Error('onInitialize must be implemented by subclass');
    }
    
    /**
     * Destroy component and cleanup resources
     */
    destroy() {
        if (this.destroyed) return;
        
        this.onDestroy();
        this.destroyed = true;
        this.initialized = false;
        
        console.log(`🗑️ ${this.name} destroyed`);
    }
    
    /**
     * Override in subclasses for cleanup
     * @protected
     */
    onDestroy() {
        // Override in subclasses
    }
    
    /**
     * Validate if component is ready for use
     * @protected
     * @returns {boolean}
     */
    isReady() {
        return this.initialized && !this.destroyed;
    }
}

/**
 * Utility functions for AlphaTerminal
 * @namespace
 */
const AlphaUtils = {
    /**
     * Format currency values
     * @param {number} value - The value to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(value) {
        if (!this.isValidNumber(value)) return '$0';
        
        const formatters = [
            { threshold: 1e12, suffix: 'T' },
            { threshold: 1e9, suffix: 'B' },
            { threshold: 1e6, suffix: 'M' },
            { threshold: 1e3, suffix: 'K' }
        ];
        
        const formatter = formatters.find(f => value >= f.threshold);
        
        if (formatter) {
            return `$${(value / formatter.threshold).toFixed(2)}${formatter.suffix}`;
        }
        
        return `$${value.toFixed(0)}`;
    },
    
    /**
     * Format price values with appropriate precision
     * @param {number} price - The price to format
     * @returns {string} Formatted price string
     */
    formatPrice(price) {
        if (!this.isValidNumber(price)) return '0';
        
        if (price >= 1000) return price.toFixed(0);
        if (price >= 1) return price.toFixed(2);
        if (price >= 0.01) return price.toFixed(4);
        return price.toFixed(6);
    },
    
    /**
     * Format percentage values
     * @param {number} percentage - The percentage to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted percentage string
     */
    formatPercentage(percentage, decimals = 2) {
        if (!this.isValidNumber(percentage)) return '0.00%';
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(decimals)}%`;
    },
    
    /**
     * Validate if value is a valid number
     * @param {*} value - Value to validate
     * @returns {boolean}
     */
    isValidNumber(value) {
        return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
    },
    
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Create delay promise
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Safe DOM element selection
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (optional)
     * @returns {Element|null}
     */
    $(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    },
    
    /**
     * Safe DOM elements selection
     * @param {string} selector - CSS selector
     * @param {Element} parent - Parent element (optional)
     * @returns {NodeList}
     */
    $$(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return [];
        }
    },
    
    /**
     * Get price change CSS class
     * @param {number} change - Price change value
     * @returns {string} CSS class name
     */
    getPriceChangeClass(change) {
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'neutral';
    },
    
    /**
     * Get price change color
     * @param {number} change - Price change value
     * @returns {string} CSS color value
     */
    getPriceChangeColor(change) {
        if (change > 0) return '#00ff41';
        if (change < 0) return '#ef4444';
        return '#666';
    }
};

/**
 * API service for AlphaTerminal
 */
class AlphaAPIService extends AlphaComponent {
    constructor() {
        super('AlphaAPIService');
        this.cache = new Map();
        this.requestQueue = [];
    }
    
    /**
     * Initialize API service
     * @protected
     */
    async onInitialize() {
        this.setupRequestInterceptors();
    }
    
    /**
     * Setup request interceptors and error handling
     * @private
     */
    setupRequestInterceptors() {
        // Add global error handling for fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                this.logRequest(args[0], response.status);
                return response;
            } catch (error) {
                this.logError(args[0], error);
                throw error;
            }
        };
    }
    
    /**
     * Make API request with error handling and caching
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, options = {}) {
        const url = ALPHA_CONFIG.API.BASE_URL + endpoint;
        const cacheKey = `${url}:${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 30000) { // 30s cache
                return cached.data;
            }
        }
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: ALPHA_CONFIG.API.TIMEOUT,
            ...options
        };
        
        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`API request failed: ${url}`, error);
            throw error;
        }
    }
    
    /**
     * Get market overview data
     * @returns {Promise<Object>}
     */
    async getMarketOverview() {
        return this.request(ALPHA_CONFIG.API.ENDPOINTS.MARKET_OVERVIEW);
    }
    
    /**
     * Get health status
     * @returns {Promise<Object>}
     */
    async getHealth() {
        return this.request(ALPHA_CONFIG.API.ENDPOINTS.HEALTH);
    }
    
    /**
     * Log successful requests
     * @private
     */
    logRequest(url, status) {
        console.log(`📡 API Request: ${url} - ${status}`);
    }
    
    /**
     * Log request errors
     * @private
     */
    logError(url, error) {
        console.error(`❌ API Error: ${url}`, error);
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ API cache cleared');
    }
    
    /**
     * Cleanup resources
     * @protected
     */
    onDestroy() {
        this.clearCache();
    }
}

/**
 * Loading screen manager
 */
class AlphaLoadingManager extends AlphaComponent {
    constructor() {
        super('AlphaLoadingManager');
        this.currentMessageIndex = 0;
    }
    
    /**
     * Initialize loading manager
     * @protected
     */
    async onInitialize() {
        this.loadingScreen = AlphaUtils.$(ALPHA_CONFIG.SELECTORS.LOADING_SCREEN);
        this.loadingStatus = AlphaUtils.$(ALPHA_CONFIG.SELECTORS.LOADING_STATUS);
        
        if (!this.loadingScreen || !this.loadingStatus) {
            throw new Error('Required loading elements not found');
        }
    }
    
    /**
     * Show loading sequence
     * @returns {Promise<void>}
     */
    async showLoadingSequence() {
        this.validateReady();
        
        for (let i = 0; i < ALPHA_CONFIG.LOADING_MESSAGES.length; i++) {
            const message = ALPHA_CONFIG.LOADING_MESSAGES[i];
            
            await this.displayMessage(message, i);
            
            const delay = this.getMessageDelay(i);
            await AlphaUtils.delay(delay);
            
            this.currentMessageIndex = i;
        }
    }
    
    /**
     * Display a loading message with effects
     * @private
     * @param {string} message - Message to display
     * @param {number} index - Message index
     */
    async displayMessage(message, index) {
        const isAwakeningMessage = message === 'The Matrix Awakens You...';
        
        if (isAwakeningMessage) {
            this.applyAwakeningEffects();
        }
        
        await this.typeMessage(message);
    }
    
    /**
     * Type message with animation
     * @private
     * @param {string} message - Message to type
     */
    async typeMessage(message) {
        this.loadingStatus.textContent = '';
        
        for (let i = 0; i < message.length; i++) {
            this.loadingStatus.textContent += message[i];
            await AlphaUtils.delay(30 + Math.random() * 20);
        }
    }
    
    /**
     * Apply special effects for awakening message
     * @private
     */
    applyAwakeningEffects() {
        Object.assign(this.loadingStatus.style, {
            color: '#00ff41',
            fontSize: '1.2rem',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(0, 255, 65, 0.8)'
        });
    }
    
    /**
     * Get delay for message based on index
     * @private
     * @param {number} index - Message index
     * @returns {number} Delay in milliseconds
     */
    getMessageDelay(index) {
        const totalMessages = ALPHA_CONFIG.LOADING_MESSAGES.length;
        
        if (index === totalMessages - 1) {
            return ALPHA_CONFIG.UI.FINAL_MESSAGE_DELAY;
        }
        
        return ALPHA_CONFIG.UI.LOADING_DELAY;
    }
    
    /**
     * Hide loading screen
     * @returns {Promise<void>}
     */
    async hideLoadingScreen() {
        this.validateReady();
        
        return new Promise((resolve) => {
            this.loadingScreen.style.transition = 'opacity 1s ease-out';
            this.loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                resolve();
            }, 1000);
        });
    }
    
    /**
     * Validate component is ready
     * @private
     */
    validateReady() {
        if (!this.isReady()) {
            throw new Error('LoadingManager not initialized');
        }
    }
}

/**
 * Main AlphaTerminal application
 */
class AlphaTerminal extends AlphaComponent {
    constructor() {
        super('AlphaTerminal');
        
        this.components = {
            api: new AlphaAPIService(),
            loading: new AlphaLoadingManager()
        };
        
        this.marketData = null;
        this.updateInterval = null;
    }
    
    /**
     * Initialize AlphaTerminal
     * @protected
     */
    async onInitialize() {
        console.log('🚀 AlphaTerminal v3.0 - Initializing...');
        
        // Initialize components
        await this.initializeComponents();
        
        // Show loading sequence
        await this.components.loading.showLoadingSequence();
        
        // Load initial data
        await this.loadInitialData();
        
        // Show dashboard
        await this.showDashboard();
        
        // Start updates
        this.startPeriodicUpdates();
        
        console.log('✅ AlphaTerminal fully initialized');
    }
    
    /**
     * Initialize all components
     * @private
     */
    async initializeComponents() {
        const initPromises = Object.values(this.components).map(component => 
            component.initialize()
        );
        
        await Promise.all(initPromises);
    }
    
    /**
     * Load initial market data
     * @private
     */
    async loadInitialData() {
        try {
            const data = await this.components.api.getMarketOverview();
            
            if (data.success && data.data) {
                this.marketData = data.data;
                console.log('📊 Initial market data loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            // Continue without data - don't block the UI
        }
    }
    
    /**
     * Show dashboard interface
     * @private
     */
    async showDashboard() {
        await this.components.loading.hideLoadingScreen();
        
        const appContainer = AlphaUtils.$(ALPHA_CONFIG.SELECTORS.APP_CONTAINER);
        if (appContainer) {
            appContainer.style.display = 'flex';
            this.animatePanels();
        }
        
        this.setupEventListeners();
        this.updateUI();
        this.startSystemClock();
    }
    
    /**
     * Animate dashboard panels
     * @private
     */
    animatePanels() {
        const panels = AlphaUtils.$$(ALPHA_CONFIG.SELECTORS.DASHBOARD_PANELS);
        
        panels.forEach((panel, index) => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                panel.style.transition = 'all 0.5s ease';
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, index * ALPHA_CONFIG.UI.PANEL_DEPLOY_DELAY);
        });
    }
    
    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        // System clock update
        this.startSystemClock();
        
        // Window resize handler
        window.addEventListener('resize', AlphaUtils.throttle(() => {
            this.handleResize();
        }, 250));
    }
    
    /**
     * Update UI with market data
     * @private
     */
    updateUI() {
        if (!this.marketData) return;
        
        this.updateGlobalMetrics();
        this.updateMarketTable();
        this.updateSummaryCards();
    }
    
    /**
     * Update global metrics display
     * @private
     */
    updateGlobalMetrics() {
        const { metrics } = this.marketData;
        if (!metrics) return;
        
        const elements = {
            totalCap: AlphaUtils.$('#total-market-cap'),
            btcDominance: AlphaUtils.$('#btc-dominance'),
            fearGreed: AlphaUtils.$('#fear-greed-index')
        };
        
        if (elements.totalCap && metrics.totalMarketCap) {
            elements.totalCap.textContent = AlphaUtils.formatCurrency(metrics.totalMarketCap);
        }
        
        if (elements.btcDominance && metrics.btcDominance) {
            elements.btcDominance.textContent = `${metrics.btcDominance.toFixed(1)}%`;
        }
        
        if (elements.fearGreed && metrics.fearGreedIndex) {
            elements.fearGreed.textContent = metrics.fearGreedIndex.toString();
            elements.fearGreed.style.color = this.getFearGreedColor(metrics.fearGreedIndex);
        }
    }
    
    /**
     * Get fear and greed index color
     * @private
     * @param {number} index - Fear and greed index value
     * @returns {string} CSS color value
     */
    getFearGreedColor(index) {
        if (index > 70) return '#ef4444'; // Red (Greed)
        if (index < 30) return '#ff6b35'; // Orange (Fear)
        return '#00ff41'; // Green (Neutral)
    }
    
    /**
     * Update market data table
     * @private
     */
    updateMarketTable() {
        const { topCryptos } = this.marketData;
        if (!topCryptos) return;
        
        const tableContainer = AlphaUtils.$('#top-cryptos-table');
        if (!tableContainer) return;
        
        const tableHTML = this.generateMarketTableHTML(topCryptos);
        tableContainer.innerHTML = tableHTML;
    }
    
    /**
     * Generate market table HTML
     * @private
     * @param {Array} cryptos - Cryptocurrency data
     * @returns {string} HTML string
     */
    generateMarketTableHTML(cryptos) {
        const rows = cryptos.slice(0, 8).map((crypto, index) => {
            const change = crypto.priceChange24h || 0;
            const changeClass = AlphaUtils.getPriceChangeClass(change);
            const changeColor = AlphaUtils.getPriceChangeColor(change);
            
            return `
                <tr style="border-bottom: 1px solid #222;">
                    <td style="padding: 8px;">${index + 1}</td>
                    <td style="padding: 8px;">
                        <div>
                            <div style="font-weight: 600;">${crypto.symbol?.toUpperCase() || 'N/A'}</div>
                            <div style="font-size: 0.7rem; color: #666;">${crypto.name || 'Unknown'}</div>
                        </div>
                    </td>
                    <td style="padding: 8px; text-align: right;">$${AlphaUtils.formatPrice(crypto.price)}</td>
                    <td style="padding: 8px; text-align: right; color: ${changeColor};">
                        ${AlphaUtils.formatPercentage(change)}
                    </td>
                    <td style="padding: 8px; text-align: right;">${AlphaUtils.formatCurrency(crypto.marketCap)}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <table style="width: 100%; color: white; font-size: 0.85rem;">
                <thead>
                    <tr style="border-bottom: 1px solid #333;">
                        <th style="padding: 8px; text-align: left;">RANK</th>
                        <th style="padding: 8px; text-align: left;">NAME</th>
                        <th style="padding: 8px; text-align: right;">PRICE</th>
                        <th style="padding: 8px; text-align: right;">24H %</th>
                        <th style="padding: 8px; text-align: right;">CAP</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    
    /**
     * Update summary cards
     * @private
     */
    updateSummaryCards() {
        const { topCryptos } = this.marketData;
        if (!topCryptos) return;
        
        let gainers = 0, losers = 0, stable = 0;
        
        topCryptos.forEach(crypto => {
            const change = crypto.priceChange24h || 0;
            if (change > 1) gainers++;
            else if (change < -1) losers++;
            else stable++;
        });
        
        const elements = {
            gainers: AlphaUtils.$('#gainers-count'),
            losers: AlphaUtils.$('#losers-count'),
            stable: AlphaUtils.$('#stable-count')
        };
        
        if (elements.gainers) elements.gainers.textContent = gainers;
        if (elements.losers) elements.losers.textContent = losers;
        if (elements.stable) elements.stable.textContent = stable;
    }
    
    /**
     * Start system clock
     * @private
     */
    startSystemClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false });
            
            const elements = {
                systemTime: AlphaUtils.$('#system-time'),
                lastUpdate: AlphaUtils.$('#last-update')
            };
            
            if (elements.systemTime) elements.systemTime.textContent = timeString;
            if (elements.lastUpdate) elements.lastUpdate.textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    /**
     * Start periodic data updates
     * @private
     */
    startPeriodicUpdates() {
        this.updateInterval = setInterval(async () => {
            try {
                await this.loadInitialData();
                this.updateUI();
            } catch (error) {
                console.error('❌ Periodic update failed:', error);
            }
        }, 30000); // Update every 30 seconds
    }
    
    /**
     * Handle window resize
     * @private
     */
    handleResize() {
        // Implement responsive behavior
        console.log('📐 Window resized');
    }
    
    /**
     * Cleanup resources
     * @protected
     */
    onDestroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        Object.values(this.components).forEach(component => {
            component.destroy();
        });
    }
}

// Initialize AlphaTerminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.alphaTerminal = new AlphaTerminal();
    window.alphaTerminal.initialize().catch(error => {
        console.error('❌ AlphaTerminal initialization failed:', error);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AlphaTerminal,
        AlphaComponent,
        AlphaUtils,
        ALPHA_CONFIG
    };
}