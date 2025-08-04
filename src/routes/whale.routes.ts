import { Router } from 'express';
import { WhaleController } from '../controllers/WhaleController';
import { validateRequest } from '../middleware/validation';
import { query, param } from 'express-validator';

const router = Router();
const whaleController = new WhaleController();

// Whale Transactions
router.get('/transactions',
  query('minValue').optional().isFloat({ min: 100000 }),
  query('token').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('timeframe').optional().isIn(['1h', '24h', '7d']),
  validateRequest,
  whaleController.getWhaleTransactions
);

// Whale Wallets
router.get('/wallets',
  query('chain').optional().isString(),
  query('minBalance').optional().isFloat({ min: 0 }),
  validateRequest,
  whaleController.getWhaleWallets
);

// Whale Alerts
router.get('/alerts',
  query('threshold').optional().isFloat({ min: 100000 }),
  query('type').optional().isIn(['buy', 'sell', 'transfer']),
  validateRequest,
  whaleController.getWhaleAlerts
);

// Wallet Analysis
router.get('/wallet/:address',
  param('address').isString(),
  validateRequest,
  whaleController.analyzeWallet
);

// Whale Accumulation/Distribution
router.get('/flow',
  query('token').optional().isString(),
  query('period').optional().isIn(['24h', '7d', '30d']),
  validateRequest,
  whaleController.getWhaleFlow
);

// Smart Money Tracking
router.get('/smart-money',
  query('strategy').optional().isIn(['accumulation', 'distribution', 'rotation']),
  validateRequest,
  whaleController.getSmartMoneyMovements
);

// Exchange Flows
router.get('/exchange-flows',
  query('exchange').optional().isString(),
  query('direction').optional().isIn(['inflow', 'outflow']),
  validateRequest,
  whaleController.getExchangeFlows
);

// Whale Patterns
router.get('/patterns',
  query('pattern').optional().isIn(['accumulation', 'distribution', 'pump', 'dump']),
  validateRequest,
  whaleController.getWhalePatterns
);

export default router;