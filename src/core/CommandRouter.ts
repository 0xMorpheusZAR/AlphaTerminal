import { PersonaOrchestrator, TaskContext } from './PersonaOrchestrator';
import { EventEmitter } from 'events';

export interface Command {
  name: string;
  description: string;
  category: 'development' | 'analysis' | 'quality' | 'utility';
  requiredPersonas: string[];
  optionalPersonas: string[];
  execute: (args: CommandArgs) => Promise<CommandResult>;
}

export interface CommandArgs {
  input: string;
  options?: Record<string, any>;
  context?: Partial<TaskContext>;
}

export interface CommandResult {
  success: boolean;
  output: any;
  personasUsed: string[];
  executionTime: number;
  suggestions?: string[];
}

export class CommandRouter extends EventEmitter {
  private commands: Map<string, Command> = new Map();
  private personaOrchestrator: PersonaOrchestrator;
  private executionQueue: Promise<any>[] = [];

  constructor(personaOrchestrator: PersonaOrchestrator) {
    super();
    this.personaOrchestrator = personaOrchestrator;
    this.initializeCommands();
  }

  private initializeCommands(): void {
    const commands: Command[] = [
      {
        name: '/build',
        description: 'Build features with optimal persona selection',
        category: 'development',
        requiredPersonas: ['architect'],
        optionalPersonas: ['frontend', 'backend', 'security'],
        execute: async (args) => this.executeBuildCommand(args)
      },
      {
        name: '/design',
        description: 'Design system architecture and components',
        category: 'development',
        requiredPersonas: ['architect'],
        optionalPersonas: ['frontend', 'backend'],
        execute: async (args) => this.executeDesignCommand(args)
      },
      {
        name: '/analyze',
        description: 'Analyze code and identify improvements',
        category: 'analysis',
        requiredPersonas: ['analyzer'],
        optionalPersonas: ['performance', 'security'],
        execute: async (args) => this.executeAnalyzeCommand(args)
      },
      {
        name: '/troubleshoot',
        description: 'Debug and fix issues',
        category: 'analysis',
        requiredPersonas: ['analyzer'],
        optionalPersonas: ['backend', 'frontend'],
        execute: async (args) => this.executeTroubleshootCommand(args)
      },
      {
        name: '/improve',
        description: 'Optimize and enhance code quality',
        category: 'quality',
        requiredPersonas: ['refactorer'],
        optionalPersonas: ['performance', 'qa'],
        execute: async (args) => this.executeImproveCommand(args)
      },
      {
        name: '/test',
        description: 'Create and run tests',
        category: 'quality',
        requiredPersonas: ['qa'],
        optionalPersonas: ['analyzer'],
        execute: async (args) => this.executeTestCommand(args)
      },
      {
        name: '/document',
        description: 'Generate documentation',
        category: 'utility',
        requiredPersonas: ['scribe'],
        optionalPersonas: ['mentor'],
        execute: async (args) => this.executeDocumentCommand(args)
      },
      {
        name: '/explain',
        description: 'Explain code and concepts',
        category: 'utility',
        requiredPersonas: ['mentor'],
        optionalPersonas: ['scribe'],
        execute: async (args) => this.executeExplainCommand(args)
      },
      {
        name: '/secure',
        description: 'Implement security best practices',
        category: 'quality',
        requiredPersonas: ['security'],
        optionalPersonas: ['backend', 'frontend'],
        execute: async (args) => this.executeSecureCommand(args)
      },
      {
        name: '/optimize',
        description: 'Optimize performance',
        category: 'quality',
        requiredPersonas: ['performance'],
        optionalPersonas: ['backend', 'frontend'],
        execute: async (args) => this.executeOptimizeCommand(args)
      }
    ];

    commands.forEach(cmd => this.commands.set(cmd.name, cmd));
  }

  async routeCommand(commandName: string, args: CommandArgs): Promise<CommandResult> {
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Command ${commandName} not found`);
    }

    const startTime = Date.now();
    this.emit('command:start', { command: commandName, args });

    try {
      const result = await command.execute(args);
      const executionTime = Date.now() - startTime;

      this.emit('command:complete', { 
        command: commandName, 
        result,
        executionTime 
      });

      return { ...result, executionTime };
    } catch (error) {
      this.emit('command:error', { command: commandName, error });
      throw error;
    }
  }

  private async executeBuildCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'development',
      complexity: this.inferComplexity(args.input),
      domain: this.inferDomain(args.input),
      requirements: [args.input],
      targetOutcome: 'Build feature according to specifications',
      ...args.context
    };

    const invocations = this.personaOrchestrator.analyzeContext(context);
    const personasUsed: string[] = [];
    const outputs: any[] = [];

    // Always use architect for build commands
    const architectResult = await this.personaOrchestrator.invokePersona('architect', context);
    personasUsed.push('architect');
    outputs.push(architectResult);

    // Invoke additional personas based on context
    for (const invocation of invocations.slice(0, 3)) {
      if (invocation.confidence > 0.6 && !personasUsed.includes(invocation.personaId)) {
        const result = await this.personaOrchestrator.invokePersona(invocation.personaId, context);
        personasUsed.push(invocation.personaId);
        outputs.push(result);
      }
    }

    return {
      success: true,
      output: {
        architecture: outputs[0],
        implementations: outputs.slice(1),
        summary: `Built feature using ${personasUsed.length} personas`
      },
      personasUsed,
      executionTime: 0,
      suggestions: this.generateSuggestions(context, personasUsed)
    };
  }

  private async executeDesignCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'development',
      complexity: 'high',
      domain: 'architecture',
      requirements: [args.input],
      targetOutcome: 'Design system architecture',
      ...args.context
    };

    const architectResult = await this.personaOrchestrator.invokePersona('architect', context);
    const personasUsed = ['architect'];

    if (args.input.toLowerCase().includes('ui') || args.input.toLowerCase().includes('frontend')) {
      const frontendResult = await this.personaOrchestrator.invokePersona('frontend', context);
      personasUsed.push('frontend');
      return {
        success: true,
        output: { architecture: architectResult, ui: frontendResult },
        personasUsed,
        executionTime: 0
      };
    }

    return {
      success: true,
      output: architectResult,
      personasUsed,
      executionTime: 0
    };
  }

  private async executeAnalyzeCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'analysis',
      complexity: 'medium',
      domain: 'code-analysis',
      requirements: [args.input],
      currentCode: args.options?.code,
      targetOutcome: 'Analyze and provide insights',
      ...args.context
    };

    const analyzerResult = await this.personaOrchestrator.invokePersona('analyzer', context);
    const personasUsed = ['analyzer'];
    const additionalAnalysis: any[] = [];

    // Add performance analysis if relevant
    if (args.input.includes('performance') || args.input.includes('slow')) {
      const perfResult = await this.personaOrchestrator.invokePersona('performance', context);
      personasUsed.push('performance');
      additionalAnalysis.push(perfResult);
    }

    // Add security analysis if relevant
    if (args.input.includes('security') || args.input.includes('vulnerability')) {
      const secResult = await this.personaOrchestrator.invokePersona('security', context);
      personasUsed.push('security');
      additionalAnalysis.push(secResult);
    }

    return {
      success: true,
      output: {
        analysis: analyzerResult,
        additionalInsights: additionalAnalysis
      },
      personasUsed,
      executionTime: 0
    };
  }

  private async executeTroubleshootCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'analysis',
      complexity: 'high',
      domain: 'debugging',
      requirements: [args.input],
      targetOutcome: 'Identify and fix issues',
      ...args.context
    };

    const analyzerResult = await this.personaOrchestrator.invokePersona('analyzer', context);
    const personasUsed = ['analyzer'];

    return {
      success: true,
      output: analyzerResult,
      personasUsed,
      executionTime: 0,
      suggestions: ['Run /test to verify fixes', 'Use /improve to refactor problematic code']
    };
  }

  private async executeImproveCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'optimization',
      complexity: 'medium',
      domain: 'refactoring',
      requirements: [args.input],
      currentCode: args.options?.code,
      targetOutcome: 'Improve code quality',
      ...args.context
    };

    const refactorResult = await this.personaOrchestrator.invokePersona('refactorer', context);
    const personasUsed = ['refactorer'];

    // Add performance improvements if needed
    if (args.options?.includePerformance) {
      const perfResult = await this.personaOrchestrator.invokePersona('performance', context);
      personasUsed.push('performance');
      return {
        success: true,
        output: { refactoring: refactorResult, performance: perfResult },
        personasUsed,
        executionTime: 0
      };
    }

    return {
      success: true,
      output: refactorResult,
      personasUsed,
      executionTime: 0
    };
  }

  private async executeTestCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'testing',
      complexity: 'medium',
      domain: 'quality-assurance',
      requirements: [args.input],
      targetOutcome: 'Create comprehensive tests',
      ...args.context
    };

    const qaResult = await this.personaOrchestrator.invokePersona('qa', context);
    const personasUsed = ['qa'];

    return {
      success: true,
      output: qaResult,
      personasUsed,
      executionTime: 0,
      suggestions: ['Run tests with coverage report', 'Add to CI/CD pipeline']
    };
  }

  private async executeDocumentCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'development',
      complexity: 'low',
      domain: 'documentation',
      requirements: [args.input],
      targetOutcome: 'Generate documentation',
      ...args.context
    };

    const scribeResult = await this.personaOrchestrator.invokePersona('scribe', context);
    const personasUsed = ['scribe'];

    return {
      success: true,
      output: scribeResult,
      personasUsed,
      executionTime: 0
    };
  }

  private async executeExplainCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'development',
      complexity: 'low',
      domain: 'education',
      requirements: [args.input],
      targetOutcome: 'Explain concept clearly',
      ...args.context
    };

    const mentorResult = await this.personaOrchestrator.invokePersona('mentor', context);
    const personasUsed = ['mentor'];

    return {
      success: true,
      output: mentorResult,
      personasUsed,
      executionTime: 0
    };
  }

  private async executeSecureCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'security',
      complexity: 'high',
      domain: 'security',
      requirements: [args.input],
      targetOutcome: 'Implement security measures',
      ...args.context
    };

    const securityResult = await this.personaOrchestrator.invokePersona('security', context);
    const personasUsed = ['security'];

    return {
      success: true,
      output: securityResult,
      personasUsed,
      executionTime: 0,
      suggestions: ['Run security audit', 'Test authentication flows']
    };
  }

  private async executeOptimizeCommand(args: CommandArgs): Promise<CommandResult> {
    const context: TaskContext = {
      type: 'optimization',
      complexity: 'high',
      domain: 'performance',
      requirements: [args.input],
      targetOutcome: 'Optimize performance',
      ...args.context
    };

    const performanceResult = await this.personaOrchestrator.invokePersona('performance', context);
    const personasUsed = ['performance'];

    return {
      success: true,
      output: performanceResult,
      personasUsed,
      executionTime: 0,
      suggestions: ['Profile before and after', 'Monitor metrics in production']
    };
  }

  private inferComplexity(input: string): 'low' | 'medium' | 'high' {
    const complexityKeywords = {
      high: ['complex', 'advanced', 'sophisticated', 'enterprise', 'scalable'],
      medium: ['standard', 'typical', 'normal', 'regular'],
      low: ['simple', 'basic', 'straightforward', 'minimal']
    };

    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      if (keywords.some(kw => input.toLowerCase().includes(kw))) {
        return level as 'low' | 'medium' | 'high';
      }
    }

    return 'medium';
  }

  private inferDomain(input: string): string {
    const domains = [
      'crypto-analytics', 'trading', 'dashboard', 'api', 'database',
      'authentication', 'ui-components', 'data-visualization', 'real-time',
      'websocket', 'caching', 'testing', 'deployment'
    ];

    for (const domain of domains) {
      if (input.toLowerCase().includes(domain.replace('-', ' '))) {
        return domain;
      }
    }

    return 'general';
  }

  private generateSuggestions(context: TaskContext, personasUsed: string[]): string[] {
    const suggestions: string[] = [];

    if (!personasUsed.includes('qa')) {
      suggestions.push('Consider running /test to ensure quality');
    }

    if (!personasUsed.includes('security') && context.domain.includes('auth')) {
      suggestions.push('Run /secure to implement security best practices');
    }

    if (!personasUsed.includes('performance') && context.complexity === 'high') {
      suggestions.push('Use /optimize to improve performance');
    }

    if (!personasUsed.includes('scribe')) {
      suggestions.push('Document your changes with /document');
    }

    return suggestions;
  }

  getAvailableCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommandByName(name: string): Command | undefined {
    return this.commands.get(name);
  }
}