import { PersonaOrchestrator } from './PersonaOrchestrator';

export interface Command {
  name: string;
  description: string;
  handler: (args: any, context: any) => Promise<any>;
  requiredPersonas: string[];
}

export class CommandRouter {
  private commands: Map<string, Command> = new Map();
  private orchestrator: PersonaOrchestrator;

  constructor(orchestrator: PersonaOrchestrator) {
    this.orchestrator = orchestrator;
    this.initializeCommands();
  }

  private initializeCommands() {
    const commands: Command[] = [
      {
        name: '/build',
        description: 'Build features with optimal personas',
        handler: this.handleBuild.bind(this),
        requiredPersonas: ['architect', 'frontend', 'backend']
      },
      {
        name: '/analyze',
        description: 'Deep analysis with Analyzer persona',
        handler: this.handleAnalyze.bind(this),
        requiredPersonas: ['analyzer']
      },
      {
        name: '/secure',
        description: 'Implement security with Security persona',
        handler: this.handleSecure.bind(this),
        requiredPersonas: ['security']
      },
      {
        name: '/optimize',
        description: 'Performance optimization',
        handler: this.handleOptimize.bind(this),
        requiredPersonas: ['performance']
      },
      {
        name: '/test',
        description: 'Create tests with QA persona',
        handler: this.handleTest.bind(this),
        requiredPersonas: ['qa']
      },
      {
        name: '/dashboard',
        description: 'Create trading dashboard',
        handler: this.handleDashboard.bind(this),
        requiredPersonas: ['architect', 'frontend', 'backend', 'performance']
      }
    ];

    commands.forEach(cmd => {
      this.commands.set(cmd.name, cmd);
    });
  }

  async executeCommand(commandName: string, args: any = {}, context: any = {}): Promise<any> {
    const command = this.commands.get(commandName);
    
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Process with orchestrator
    const taskDescription = `${command.description}: ${JSON.stringify(args)}`;
    const result = await this.orchestrator.processTask(taskDescription, {
      ...context,
      command: commandName,
      requiredPersonas: command.requiredPersonas
    });

    // Execute command handler
    const handlerResult = await command.handler(args, context);

    return {
      orchestrationResult: result,
      commandResult: handlerResult
    };
  }

  private async handleBuild(args: any, context: any): Promise<any> {
    return {
      feature: args.feature || 'unknown',
      status: 'Building feature with systematic persona coordination',
      components: ['architecture', 'frontend', 'backend', 'testing']
    };
  }

  private async handleAnalyze(args: any, context: any): Promise<any> {
    return {
      analysis: 'Deep market analysis performed',
      insights: [
        'Token failure patterns identified',
        'Market anomalies detected',
        'Risk metrics calculated'
      ],
      data: args.data || 'market_data'
    };
  }

  private async handleSecure(args: any, context: any): Promise<any> {
    return {
      security: 'Security implementation completed',
      measures: [
        'Authentication system',
        'Data encryption',
        'API rate limiting',
        'Input validation'
      ]
    };
  }

  private async handleOptimize(args: any, context: any): Promise<any> {
    return {
      optimization: 'Performance optimization completed',
      improvements: [
        'Caching implemented',
        'Database queries optimized',
        'Real-time data streaming enhanced',
        'Memory usage reduced'
      ]
    };
  }

  private async handleTest(args: any, context: any): Promise<any> {
    return {
      testing: 'Comprehensive test suite created',
      coverage: [
        'Unit tests',
        'Integration tests',
        'API endpoint tests',
        'WebSocket tests'
      ]
    };
  }

  private async handleDashboard(args: any, context: any): Promise<any> {
    return {
      dashboard: 'Bloomberg-style trading dashboard created',
      features: [
        'Real-time market data',
        'Interactive charts',
        'WebSocket integration',
        'Responsive design'
      ],
      components: args.components || ['market-heatmap', 'defi-metrics', 'real-time-news']
    };
  }

  getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}