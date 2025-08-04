import { Router } from 'express';
import { DeFiController } from '../controllers/DeFiController';
import { validateRequest } from '../middleware/validation';
import { query, param } from 'express-validator';

const router = Router();
const defiController = new DeFiController();

// DeFi Overview
router.get('/overview', defiController.getDeFiOverview);

// Protocol TVL Rankings
router.get('/tvl',
  query('chain').optional().isString(),
  query('category').optional().isIn(['dex', 'lending', 'yield', 'derivatives', 'insurance']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  defiController.getTVLRankings
);

// Protocol Details
router.get('/protocol/:name',
  param('name').isString(),
  validateRequest,
  defiController.getProtocolDetails
);

// Yield Farming Opportunities
router.get('/yields',
  query('minApy').optional().isFloat({ min: 0 }),
  query('chain').optional().isString(),
  query('stablecoin').optional().isBoolean(),
  validateRequest,
  defiController.getYieldOpportunities
);

// Liquidity Pools
router.get('/pools',
  query('dex').optional().isString(),
  query('pair').optional().isString(),
  query('minLiquidity').optional().isFloat({ min: 0 }),
  validateRequest,
  defiController.getLiquidityPools
);

// DeFi Pulse Index
router.get('/pulse', defiController.getDeFiPulseIndex);

// Gas Prices
router.get('/gas',
  query('chain').optional().isIn(['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism']),
  validateRequest,
  defiController.getGasPrices
);

// Cross-chain Bridge Stats
router.get('/bridges', defiController.getBridgeStats);

// Lending Rates
router.get('/lending-rates',
  query('protocol').optional().isString(),
  query('asset').optional().isString(),
  validateRequest,
  defiController.getLendingRates
);

// Stablecoin Metrics
router.get('/stablecoins', defiController.getStablecoinMetrics);

export default router;