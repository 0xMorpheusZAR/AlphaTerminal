/**
 * @fileoverview Unified API routes for AlphaTerminal
 * @module APIRoutes
 * @version 4.0.0
 */

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { CoinGeckoProService } from '../services/CoinGeckoProService';
import { MarketDataAggregator } from '../services/MarketDataAggregator';

/**
 * Create API routes aligned with frontend expectations
 */
export function createAPIRoutes(
    coinGeckoService: CoinGeckoProService,
    marketAggregator: MarketDataAggregator,
    logger: Logger
): Router {
    const router = Router();

    /**
     * Global market data - Expected by frontend
     */
    router.get('/market/global', async (req: Request, res: Response) => {
        try {
            const globalData = await coinGeckoService.getGlobalData();
            
            res.json({
                success: true,
                data: {
                    total_market_cap: globalData.data.total_market_cap,
                    total_volume: globalData.data.total_volume,
                    market_cap_percentage: globalData.data.market_cap_percentage,
                    market_cap_change_percentage_24h_usd: globalData.data.market_cap_change_percentage_24h_usd,
                    updated_at: globalData.data.updated_at,
                    active_cryptocurrencies: globalData.data.active_cryptocurrencies,
                    markets: globalData.data.markets
                },
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch global market data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch global market data'
            });
        }
    });

    /**
     * DeFi protocols data - Expected by frontend
     */
    router.get('/defi/protocols', async (req: Request, res: Response) => {
        try {
            const { per_page = 20, page = 1 } = req.query;
            
            const defiData = await (coinGeckoService as any).getDefiMarkets({
                per_page: Number(per_page),
                page: Number(page)
            });
            
            res.json({
                success: true,
                data: defiData,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch DeFi data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch DeFi data'
            });
        }
    });

    /**
     * Derivatives exchanges data - Expected by frontend
     */
    router.get('/derivatives/exchanges', async (req: Request, res: Response) => {
        try {
            const derivativesData = await coinGeckoService.getDerivativesExchanges();
            
            res.json({
                success: true,
                data: derivativesData,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch derivatives data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch derivatives data'
            });
        }
    });

    /**
     * NFT list data - Expected by frontend
     */
    router.get('/nfts/list', async (req: Request, res: Response) => {
        try {
            const { per_page = 20, page = 1 } = req.query;
            
            const nftData = await (coinGeckoService as any).getNFTList({
                per_page: Number(per_page),
                page: Number(page)
            });
            
            res.json({
                success: true,
                data: nftData,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch NFT data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch NFT data'
            });
        }
    });

    /**
     * Market overview - Original endpoint
     */
    router.get('/market/overview', async (req: Request, res: Response) => {
        try {
            const data = await (marketAggregator as any).getMarketOverview();
            
            res.json({
                success: true,
                data,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Market overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch market overview'
            });
        }
    });

    /**
     * Market data with filters
     */
    router.get('/market/data', async (req: Request, res: Response) => {
        try {
            const { symbols, metrics } = req.query;
            
            const data = await (marketAggregator as any).getMarketData({
                symbols: symbols ? String(symbols).split(',') : undefined,
                metrics: metrics ? String(metrics).split(',') : undefined
            });
            
            res.json({
                success: true,
                data,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Market data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch market data'
            });
        }
    });

    /**
     * Trending data
     */
    router.get('/trending', async (req: Request, res: Response) => {
        try {
            const trending = await coinGeckoService.getTrending();
            
            res.json({
                success: true,
                data: trending,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch trending data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch trending data'
            });
        }
    });

    /**
     * Exchange data
     */
    router.get('/exchanges', async (req: Request, res: Response) => {
        try {
            const { per_page = 20, page = 1 } = req.query;
            
            const exchanges = await coinGeckoService.getExchanges(
                Number(per_page),
                Number(page)
            );
            
            res.json({
                success: true,
                data: exchanges,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Failed to fetch exchanges:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch exchanges'
            });
        }
    });

    return router;
}

export default createAPIRoutes;