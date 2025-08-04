import { EventEmitter } from 'events';
import { PersonaOrchestrator } from './PersonaOrchestrator';
import { ContextAnalyzer } from './ContextAnalyzer';
import { CommandRouter } from './CommandRouter';
import { TaskContext, TaskResult, DashboardConfig } from '../types';
import winston from 'winston';

export class SuperClaudeFramework extends EventEmitter {
  private orchestrator: PersonaOrchestrator;
  private analyzer: ContextAnalyzer;
  private router: CommandRouter;
  private logger: winston.Logger;
  private config: {
    maxConcurrentPersonas: number;
    taskTimeout: number;
    enableAutoRouting: boolean;
    logLevel: string;
  };

  constructor(config?: Partial<SuperClaudeFramework['config']>) {
    super();
    
    this.config = {
      maxConcurrentPersonas: 5,
      taskTimeout: 300000, // 5 minutes
      enableAutoRouting: true,
      logLevel: 'info',
      ...config
    };

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ filename: 'alpha-terminal.log' })
      ]
    });

    this.orchestrator = new PersonaOrchestrator(this.config.maxConcurrentPersonas, this.logger);
    this.analyzer = new ContextAnalyzer(this.logger);
    this.router = new CommandRouter(this.orchestrator, this.analyzer, this.logger);

    this.initializeEventHandlers();
    this.logger.info('SuperClaude Framework initialized');
  }

  private initializeEventHandlers(): void {
    this.orchestrator.on('persona:activated', (personaId: string) => {
      this.logger.info(`Persona activated: ${personaId}`);
      this.emit('persona:activated', personaId);
    });

    this.orchestrator.on('persona:completed', (result: TaskResult) => {
      this.logger.info(`Persona completed task: ${result.personaId}`);
      this.emit('task:completed', result);
    });

    this.orchestrator.on('persona:failed', (error: Error, personaId: string) => {
      this.logger.error(`Persona failed: ${personaId}`, error);
      this.emit('task:failed', { error, personaId });
    });

    this.router.on('command:executed', (command: string, result: any) => {
      this.logger.debug(`Command executed: ${command}`);
      this.emit('command:executed', { command, result });
    });
  }

  async processTask(context: TaskContext): Promise<TaskResult> {
    this.logger.info('Processing task', { context });

    try {
      // Analyze context to determine best approach
      const analysis = await this.analyzer.analyze(context);
      
      // Route to appropriate handler
      if (this.config.enableAutoRouting) {
        return await this.router.routeTask(context, analysis);
      } else {
        // Manual persona selection
        const scores = await this.orchestrator.evaluatePersonas(context);
        const bestPersona = scores.reduce((prev, curr) => 
          prev.score > curr.score ? prev : curr
        );
        
        return await this.orchestrator.executeTask(
          bestPersona.personaId,
          context
        );
      }
    } catch (error) {
      this.logger.error('Task processing failed', error);
      throw error;
    }
  }

  async executeCommand(command: string, args?: any): Promise<any> {
    return await this.router.executeCommand(command, args);
  }

  async configureDashboard(config: DashboardConfig): Promise<void> {
    this.logger.info('Configuring dashboard', { config });
    this.emit('dashboard:configuring', config);
    
    // Dashboard configuration will be handled by specialized personas
    const context: TaskContext = {
      description: 'Configure Bloomberg-style dashboard',
      type: TaskType.FRONTEND,
      requirements: ['dashboard', 'ui', 'realtime'],
      priority: 'high',
      domain: 'crypto-trading',
      technicalStack: ['react', 'websocket', 'typescript']
    };

    await this.processTask(context);
    this.emit('dashboard:configured', config);
  }

  getActivePersonas(): string[] {
    return this.orchestrator.getActivePersonas();
  }

  getMetrics(): any {
    return {
      activePersonas: this.getActivePersonas().length,
      tasksProcessed: this.orchestrator.getTaskCount(),
      avgExecutionTime: this.orchestrator.getAverageExecutionTime(),
      successRate: this.orchestrator.getSuccessRate()
    };
  }

  shutdown(): void {
    this.logger.info('Shutting down SuperClaude Framework');
    this.orchestrator.shutdown();
    this.removeAllListeners();
  }
}

// Import TaskType here to avoid circular dependency
import { TaskType } from '../types';