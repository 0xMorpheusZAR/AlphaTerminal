// ==================== ALPHATERMINAL CHART MANAGER ====================

class ChartManager {
    constructor() {
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.currentSymbol = 'BTC';
        this.currentTimeframe = '1h';
        this.chartContainer = null;
        
        this.initialize();
    }

    initialize() {
        console.log('📊 Initializing Chart Manager...');
        this.chartContainer = document.getElementById('trading-chart');
        
        if (this.chartContainer) {
            this.createChart();
            this.setupEventListeners();
        } else {
            console.warn('⚠️ Chart container not found');
        }
    }

    createChart() {
        if (!this.chartContainer) return;

        const chartOptions = {
            width: this.chartContainer.clientWidth,
            height: this.chartContainer.clientHeight,
            layout: {
                backgroundColor: '#0f1419',
                textColor: '#ffffff',
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
            },
            grid: {
                vertLines: {
                    color: '#21262d',
                    style: 1,
                    visible: true,
                },
                horzLines: {
                    color: '#21262d',
                    style: 1,
                    visible: true,
                },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: '#00ff41',
                    width: 1,
                    style: 2,
                },
                horzLine: {
                    color: '#00ff41',
                    width: 1, 
                    style: 2,
                },
            },
            timeScale: {
                borderColor: '#30363d',
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time) => {
                    const date = new Date(time * 1000);
                    return date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    });
                },
            },
            priceScale: {
                borderColor: '#30363d',
                position: 'right',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            watermark: {
                color: 'rgba(0, 255, 65, 0.1)',
                visible: true,
                text: 'ALPHATERMINAL',
                fontSize: 24,
                horzAlign: 'center',
                vertAlign: 'center',
            },
        };

        try {
            this.chart = LightweightCharts.createChart(this.chartContainer, chartOptions);
            
            // Add candlestick series
            this.candleSeries = this.chart.addCandlestickSeries({
                upColor: '#00ff41',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#00ff41',
                wickDownColor: '#ef4444',
                priceFormat: {
                    type: 'price',
                    precision: 2,
                    minMove: 0.01,
                },
            });

            // Add volume series
            this.volumeSeries = this.chart.addHistogramSeries({
                color: '#26a69a',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });

            console.log('✅ Chart created successfully');
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Failed to create chart:', error);
            this.showChartError('Failed to initialize chart');
        }
    }

    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTimeframe(e.target.dataset.timeframe);
            });
        });

        // Chart symbol updates
        if (window.alphaTerminal && window.alphaTerminal.socket) {
            window.alphaTerminal.socket.on('price-update', (data) => {
                this.updatePrice(data);
            });
        }
    }

    handleResize() {
        if (this.chart && this.chartContainer) {
            this.chart.applyOptions({
                width: this.chartContainer.clientWidth,
                height: this.chartContainer.clientHeight,
            });
        }
    }

    async loadInitialData() {
        try {
            console.log(`📈 Loading chart data for ${this.currentSymbol}/${this.currentTimeframe}`);
            
            // Generate sample data for demonstration
            const sampleData = this.generateSampleData();
            
            if (this.candleSeries && sampleData.candles) {
                this.candleSeries.setData(sampleData.candles);
            }
            
            if (this.volumeSeries && sampleData.volume) {
                this.volumeSeries.setData(sampleData.volume);
            }

            this.updateChartHeader(this.currentSymbol, sampleData.candles);
            
        } catch (error) {
            console.error('❌ Failed to load chart data:', error);
            this.showChartError('Failed to load chart data');
        }
    }

    generateSampleData() {
        const candles = [];
        const volume = [];
        const now = Math.floor(Date.now() / 1000);
        const timeframeSeconds = this.getTimeframeInSeconds(this.currentTimeframe);
        
        let currentPrice = 45000; // Starting BTC price
        
        for (let i = 100; i >= 0; i--) {
            const time = now - (i * timeframeSeconds);
            const volatility = 0.02; // 2% volatility
            
            const open = currentPrice;
            const change = (Math.random() - 0.5) * volatility * currentPrice;
            const high = Math.max(open, open + change) + (Math.random() * 0.01 * currentPrice);
            const low = Math.min(open, open + change) - (Math.random() * 0.01 * currentPrice);
            const close = open + change;
            
            currentPrice = close;
            
            candles.push({
                time,
                open,
                high,
                low,
                close
            });
            
            volume.push({
                time,
                value: Math.random() * 1000000,
                color: close > open ? 'rgba(0, 255, 65, 0.5)' : 'rgba(239, 68, 68, 0.5)'
            });
        }
        
        return { candles, volume };
    }

    getTimeframeInSeconds(timeframe) {
        const timeframes = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400
        };
        return timeframes[timeframe] || 3600;
    }

    changeTimeframe(timeframe) {
        console.log(`📊 Changing timeframe to ${timeframe}`);
        
        // Update active button
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-timeframe="${timeframe}"]`)?.classList.add('active');
        
        this.currentTimeframe = timeframe;
        this.loadInitialData();
    }

    updatePrice(data) {
        if (!this.candleSeries || !data) return;

        try {
            // Update the latest candle with new price data
            const lastCandle = {
                time: Math.floor(Date.now() / 1000),
                open: data.price || 45000,
                high: data.price * 1.001,
                low: data.price * 0.999,
                close: data.price || 45000
            };

            this.candleSeries.update(lastCandle);
            this.updateChartHeader(this.currentSymbol, [lastCandle]);
            
        } catch (error) {
            console.error('❌ Failed to update price:', error);
        }
    }

    updateChartHeader(symbol, candleData) {
        const symbolElement = document.getElementById('chart-symbol');
        const priceElement = document.getElementById('chart-price');
        const changeElement = document.getElementById('chart-change');

        if (symbolElement) {
            symbolElement.textContent = `${symbol}/USD`;
        }

        if (candleData && candleData.length > 0) {
            const latestCandle = candleData[candleData.length - 1];
            const price = latestCandle.close;
            
            if (priceElement) {
                priceElement.textContent = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }

            if (changeElement && candleData.length > 1) {
                const previousCandle = candleData[candleData.length - 2];
                const change = ((price - previousCandle.close) / previousCandle.close) * 100;
                const changeClass = change >= 0 ? 'positive' : 'negative';
                const changeSign = change >= 0 ? '+' : '';
                
                changeElement.textContent = `${changeSign}${change.toFixed(2)}%`;
                changeElement.className = `chart-change ${changeClass}`;
            }
        }
    }

    showChartError(message) {
        if (this.chartContainer) {
            this.chartContainer.innerHTML = `
                <div class="chart-error">
                    <div class="error-icon">📊</div>
                    <div class="error-message">${message}</div>
                    <button class="retry-btn" onclick="window.chartManager.initialize()">Retry</button>
                </div>
            `;
        }
    }

    changeSymbol(symbol) {
        console.log(`📊 Changing symbol to ${symbol}`);
        this.currentSymbol = symbol.toUpperCase();
        this.loadInitialData();
    }

    destroy() {
        if (this.chart) {
            this.chart.remove();
            this.chart = null;
            this.candleSeries = null;
            this.volumeSeries = null;
        }
    }
}

// Export globally
window.ChartManager = ChartManager;