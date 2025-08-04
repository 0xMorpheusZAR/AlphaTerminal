import { PersonaOrchestrator } from './PersonaOrchestrator';
import { CommandRouter } from './CommandRouter';
import { ContextAnalyzer } from './ContextAnalyzer';
import { EventEmitter } from 'events';

export interface FrameworkConfig {
  autoRoute: boolean;
  tokenOptimization: boolean;
  verboseLogging: boolean;
  maxConcurrentPersonas: number;
  contextCaching: boolean;
}

export interface TaskRequest {
  input: string;
  command?: string;
  context?: any;
  options?: Record<string, any>;
}

export interface TaskResponse {
  success: boolean;
  result: any;
  personasInvoked: string[];
  executionPath: string[];
  suggestions?: string[];
  metrics: {
    totalTime: number;
    personaTime: Record<string, number>;
    contextAnalysisTime: number;
  };
}

export class SuperClaudeFramework extends EventEmitter {
  private personaOrchestrator: PersonaOrchestrator;
  private commandRouter: CommandRouter;
  private contextAnalyzer: ContextAnalyzer;
  private config: FrameworkConfig;
  private executionHistory: TaskResponse[] = [];

  constructor(config?: Partial<FrameworkConfig>) {
    super();
    
    this.config = {
      autoRoute: true,
      tokenOptimization: true,
      verboseLogging: false,
      maxConcurrentPersonas: 3,
      contextCaching: true,
      ...config
    };

    this.personaOrchestrator = new PersonaOrchestrator();
    this.commandRouter = new CommandRouter(this.personaOrchestrator);
    this.contextAnalyzer = new ContextAnalyzer();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.personaOrchestrator.on('persona:invoked', (data) => {
      this.log('Persona invoked:', data.personaId);
      this.emit('persona:active', data);
    });

    this.personaOrchestrator.on('persona:completed', (data) => {
      this.log('Persona completed:', data.personaId);
      this.emit('persona:done', data);
    });

    this.commandRouter.on('command:start', (data) => {
      this.log('Command started:', data.command);
      this.emit('task:start', data);
    });

    this.commandRouter.on('command:complete', (data) => {
      this.log('Command completed:', data.command);
      this.emit('task:complete', data);
    });
  }

  async processTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();
    const executionPath: string[] = [];
    const personaTimes: Record<string, number> = {};

    try {
      // Step 1: Analyze context
      const contextStart = Date.now();
      const analysis = this.contextAnalyzer.analyzeTask(request.input, request.context);
      const contextAnalysisTime = Date.now() - contextStart;
      
      executionPath.push(`Context analyzed: ${analysis.taskContext.type} task in ${analysis.taskContext.domain}`);
      
      // Step 2: Determine routing strategy
      let result: any;
      let personasInvoked: string[] = [];

      if (request.command) {
        // Direct command routing
        executionPath.push(`Routing to command: ${request.command}`);
        const commandResult = await this.commandRouter.routeCommand(request.command, {
          input: request.input,
          options: request.options,
          context: analysis.taskContext
        });
        
        result = commandResult.output;
        personasInvoked = commandResult.personasUsed;
      } else if (this.config.autoRoute) {
        // Automatic persona selection
        executionPath.push('Auto-routing based on context analysis');
        
        const invocations = this.personaOrchestrator.analyzeContext(analysis.taskContext);
        const topPersonas = invocations
          .slice(0, this.config.maxConcurrentPersonas)
          .filter(inv => inv.confidence > 0.5);

        for (const invocation of topPersonas) {
          const personaStart = Date.now();
          executionPath.push(`Invoking ${invocation.personaId} (${(invocation.confidence * 100).toFixed(0)}% confidence)`);
          
          await this.personaOrchestrator.invokePersona(invocation.personaId, analysis.taskContext);
          personasInvoked.push(invocation.personaId);
          
          personaTimes[invocation.personaId] = Date.now() - personaStart;
        }

        result = {
          analysis,
          personaResults: invocations.map(inv => ({
            persona: inv.personaId,
            confidence: inv.confidence,
            reasoning: inv.reasoning,
            actions: inv.suggestedActions
          }))
        };
      } else {
        // Manual persona selection based on suggested personas
        executionPath.push('Manual routing based on suggested personas');
        
        for (const personaId of analysis.suggestedPersonas.slice(0, this.config.maxConcurrentPersonas)) {
          const personaStart = Date.now();
          executionPath.push(`Invoking suggested persona: ${personaId}`);
          
          await this.personaOrchestrator.invokePersona(personaId, analysis.taskContext);
          personasInvoked.push(personaId);
          
          personaTimes[personaId] = Date.now() - personaStart;
        }

        result = {
          analysis,
          personasUsed: personasInvoked
        };
      }

      const totalTime = Date.now() - startTime;

      const response: TaskResponse = {
        success: true,
        result,
        personasInvoked,
        executionPath,
        suggestions: this.generateSuggestions(analysis, personasInvoked),
        metrics: {
          totalTime,
          personaTime: personaTimes,
          contextAnalysisTime
        }
      };

      this.executionHistory.push(response);
      this.emit('task:success', response);
      
      return response;

    } catch (error) {
      const errorResponse: TaskResponse = {
        success: false,
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
        personasInvoked: [],
        executionPath: [...executionPath, `Error: ${error}`],
        metrics: {
          totalTime: Date.now() - startTime,
          personaTime: personaTimes,
          contextAnalysisTime: 0
        }
      };

      this.emit('task:error', errorResponse);
      return errorResponse;
    }
  }

  private generateSuggestions(analysis: any, personasInvoked: string[]): string[] {
    const suggestions: string[] = [];

    // Suggest complementary personas
    const suggestedButNotInvoked = analysis.suggestedPersonas.filter(
      (p: string) => !personasInvoked.includes(p)
    );

    if (suggestedButNotInvoked.length > 0) {
      suggestions.push(`Consider using: ${suggestedButNotInvoked.join(', ')}`);
    }

    // Task-specific suggestions
    if (analysis.taskContext.type === 'development' && !personasInvoked.includes('qa')) {
      suggestions.push('Run /test to ensure quality');
    }

    if (analysis.taskContext.complexity === 'high' && !personasInvoked.includes('architect')) {
      suggestions.push('Consider architectural review with /design');
    }

    if (analysis.projectContext?.projectType === 'crypto-analytics') {
      if (!personasInvoked.includes('performance')) {
        suggestions.push('Optimize for real-time data with /optimize');
      }
      if (!personasInvoked.includes('security')) {
        suggestions.push('Secure API keys and sensitive data with /secure');
      }
    }

    return suggestions;
  }

  async executeCommand(command: string, args: any): Promise<TaskResponse> {
    return this.processTask({
      command,
      input: args.input || '',
      options: args.options,
      context: args.context
    });
  }

  getAvailableCommands(): string[] {
    return this.commandRouter.getAvailableCommands().map(cmd => cmd.name);
  }

  getActivePersonas(): string[] {
    return this.personaOrchestrator.getActivePersonas();
  }

  getExecutionHistory(): TaskResponse[] {
    return [...this.executionHistory];
  }

  clearHistory(): void {
    this.executionHistory = [];
    this.personaOrchestrator.clearHistory();
  }

  updateConfig(config: Partial<FrameworkConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  private log(...args: any[]): void {
    if (this.config.verboseLogging) {
      console.log('[SuperClaude]', ...args);
    }
  }

  // AlphaTerminal specific methods
  async analyzeCryptoMarket(input: string): Promise<TaskResponse> {
    return this.processTask({
      input: `Analyze crypto market: ${input}`,
      context: {
        domain: 'crypto-analytics',
        features: ['market-analysis', 'trading-signals', 'defi-metrics']
      }
    });
  }

  async buildTradingDashboard(requirements: string): Promise<TaskResponse> {
    return this.processTask({
      command: '/build',
      input: `Create crypto trading dashboard: ${requirements}`,
      context: {
        projectType: 'crypto-analytics',
        components: ['charts', 'real-time-data', 'websockets']
      }
    });
  }

  async optimizeDataPipeline(description: string): Promise<TaskResponse> {
    return this.processTask({
      command: '/optimize',
      input: `Optimize crypto data pipeline: ${description}`,
      context: {
        focus: 'performance',
        requirements: ['low-latency', 'high-throughput', 'real-time']
      }
    });
  }

  async secureTradingAPI(apiDescription: string): Promise<TaskResponse> {
    return this.processTask({
      command: '/secure',
      input: `Secure trading API: ${apiDescription}`,
      context: {
        security: ['authentication', 'rate-limiting', 'encryption'],
        compliance: ['api-key-management', 'audit-logging']
      }
    });
  }
}

// Export singleton instance for easy usage
export const superclaude = new SuperClaudeFramework();

// Export types
export * from './PersonaOrchestrator';
export * from './CommandRouter';
export * from './ContextAnalyzer';