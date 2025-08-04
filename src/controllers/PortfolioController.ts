import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import winston from 'winston';

export class PortfolioController {
  private logger: winston.Logger;
  private portfolios: Map<string, any> = new Map(); // In-memory storage for demo

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  getPortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const portfolios = Array.from(this.portfolios.values())
        .filter(p => p.userId === userId);

      res.json({ success: true, data: portfolios });
    } catch (error) {
      this.logger.error('Failed to get portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to fetch portfolio' });
    }
  };

  createPortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { name, description } = req.body;
      
      const portfolio = {
        id: `portfolio_${Date.now()}`,
        userId,
        name: name || 'My Portfolio',
        description: description || '',
        holdings: [],
        totalValue: 0,
        totalCost: 0,
        pnl: 0,
        pnlPercentage: 0,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      this.portfolios.set(portfolio.id, portfolio);
      
      res.json({ success: true, data: portfolio });
    } catch (error) {
      this.logger.error('Failed to create portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to create portfolio' });
    }
  };

  updatePortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      Object.assign(portfolio, req.body, { lastUpdated: new Date() });
      this.portfolios.set(id, portfolio);
      
      res.json({ success: true, data: portfolio });
    } catch (error) {
      this.logger.error('Failed to update portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to update portfolio' });
    }
  };

  deletePortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      this.portfolios.delete(id);
      
      res.json({ success: true, message: 'Portfolio deleted successfully' });
    } catch (error) {
      this.logger.error('Failed to delete portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to delete portfolio' });
    }
  };

  addHolding = async (req: AuthRequest, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const { symbol, quantity, price } = req.body;
      
      const portfolio = this.portfolios.get(portfolioId);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      const holding = {
        symbol,
        quantity,
        averageCost: price,
        currentPrice: price * (1 + (Math.random() - 0.5) * 0.1),
        value: 0,
        pnl: 0,
        pnlPercentage: 0,
        allocation: 0
      };

      holding.value = holding.quantity * holding.currentPrice;
      holding.pnl = (holding.currentPrice - holding.averageCost) * holding.quantity;
      holding.pnlPercentage = ((holding.currentPrice - holding.averageCost) / holding.averageCost) * 100;

      portfolio.holdings.push(holding);
      this.updatePortfolioMetrics(portfolio);
      
      res.json({ success: true, data: holding });
    } catch (error) {
      this.logger.error('Failed to add holding', error);
      res.status(500).json({ success: false, error: 'Failed to add holding' });
    }
  };

  updateHolding = async (req: AuthRequest, res: Response) => {
    try {
      const { portfolioId, symbol } = req.params;
      const { quantity, averageCost } = req.body;
      
      const portfolio = this.portfolios.get(portfolioId);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      const holding = portfolio.holdings.find((h: any) => h.symbol === symbol);
      if (!holding) {
        res.status(404).json({ success: false, error: 'Holding not found' });
        return;
      }

      if (quantity !== undefined) holding.quantity = quantity;
      if (averageCost !== undefined) holding.averageCost = averageCost;
      
      this.updateHoldingMetrics(holding);
      this.updatePortfolioMetrics(portfolio);
      
      res.json({ success: true, data: holding });
    } catch (error) {
      this.logger.error('Failed to update holding', error);
      res.status(500).json({ success: false, error: 'Failed to update holding' });
    }
  };

  removeHolding = async (req: AuthRequest, res: Response) => {
    try {
      const { portfolioId, symbol } = req.params;
      
      const portfolio = this.portfolios.get(portfolioId);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      portfolio.holdings = portfolio.holdings.filter((h: any) => h.symbol !== symbol);
      this.updatePortfolioMetrics(portfolio);
      
      res.json({ success: true, message: 'Holding removed successfully' });
    } catch (error) {
      this.logger.error('Failed to remove holding', error);
      res.status(500).json({ success: false, error: 'Failed to remove holding' });
    }
  };

  getPerformance = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      const performance = {
        totalReturn: portfolio.pnl,
        totalReturnPercentage: portfolio.pnlPercentage,
        dailyReturn: portfolio.pnl * 0.01,
        dailyReturnPercentage: portfolio.pnlPercentage * 0.01,
        weeklyReturn: portfolio.pnl * 0.07,
        monthlyReturn: portfolio.pnl * 0.3,
        yearlyReturn: portfolio.pnl * 3.65,
        sharpeRatio: 1.5 + Math.random(),
        volatility: Math.random() * 0.3,
        maxDrawdown: -Math.random() * 0.2
      };

      res.json({ success: true, data: performance });
    } catch (error) {
      this.logger.error('Failed to get performance', error);
      res.status(500).json({ success: false, error: 'Failed to fetch performance' });
    }
  };

  getAllocation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      const allocation = portfolio.holdings.map((h: any) => ({
        symbol: h.symbol,
        allocation: h.allocation,
        value: h.value,
        quantity: h.quantity
      }));

      res.json({ success: true, data: allocation });
    } catch (error) {
      this.logger.error('Failed to get allocation', error);
      res.status(500).json({ success: false, error: 'Failed to fetch allocation' });
    }
  };

  getHistory = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      // Generate mock history
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        value: portfolio.totalValue * (1 + (Math.random() - 0.5) * 0.02 * (30 - i)),
        pnl: portfolio.pnl * (i / 30),
        transactions: Math.floor(Math.random() * 5)
      }));

      res.json({ success: true, data: history });
    } catch (error) {
      this.logger.error('Failed to get history', error);
      res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
  };

  optimizePortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { targetReturn, riskTolerance } = req.body;
      
      const portfolio = this.portfolios.get(id);
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      // Mock optimization results
      const optimization = {
        currentAllocation: portfolio.holdings.map((h: any) => ({
          symbol: h.symbol,
          current: h.allocation,
          recommended: Math.random() * 0.4 + 0.1
        })),
        expectedReturn: targetReturn || 0.15,
        expectedRisk: riskTolerance === 'low' ? 0.1 : riskTolerance === 'high' ? 0.3 : 0.2,
        sharpeRatio: 1.5 + Math.random(),
        recommendations: [
          'Increase allocation to BTC for stability',
          'Consider adding DeFi tokens for higher yield',
          'Reduce exposure to small-cap altcoins'
        ]
      };

      res.json({ success: true, data: optimization });
    } catch (error) {
      this.logger.error('Failed to optimize portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to optimize portfolio' });
    }
  };

  comparePortfolios = async (req: AuthRequest, res: Response) => {
    try {
      const { portfolioIds } = req.body;
      const userId = req.user?.id;
      
      const portfolios = portfolioIds
        .map((id: string) => this.portfolios.get(id))
        .filter((p: any) => p && p.userId === userId);

      if (portfolios.length === 0) {
        res.status(404).json({ success: false, error: 'No portfolios found' });
        return;
      }

      const comparison = portfolios.map((p: any) => ({
        id: p.id,
        name: p.name,
        totalValue: p.totalValue,
        pnl: p.pnl,
        pnlPercentage: p.pnlPercentage,
        holdingsCount: p.holdings.length,
        volatility: Math.random() * 0.3,
        sharpeRatio: 1 + Math.random() * 2
      }));

      res.json({ success: true, data: comparison });
    } catch (error) {
      this.logger.error('Failed to compare portfolios', error);
      res.status(500).json({ success: false, error: 'Failed to compare portfolios' });
    }
  };

  getRiskAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      const riskAnalysis = {
        overallRisk: Math.random() > 0.5 ? 'medium' : Math.random() > 0.3 ? 'low' : 'high',
        volatility: Math.random() * 0.3,
        beta: 0.8 + Math.random() * 0.4,
        valueAtRisk: portfolio.totalValue * 0.05,
        maxDrawdown: -Math.random() * 0.3,
        correlationMatrix: this.generateCorrelationMatrix(portfolio.holdings),
        riskFactors: [
          { factor: 'Market Risk', impact: 'high', score: Math.random() * 10 },
          { factor: 'Concentration Risk', impact: 'medium', score: Math.random() * 10 },
          { factor: 'Liquidity Risk', impact: 'low', score: Math.random() * 10 }
        ]
      };

      res.json({ success: true, data: riskAnalysis });
    } catch (error) {
      this.logger.error('Failed to get risk analysis', error);
      res.status(500).json({ success: false, error: 'Failed to fetch risk analysis' });
    }
  };

  exportPortfolio = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = this.portfolios.get(id);
      
      if (!portfolio || portfolio.userId !== req.user?.id) {
        res.status(404).json({ success: false, error: 'Portfolio not found' });
        return;
      }

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="portfolio_${id}.csv"`);

      // Generate CSV content
      let csv = 'Symbol,Quantity,Average Cost,Current Price,Value,P&L,P&L %,Allocation\n';
      portfolio.holdings.forEach((h: any) => {
        csv += `${h.symbol},${h.quantity},${h.averageCost},${h.currentPrice},${h.value},${h.pnl},${h.pnlPercentage},${h.allocation}\n`;
      });

      res.send(csv);
    } catch (error) {
      this.logger.error('Failed to export portfolio', error);
      res.status(500).json({ success: false, error: 'Failed to export portfolio' });
    }
  };

  // Helper methods
  private updateHoldingMetrics(holding: any): void {
    holding.value = holding.quantity * holding.currentPrice;
    holding.pnl = (holding.currentPrice - holding.averageCost) * holding.quantity;
    holding.pnlPercentage = ((holding.currentPrice - holding.averageCost) / holding.averageCost) * 100;
  }

  private updatePortfolioMetrics(portfolio: any): void {
    portfolio.totalValue = portfolio.holdings.reduce((sum: number, h: any) => sum + h.value, 0);
    portfolio.totalCost = portfolio.holdings.reduce((sum: number, h: any) => sum + (h.averageCost * h.quantity), 0);
    portfolio.pnl = portfolio.totalValue - portfolio.totalCost;
    portfolio.pnlPercentage = portfolio.totalCost > 0 ? (portfolio.pnl / portfolio.totalCost) * 100 : 0;
    
    // Update allocations
    portfolio.holdings.forEach((h: any) => {
      h.allocation = portfolio.totalValue > 0 ? (h.value / portfolio.totalValue) * 100 : 0;
    });
    
    portfolio.lastUpdated = new Date();
  }

  private generateCorrelationMatrix(holdings: any[]): any {
    const matrix: any = {};
    holdings.forEach(h1 => {
      matrix[h1.symbol] = {};
      holdings.forEach(h2 => {
        matrix[h1.symbol][h2.symbol] = h1.symbol === h2.symbol ? 1 : Math.random() * 0.8 - 0.4;
      });
    });
    return matrix;
  }
}