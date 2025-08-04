// ==================== ALPHATERMINAL MATRIX DEPLOYMENT ====================

class MatrixDeployment {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.websocketManager = null;
        this.chartManager = null;
        this.dashboardManager = null;
        this.loadingStage = 0;
        this.loadingMessages = [
            'Initializing quantum encryption...',
            'Connecting to satellite networks...',
            'Loading CoinGecko Pro API...',
            'Establishing secure channels...',
            'Synchronizing market data...',
            'Calibrating neural networks...',
            'Activating trading algorithms...',
            'System ready. Welcome to the Matrix.',
            'The Matrix Awakens You...'
        ];
        
        this.init();
    }

    async init() {
        console.log('🚀 AlphaTerminal Matrix Deployment - Initializing...');
        
        // Show Matrix loading sequence
        await this.showMatrixSequence();
        
        // Initialize all systems after awakening message
        await this.initializeTerminalSystems();
        
        // Deploy the dashboard
        this.deployDashboard();
        
        console.log('✅ The Matrix has awakened - AlphaTerminal deployed');
    }

    async showMatrixSequence() {
        const loadingStatus = document.getElementById('loading-status') || 
                            document.querySelector('.loading-status');
        
        if (!loadingStatus) return;

        // Show all loading messages including the awakening
        for (let i = 0; i < this.loadingMessages.length; i++) {
            await this.typeMessage(loadingStatus, this.loadingMessages[i]);
            
            let delay;
            if (i === this.loadingMessages.length - 2) {
                // "System ready. Welcome to the Matrix." - longer pause
                delay = 1500;
            } else if (i === this.loadingMessages.length - 1) {
                // "The Matrix Awakens You..." - dramatic pause before deployment
                delay = 2500;
            } else if (i === 0) {
                // First message
                delay = 800;
            } else {
                // Regular messages
                delay = 400 + Math.random() * 600;
            }
            
            await this.delay(delay);
        }
    }

    async typeMessage(element, message) {
        element.textContent = '';
        
        // Special styling for awakening message
        if (message === 'The Matrix Awakens You...') {
            element.style.color = '#00ff41';
            element.style.fontSize = '1.1rem';
            element.style.fontWeight = '600';
            element.style.textShadow = '0 0 20px rgba(0, 255, 65, 0.8)';
        }
        
        for (let i = 0; i < message.length; i++) {
            element.textContent += message[i];
            await this.delay(30 + Math.random() * 20);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initializeTerminalSystems() {
        console.log('🔧 Initializing Terminal Systems...');
        
        // Initialize managers
        this.initializeManagers();
        
        // Initialize socket connection
        this.initializeSocket();
        
        // Start system time
        this.startSystemTime();
        
        // Load initial data
        await this.loadInitialData();
    }

    initializeManagers() {
        console.log('🔧 Initializing component managers...');
        
        // Initialize WebSocket Manager
        if (window.WebSocketManager) {
            this.websocketManager = new window.WebSocketManager();
            // Make websocket manager available globally
            if (!window.alphaTerminal) window.alphaTerminal = {};
            window.alphaTerminal.socket = this.websocketManager;
        }
        
        // Initialize Chart Manager
        if (window.ChartManager) {
            this.chartManager = new window.ChartManager();
            window.chartManager = this.chartManager;
        }
        
        // Initialize Dashboard Manager
        if (window.DashboardManager) {
            this.dashboardManager = new window.DashboardManager();
            window.dashboardManager = this.dashboardManager;
        }
    }

    initializeSocket() {
        console.log('🔌 Setting up WebSocket event handlers...');
        
        // WebSocket will be initialized by WebSocketManager
        if (this.websocketManager) {
            this.websocketManager.on('connected', () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.updateConnectionStatus(true);
            });

            this.websocketManager.on('disconnected', () => {
                console.log('❌ WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
            });
        }
    }

    async loadInitialData() {
        console.log('📈 Loading initial market data...');
        
        try {
            // Load market data
            const response = await fetch('/api/market/overview');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateDashboard(data.data);
                }
            }

        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    deployDashboard() {
        console.log('🎭 Deploying AlphaTerminal Dashboard...');
        
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        if (loadingScreen && app) {
            // Create dramatic matrix-style transition
            loadingScreen.style.transition = 'opacity 1.5s ease-out, transform 1.5s ease-out';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(0.95)';

            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'flex';
                app.style.opacity = '0';
                app.style.transform = 'scale(1.05)';
                
                // Animate dashboard deployment
                setTimeout(() => {
                    app.style.transition = 'all 1s ease-out';
                    app.style.opacity = '1';
                    app.style.transform = 'scale(1)';
                    
                    // Animate individual panels with staggered deployment
                    this.deployPanels();
                }, 100);
            }, 1500);
        }
    }

    deployPanels() {
        const panels = document.querySelectorAll('.dashboard-panel');
        
        panels.forEach((panel, index) => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(30px) scale(0.95)';
            
            setTimeout(() => {
                panel.style.transition = 'all 0.8s ease-out';
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0) scale(1)';
                
                // Add subtle glow effect on deployment
                panel.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.2)';
                
                setTimeout(() => {
                    panel.style.boxShadow = '';
                }, 1000);
                
            }, index * 150); // Staggered deployment
        });

        // Final console message
        setTimeout(() => {
            console.log('🌟 The Matrix has fully awakened - AlphaTerminal is live!');
        }, panels.length * 150 + 800);
    }

    updateDashboard(data) {
        console.log('📊 Updating dashboard with market data');
        
        if (data.metrics) {
            this.updateGlobalMetrics(data.metrics);
        }

        if (data.topCryptos) {
            this.updateMarketOverview(data.topCryptos);
        }
    }

    updateGlobalMetrics(metrics) {
        const totalCapElement = document.getElementById('total-market-cap');
        const btcDominanceElement = document.getElementById('btc-dominance');
        const fearGreedElement = document.getElementById('fear-greed-index');

        if (totalCapElement && metrics.totalMarketCap) {
            totalCapElement.textContent = this.formatCurrency(metrics.totalMarketCap);
        }

        if (btcDominanceElement && metrics.btcDominance) {
            btcDominanceElement.textContent = `${metrics.btcDominance.toFixed(1)}%`;
        }

        if (fearGreedElement) {
            const fearGreed = metrics.fearGreedIndex || 50;
            fearGreedElement.textContent = fearGreed.toString();
            
            // Update color based on value
            if (fearGreed > 70) {
                fearGreedElement.style.color = '#ef4444'; // Red (Greed)
            } else if (fearGreed < 30) {
                fearGreedElement.style.color = '#ff6b35'; // Orange (Fear)
            } else {
                fearGreedElement.style.color = '#00ff41'; // Green (Neutral)
            }
        }
    }

    updateMarketOverview(cryptos) {
        if (!cryptos || !Array.isArray(cryptos)) return;

        const tableContainer = document.getElementById('top-cryptos-table');
        if (!tableContainer) return;

        let gainers = 0, losers = 0, stable = 0;

        const tableHTML = `
            <table class="market-table">
                <thead>
                    <tr>
                        <th>RANK</th>
                        <th>NAME</th>
                        <th>PRICE</th>
                        <th>24H %</th>
                        <th>MARKET CAP</th>
                        <th>VOLUME</th>
                    </tr>
                </thead>
                <tbody>
                    ${cryptos.slice(0, 20).map((crypto, index) => {
                        const change = crypto.priceChange24h || 0;
                        if (change > 1) gainers++;
                        else if (change < -1) losers++;
                        else stable++;

                        const changeClass = change >= 0 ? 'positive' : 'negative';
                        
                        return `
                            <tr class="market-row" data-symbol="${crypto.symbol}">
                                <td>${index + 1}</td>
                                <td>
                                    <div class="crypto-info">
                                        <span class="crypto-symbol">${crypto.symbol?.toUpperCase()}</span>
                                        <span class="crypto-name">${crypto.name}</span>
                                    </div>
                                </td>
                                <td class="price-cell">$${this.formatNumber(crypto.price)}</td>
                                <td class="change-cell ${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</td>
                                <td>$${this.formatLargeNumber(crypto.marketCap)}</td>
                                <td>$${this.formatLargeNumber(crypto.volume24h)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = tableHTML;

        // Update summary cards
        const gainersEl = document.getElementById('gainers-count');
        const losersEl = document.getElementById('losers-count');
        const stableEl = document.getElementById('stable-count');
        
        if (gainersEl) gainersEl.textContent = gainers;
        if (losersEl) losersEl.textContent = losers;
        if (stableEl) stableEl.textContent = stable;

        // Add click handlers for rows
        document.querySelectorAll('.market-row').forEach(row => {
            row.addEventListener('click', () => {
                const symbol = row.dataset.symbol;
                this.loadCryptoChart(symbol);
            });
        });
    }

    loadCryptoChart(symbol) {
        console.log(`📊 Loading chart for ${symbol}`);
        if (this.chartManager) {
            this.chartManager.changeSymbol(symbol);
        }
    }

    startSystemTime() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const timeElement = document.getElementById('system-time');
            if (timeElement) {
                timeElement.textContent = timeString;
            }

            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement && this.isConnected) {
                lastUpdateElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
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
    }

    // Utility functions
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        if (num >= 1000) return num.toFixed(0);
        if (num >= 1) return num.toFixed(2);
        if (num >= 0.01) return num.toFixed(4);
        return num.toFixed(6);
    }

    formatLargeNumber(num) {
        if (num === null || num === undefined) return '0';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(0);
    }

    formatCurrency(num) {
        return '$' + this.formatLargeNumber(num);
    }
}

// Initialize the Matrix deployment when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.matrixDeployment = new MatrixDeployment();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatrixDeployment;
}