import { EventEmitter } from 'events';
import { PersonaOrchestrator } from './PersonaOrchestrator';
import { CommandRouter } from './CommandRouter';
import { ContextAnalyzer } from './ContextAnalyzer';

export interface FrameworkConfig {
  maxConcurrentTasks?: number;
  personaTimeout?: number;
  enableLogging?: boolean;
}

export class SuperClaudeFramework extends EventEmitter {
  private orchestrator: PersonaOrchestrator;
  private router: CommandRouter;
  private analyzer: ContextAnalyzer;
  private config: FrameworkConfig;
  private isInitialized: boolean = false;

  constructor(config: FrameworkConfig = {}) {
    super();
    this.config = {
      maxConcurrentTasks: 5,
      personaTimeout: 30000,
      enableLogging: true,
      ...config
    };

    this.orchestrator = new PersonaOrchestrator();
    this.router = new CommandRouter(this.orchestrator);
    this.analyzer = new ContextAnalyzer();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Forward orchestrator events
    this.orchestrator.on('persona:activated', (data) => {
      if (this.config.enableLogging) {
        console.log(`🤖 Persona activated: ${data.persona} - ${data.task}`);
      }
      this.emit('persona:activated', data);
    });

    this.orchestrator.on('persona:deactivated', (persona) => {
      if (this.config.enableLogging) {
        console.log(`💤 Persona deactivated: ${persona}`);
      }
      this.emit('persona:deactivated', persona);
    });

    this.orchestrator.on('task:completed', (task) => {
      if (this.config.enableLogging) {
        console.log(`✅ Task completed: ${task.id}`);
      }
      this.emit('task:completed', task);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing SuperClaude Framework...');
    
    // Simulate initialization process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isInitialized = true;
    console.log('✅ SuperClaude Framework initialized');
    this.emit('framework:initialized');
  }

  async processTask(options: {
    input: string;
    context?: any;
    useAnalyzer?: boolean;
  }): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Framework not initialized. Call initialize() first.');
    }

    const { input, context = {}, useAnalyzer = true } = options;

    // Analyze context if enabled
    let analysisContext = context;
    if (useAnalyzer) {
      const analysis = this.analyzer.analyzeContext(input, context);
      analysisContext = { ...context, analysis };
    }

    // Process with orchestrator
    return await this.orchestrator.processTask(input, analysisContext);
  }

  async executeCommand(command: string, args: any = {}, context: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Framework not initialized. Call initialize() first.');
    }

    return await this.router.executeCommand(command, args, context);
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      activePersonas: this.orchestrator.getActivePersonas(),
      personaStatus: this.orchestrator.getPersonaStatus(),
      availableCommands: this.router.getAvailableCommands()
    };
  }

  subscribeToPersonaUpdates(callback: (update: any) => void): void {
    this.on('persona:activated', callback);
    this.on('persona:deactivated', callback);
  }

  // Convenience methods for common operations
  async analyzeTokenFailures(threshold: number = 90): Promise<any> {
    return await this.processTask({
      input: `Analyze token failures with ${threshold}% decline from ATH`,
      context: { projectType: 'crypto-analytics', domain: ['crypto', 'analytics'] }
    });
  }

  async createTradingDashboard(options: any = {}): Promise<any> {
    return await this.executeCommand('/dashboard', options, {
      projectType: 'dashboard',
      security: options.security || 'standard',
      performance: options.performance || 'high'
    });
  }

  async optimizePerformance(target: string): Promise<any> {
    return await this.executeCommand('/optimize', { target }, {
      projectType: 'optimization',
      performance: 'critical'
    });
  }
}