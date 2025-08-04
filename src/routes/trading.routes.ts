import { Router } from 'express';
import { TradingController } from '../controllers/TradingController';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const tradingController = new TradingController();

// Public routes
router.get('/strategies/templates', tradingController.getStrategyTemplates);
router.get('/strategies/performance/:id',
  param('id').isString(),
  validateRequest,
  tradingController.getStrategyPerformance
);

// Protected routes
router.use(authMiddleware);

// Strategy Management
router.get('/strategies', tradingController.getUserStrategies);
router.post('/strategies',
  body('name').isString(),
  body('type').isIn(['momentum', 'arbitrage', 'market-making', 'mean-reversion', 'trend-following']),
  body('pairs').isArray().notEmpty(),
  body('parameters').isObject(),
  validateRequest,
  tradingController.createStrategy
);

router.put('/strategies/:id',
  param('id').isString(),
  body('parameters').optional().isObject(),
  body('status').optional().isIn(['active', 'paused']),
  validateRequest,
  tradingController.updateStrategy
);

router.delete('/strategies/:id',
  param('id').isString(),
  validateRequest,
  tradingController.deleteStrategy
);

// Strategy Execution
router.post('/strategies/:id/start',
  param('id').isString(),
  validateRequest,
  tradingController.startStrategy
);

router.post('/strategies/:id/stop',
  param('id').isString(),
  validateRequest,
  tradingController.stopStrategy
);

// Backtesting
router.post('/backtest',
  body('strategyId').isString(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('initialCapital').isFloat({ min: 0 }),
  validateRequest,
  tradingController.backtest
);

// Trading Signals
router.get('/signals',
  query('strategy').optional().isString(),
  query('pair').optional().isString(),
  query('timeframe').optional().isIn(['1m', '5m', '15m', '1h', '4h', '1d']),
  validateRequest,
  tradingController.getTradingSignals
);

// Risk Management
router.get('/risk/limits', tradingController.getRiskLimits);
router.put('/risk/limits',
  body('maxPositionSize').optional().isFloat({ min: 0 }),
  body('maxDrawdown').optional().isFloat({ min: 0, max: 1 }),
  body('dailyLossLimit').optional().isFloat({ min: 0 }),
  validateRequest,
  tradingController.updateRiskLimits
);

// Trade History
router.get('/trades',
  query('strategyId').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('status').optional().isIn(['open', 'closed', 'cancelled']),
  validateRequest,
  tradingController.getTradeHistory
);

// Order Management
router.post('/orders',
  body('pair').isString(),
  body('type').isIn(['market', 'limit', 'stop', 'stop-limit']),
  body('side').isIn(['buy', 'sell']),
  body('quantity').isFloat({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stopPrice').optional().isFloat({ min: 0 }),
  validateRequest,
  tradingController.createOrder
);

router.delete('/orders/:id',
  param('id').isString(),
  validateRequest,
  tradingController.cancelOrder
);

// Paper Trading
router.post('/paper-trade',
  body('enabled').isBoolean(),
  validateRequest,
  tradingController.togglePaperTrading
);

export default router;