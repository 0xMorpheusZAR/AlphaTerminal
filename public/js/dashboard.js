// ==================== ALPHATERMINAL DASHBOARD MANAGER ====================

class DashboardManager {
    constructor() {
        this.panels = new Map();
        this.websocketManager = null;
        this.chartManager = null;
        this.updateIntervals = new Map();
        this.isInitialized = false;
        
        this.initialize();
    }

    initialize() {
        console.log('📊 Initializing Dashboard Manager...');
        
        // Wait for other managers to be available
        this.waitForDependencies().then(() => {
            this.setupPanels();
            this.setupEventListeners();
            this.connectToDataSources();
            this.startDataUpdates();
            this.isInitialized = true;
            console.log('✅ Dashboard Manager initialized');
        });
    }

    async waitForDependencies() {
        const maxAttempts = 50;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.WebSocketManager && window.ChartManager && window.AlphaUtils) {
                console.log('✅ All dependencies loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ Some dependencies may not be loaded');
    }

    setupPanels() {
        // Initialize all dashboard panels
        const panelElements = document.querySelectorAll('.dashboard-panel');
        
        panelElements.forEach(panel => {
            const panelType = panel.dataset.panel;
            this.panels.set(panelType, {
                element: panel,
                type: panelType,
                isMaximized: false,
                lastUpdate: null
            });
            
            this.setupPanelControls(panel);
        });

        console.log(`📊 Initialized ${this.panels.size} dashboard panels`);
    }

    setupPanelControls(panel) {
        const controls = panel.querySelectorAll('.panel-btn');
        
        controls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const panelType = panel.dataset.panel;
                
                this.handlePanelAction(panelType, action);
            });
        });
    }

    setupEventListeners() {
        // Symbol search functionality
        const symbolSearch = document.getElementById('symbol-search');
        if (symbolSearch) {
            symbolSearch.addEventListener('input', AlphaUtils.debounce((e) => {
                this.handleSymbolSearch(e.target.value);
            }, 300));
        }

        // Layout toggle
        const layoutToggle = document.getElementById('layout-toggle');
        if (layoutToggle) {
            layoutToggle.addEventListener('click', () => {
                this.toggleLayout();
            });
        }

        // Settings toggle
        const settingsToggle = document.getElementById('settings-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Timeframe controls
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimeframe(e.target.dataset.timeframe);
            });
        });

        // Window resize handler
        window.addEventListener('resize', AlphaUtils.throttle(() => {
            this.handleResize();
        }, 250));
    }

    connectToDataSources() {
        if (window.alphaTerminal && window.alphaTerminal.socket) {
            this.websocketManager = window.alphaTerminal.socket;
            
            // Subscribe to data channels
            this.websocketManager.on('market-data', (data) => {
                this.updateMarketOverview(data);
            });

            this.websocketManager.on('comprehensive-data', (data) => {
                this.updateAllPanels(data);
            });

            this.websocketManager.on('price-update', (data) => {
                this.updatePriceDisplays(data);
            });

            this.websocketManager.on('derivatives-data', (data) => {
                this.updateDerivativesPanel(data);
            });

            this.websocketManager.on('defi-data', (data) => {
                this.updateDefiPanel(data);
            });

            this.websocketManager.on('nft-data', (data) => {
                this.updateNftPanel(data);
            });

            this.websocketManager.on('trending-data', (data) => {
                this.updateTrendingData(data);
            });

            console.log('🔌 Connected to WebSocket data sources');
        }
    }

    startDataUpdates() {
        // Global metrics update
        this.updateIntervals.set('global-metrics', setInterval(() => {
            this.updateGlobalMetrics();
        }, 30000));

        // System time update
        this.updateIntervals.set('system-time', setInterval(() => {
            this.updateSystemTime();
        }, 1000));

        // Initial data load
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial dashboard data...');
            
            // Load market overview data
            await this.loadMarketOverviewData();
            
            // Load DeFi data
            await this.loadDefiData();
            
            // Load derivatives data
            await this.loadDerivativesData();
            
            // Load NFT data
            await this.loadNftData();
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            AlphaUtils.showNotification('Failed to load initial data', 'error');
        }
    }

    async loadMarketOverviewData() {
        try {
            const response = await AlphaUtils.makeRequest('/api/market/global');
            if (response.success) {
                this.updateGlobalMetrics(response.data);
                this.updateMarketOverview(response.data);
            }
        } catch (error) {
            console.error('Failed to load market overview:', error);
        }
    }

    async loadDefiData() {
        try {
            const response = await AlphaUtils.makeRequest('/api/defi/protocols');
            if (response.success) {
                this.updateDefiPanel(response.data);
            }
        } catch (error) {
            console.error('Failed to load DeFi data:', error);
        }
    }

    async loadDerivativesData() {
        try {
            const response = await AlphaUtils.makeRequest('/api/derivatives/exchanges');
            if (response.success) {
                this.updateDerivativesPanel(response.data);
            }
        } catch (error) {
            console.error('Failed to load derivatives data:', error);
        }
    }

    async loadNftData() {
        try {
            const response = await AlphaUtils.makeRequest('/api/nfts/list');
            if (response.success) {
                this.updateNftPanel(response.data);
            }
        } catch (error) {
            console.error('Failed to load NFT data:', error);
        }
    }

    updateGlobalMetrics(data = null) {
        const totalMarketCap = document.getElementById('total-market-cap');
        const btcDominance = document.getElementById('btc-dominance');
        const fearGreedIndex = document.getElementById('fear-greed-index');

        if (data) {
            if (totalMarketCap && data.total_market_cap) {
                totalMarketCap.textContent = AlphaUtils.formatMarketCap(data.total_market_cap.usd);
            }

            if (btcDominance && data.market_cap_percentage) {
                btcDominance.textContent = `${data.market_cap_percentage.btc.toFixed(1)}%`;
            }

            if (fearGreedIndex && data.fear_greed_index) {
                fearGreedIndex.textContent = data.fear_greed_index.value || '--';
            }
        }

        // Update last update time
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            lastUpdate.textContent = AlphaUtils.formatTimestamp(new Date());
        }
    }

    updateMarketOverview(data) {
        if (!data || !data.coins) return;

        const topCryptosTable = document.getElementById('top-cryptos-table');
        if (!topCryptosTable) return;

        let gainers = 0, losers = 0, stable = 0;

        const tableHTML = `
            <div class="crypto-table">
                <div class="table-header">
                    <div class="col-rank">#</div>
                    <div class="col-name">NAME</div>
                    <div class="col-price">PRICE</div>
                    <div class="col-change-24h">24H</div>
                    <div class="col-volume">VOLUME</div>
                    <div class="col-market-cap">MARKET CAP</div>
                </div>
                <div class="table-body">
                    ${data.coins.slice(0, 10).map(coin => {
                        const change24h = coin.price_change_percentage_24h || 0;
                        if (change24h > 0.5) gainers++;
                        else if (change24h < -0.5) losers++;
                        else stable++;

                        return `
                            <div class="table-row crypto-row" data-symbol="${coin.symbol}">
                                <div class="col-rank">${coin.market_cap_rank || '--'}</div>
                                <div class="col-name">
                                    <img src="${coin.image}" alt="${coin.name}" class="crypto-icon" onerror="this.style.display='none'">
                                    <span class="crypto-name">${coin.name}</span>
                                    <span class="crypto-symbol">${coin.symbol.toUpperCase()}</span>
                                </div>
                                <div class="col-price">${AlphaUtils.formatPrice(coin.current_price)}</div>
                                <div class="col-change-24h ${AlphaUtils.getPriceChangeClass(change24h)}">
                                    ${AlphaUtils.formatPercentage(change24h)}
                                </div>
                                <div class="col-volume">${AlphaUtils.formatVolume(coin.total_volume)}</div>
                                <div class="col-market-cap">${AlphaUtils.formatMarketCap(coin.market_cap)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        topCryptosTable.innerHTML = tableHTML;

        // Update summary cards
        document.getElementById('gainers-count').textContent = gainers;
        document.getElementById('losers-count').textContent = losers;
        document.getElementById('stable-count').textContent = stable;

        // Add click handlers for crypto rows
        document.querySelectorAll('.crypto-row').forEach(row => {
            row.addEventListener('click', () => {
                const symbol = row.dataset.symbol;
                this.selectCrypto(symbol);
            });
        });
    }

    updateDefiPanel(data) {
        if (!data) return;

        // Update DeFi metrics
        const totalTvl = document.getElementById('total-tvl');
        const tvlChange = document.getElementById('tvl-change');
        const topProtocol = document.getElementById('top-protocol');

        if (totalTvl && data.total_tvl) {
            totalTvl.textContent = AlphaUtils.formatMarketCap(data.total_tvl);
        }

        if (tvlChange && data.tvl_change_24h) {
            tvlChange.textContent = AlphaUtils.formatPercentage(data.tvl_change_24h);
            tvlChange.className = `metric-change ${AlphaUtils.getPriceChangeClass(data.tvl_change_24h)}`;
        }

        if (topProtocol && data.protocols && data.protocols.length > 0) {
            topProtocol.textContent = data.protocols[0].name;
        }

        // Update protocols list
        const protocolsList = document.getElementById('defi-protocols');
        if (protocolsList && data.protocols) {
            const protocolsHTML = data.protocols.slice(0, 8).map(protocol => `
                <div class="protocol-item">
                    <div class="protocol-info">
                        <span class="protocol-name">${protocol.name}</span>
                        <span class="protocol-category">${protocol.category || 'DeFi'}</span>
                    </div>
                    <div class="protocol-metrics">
                        <span class="protocol-tvl">${AlphaUtils.formatMarketCap(protocol.tvl)}</span>
                        <span class="protocol-change ${AlphaUtils.getPriceChangeClass(protocol.change_24h)}">
                            ${AlphaUtils.formatPercentage(protocol.change_24h)}
                        </span>
                    </div>
                </div>
            `).join('');

            protocolsList.innerHTML = protocolsHTML;
        }
    }

    updateDerivativesPanel(data) {
        if (!data) return;

        const totalOi = document.getElementById('total-oi');
        const avgFunding = document.getElementById('avg-funding');
        const derivativesTable = document.getElementById('derivatives-table');

        if (totalOi && data.total_open_interest) {
            totalOi.textContent = AlphaUtils.formatMarketCap(data.total_open_interest);
        }

        if (avgFunding && data.average_funding_rate) {
            avgFunding.textContent = AlphaUtils.formatPercentage(data.average_funding_rate, 4);
        }

        if (derivativesTable && data.exchanges) {
            const tableHTML = `
                <div class="derivatives-list">
                    ${data.exchanges.slice(0, 6).map(exchange => `
                        <div class="derivative-item">
                            <div class="derivative-info">
                                <span class="derivative-name">${exchange.name}</span>
                                <span class="derivative-type">${exchange.type || 'PERPETUAL'}</span>
                            </div>
                            <div class="derivative-metrics">
                                <span class="derivative-oi">${AlphaUtils.formatMarketCap(exchange.open_interest)}</span>
                                <span class="derivative-volume">${AlphaUtils.formatVolume(exchange.volume_24h)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            derivativesTable.innerHTML = tableHTML;
        }
    }

    updateNftPanel(data) {
        if (!data) return;

        const nftMarketCap = document.getElementById('nft-market-cap');
        const nftVolume = document.getElementById('nft-volume');
        const nftCollections = document.getElementById('nft-collections');

        if (nftMarketCap && data.market_cap) {
            nftMarketCap.textContent = AlphaUtils.formatMarketCap(data.market_cap);
        }

        if (nftVolume && data.volume_24h) {
            nftVolume.textContent = AlphaUtils.formatVolume(data.volume_24h);
        }

        if (nftCollections && data.collections) {
            const collectionsHTML = `
                <div class="nft-collections-list">
                    ${data.collections.slice(0, 6).map(collection => `
                        <div class="nft-collection">
                            <div class="collection-info">
                                <span class="collection-name">${collection.name}</span>
                                <span class="collection-floor">${AlphaUtils.formatPrice(collection.floor_price)} ETH</span>
                            </div>
                            <div class="collection-change ${AlphaUtils.getPriceChangeClass(collection.change_24h)}">
                                ${AlphaUtils.formatPercentage(collection.change_24h)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            nftCollections.innerHTML = collectionsHTML;
        }
    }

    updateTrendingData(data) {
        if (!data || !data.coins) return;

        const trendingTopics = document.getElementById('trending-topics');
        if (trendingTopics) {
            const trendingHTML = `
                <div class="trending-list">
                    <h4 class="trending-title">🔥 TRENDING</h4>
                    ${data.coins.slice(0, 5).map((coin, index) => `
                        <div class="trending-item">
                            <span class="trending-rank">${index + 1}</span>
                            <span class="trending-name">${coin.name}</span>
                            <span class="trending-symbol">${coin.symbol.toUpperCase()}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            trendingTopics.innerHTML = trendingHTML;
        }
    }

    updatePriceDisplays(data) {
        // Update global price displays
        if (data.symbol && data.price) {
            const elements = document.querySelectorAll(`[data-symbol="${data.symbol}"]`);
            elements.forEach(el => {
                const priceEl = el.querySelector('.price');
                if (priceEl) {
                    priceEl.textContent = AlphaUtils.formatPrice(data.price);
                    AlphaUtils.pulse(priceEl, 500);
                }
            });
        }
    }

    updateSystemTime() {
        const systemTime = document.getElementById('system-time');
        if (systemTime) {
            systemTime.textContent = AlphaUtils.formatTimestamp(new Date());
        }
    }

    handlePanelAction(panelType, action) {
        const panel = this.panels.get(panelType);
        if (!panel) return;

        switch (action) {
            case 'refresh':
                this.refreshPanel(panelType);
                break;
            case 'maximize':
                this.maximizePanel(panelType);
                break;
            case 'close':
                this.closePanel(panelType);
                break;
            case 'indicators':
                this.showIndicators(panelType);
                break;
        }
    }

    refreshPanel(panelType) {
        console.log(`🔄 Refreshing panel: ${panelType}`);
        
        switch (panelType) {
            case 'market-overview':
                this.loadMarketOverviewData();
                break;
            case 'defi':
                this.loadDefiData();
                break;
            case 'derivatives':
                this.loadDerivativesData();
                break;
            case 'nfts':
                this.loadNftData();
                break;
            default:
                console.log(`No refresh handler for panel: ${panelType}`);
        }

        AlphaUtils.showNotification(`${panelType} panel refreshed`, 'success', 2000);
    }

    maximizePanel(panelType) {
        const panel = this.panels.get(panelType);
        if (!panel) return;

        panel.isMaximized = !panel.isMaximized;
        
        if (panel.isMaximized) {
            panel.element.classList.add('maximized');
            document.body.classList.add('panel-maximized');
        } else {
            panel.element.classList.remove('maximized');
            document.body.classList.remove('panel-maximized');
        }
    }

    closePanel(panelType) {
        const panel = this.panels.get(panelType);
        if (!panel) return;

        panel.element.style.display = 'none';
        AlphaUtils.showNotification(`${panelType} panel closed`, 'info', 2000);
    }

    selectCrypto(symbol) {
        console.log(`📊 Selecting crypto: ${symbol}`);
        
        if (window.chartManager) {
            window.chartManager.changeSymbol(symbol);
        }

        // Update symbol search
        const symbolSearch = document.getElementById('symbol-search');
        if (symbolSearch) {
            symbolSearch.value = symbol.toUpperCase();
        }

        AlphaUtils.showNotification(`Selected ${symbol.toUpperCase()}`, 'success', 2000);
    }

    handleSymbolSearch(query) {
        if (query.length < 2) return;

        console.log(`🔍 Searching for: ${query}`);
        
        // This would typically search through available cryptocurrencies
        // For now, we'll just update the chart if it's a valid symbol
        if (query.length >= 3) {
            this.selectCrypto(query);
        }
    }

    changeTimeframe(timeframe) {
        console.log(`⏱️ Changing global timeframe to: ${timeframe}`);
        
        if (window.chartManager) {
            window.chartManager.changeTimeframe(timeframe);
        }
    }

    toggleLayout() {
        console.log('🔄 Toggling dashboard layout');
        
        const dashboardGrid = document.getElementById('dashboard-grid');
        if (dashboardGrid) {
            dashboardGrid.classList.toggle('compact-layout');
        }

        AlphaUtils.showNotification('Layout toggled', 'info', 2000);
    }

    showSettings() {
        console.log('⚙️ Showing settings');
        
        // This would open a settings modal
        AlphaUtils.showNotification('Settings panel coming soon', 'info', 3000);
    }

    handleResize() {
        // Handle responsive layout changes
        const width = window.innerWidth;
        const dashboardGrid = document.getElementById('dashboard-grid');
        
        if (dashboardGrid) {
            if (width < 768) {
                dashboardGrid.classList.add('mobile-layout');
            } else {
                dashboardGrid.classList.remove('mobile-layout');
            }
        }

        // Resize charts
        if (window.chartManager) {
            window.chartManager.handleResize();
        }
    }

    updateAllPanels(data) {
        if (data.market) this.updateMarketOverview(data.market);
        if (data.defi) this.updateDefiPanel(data.defi);
        if (data.derivatives) this.updateDerivativesPanel(data.derivatives);
        if (data.nfts) this.updateNftPanel(data.nfts);
        if (data.trending) this.updateTrendingData(data.trending);
        if (data.global) this.updateGlobalMetrics(data.global);
    }

    destroy() {
        // Clear all intervals
        this.updateIntervals.forEach((interval, key) => {
            clearInterval(interval);
        });
        this.updateIntervals.clear();

        // Clear panels
        this.panels.clear();

        console.log('🗑️ Dashboard Manager destroyed');
    }
}

// Export globally
window.DashboardManager = DashboardManager;