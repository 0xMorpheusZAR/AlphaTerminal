// Complete working dashboard implementation
class WorkingDashboard {
    constructor() {
        this.socket = null;
        this.panels = new Map();
        this.init();
    }

    init() {
        console.log('Initializing Working Dashboard...');
        this.connectWebSocket();
        this.setupPanelHandlers();
        this.loadAllData();
    }

    connectWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            
            // Subscribe to all channels
            const channels = [
                'market-data',
                'comprehensive-data',
                'derivatives-data',
                'nft-data',
                'defi-data',
                'trending-data',
                'exchanges-data'
            ];
            
            channels.forEach(channel => {
                this.socket.emit('subscribe', channel);
            });
        });

        // Handle incoming data
        this.socket.on('market-data', (data) => {
            console.log('Received market data:', data);
            this.updateMarketPanel(data);
        });

        this.socket.on('comprehensive-data', (data) => {
            console.log('Received comprehensive data:', data);
            this.updateComprehensivePanel(data);
        });
    }

    async loadAllData() {
        // Load market overview
        try {
            const response = await fetch('/api/market/overview');
            const data = await response.json();
            if (data.success) {
                this.updateMarketOverview(data.data);
            }
        } catch (error) {
            console.error('Failed to load market overview:', error);
        }

        // Load other panels
        this.loadDefiData();
        this.loadDerivativesData();
        this.loadNFTData();
    }

    updateMarketOverview(data) {
        // Update metrics
        if (data.metrics) {
            const elements = {
                totalCap: document.getElementById('total-market-cap'),
                btcDom: document.getElementById('btc-dominance'),
                fearGreed: document.getElementById('fear-greed-index')
            };

            if (elements.totalCap) {
                elements.totalCap.textContent = '$' + (data.metrics.totalMarketCap / 1e12).toFixed(2) + 'T';
            }
            if (elements.btcDom) {
                elements.btcDom.textContent = data.metrics.btcDominance.toFixed(1) + '%';
            }
            if (elements.fearGreed) {
                elements.fearGreed.textContent = data.metrics.fearGreedIndex;
                elements.fearGreed.style.color = this.getFearGreedColor(data.metrics.fearGreedIndex);
            }
        }

        // Update crypto table
        if (data.topCryptos) {
            this.updateCryptoTable(data.topCryptos);
        }
    }

    updateCryptoTable(cryptos) {
        const table = document.getElementById('top-cryptos-table');
        if (!table) return;

        let gainers = 0, losers = 0, stable = 0;

        const html = `
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
                <tbody>
                    ${cryptos.map((crypto, i) => {
                        const change = crypto.priceChange24h || 0;
                        if (change > 1) gainers++;
                        else if (change < -1) losers++;
                        else stable++;
                        
                        const changeColor = change >= 0 ? '#00ff41' : '#ef4444';
                        const changeSign = change >= 0 ? '+' : '';
                        
                        return `
                            <tr style="border-bottom: 1px solid #222;">
                                <td style="padding: 8px;">${crypto.rank || i + 1}</td>
                                <td style="padding: 8px;">
                                    <div>
                                        <div style="font-weight: 600;">${crypto.symbol.toUpperCase()}</div>
                                        <div style="font-size: 0.7rem; color: #666;">${crypto.name}</div>
                                    </div>
                                </td>
                                <td style="padding: 8px; text-align: right;">$${this.formatPrice(crypto.price)}</td>
                                <td style="padding: 8px; text-align: right; color: ${changeColor};">
                                    ${changeSign}${change.toFixed(2)}%
                                </td>
                                <td style="padding: 8px; text-align: right;">${this.formatMarketCap(crypto.marketCap)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        table.innerHTML = html;

        // Update summary cards
        const elements = {
            gainers: document.getElementById('gainers-count'),
            losers: document.getElementById('losers-count'),
            stable: document.getElementById('stable-count')
        };

        if (elements.gainers) elements.gainers.textContent = gainers;
        if (elements.losers) elements.losers.textContent = losers;
        if (elements.stable) elements.stable.textContent = stable;
    }

    async loadDefiData() {
        try {
            const response = await fetch('/api/defi/protocols');
            const data = await response.json();
            if (data.success) {
                this.updateDefiPanel(data.data);
            }
        } catch (error) {
            console.error('Failed to load DeFi data:', error);
        }
    }

    async loadDerivativesData() {
        try {
            const response = await fetch('/api/derivatives/exchanges');
            const data = await response.json();
            if (data.success) {
                this.updateDerivativesPanel(data.data);
            }
        } catch (error) {
            console.error('Failed to load derivatives data:', error);
        }
    }

    async loadNFTData() {
        try {
            const response = await fetch('/api/nfts/list');
            const data = await response.json();
            if (data.success) {
                this.updateNFTPanel(data.data);
            }
        } catch (error) {
            console.error('Failed to load NFT data:', error);
        }
    }

    updateDefiPanel(data) {
        const container = document.querySelector('.defi-protocols-list');
        if (!container || !data.length) return;

        const html = data.slice(0, 5).map(protocol => `
            <div style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 600; color: #00ff41;">${protocol.name}</div>
                        <div style="font-size: 0.8rem; color: #666;">${protocol.symbol?.toUpperCase() || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>$${this.formatMarketCap(protocol.market_cap)}</div>
                        <div style="color: ${protocol.price_change_percentage_24h >= 0 ? '#00ff41' : '#ef4444'}">
                            ${protocol.price_change_percentage_24h >= 0 ? '+' : ''}${protocol.price_change_percentage_24h?.toFixed(2) || 0}%
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateDerivativesPanel(data) {
        const container = document.querySelector('.derivatives-table');
        if (!container || !data.length) return;

        const html = data.slice(0, 5).map(exchange => `
            <div style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="display: flex; justify-content: space-between;">
                    <div style="font-weight: 600; color: #00ff41;">${exchange.name}</div>
                    <div style="text-align: right;">
                        <div>Volume: ${exchange.trade_volume_24h_btc?.toFixed(2) || 0} BTC</div>
                        <div style="font-size: 0.8rem; color: #666;">OI: ${exchange.open_interest_btc?.toFixed(2) || 0} BTC</div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateNFTPanel(data) {
        const container = document.querySelector('.nft-collections');
        if (!container || !data.length) return;

        const html = data.slice(0, 5).map(nft => `
            <div style="padding: 10px; border-bottom: 1px solid #333;">
                <div style="display: flex; justify-content: space-between;">
                    <div style="font-weight: 600; color: #00ff41;">${nft.name}</div>
                    <div style="text-align: right;">
                        <div>Floor: ${nft.floor_price_in_native_currency?.toFixed(2) || 0} ETH</div>
                        <div style="color: ${nft.floor_price_24h_percentage_change >= 0 ? '#00ff41' : '#ef4444'}; font-size: 0.8rem;">
                            ${nft.floor_price_24h_percentage_change >= 0 ? '+' : ''}${nft.floor_price_24h_percentage_change?.toFixed(2) || 0}%
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    setupPanelHandlers() {
        // Handle panel buttons
        document.querySelectorAll('.panel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const panel = e.target.closest('.dashboard-panel');
                
                switch(action) {
                    case 'refresh':
                        this.refreshPanel(panel);
                        break;
                    case 'maximize':
                        this.toggleMaximize(panel);
                        break;
                    case 'close':
                        panel.style.display = 'none';
                        break;
                }
            });
        });
    }

    refreshPanel(panel) {
        const panelType = panel.dataset.panel;
        console.log('Refreshing panel:', panelType);
        this.loadAllData();
    }

    toggleMaximize(panel) {
        panel.classList.toggle('maximized');
    }

    formatPrice(num) {
        if (!num) return '0';
        if (num >= 1000) return num.toFixed(0);
        if (num >= 1) return num.toFixed(2);
        if (num >= 0.01) return num.toFixed(4);
        return num.toFixed(6);
    }

    formatMarketCap(num) {
        if (!num) return '$0';
        if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
        return '$' + num.toFixed(0);
    }

    getFearGreedColor(value) {
        if (value >= 70) return '#ef4444'; // Extreme Greed
        if (value >= 50) return '#00ff41'; // Greed/Neutral
        return '#ff6b35'; // Fear
    }

    updateMarketPanel(data) {
        console.log('Updating market panel with:', data);
    }

    updateComprehensivePanel(data) {
        console.log('Updating comprehensive panel with:', data);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.workingDashboard = new WorkingDashboard();
    });
} else {
    window.workingDashboard = new WorkingDashboard();
}