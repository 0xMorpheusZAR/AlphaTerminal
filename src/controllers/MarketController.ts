import { Request, Response } from 'express';
import { MarketService } from '../services/MarketService';
import { CryptoDataService } from '../services/CryptoDataService';
import { TechnicalAnalysisService } from '../services/TechnicalAnalysisService';
import winston from 'winston';

export class MarketController {
  private marketService: MarketService;
  private cryptoDataService: CryptoDataService;
  private technicalService: TechnicalAnalysisService;
  private logger: winston.Logger;

  constructor() {
    this.marketService = new MarketService();
    this.cryptoDataService = new CryptoDataService();
    this.technicalService = new TechnicalAnalysisService();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  getMarketOverview = async (_req: Request, res: Response) => {
    try {
      const [marketData, metrics, sentiment] = await Promise.all([
        this.cryptoDataService.getMarketData(),
        this.cryptoDataService.getMarketMetrics(),
        this.marketService.getMarketSentiment()
      ]);

      res.json({
        success: true,
        data: {
          topCryptos: marketData.slice(0, 10),
          metrics,
          sentiment,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to get market overview', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch market overview' 
      });
    }
  };

  getMarketMetrics = async (_req: Request, res: Response) => {
    try {
      const metrics = await this.cryptoDataService.getMarketMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      this.logger.error('Failed to get market metrics', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch market metrics' 
      });
    }
  };

  getMarketSentiment = async (_req: Request, res: Response) => {
    try {
      const sentiment = await this.marketService.getMarketSentiment();
      res.json({
        success: true,
        data: sentiment
      });
    } catch (error) {
      this.logger.error('Failed to get market sentiment', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch market sentiment' 
      });
    }
  };

  getMarketData = async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0, sort = 'market_cap' } = req.query;
      const data = await this.marketService.getMarketData({
        limit: Number(limit),
        offset: Number(offset),
        sort: sort as string
      });

      res.json({
        success: true,
        data,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: data.length
        }
      });
    } catch (error) {
      this.logger.error('Failed to get market data', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch market data' 
      });
    }
  };

  getCryptoDetails = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const details = await this.marketService.getCryptoDetails(symbol);
      
      if (!details) {
        res.status(404).json({
          success: false,
          error: 'Cryptocurrency not found'
        });
        return;
      }

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      this.logger.error('Failed to get crypto details', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch cryptocurrency details' 
      });
    }
  };

  getPriceHistory = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { interval, from, to } = req.query;
      
      const history = await this.marketService.getPriceHistory(symbol, {
        interval: interval as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined
      });

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      this.logger.error('Failed to get price history', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch price history' 
      });
    }
  };

  getOrderBook = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { depth = 20 } = req.query;
      
      const orderBook = await this.marketService.getOrderBook(symbol, Number(depth));

      res.json({
        success: true,
        data: orderBook
      });
    } catch (error) {
      this.logger.error('Failed to get order book', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch order book' 
      });
    }
  };

  getTradeHistory = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { limit = 100 } = req.query;
      
      const trades = await this.marketService.getTradeHistory(symbol, Number(limit));

      res.json({
        success: true,
        data: trades
      });
    } catch (error) {
      this.logger.error('Failed to get trade history', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch trade history' 
      });
    }
  };

  getTechnicalIndicators = async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { indicators } = req.query;
      
      const indicatorList = indicators 
        ? (indicators as string).split(',') 
        : ['rsi', 'macd', 'bollinger', 'ema'];
      
      const technicals = await this.technicalService.calculateIndicators(
        symbol, 
        indicatorList
      );

      res.json({
        success: true,
        data: technicals
      });
    } catch (error) {
      this.logger.error('Failed to get technical indicators', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate technical indicators' 
      });
    }
  };

  getMarketHeatmap = async (req: Request, res: Response) => {
    try {
      const { category = 'all' } = req.query;
      const heatmap = await this.marketService.generateHeatmap(category as string);

      res.json({
        success: true,
        data: heatmap
      });
    } catch (error) {
      this.logger.error('Failed to get market heatmap', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate market heatmap' 
      });
    }
  };

  getTrendingCryptos = async (_req: Request, res: Response) => {
    try {
      const trending = await this.marketService.getTrendingCryptos();

      res.json({
        success: true,
        data: trending
      });
    } catch (error) {
      this.logger.error('Failed to get trending cryptos', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch trending cryptocurrencies' 
      });
    }
  };

  getMarketMovers = async (req: Request, res: Response) => {
    try {
      const { type, timeframe = '24h' } = req.query;
      const movers = await this.marketService.getMarketMovers(
        type as 'gainers' | 'losers',
        timeframe as string
      );

      res.json({
        success: true,
        data: movers
      });
    } catch (error) {
      this.logger.error('Failed to get market movers', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch market movers' 
      });
    }
  };
}