import { SuperClaudeFramework } from './core/SuperClaudeFramework';
import { CryptoDataService } from './services/CryptoDataService';
import { TaskContext, TaskType, DashboardConfig } from './types';
import winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class AlphaTerminal {
  private framework: SuperClaudeFramework;
  private dataService: CryptoDataService;
  private logger: winston.Logger;
  private isInitialized: boolean = false;

  constructor(config?: {
    logLevel?: string;
    enableMockData?: boolean;
  }) {
    this.logger = winston.createLogger({
      level: config?.logLevel || process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: process.env.LOG_FILE || 'alpha-terminal.log' 
        })
      ]
    });

    this.framework = new SuperClaudeFramework({
      maxConcurrentPersonas: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5'),
      enableAutoRouting: true,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info'
    });

    this.dataService = new CryptoDataService({
      cacheTTL: parseInt(process.env.CACHE_TTL || '300') * 1000,
      logger: this.logger
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.framework.on('task:completed', (result) => {
      this.logger.info('Task completed', { 
        taskId: result.taskId, 
        persona: result.personaId 
      });
    });

    this.framework.on('task:failed', ({ error, personaId }) => {
      this.logger.error('Task failed', { error, personaId });
    });

    this.framework.on('persona:activated', (personaId) => {
      this.logger.debug(`Persona ${personaId} activated`);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.logger.info('Initializing AlphaTerminal...');

    try {
      // Test data service connectivity
      await this.dataService.getMarketMetrics();
      
      this.isInitialized = true;
      this.logger.info('AlphaTerminal initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AlphaTerminal', error);
      throw error;
    }
  }

  // Market Analysis Methods
  async getMarketOverview(): Promise<any> {
    const context: TaskContext = {
      description: 'Generate comprehensive market overview with key metrics and trends',
      type: TaskType.ANALYSIS,
      requirements: ['market-data', 'metrics', 'trends', 'visualization'],
      priority: 'medium'
    };

    const [marketData, metrics, anomalies] = await Promise.all([
      this.dataService.getMarketData(),
      this.dataService.getMarketMetrics(),
      this.dataService.detectMarketAnomalies()
    ]);

    const result = await this.framework.processTask(context);

    return {
      marketData: marketData.slice(0, 10), // Top 10 coins
      metrics,
      anomalies,
      analysis: result.result
    };
  }

  async analyzeToken(symbol: string): Promise<any> {
    const context: TaskContext = {
      description: `Perform comprehensive analysis of ${symbol} including technical indicators, market sentiment, and trading opportunities`,
      type: TaskType.TRADING,
      requirements: ['technical-analysis', 'sentiment-analysis', 'risk-assessment'],
      priority: 'high',
      domain: 'crypto-trading'
    };

    const [marketData, prediction] = await Promise.all([
      this.dataService.getMarketData([symbol]),
      this.dataService.predictPriceMovements(symbol)
    ]);

    const result = await this.framework.processTask(context);

    return {
      token: marketData[0],
      prediction,
      analysis: result.result
    };
  }

  async analyzeTokenFailures(days: number = 30): Promise<any> {
    const context: TaskContext = {
      description: `Analyze token failures and risk factors over the past ${days} days`,
      type: TaskType.ANALYSIS,
      requirements: ['risk-analysis', 'failure-patterns', 'predictive-modeling'],
      priority: 'high'
    };

    const result = await this.framework.processTask(context);
    
    // Mock failure analysis
    return {
      timeframe: `${days} days`,
      failurePatterns: [
        { pattern: 'Rug pull indicators', frequency: 15, severity: 'critical' },
        { pattern: 'Low liquidity warnings', frequency: 42, severity: 'high' },
        { pattern: 'Team abandonment signs', frequency: 8, severity: 'critical' }
      ],
      riskFactors: [
        'Anonymous teams',
        'No audit reports',
        'Concentrated holdings',
        'Low trading volume'
      ],
      analysis: result.result
    };
  }

  // Trading Methods
  async createTradingStrategy(params: {
    type: 'momentum' | 'arbitrage' | 'market-making';
    pairs: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }): Promise<any> {
    const context: TaskContext = {
      description: `Create ${params.type} trading strategy for ${params.pairs.join(', ')} with ${params.riskLevel} risk`,
      type: TaskType.TRADING,
      requirements: ['strategy-design', 'risk-management', 'backtesting'],
      priority: 'high',
      domain: 'algo-trading'
    };

    return await this.framework.processTask(context);
  }

  // Dashboard Methods
  async createDashboard(config: DashboardConfig): Promise<any> {
    const context: TaskContext = {
      description: 'Create Bloomberg-style crypto dashboard with real-time data feeds',
      type: TaskType.FRONTEND,
      requirements: ['dashboard', 'real-time', 'websocket', 'visualization'],
      priority: 'high',
      technicalStack: ['react', 'typescript', 'websocket', 'd3']
    };

    await this.framework.configureDashboard(config);
    return await this.framework.processTask(context);
  }

  // Command Execution
  async executeCommand(command: string): Promise<any> {
    return await this.framework.executeCommand(command);
  }

  // Utility Methods
  getSystemMetrics(): any {
    return {
      framework: this.framework.getMetrics(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activePersonas: this.framework.getActivePersonas()
    };
  }

  async runDiagnostics(): Promise<any> {
    const diagnostics = {
      framework: 'checking',
      dataService: 'checking',
      personas: 'checking',
      overall: 'checking'
    };

    try {
      // Test framework
      const testContext: TaskContext = {
        description: 'System diagnostic test',
        type: TaskType.TESTING,
        requirements: ['health-check'],
        priority: 'low'
      };
      
      await this.framework.processTask(testContext);
      diagnostics.framework = 'healthy';

      // Test data service
      await this.dataService.getMarketMetrics();
      diagnostics.dataService = 'healthy';

      // Test personas
      const activePersonas = this.framework.getActivePersonas();
      diagnostics.personas = activePersonas.length > 0 ? 'active' : 'ready';

      diagnostics.overall = 'healthy';
    } catch (error) {
      this.logger.error('Diagnostics failed', error);
      diagnostics.overall = 'unhealthy';
    }

    return diagnostics;
  }

  shutdown(): void {
    this.logger.info('Shutting down AlphaTerminal...');
    this.framework.shutdown();
    this.logger.info('AlphaTerminal shutdown complete');
  }
}

// Export singleton instance
export const alphaTerminal = new AlphaTerminal();

// Export for testing
export default AlphaTerminal;