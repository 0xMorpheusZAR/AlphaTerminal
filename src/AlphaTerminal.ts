import { SuperClaudeFramework } from './core/SuperClaudeFramework';
import { CryptoDataService } from './services/CryptoDataService.js';

export class AlphaTerminal {
  public framework: SuperClaudeFramework;
  private cryptoService: CryptoDataService;
  private isInitialized: boolean = false;

  constructor() {
    this.framework = new SuperClaudeFramework({
      maxConcurrentTasks: 5,
      personaTimeout: 30000,
      enableLogging: true
    });
    
    this.cryptoService = new CryptoDataService();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Forward framework events
    this.framework.on('persona:activated', (data) => {
      console.log(`🎭 Persona ${data.persona} activated for: ${data.task}`);
    });

    this.framework.on('task:completed', (task) => {
      console.log(`✅ Task ${task.id} completed by: ${task.assignedPersonas.join(', ')}`);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing SuperClaude AlphaTerminal...');
    
    // Initialize framework
    await this.framework.initialize();
    
    // Initialize crypto data service
    await this.cryptoService.initialize();
    
    this.isInitialized = true;
    console.log('✨ AlphaTerminal ready for systematic persona invocation!');
  }

  // Core Features
  async analyzeTokenFailures(threshold: number = 90): Promise<any> {
    const result = await this.framework.processTask({
      input: `Analyze tokens that have declined ${threshold}% or more from their ATH`,
      context: {
        projectType: 'crypto-analytics',
        domain: ['crypto', 'analytics'],
        dataSource: 'coingecko'
      }
    });

    // Get actual market data
    const marketData = await this.cryptoService.getMarketData();
    const failedTokens = this.identifyFailedTokens(marketData, threshold);

    return {
      ...result,
      data: {
        failedTokens,
        totalAnalyzed: marketData.length,
        failureRate: (failedTokens.length / marketData.length) * 100
      }
    };
  }

  async createTradingDashboard(options: any = {}): Promise<any> {
    const defaultOptions = {
      components: ['market-heatmap', 'defi-metrics', 'real-time-news'],
      theme: 'dark',
      realtime: true
    };

    const config = { ...defaultOptions, ...options };

    return await this.framework.executeCommand('/dashboard', config, {
      projectType: 'dashboard',
      security: 'standard',
      performance: 'high'
    });
  }

  async monitorUnlockSchedule(): Promise<any> {
    return await this.framework.processTask({
      input: 'Monitor upcoming token unlock schedules and vesting events',
      context: {
        projectType: 'crypto-analytics',
        domain: ['crypto', 'analytics'],
        dataSource: 'velo'
      }
    });
  }

  async runMonteCarloSimulation(symbol: string, scenarios: number = 10000): Promise<any> {
    return await this.framework.processTask({
      input: `Run Monte Carlo simulation for ${symbol} with ${scenarios} scenarios`,
      context: {
        projectType: 'crypto-analytics',
        domain: ['crypto', 'analytics', 'simulation'],
        complexity: 'high'
      }
    });
  }

  async detectLiquiditySpikes(): Promise<any> {
    return await this.framework.processTask({
      input: 'Detect unusual liquidity spikes and volume anomalies across DEX protocols',
      context: {
        projectType: 'crypto-analytics',
        domain: ['crypto', 'analytics', 'defi'],
        dataSource: 'defillama'
      }
    });
  }

  // Event subscriptions
  subscribeToPersonaUpdates(callback: (update: any) => void): void {
    this.framework.subscribeToPersonaUpdates(callback);
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.framework.on(event, listener);
  }

  // Utility methods
  private identifyFailedTokens(marketData: any[], threshold: number): any[] {
    return marketData.filter(token => {
      // Mock calculation - in real implementation would use ATH data
      const currentPrice = token.current_price;
      const mockATH = currentPrice * (2 + Math.random() * 8); // Simulate ATH
      const decline = ((mockATH - currentPrice) / mockATH) * 100;
      
      return decline >= threshold;
    });
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      framework: this.framework.getStatus(),
      cryptoService: this.cryptoService.getStatus()
    };
  }
}

// Export singleton instance
export const alphaTerminal = new AlphaTerminal();