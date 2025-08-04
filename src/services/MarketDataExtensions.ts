/**
 * @fileoverview Market data extensions for AlphaTerminal
 * @module MarketDataExtensions
 * @version 4.0.0
 */

import { CoinGeckoProService } from './CoinGeckoProService';
import { MarketDataAggregator } from './MarketDataAggregator';

/**
 * Extended MarketDataAggregator with frontend-aligned methods
 */
export class ExtendedMarketDataAggregator extends MarketDataAggregator {
    /**
     * Get market overview data
     */
    async getMarketOverview() {
        const comprehensiveData = await this.getComprehensiveMarketData();
        
        // Extract overview data from comprehensive data
        return {
            metrics: {
                totalMarketCap: comprehensiveData.marketOverview.globalMetrics.total_market_cap?.usd || 0,
                btcDominance: comprehensiveData.marketOverview.globalMetrics.market_cap_percentage?.btc || 0,
                fearGreedIndex: comprehensiveData.marketOverview.fearGreedIndex || 50,
                totalVolume24h: comprehensiveData.marketOverview.globalMetrics.total_volume?.usd || 0,
                activeCryptocurrencies: comprehensiveData.marketOverview.globalMetrics.active_cryptocurrencies || 0
            },
            topCryptos: comprehensiveData.marketOverview.topCryptos.map((coin: any) => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                price: coin.current_price,
                priceChange24h: coin.price_change_percentage_24h,
                marketCap: coin.market_cap,
                volume24h: coin.total_volume,
                rank: coin.market_cap_rank
            }))
        };
    }

    /**
     * Get market data with filters
     */
    async getMarketData(options: { symbols?: string[], metrics?: string[] }) {
        const comprehensiveData = await this.getComprehensiveMarketData();
        
        let result = comprehensiveData;
        
        if (options.symbols) {
            // Filter by symbols
            result.marketOverview.topCryptos = result.marketOverview.topCryptos.filter((coin: any) => 
                options.symbols!.includes(coin.symbol.toLowerCase())
            );
        }
        
        return result;
    }
}

/**
 * Extended CoinGeckoProService with frontend-aligned methods
 */
export class ExtendedCoinGeckoProService extends CoinGeckoProService {
    /**
     * Get DeFi markets data
     */
    async getDefiMarkets(options: { per_page?: number, page?: number }) {
        // DeFi data can be fetched through categories
        return this.getCoinsMarkets('usd', {
            category: 'decentralized_finance_defi',
            order: 'market_cap_desc',
            perPage: options.per_page || 100,
            page: options.page || 1,
            sparkline: false
        });
    }

    /**
     * Get NFT list - alias for getNFTsList
     */
    async getNFTList(options: { per_page?: number, page?: number }) {
        return this.getNFTsList(
            'market_cap_usd_desc',
            undefined,
            options.per_page || 100,
            options.page || 1
        );
    }

    /**
     * Get simple price - alias for getSimplePrices
     */
    async getSimplePrice(options: {
        ids: string[],
        vs_currencies: string[],
        include_24hr_change?: boolean
    }) {
        return this.getSimplePrices(
            options.ids,
            options.vs_currencies,
            true,
            true,
            options.include_24hr_change || false,
            false
        );
    }
}

export { ExtendedMarketDataAggregator as MarketDataAggregator };
export { ExtendedCoinGeckoProService as CoinGeckoProService };