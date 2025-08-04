import { enhancedCoinGeckoService } from './coingecko-enhanced';
import { cacheConfig, cacheKeys } from './cache-manager';
import { whaleAlertService } from './whale-alert';
import { aiSentimentService } from './ai-sentiment';
import { veloService } from './velo';

export interface ShowcaseData {
  globalMetrics: {
    totalMarketCap: string;
    marketCapChange: string;
    volume24h: string;
    volumeChange: string;
    activeCryptos: string;
    cryptoChange: string;
    btcDominance: string;
    dominanceChange: string;
  };
  marketOverview: any;
  whaleData: any;
  defiData: any;
  derivativesData: any;
  sentimentData: any;
  riskData: any;
}

export class CoinGeckoProShowcaseService {
  constructor() {}

  async getShowcaseData(timeframe: string = '24h'): Promise<ShowcaseData> {
    const cacheKey = cacheKeys.showcaseData(timeframe);
    
    // Try to get from cache first
    return cacheConfig.marketData.get(
      cacheKey,
      async () => {
        try {
          console.log(`[Showcase] Fetching fresh data for timeframe: ${timeframe}`);
          
          // Fetch all data in parallel for optimal performance
          const [
            globalData,
            topCoins,
            trendingCoins,
            defiProtocols,
            exchangeData
          ] = await Promise.all([
            this.getGlobalMetrics(),
            enhancedCoinGeckoService.getTopCoins(100),
            this.getTrendingData(),
            this.getDefiData(),
            this.getExchangeData()
          ]);

          const showcaseData = {
            globalMetrics: globalData,
            marketOverview: await this.getMarketOverview(topCoins),
            whaleData: await this.getWhaleData(),
            defiData: await this.getEnhancedDefiData(),
            derivativesData: await this.getDerivativesData(),
            sentimentData: await this.getSentimentData(),
            riskData: await this.getRiskData()
          };

          console.log('[Showcase] Data fetch complete');
          return showcaseData;
        } catch (error) {
          console.error('Error fetching showcase data:', error);
          return this.getMockShowcaseData();
        }
      },
      30 // 30 second cache for showcase data
    );
  }

  private async getGlobalMetrics() {
    try {
      const globalData = await enhancedCoinGeckoService.getGlobalData();
      const { data } = globalData;
      
      return {
        totalMarketCap: this.formatLargeNumber(data.total_market_cap.usd),
        marketCapChange: `${data.market_cap_change_percentage_24h_usd > 0 ? '+' : ''}${data.market_cap_change_percentage_24h_usd.toFixed(2)}%`,
        volume24h: this.formatLargeNumber(data.total_volume.usd),
        volumeChange: '+12.4%', // Mock as not directly available
        activeCryptos: data.active_cryptocurrencies.toLocaleString(),
        cryptoChange: '+42', // Mock
        btcDominance: `${data.market_cap_percentage.btc.toFixed(1)}%`,
        dominanceChange: '-0.8%' // Mock
      };
    } catch (error) {
      return {
        totalMarketCap: '$2.45T',
        marketCapChange: '+3.2%',
        volume24h: '$124.5B',
        volumeChange: '+12.4%',
        activeCryptos: '12,854',
        cryptoChange: '+42',
        btcDominance: '52.3%',
        dominanceChange: '-0.8%'
      };
    }
  }

  private async getMarketOverview(topCoins: any[]) {
    const topGainers = topCoins
      .filter(coin => coin.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        change: coin.price_change_percentage_24h.toFixed(1)
      }));

    const topLosers = topCoins
      .filter(coin => coin.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 5)
      .map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        change: coin.price_change_percentage_24h.toFixed(1)
      }));

    const top10Coins = topCoins.slice(0, 10).map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      marketCap: coin.market_cap
    }));

    // Generate 7-day trend data
    const trendLabels = this.getLast7Days();
    const marketCapTrend = this.generateTrendData(2.42, 0.02, 7);
    const volumeTrend = this.generateTrendData(110, 5, 7);

    return {
      topGainers,
      topLosers,
      topCoins: top10Coins,
      trendLabels,
      marketCapTrend,
      volumeTrend
    };
  }

  private async getTrendingData() {
    try {
      const trending = await enhancedCoinGeckoService.getTrendingCoins();
      return trending;
    } catch (error) {
      return { coins: [] };
    }
  }

  private async getWhaleData() {
    try {
      // Get real whale transactions
      const transactions = await whaleAlertService.getRecentTransactions(1000000); // $1M+ transactions
      const formattedTransactions = transactions
        .slice(0, 10)
        .map(tx => whaleAlertService.formatTransaction(tx));

      // Get exchange flows
      const exchangeFlows = await whaleAlertService.getExchangeFlows();
      const topFlows = exchangeFlows.slice(0, 4).map(flow => ({
        name: flow.exchange,
        netFlow: Math.round(flow.netFlow)
      }));

      // Calculate accumulation scores based on whale activity
      const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK'];
      const accumulationScores = await Promise.all(
        symbols.map(async symbol => {
          const symbolTxs = await whaleAlertService.getTransactionsBySymbol(symbol);
          const buyPressure = symbolTxs.filter(tx => 
            tx.from.owner_type === 'exchange'
          ).length;
          const sellPressure = symbolTxs.filter(tx => 
            tx.to.owner_type === 'exchange'
          ).length;
          
          // Score 0-100 based on buy/sell ratio
          const total = buyPressure + sellPressure;
          return total > 0 ? Math.round((buyPressure / total) * 100) : 50;
        })
      );

      return {
        whaleTransactions: formattedTransactions,
        accumulationScores,
        exchangeFlows: topFlows
      };
    } catch (error) {
      console.error('Error fetching whale data:', error);
      // Return mock data as fallback
      return {
        whaleTransactions: [
          {
            amount: '2,500',
            symbol: 'BTC',
            usdValue: '112.5M',
            type: 'buy',
            from: '0x1234...5678',
            to: 'Binance',
            time: '2 mins ago',
            exchange: 'Binance'
          }
        ],
        accumulationScores: [85, 72, 68, 45, 55, 78],
        exchangeFlows: [
          { name: 'Binance', netFlow: -850 },
          { name: 'Coinbase', netFlow: -420 }
        ]
      };
    }
  }

  private async getDefiData() {
    // Basic DeFi data - enhanced version below
    return {
      tvl: '$142.8B',
      tvlChange: '+5.2%',
      defiDominance: '5.8%',
      dominanceChange: '+0.3%',
      activeProtocols: '3,241',
      protocolChange: '+18'
    };
  }

  private async getEnhancedDefiData() {
    return {
      ...await this.getDefiData(),
      chains: ['Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism', 'Avalanche'],
      chainTvl: [85.2, 12.8, 8.5, 6.2, 4.8, 3.9],
      topProtocols: [
        { name: 'Lido', category: 'Liquid Staking', tvl: '32.8B', change: 5.2 },
        { name: 'MakerDAO', category: 'CDP', tvl: '8.5B', change: -2.1 },
        { name: 'AAVE', category: 'Lending', tvl: '7.2B', change: 3.8 },
        { name: 'Uniswap', category: 'DEX', tvl: '5.8B', change: 1.5 }
      ],
      yieldPools: [
        { pair: 'ETH-USDC', protocol: 'Uniswap V3', apy: 24.5, tvl: '125M', rewards: ['UNI', 'ARB'] },
        { pair: 'wBTC-ETH', protocol: 'Curve', apy: 18.2, tvl: '89M', rewards: ['CRV', 'CVX'] },
        { pair: 'MATIC-USDT', protocol: 'Quickswap', apy: 35.8, tvl: '42M', rewards: ['QUICK', 'MATIC'] }
      ]
    };
  }

  private async getExchangeData() {
    // Exchange data - in production from exchange APIs
    return {
      topExchanges: [
        { name: 'Binance', volume24h: 45.2, marketShare: 35.8 },
        { name: 'Coinbase', volume24h: 12.8, marketShare: 10.1 },
        { name: 'OKX', volume24h: 8.5, marketShare: 6.7 }
      ]
    };
  }

  private async getDerivativesData() {
    return {
      volume24h: '142.8B',
      totalOI: '32.0B',
      lsRatio: '1.24',
      fundingRate: '0.012%',
      openInterest: [18500000000, 8200000000, 1800000000, 3500000000],
      optionsFlow: [
        { asset: 'BTC', strike: '$50,000', type: 'CALL', expiry: 'Jan 26', size: '1,000', premium: '2.5M' },
        { asset: 'ETH', strike: '$3,000', type: 'PUT', expiry: 'Jan 19', size: '5,000', premium: '1.8M' },
        { asset: 'BTC', strike: '$45,000', type: 'CALL', expiry: 'Feb 23', size: '500', premium: '1.2M' }
      ],
      liquidationLevels: ['$42k', '$43k', '$44k', '$45k', '$46k', '$47k'],
      longLiquidations: [120, 85, 45, 20, 10, 5],
      shortLiquidations: [5, 10, 25, 60, 95, 140]
    };
  }

  private async getSentimentData() {
    try {
      // Get recent news from Velo
      const news = await veloService.getNews(20);
      const newsTexts = news.map(item => `${item.headline} ${item.summary}`);

      // Analyze sentiment
      const marketSentiment = await aiSentimentService.analyzeMultipleSources(
        [], // Twitter texts would come from Twitter API
        [], // Reddit texts would come from Reddit API
        newsTexts
      );

      const fearGreedIndex = await aiSentimentService.getFearGreedIndex();

      // Format trending topics
      const trendingTopics = marketSentiment.trendingTopics.map(topic => ({
        emoji: topic.emoji,
        name: topic.topic,
        mentions: `${(topic.mentions / 1000).toFixed(1)}k`,
        sentiment: topic.sentiment
      }));

      // Generate hourly sentiment data
      const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      const currentScore = marketSentiment.overall.score;
      
      // Simulate hourly variations
      const twitterSentiment = hours.map(() => 
        Math.max(0, Math.min(100, currentScore + (Math.random() - 0.5) * 10))
      );
      const redditSentiment = hours.map(() => 
        Math.max(0, Math.min(100, currentScore + (Math.random() - 0.5) * 15))
      );
      const newsSentiment = hours.map(() => 
        Math.max(0, Math.min(100, currentScore + (Math.random() - 0.5) * 5))
      );

      return {
        overallSentiment: marketSentiment.overall.score.toString(),
        fearGreed: fearGreedIndex.toString(),
        socialVolume: '8.2M', // Would come from social media APIs
        sentimentLabels: hours,
        twitterSentiment,
        redditSentiment,
        newsSentiment,
        trendingTopics: trendingTopics.length > 0 ? trendingTopics : [
          { emoji: '🚀', name: 'Bitcoin ETF', mentions: '45.2k', sentiment: 82 },
          { emoji: '🔥', name: 'Solana Memecoins', mentions: '38.7k', sentiment: 75 }
        ],
        influencers: [
          { 
            name: 'CryptoPunk6529', 
            followers: '458K', 
            stance: marketSentiment.overall.sentiment === 'bullish' ? 'Bullish' : 'Neutral', 
            lastTweet: marketSentiment.overall.summary
          },
          { 
            name: 'Pentoshi', 
            followers: '742K', 
            stance: 'Neutral', 
            lastTweet: 'Watching key levels here. $44k must hold for bulls.' 
          },
          { 
            name: 'CryptoCapo', 
            followers: '385K', 
            stance: marketSentiment.overall.sentiment === 'bearish' ? 'Bearish' : 'Neutral', 
            lastTweet: 'Market structure analysis suggests caution.' 
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      // Return mock data as fallback
      return {
        overallSentiment: '72',
        fearGreed: '68',
        socialVolume: '8.2M',
        sentimentLabels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        twitterSentiment: [65, 68, 72, 70, 75, 72],
        redditSentiment: [60, 62, 68, 65, 70, 68],
        newsSentiment: [70, 72, 75, 73, 78, 75],
        trendingTopics: [
          { emoji: '🚀', name: 'Bitcoin ETF', mentions: '45.2k', sentiment: 82 }
        ],
        influencers: []
      };
    }
  }

  private async getRiskData() {
    return {
      volatilityIndex: '68.5',
      correlationRisk: '0.82',
      liquidityScore: '7.2/10',
      systemicRisk: '42%',
      riskLevels: [75, 45, 30, 55, 60, 40],
      strategies: [
        { title: 'Diversification', description: 'Spread investments across multiple assets and sectors' },
        { title: 'Stop-Loss Orders', description: 'Set automatic sell orders to limit downside risk' },
        { title: 'Position Sizing', description: 'Never risk more than 2% of portfolio on a single trade' },
        { title: 'Regular Rebalancing', description: 'Quarterly portfolio rebalancing to maintain target allocations' }
      ],
      blackSwanEvents: [
        { 
          title: 'Major Exchange Hack', 
          probability: 15, 
          impact: 'high', 
          severity: 'high', 
          description: 'Potential security breach at top-5 exchange could trigger market panic' 
        },
        { 
          title: 'Stablecoin De-peg', 
          probability: 8, 
          impact: 'high', 
          severity: 'high', 
          description: 'Major stablecoin losing peg could cause liquidity crisis' 
        },
        { 
          title: 'Regulatory Crackdown', 
          probability: 25, 
          impact: 'medium', 
          severity: 'medium', 
          description: 'Sudden regulatory action in major market' 
        },
        { 
          title: 'Quantum Computing Threat', 
          probability: 2, 
          impact: 'high', 
          severity: 'low', 
          description: 'Breakthrough in quantum computing threatening cryptographic security' 
        }
      ]
    };
  }

  // Helper methods
  private formatLargeNumber(num: number): string {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toFixed(0)}`;
  }

  private getLast7Days(): string[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: string[] = [];
    const today = new Date().getDay();
    
    for (let i = 6; i >= 0; i--) {
      result.push(days[(today - i + 7) % 7]);
    }
    
    return result;
  }

  private generateTrendData(base: number, variance: number, points: number): number[] {
    const data: number[] = [];
    let current = base;
    
    for (let i = 0; i < points; i++) {
      current += (Math.random() - 0.5) * variance;
      data.push(Number(current.toFixed(2)));
    }
    
    return data;
  }

  private getMockShowcaseData(): ShowcaseData {
    return {
      globalMetrics: {
        totalMarketCap: '$2.45T',
        marketCapChange: '+3.2%',
        volume24h: '$124.5B',
        volumeChange: '+12.4%',
        activeCryptos: '12,854',
        cryptoChange: '+42',
        btcDominance: '52.3%',
        dominanceChange: '-0.8%'
      },
      marketOverview: {},
      whaleData: {},
      defiData: {},
      derivativesData: {},
      sentimentData: {},
      riskData: {}
    };
  }
}

export const coinGeckoProShowcaseService = new CoinGeckoProShowcaseService();