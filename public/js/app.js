// ==================== ALPHATERMINAL ENHANCED APPLICATION ====================

class AlphaTerminalApp {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.loadingStage = 0;
        this.loadingMessages = [
            'Initializing quantum encryption...',
            'Connecting to satellite networks...',
            'Loading CoinGecko Pro API...',
            'Establishing secure channels...',
            'Synchronizing market data...',
            'Calibrating neural networks...',
            'Activating trading algorithms...',
            'System ready. Welcome to the Matrix.'
        ];
        
        this.init();
    }

    async init() {
        console.log('🚀 AlphaTerminal v3.0 Pro - Initializing...');
        
        // Show enhanced loading sequence
        await this.showLoadingSequence();
        
        // Initialize UI components (including managers)
        this.initializeUI();
        
        // Initialize socket connection after managers are ready
        this.initializeSocket();
        
        // Start system time
        this.startSystemTime();
        
        // Load initial data
        await this.loadInitialData();
        
        // Hide loading screen and show dashboard
        this.showDashboard();
        
        console.log('✅ AlphaTerminal fully initialized');
    }

    async showLoadingSequence() {
        const loadingStatus = document.getElementById('loading-status') || 
                            document.querySelector('.loading-status');
        
        if (!loadingStatus) return;

        // Enhanced loading sequence with realistic delays
        for (let i = 0; i < this.loadingMessages.length; i++) {
            loadingStatus.textContent = this.loadingMessages[i];
            
            // Add typing effect
            await this.typeMessage(loadingStatus, this.loadingMessages[i]);
            
            // Realistic loading delays
            const delay = i === 0 ? 800 : 
                         i === this.loadingMessages.length - 1 ? 1200 : 
                         400 + Math.random() * 600;
            
            await this.delay(delay);
        }
    }

    async typeMessage(element, message) {
        element.textContent = '';
        for (let i = 0; i < message.length; i++) {
            element.textContent += message[i];
            await this.delay(30 + Math.random() * 20);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    initializeSocket() {
        console.log('🔌 Setting up WebSocket event handlers...');
        
        // WebSocket will be initialized by WebSocketManager
        // Just set up event delegation here
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

    subscribeToChannels() {
        const channels = [
            'comprehensive-data',
            'market-data',
            'derivatives-data',
            'nft-data',
            'defi-data',
            'trending-data',
            'exchanges-data'
        ];

        channels.forEach(channel => {
            console.log(`📡 Subscribing to ${channel}`);
            this.socket.emit('subscribe', { channel });
        });
    }

    initializeUI() {
        console.log('🎨 Initializing UI components...');

        // Initialize managers
        this.initializeManagers();
        
        // Initialize search functionality
        this.initializeSearch();
        
        // Initialize panel controls
        this.initializePanelControls();
        
        // Initialize chart
        this.initializeChart();
        
        // Initialize tooltips and interactions
        this.initializeInteractions();

        // Initialize keyboard shortcuts
        this.initializeKeyboardShortcuts();
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

    initializeSearch() {
        const searchInput = document.getElementById('symbol-search');
        const searchBtn = document.querySelector('.search-btn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.executeSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.executeSearch(searchInput.value);
            });
        }
    }

    initializePanelControls() {
        // Panel maximize/minimize functionality
        document.querySelectorAll('.panel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const panel = e.target.closest('.dashboard-panel');
                
                switch (action) {
                    case 'maximize':
                        this.maximizePanel(panel);
                        break;
                    case 'minimize':
                        this.minimizePanel(panel);
                        break;
                    case 'close':
                        this.closePanel(panel);
                        break;
                    case 'refresh':
                        this.refreshPanel(panel);
                        break;
                }
            });
        });

        // Timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateChartTimeframe(e.target.dataset.timeframe);
            });
        });

        // Derivative type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateDerivativeType(e.target.dataset.type);
            });
        });
    }

    initializeChart() {
        const chartContainer = document.getElementById('trading-chart');
        if (!chartContainer) return;

        // Initialize with LightweightCharts
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                backgroundColor: '#0f1419',
                textColor: '#ffffff',
            },
            grid: {
                vertLines: {
                    color: '#21262d',
                },
                horzLines: {
                    color: '#21262d',
                },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: '#30363d',
                timeVisible: true,
            },
            priceScale: {
                borderColor: '#30363d',
            },
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#00ff41',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#00ff41',
            wickDownColor: '#ef4444',
        });

        // Make chart responsive
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
            });
        });
    }

    initializeInteractions() {
        // Add hover effects and tooltips
        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.addEventListener('mouseenter', () => {
                panel.style.transform = 'translateY(-2px)';
                panel.style.boxShadow = '0 4px 20px rgba(0, 255, 65, 0.1)';
            });

            panel.addEventListener('mouseleave', () => {
                panel.style.transform = 'translateY(0)';
                panel.style.boxShadow = '';
            });
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('symbol-search')?.focus();
            }

            // F11 for fullscreen
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
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

    showDashboard() {
        console.log('🎭 Transitioning to dashboard...');
        
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        if (loadingScreen && app) {
            // Fade out loading screen
            loadingScreen.style.transition = 'opacity 1s ease-out';
            loadingScreen.style.opacity = '0';

            setTimeout(() => {
                loadingScreen.style.display = 'none';
                app.style.display = 'flex';
                
                // Animate dashboard panels
                document.querySelectorAll('.dashboard-panel').forEach((panel, index) => {
                    panel.style.opacity = '0';
                    panel.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        panel.style.transition = 'all 0.5s ease';
                        panel.style.opacity = '1';
                        panel.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }, 1000);
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
                lastUpdateElement.textContent = `LAST UPDATE: ${timeString}`;
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
        document.getElementById('gainers-count').textContent = gainers;
        document.getElementById('losers-count').textContent = losers;
        document.getElementById('stable-count').textContent = stable;

        // Add click handlers for rows
        document.querySelectorAll('.market-row').forEach(row => {
            row.addEventListener('click', () => {
                const symbol = row.dataset.symbol;
                this.loadCryptoChart(symbol);
            });
        });
    }

    updateDerivativesPanel(derivatives) {
        if (!derivatives) return;

        const totalOIElement = document.getElementById('total-oi');
        const avgFundingElement = document.getElementById('avg-funding');

        if (totalOIElement && derivatives.totalOpenInterest) {
            totalOIElement.textContent = this.formatCurrency(derivatives.totalOpenInterest);
        }

        if (avgFundingElement && derivatives.fundingRates) {
            const rates = Object.values(derivatives.fundingRates);
            const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            avgFundingElement.textContent = `${(avgRate * 100).toFixed(3)}%`;
        }
    }

    updateNFTPanel(nfts) {
        if (!nfts) return;

        const marketCapElement = document.getElementById('nft-market-cap');
        const volumeElement = document.getElementById('nft-volume');

        if (marketCapElement && nfts.totalMarketCap) {
            marketCapElement.textContent = this.formatCurrency(nfts.totalMarketCap);
        }

        if (volumeElement && nfts.volume24h) {
            volumeElement.textContent = this.formatCurrency(nfts.volume24h);
        }
    }

    updateDeFiPanel(defi) {
        if (!defi) return;

        const tvlElement = document.getElementById('total-tvl');
        const topProtocolElement = document.getElementById('top-protocol');

        if (tvlElement && defi.totalValueLocked) {
            tvlElement.textContent = this.formatCurrency(defi.totalValueLocked);
        }

        if (topProtocolElement && defi.dexes && defi.dexes.length > 0) {
            topProtocolElement.textContent = defi.dexes[0].attributes?.name || 'N/A';
        }
    }

    updateAPIStatus(status) {
        const creditsElement = document.getElementById('api-credits');
        if (creditsElement && status.credits_left) {
            creditsElement.textContent = `${status.credits_left} CREDITS`;
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

    // Panel actions
    maximizePanel(panel) {
        panel.style.gridColumn = '1 / -1';
        panel.style.gridRow = '1 / -1';
        panel.style.zIndex = '1000';
    }

    minimizePanel(panel) {
        panel.style.gridColumn = '';
        panel.style.gridRow = '';
        panel.style.zIndex = '';
    }

    refreshPanel(panel) {
        const panelType = panel.dataset.panel;
        console.log(`🔄 Refreshing ${panelType} panel`);
        
        // Add refresh animation
        panel.style.opacity = '0.7';
        setTimeout(() => {
            panel.style.opacity = '1';
        }, 300);

        // Re-subscribe to relevant channel
        if (this.socket) {
            this.socket.emit('subscribe', { channel: `${panelType}-data` });
        }
    }

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.alphaTerminal = new AlphaTerminalApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaTerminalApp;
}