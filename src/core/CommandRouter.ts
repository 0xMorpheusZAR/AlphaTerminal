import { EventEmitter } from 'events';
import { PersonaOrchestrator } from './PersonaOrchestrator';
import { ContextAnalyzer, ContextAnalysis } from './ContextAnalyzer';
import { TaskContext, TaskResult, TaskType } from '../types';
import winston from 'winston';

interface CommandHandler {
  pattern: RegExp;
  handler: (args: any) => Promise<any>;
  description: string;
  personas: string[];
}

export class CommandRouter extends EventEmitter {
  private commands: Map<string, CommandHandler>;
  private shortcuts: Map<string, string>;

  constructor(
    private orchestrator: PersonaOrchestrator,
    private analyzer: ContextAnalyzer,
    private logger: winston.Logger
  ) {
    super();
    this.commands = new Map();
    this.shortcuts = new Map();
    this.initializeCommands();
    this.initializeShortcuts();
  }

  private initializeCommands(): void {
    // Market data commands
    this.registerCommand('market.overview', {
      pattern: /^market\s+overview$/i,
      handler: async () => this.handleMarketOverview(),
      description: 'Get market overview and key metrics',
      personas: ['data-analyst', 'trader']
    });

    this.registerCommand('market.heatmap', {
      pattern: /^market\s+heatmap$/i,
      handler: async (args) => this.handleMarketHeatmap(args),
      description: 'Display market heatmap',
      personas: ['frontend', 'data-analyst']
    });

    // Trading commands
    this.registerCommand('trade.analyze', {
      pattern: /^trade\s+analyze\s+(.+)$/i,
      handler: async (args) => this.handleTradeAnalysis(args),
      description: 'Analyze trading opportunity',
      personas: ['trader', 'data-analyst']
    });

    this.registerCommand('portfolio.status', {
      pattern: /^portfolio\s+status$/i,
      handler: async () => this.handlePortfolioStatus(),
      description: 'Get portfolio status and performance',
      personas: ['trader', 'data-analyst']
    });

    // Dashboard commands
    this.registerCommand('dashboard.create', {
      pattern: /^dashboard\s+create\s+(.+)$/i,
      handler: async (args) => this.handleDashboardCreate(args),
      description: 'Create new dashboard configuration',
      personas: ['frontend', 'ux-designer']
    });

    this.registerCommand('dashboard.widget', {
      pattern: /^dashboard\s+widget\s+add\s+(.+)$/i,
      handler: async (args) => this.handleWidgetAdd(args),
      description: 'Add widget to dashboard',
      personas: ['frontend']
    });

    // Data commands
    this.registerCommand('data.stream', {
      pattern: /^data\s+stream\s+(.+)$/i,
      handler: async (args) => this.handleDataStream(args),
      description: 'Start data streaming for symbol',
      personas: ['data-engineer', 'backend']
    });

    this.registerCommand('data.historical', {
      pattern: /^data\s+historical\s+(.+)$/i,
      handler: async (args) => this.handleHistoricalData(args),
      description: 'Fetch historical data',
      personas: ['data-engineer', 'data-analyst']
    });

    // System commands
    this.registerCommand('system.status', {
      pattern: /^system\s+status$/i,
      handler: async () => this.handleSystemStatus(),
      description: 'Get system status and metrics',
      personas: ['devops', 'performance']
    });

    this.registerCommand('system.optimize', {
      pattern: /^system\s+optimize$/i,
      handler: async () => this.handleSystemOptimize(),
      description: 'Run system optimization',
      personas: ['performance', 'backend']
    });

    // Security commands
    this.registerCommand('security.audit', {
      pattern: /^security\s+audit$/i,
      handler: async () => this.handleSecurityAudit(),
      description: 'Run security audit',
      personas: ['security']
    });

    // Help command
    this.registerCommand('help', {
      pattern: /^help$/i,
      handler: async () => this.handleHelp(),
      description: 'Show available commands',
      personas: ['architect']
    });
  }

  private initializeShortcuts(): void {
    this.shortcuts.set('mo', 'market overview');
    this.shortcuts.set('mh', 'market heatmap');
    this.shortcuts.set('ps', 'portfolio status');
    this.shortcuts.set('ss', 'system status');
    this.shortcuts.set('h', 'help');
  }

  private registerCommand(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  async executeCommand(command: string, args?: any): Promise<any> {
    this.logger.info('Executing command', { command, args });

    // Check for shortcuts
    const expandedCommand = this.expandShortcut(command);
    
    // Find matching command
    for (const [name, handler] of this.commands) {
      const match = expandedCommand.match(handler.pattern);
      if (match) {
        try {
          const result = await handler.handler({ match, ...args });
          this.emit('command:executed', name, result);
          return result;
        } catch (error) {
          this.logger.error('Command execution failed', { command: name, error });
          this.emit('command:failed', name, error);
          throw error;
        }
      }
    }

    throw new Error(`Unknown command: ${command}`);
  }

  private expandShortcut(command: string): string {
    const parts = command.split(' ');
    const shortcut = parts[0].toLowerCase();
    
    if (this.shortcuts.has(shortcut)) {
      parts[0] = this.shortcuts.get(shortcut)!;
      return parts.join(' ');
    }
    
    return command;
  }

  async routeTask(context: TaskContext, analysis: ContextAnalysis): Promise<TaskResult> {
    this.logger.info('Routing task based on analysis', { 
      primaryDomain: analysis.primaryDomain,
      suggestedPersonas: analysis.suggestedPersonas 
    });

    // Handle collaborative tasks
    if (analysis.requiresCollaboration) {
      return await this.handleCollaborativeTask(context, analysis);
    }

    // Route to best persona
    const scores = await this.orchestrator.evaluatePersonas(context);
    const bestMatch = scores[0];

    if (bestMatch.score < 0.3) {
      this.logger.warn('Low confidence score for all personas', { bestMatch });
    }

    return await this.orchestrator.executeTask(bestMatch.personaId, context);
  }

  private async handleCollaborativeTask(
    context: TaskContext, 
    analysis: ContextAnalysis
  ): Promise<TaskResult> {
    this.logger.info('Handling collaborative task', { 
      personas: analysis.suggestedPersonas 
    });

    const results: TaskResult[] = [];
    
    // Execute tasks with suggested personas in sequence
    for (const personaId of analysis.suggestedPersonas) {
      try {
        const result = await this.orchestrator.executeTask(personaId, {
          ...context,
          description: `[${personaId}] ${context.description}`
        });
        results.push(result);
      } catch (error) {
        this.logger.error(`Persona ${personaId} failed in collaboration`, error);
      }
    }

    // Aggregate results
    return {
      taskId: `collab_${Date.now()}`,
      personaId: 'collaborative',
      status: 'completed',
      result: {
        personas: analysis.suggestedPersonas,
        individualResults: results,
        summary: 'Collaborative task completed'
      },
      startTime: results[0]?.startTime || new Date(),
      endTime: new Date()
    };
  }

  // Command Handlers
  private async handleMarketOverview(): Promise<any> {
    const context: TaskContext = {
      description: 'Fetch and analyze current market overview',
      type: TaskType.ANALYSIS,
      requirements: ['market-data', 'analytics', 'real-time'],
      priority: 'medium'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleMarketHeatmap(_args: any): Promise<any> {
    const context: TaskContext = {
      description: 'Generate market heatmap visualization',
      type: TaskType.FRONTEND,
      requirements: ['visualization', 'heatmap', 'real-time-data'],
      priority: 'medium',
      technicalStack: ['d3', 'react']
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleTradeAnalysis(args: any): Promise<any> {
    const symbol = args.match[1];
    const context: TaskContext = {
      description: `Analyze trading opportunity for ${symbol}`,
      type: TaskType.TRADING,
      requirements: ['technical-analysis', 'risk-assessment', 'market-data'],
      priority: 'high',
      domain: 'crypto-trading'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handlePortfolioStatus(): Promise<any> {
    const context: TaskContext = {
      description: 'Get current portfolio status and performance metrics',
      type: TaskType.TRADING,
      requirements: ['portfolio-analysis', 'performance-metrics', 'risk-metrics'],
      priority: 'medium'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleDashboardCreate(args: any): Promise<any> {
    const config = args.match[1];
    const context: TaskContext = {
      description: `Create new dashboard with configuration: ${config}`,
      type: TaskType.FRONTEND,
      requirements: ['dashboard', 'ui-components', 'layout', 'real-time'],
      priority: 'high',
      technicalStack: ['react', 'typescript', 'websocket']
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleWidgetAdd(args: any): Promise<any> {
    const widgetType = args.match[1];
    const context: TaskContext = {
      description: `Add ${widgetType} widget to dashboard`,
      type: TaskType.FRONTEND,
      requirements: ['widget', 'dashboard', 'real-time-updates'],
      priority: 'medium',
      technicalStack: ['react', 'typescript']
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleDataStream(args: any): Promise<any> {
    const symbol = args.match[1];
    const context: TaskContext = {
      description: `Start real-time data streaming for ${symbol}`,
      type: TaskType.DATA_INTEGRATION,
      requirements: ['websocket', 'data-streaming', 'real-time'],
      priority: 'high',
      technicalStack: ['websocket', 'nodejs']
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleHistoricalData(args: any): Promise<any> {
    const params = args.match[1];
    const context: TaskContext = {
      description: `Fetch historical data with parameters: ${params}`,
      type: TaskType.DATA_INTEGRATION,
      requirements: ['historical-data', 'api-integration', 'data-processing'],
      priority: 'medium'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleSystemStatus(): Promise<any> {
    const context: TaskContext = {
      description: 'Get comprehensive system status and metrics',
      type: TaskType.PERFORMANCE,
      requirements: ['monitoring', 'metrics', 'system-health'],
      priority: 'medium'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleSystemOptimize(): Promise<any> {
    const context: TaskContext = {
      description: 'Run system optimization and performance tuning',
      type: TaskType.PERFORMANCE,
      requirements: ['optimization', 'performance-tuning', 'caching'],
      priority: 'high'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleSecurityAudit(): Promise<any> {
    const context: TaskContext = {
      description: 'Perform comprehensive security audit',
      type: TaskType.SECURITY,
      requirements: ['security-scan', 'vulnerability-assessment', 'compliance-check'],
      priority: 'critical'
    };

    return await this.routeTask(context, await this.analyzer.analyze(context));
  }

  private async handleHelp(): Promise<any> {
    const commandList = Array.from(this.commands.entries()).map(([name, cmd]) => ({
      name,
      description: cmd.description,
      pattern: cmd.pattern.source
    }));

    const shortcutList = Array.from(this.shortcuts.entries()).map(([short, full]) => ({
      shortcut: short,
      command: full
    }));

    return {
      commands: commandList,
      shortcuts: shortcutList,
      usage: 'Type a command or use a shortcut. Example: "market overview" or "mo"'
    };
  }

  getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}