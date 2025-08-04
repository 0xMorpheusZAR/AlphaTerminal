import { Router } from 'express';
import { MarketController } from '../controllers/MarketController';
import { validateRequest } from '../middleware/validation';
import { param, query } from 'express-validator';

const router = Router();
const marketController = new MarketController();

// Market Overview Routes
router.get('/overview', marketController.getMarketOverview);
router.get('/metrics', marketController.getMarketMetrics);
router.get('/sentiment', marketController.getMarketSentiment);

// Cryptocurrency Data Routes
router.get('/data', 
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sort').optional().isIn(['market_cap', 'volume', 'price_change']),
  validateRequest,
  marketController.getMarketData
);

router.get('/data/:symbol',
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  validateRequest,
  marketController.getCryptoDetails
);

// Price History Routes
router.get('/history/:symbol',
  param('symbol').isString(),
  query('interval').isIn(['1m', '5m', '15m', '1h', '4h', '1d', '1w']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  validateRequest,
  marketController.getPriceHistory
);

// Order Book Routes
router.get('/orderbook/:symbol',
  param('symbol').isString(),
  query('depth').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  marketController.getOrderBook
);

// Trade History Routes
router.get('/trades/:symbol',
  param('symbol').isString(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  validateRequest,
  marketController.getTradeHistory
);

// Technical Analysis Routes
router.get('/technical/:symbol',
  param('symbol').isString(),
  query('indicators').optional().isString(),
  validateRequest,
  marketController.getTechnicalIndicators
);

// Market Heatmap Route
router.get('/heatmap',
  query('category').optional().isIn(['all', 'defi', 'gaming', 'layer1', 'layer2']),
  validateRequest,
  marketController.getMarketHeatmap
);

// Trending Cryptocurrencies
router.get('/trending', marketController.getTrendingCryptos);

// Market Movers
router.get('/movers',
  query('type').isIn(['gainers', 'losers']),
  query('timeframe').optional().isIn(['1h', '24h', '7d']),
  validateRequest,
  marketController.getMarketMovers
);

export default router;