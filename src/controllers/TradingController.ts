import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import winston from 'winston';

export class TradingController {
  private logger: winston.Logger;
  private strategies: Map<string, any> = new Map();
  private orders: Map<string, any> = new Map();
  private trades: any[] = [];

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Pre-populate with strategy templates
    const templates = [
      {
        id: 'template_momentum',
        name: 'Momentum Trading',
        type: 'momentum',
        description: 'Buy high, sell higher - follows strong trends',
        parameters: {
          rsiThreshold: 70,
          volumeMultiplier: 2,
          stopLoss: 0.05,
          takeProfit: 0.15
        }
      },
      {
        id: 'template_arbitrage',
        name: 'Exchange Arbitrage',
        type: 'arbitrage',
        description: 'Exploit price differences across exchanges',
        parameters: {
          minSpread: 0.005,
          maxPositionSize: 10000,
          executionSpeed: 'fast'
        }
      },
      {
        id: 'template_grid',
        name: 'Grid Trading',
        type: 'market-making',
        description: 'Place buy and sell orders at regular intervals',
        parameters: {
          gridLevels: 10,
          gridSpacing: 0.01,
          orderSize: 100
        }
      }
    ];

    templates.forEach(t => this.strategies.set(t.id, t));
  }

  getStrategyTemplates = async (_req: Request, res: Response) => {
    try {
      const templates = Array.from(this.strategies.values())
        .filter(s => s.id.startsWith('template_'));

      res.json({ success: true, data: templates });
    } catch (error) {
      this.logger.error('Failed to get strategy templates', error);
      res.status(500).json({ success: false, error: 'Failed to fetch strategy templates' });
    }
  };

  getStrategyPerformance = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const strategy = this.strategies.get(id);

      if (!strategy) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      const performance = {
        strategyId: id,
        totalTrades: Math.floor(Math.random() * 1000),
        winRate: Math.random() * 0.3 + 0.5,
        profitFactor: 1 + Math.random() * 2,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: -Math.random() * 0.3,
        totalPnl: (Math.random() - 0.3) * 100000,
        avgPnlPerTrade: (Math.random() - 0.3) * 100,
        bestTrade: Math.random() * 5000,
        worstTrade: -Math.random() * 2000,
        avgHoldTime: Math.floor(Math.random() * 24) + ' hours',
        currentPositions: Math.floor(Math.random() * 5)
      };

      res.json({ success: true, data: performance });
    } catch (error) {
      this.logger.error('Failed to get strategy performance', error);
      res.status(500).json({ success: false, error: 'Failed to fetch strategy performance' });
    }
  };

  getUserStrategies = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const strategies = Array.from(this.strategies.values())
        .filter(s => s.userId === userId && !s.id.startsWith('template_'));

      res.json({ success: true, data: strategies });
    } catch (error) {
      this.logger.error('Failed to get user strategies', error);
      res.status(500).json({ success: false, error: 'Failed to fetch strategies' });
    }
  };

  createStrategy = async (req: AuthRequest, res: Response) => {
    try {
      const { name, type, pairs, parameters } = req.body;
      const userId = req.user?.id;

      const strategy = {
        id: `strategy_${Date.now()}`,
        userId,
        name,
        type,
        status: 'paused',
        pairs,
        parameters,
        createdAt: new Date(),
        performance: {
          totalTrades: 0,
          winRate: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          totalPnl: 0,
          avgPnlPerTrade: 0
        }
      };

      this.strategies.set(strategy.id, strategy);

      res.json({ success: true, data: strategy });
    } catch (error) {
      this.logger.error('Failed to create strategy', error);
      res.status(500).json({ success: false, error: 'Failed to create strategy' });
    }
  };

  updateStrategy = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { parameters, status } = req.body;
      const userId = req.user?.id;

      const strategy = this.strategies.get(id);
      if (!strategy || strategy.userId !== userId) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      if (parameters) strategy.parameters = { ...strategy.parameters, ...parameters };
      if (status) strategy.status = status;

      this.strategies.set(id, strategy);

      res.json({ success: true, data: strategy });
    } catch (error) {
      this.logger.error('Failed to update strategy', error);
      res.status(500).json({ success: false, error: 'Failed to update strategy' });
    }
  };

  deleteStrategy = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const strategy = this.strategies.get(id);
      if (!strategy || strategy.userId !== userId) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      if (strategy.status === 'active') {
        res.status(400).json({ success: false, error: 'Cannot delete active strategy' });
        return;
      }

      this.strategies.delete(id);

      res.json({ success: true, message: 'Strategy deleted successfully' });
    } catch (error) {
      this.logger.error('Failed to delete strategy', error);
      res.status(500).json({ success: false, error: 'Failed to delete strategy' });
    }
  };

  startStrategy = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const strategy = this.strategies.get(id);
      if (!strategy || strategy.userId !== userId) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      strategy.status = 'active';
      strategy.startedAt = new Date();
      this.strategies.set(id, strategy);

      // Simulate strategy execution
      this.simulateStrategyExecution(id);

      res.json({ success: true, data: strategy });
    } catch (error) {
      this.logger.error('Failed to start strategy', error);
      res.status(500).json({ success: false, error: 'Failed to start strategy' });
    }
  };

  stopStrategy = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const strategy = this.strategies.get(id);
      if (!strategy || strategy.userId !== userId) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      strategy.status = 'paused';
      strategy.stoppedAt = new Date();
      this.strategies.set(id, strategy);

      res.json({ success: true, data: strategy });
    } catch (error) {
      this.logger.error('Failed to stop strategy', error);
      res.status(500).json({ success: false, error: 'Failed to stop strategy' });
    }
  };

  backtest = async (req: AuthRequest, res: Response) => {
    try {
      const { strategyId, startDate, endDate, initialCapital } = req.body;
      const userId = req.user?.id;

      const strategy = this.strategies.get(strategyId);
      if (!strategy || strategy.userId !== userId) {
        res.status(404).json({ success: false, error: 'Strategy not found' });
        return;
      }

      // Simulate backtesting results
      const results = {
        strategyId,
        period: { start: startDate, end: endDate },
        initialCapital,
        finalCapital: initialCapital * (1 + (Math.random() - 0.3)),
        totalTrades: Math.floor(Math.random() * 500),
        winningTrades: Math.floor(Math.random() * 300),
        losingTrades: Math.floor(Math.random() * 200),
        profitFactor: 1 + Math.random() * 2,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: -Math.random() * 0.4,
        avgWin: Math.random() * 1000,
        avgLoss: -Math.random() * 500,
        bestMonth: (Math.random() * 30).toFixed(2) + '%',
        worstMonth: (-Math.random() * 20).toFixed(2) + '%',
        monthlyReturns: this.generateMonthlyReturns(),
        equityCurve: this.generateEquityCurve(initialCapital)
      };

      res.json({ success: true, data: results });
    } catch (error) {
      this.logger.error('Failed to backtest', error);
      res.status(500).json({ success: false, error: 'Failed to run backtest' });
    }
  };

  getTradingSignals = async (req: AuthRequest, res: Response) => {
    try {
      const { strategy, pair, timeframe } = req.query;
      
      const signals = this.generateTradingSignals(
        strategy as string,
        pair as string,
        timeframe as string
      );

      res.json({ success: true, data: signals });
    } catch (error) {
      this.logger.error('Failed to get trading signals', error);
      res.status(500).json({ success: false, error: 'Failed to fetch trading signals' });
    }
  };

  getRiskLimits = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      
      // Mock risk limits
      const limits = {
        userId,
        maxPositionSize: 50000,
        maxDrawdown: 0.2,
        dailyLossLimit: 5000,
        maxOpenPositions: 10,
        marginUsageLimit: 0.8,
        currentUsage: {
          positionSize: Math.random() * 30000,
          drawdown: Math.random() * 0.1,
          dailyLoss: Math.random() * 2000,
          openPositions: Math.floor(Math.random() * 5),
          marginUsage: Math.random() * 0.5
        }
      };

      res.json({ success: true, data: limits });
    } catch (error) {
      this.logger.error('Failed to get risk limits', error);
      res.status(500).json({ success: false, error: 'Failed to fetch risk limits' });
    }
  };

  updateRiskLimits = async (req: AuthRequest, res: Response) => {
    try {
      const updates = req.body;
      
      // In a real app, save to database
      res.json({ 
        success: true, 
        data: { ...updates, updated: true },
        message: 'Risk limits updated successfully' 
      });
    } catch (error) {
      this.logger.error('Failed to update risk limits', error);
      res.status(500).json({ success: false, error: 'Failed to update risk limits' });
    }
  };

  getTradeHistory = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { strategyId, from, to, status } = req.query;
      
      let trades = this.trades.filter(t => t.userId === userId);
      
      if (strategyId) trades = trades.filter(t => t.strategyId === strategyId);
      if (status) trades = trades.filter(t => t.status === status);
      if (from) trades = trades.filter(t => new Date(t.timestamp) >= new Date(from as string));
      if (to) trades = trades.filter(t => new Date(t.timestamp) <= new Date(to as string));

      res.json({ success: true, data: trades });
    } catch (error) {
      this.logger.error('Failed to get trade history', error);
      res.status(500).json({ success: false, error: 'Failed to fetch trade history' });
    }
  };

  createOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { pair, type, side, quantity, price, stopPrice } = req.body;
      const userId = req.user?.id;

      const order = {
        id: `order_${Date.now()}`,
        userId,
        pair,
        type,
        side,
        quantity,
        price: price || 'market',
        stopPrice,
        status: 'pending',
        createdAt: new Date(),
        fills: []
      };

      this.orders.set(order.id, order);

      // Simulate order execution
      setTimeout(() => this.executeOrder(order.id), Math.random() * 3000);

      res.json({ success: true, data: order });
    } catch (error) {
      this.logger.error('Failed to create order', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  };

  cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const order = this.orders.get(id);
      if (!order || order.userId !== userId) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }

      if (order.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Cannot cancel executed order' });
        return;
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      this.orders.set(id, order);

      res.json({ success: true, data: order });
    } catch (error) {
      this.logger.error('Failed to cancel order', error);
      res.status(500).json({ success: false, error: 'Failed to cancel order' });
    }
  };

  togglePaperTrading = async (req: AuthRequest, res: Response) => {
    try {
      const { enabled } = req.body;
      // const userId = req.user?.id; // Available when implementing user preferences

      // In a real app, save user preference
      res.json({ 
        success: true, 
        data: { 
          paperTradingEnabled: enabled,
          message: enabled ? 'Paper trading enabled' : 'Live trading enabled (BE CAREFUL!)'
        }
      });
    } catch (error) {
      this.logger.error('Failed to toggle paper trading', error);
      res.status(500).json({ success: false, error: 'Failed to toggle paper trading' });
    }
  };

  // Helper methods
  private simulateStrategyExecution(strategyId: string): void {
    // Simulate periodic trade execution
    const interval = setInterval(() => {
      const strategy = this.strategies.get(strategyId);
      if (!strategy || strategy.status !== 'active') {
        clearInterval(interval);
        return;
      }

      // Create mock trade
      const trade = {
        id: `trade_${Date.now()}`,
        userId: strategy.userId,
        strategyId,
        pair: strategy.pairs[Math.floor(Math.random() * strategy.pairs.length)],
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity: Math.random() * 1000,
        price: Math.random() * 100,
        pnl: (Math.random() - 0.5) * 1000,
        status: 'closed',
        timestamp: new Date()
      };

      this.trades.push(trade);

      // Update strategy performance
      strategy.performance.totalTrades++;
      if (trade.pnl > 0) {
        strategy.performance.winRate = 
          (strategy.performance.winRate * (strategy.performance.totalTrades - 1) + 1) / 
          strategy.performance.totalTrades;
      }
      strategy.performance.totalPnl += trade.pnl;
      
      this.strategies.set(strategyId, strategy);
    }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds
  }

  private executeOrder(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'pending') return;

    order.status = 'filled';
    order.executedAt = new Date();
    order.executedPrice = order.price === 'market' 
      ? Math.random() * 100 
      : order.price * (1 + (Math.random() - 0.5) * 0.001);
    
    this.orders.set(orderId, order);

    // Create trade record
    const trade = {
      id: `trade_${Date.now()}`,
      userId: order.userId,
      orderId,
      pair: order.pair,
      side: order.side,
      quantity: order.quantity,
      price: order.executedPrice,
      pnl: 0,
      status: 'open',
      timestamp: new Date()
    };

    this.trades.push(trade);
  }

  private generateTradingSignals(strategy?: string, pair?: string, timeframe?: string): any[] {
    const signals = [];
    const pairs = pair ? [pair] : ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    const actions = ['buy', 'sell', 'hold'];
    
    for (const p of pairs) {
      signals.push({
        pair: p,
        action: actions[Math.floor(Math.random() * actions.length)],
        strength: Math.random(),
        strategy: strategy || 'momentum',
        timeframe: timeframe || '1h',
        indicators: {
          rsi: Math.random() * 100,
          macd: (Math.random() - 0.5) * 10,
          volume: Math.random() > 0.5 ? 'above_average' : 'below_average'
        },
        price: Math.random() * 50000,
        target: Math.random() * 55000,
        stopLoss: Math.random() * 45000,
        confidence: Math.random() * 0.4 + 0.6,
        timestamp: new Date()
      });
    }
    
    return signals;
  }

  private generateMonthlyReturns(): any[] {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      return: (Math.random() - 0.3) * 30
    }));
  }

  private generateEquityCurve(initialCapital: number): any[] {
    const curve = [{ date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), value: initialCapital }];
    let currentValue = initialCapital;
    
    for (let i = 1; i <= 365; i++) {
      const dailyReturn = (Math.random() - 0.48) * 0.03;
      currentValue *= (1 + dailyReturn);
      
      if (i % 7 === 0) { // Weekly data points
        curve.push({
          date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
          value: currentValue
        });
      }
    }
    
    return curve;
  }
}