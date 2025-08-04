import { Router } from 'express';
import { PortfolioController } from '../controllers/PortfolioController';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const portfolioController = new PortfolioController();

// All portfolio routes require authentication
router.use(authMiddleware);

// Portfolio Management
router.get('/', portfolioController.getPortfolio);
router.post('/', portfolioController.createPortfolio);
router.put('/:id', 
  param('id').isString(),
  validateRequest,
  portfolioController.updatePortfolio
);
router.delete('/:id',
  param('id').isString(),
  validateRequest,
  portfolioController.deletePortfolio
);

// Holdings Management
router.post('/:portfolioId/holdings',
  param('portfolioId').isString(),
  body('symbol').isString(),
  body('quantity').isFloat({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  validateRequest,
  portfolioController.addHolding
);

router.put('/:portfolioId/holdings/:symbol',
  param('portfolioId').isString(),
  param('symbol').isString(),
  body('quantity').optional().isFloat({ min: 0 }),
  body('averageCost').optional().isFloat({ min: 0 }),
  validateRequest,
  portfolioController.updateHolding
);

router.delete('/:portfolioId/holdings/:symbol',
  param('portfolioId').isString(),
  param('symbol').isString(),
  validateRequest,
  portfolioController.removeHolding
);

// Portfolio Analytics
router.get('/:id/performance',
  param('id').isString(),
  validateRequest,
  portfolioController.getPerformance
);

router.get('/:id/allocation',
  param('id').isString(),
  validateRequest,
  portfolioController.getAllocation
);

router.get('/:id/history',
  param('id').isString(),
  validateRequest,
  portfolioController.getHistory
);

// Portfolio Optimization
router.post('/:id/optimize',
  param('id').isString(),
  body('targetReturn').optional().isFloat(),
  body('riskTolerance').optional().isIn(['low', 'medium', 'high']),
  validateRequest,
  portfolioController.optimizePortfolio
);

// Portfolio Comparison
router.post('/compare',
  body('portfolioIds').isArray().notEmpty(),
  validateRequest,
  portfolioController.comparePortfolios
);

// Risk Analysis
router.get('/:id/risk',
  param('id').isString(),
  validateRequest,
  portfolioController.getRiskAnalysis
);

// Export Portfolio
router.get('/:id/export',
  param('id').isString(),
  validateRequest,
  portfolioController.exportPortfolio
);

export default router;