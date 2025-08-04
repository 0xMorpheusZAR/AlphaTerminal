import { TaskContext } from './PersonaOrchestrator';

export interface CodeContext {
  fileName?: string;
  fileType?: string;
  imports?: string[];
  exports?: string[];
  dependencies?: string[];
  complexity?: number;
  lineCount?: number;
  hasTests?: boolean;
  framework?: string;
  patterns?: string[];
}

export interface ProjectContext {
  projectType: 'crypto-analytics' | 'web-app' | 'api' | 'library' | 'unknown';
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    testing?: string[];
    deployment?: string[];
  };
  features: string[];
  integrations: string[];
}

export interface AnalysisResult {
  taskContext: TaskContext;
  codeContext?: CodeContext;
  projectContext?: ProjectContext;
  suggestedPersonas: string[];
  confidence: number;
}

export class ContextAnalyzer {
  private static readonly PATTERNS = {
    frontend: {
      react: /import\s+.*\s+from\s+['"]react['"]/,
      typescript: /\.tsx?$/,
      tailwind: /className=["'].*(?:flex|grid|p-|m-|text-)/,
      components: /(?:Component|FC|jsx|tsx)/i,
      hooks: /use[A-Z]\w+/,
      state: /(?:useState|useReducer|zustand|redux)/
    },
    backend: {
      express: /import\s+.*\s+from\s+['"]express['"]/,
      api: /(?:router|endpoint|middleware|controller)/i,
      database: /(?:query|schema|model|migration)/i,
      auth: /(?:auth|jwt|session|passport)/i,
      services: /(?:service|repository|handler)/i
    },
    crypto: {
      trading: /(?:price|volume|market|trade|order)/i,
      defi: /(?:tvl|apy|liquidity|yield|protocol)/i,
      tokens: /(?:token|coin|crypto|blockchain)/i,
      analytics: /(?:analyze|metric|indicator|signal)/i
    },
    quality: {
      tests: /(?:test|spec|describe|it|expect)/,
      performance: /(?:optimize|cache|lazy|memo)/,
      security: /(?:sanitize|validate|encrypt|secure)/,
      patterns: /(?:singleton|factory|observer|strategy)/
    }
  };

  analyzeTask(input: string, additionalContext?: Partial<CodeContext>): AnalysisResult {
    const codeContext = this.extractCodeContext(input, additionalContext);
    const projectContext = this.inferProjectContext(input, codeContext);
    const taskContext = this.buildTaskContext(input, codeContext, projectContext);
    const suggestedPersonas = this.suggestPersonas(taskContext, codeContext, projectContext);

    return {
      taskContext,
      codeContext,
      projectContext,
      suggestedPersonas,
      confidence: this.calculateConfidence(input, codeContext, projectContext)
    };
  }

  private extractCodeContext(input: string, additional?: Partial<CodeContext>): CodeContext {
    const context: CodeContext = {
      ...additional
    };

    // Detect file type
    const fileTypeMatch = input.match(/\.(tsx?|jsx?|py|java|go|rs)$/);
    if (fileTypeMatch) {
      context.fileType = fileTypeMatch[1];
    }

    // Detect imports
    const importMatches = input.matchAll(/import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g);
    context.imports = Array.from(importMatches, m => m[1]);

    // Detect framework
    if (this.PATTERNS.frontend.react.test(input)) {
      context.framework = 'react';
    } else if (this.PATTERNS.backend.express.test(input)) {
      context.framework = 'express';
    }

    // Detect patterns
    context.patterns = [];
    for (const [category, patterns] of Object.entries(this.PATTERNS)) {
      for (const [name, pattern] of Object.entries(patterns)) {
        if (pattern.test(input)) {
          context.patterns.push(`${category}.${name}`);
        }
      }
    }

    // Estimate complexity
    context.complexity = this.estimateComplexity(input);
    context.lineCount = input.split('\n').length;
    context.hasTests = this.PATTERNS.quality.tests.test(input);

    return context;
  }

  private inferProjectContext(input: string, codeContext: CodeContext): ProjectContext {
    const projectContext: ProjectContext = {
      projectType: 'unknown',
      techStack: {},
      features: [],
      integrations: []
    };

    // Determine project type based on patterns
    const cryptoScore = this.countPatternMatches(input, this.PATTERNS.crypto);
    const webScore = this.countPatternMatches(input, this.PATTERNS.frontend) + 
                     this.countPatternMatches(input, this.PATTERNS.backend);

    if (cryptoScore > 3) {
      projectContext.projectType = 'crypto-analytics';
      projectContext.features.push('crypto-trading', 'market-analysis', 'defi-metrics');
    } else if (webScore > 2) {
      projectContext.projectType = 'web-app';
    }

    // Infer tech stack
    if (codeContext.framework === 'react') {
      projectContext.techStack.frontend = ['react', 'typescript', 'tailwind'];
    }
    if (codeContext.framework === 'express') {
      projectContext.techStack.backend = ['nodejs', 'express', 'typescript'];
    }

    // Detect integrations
    const integrationKeywords = [
      'coingecko', 'binance', 'uniswap', 'chainlink', 'moralis',
      'web3', 'ethers', 'wagmi', 'rainbow', 'alchemy'
    ];

    integrationKeywords.forEach(keyword => {
      if (input.toLowerCase().includes(keyword)) {
        projectContext.integrations.push(keyword);
      }
    });

    return projectContext;
  }

  private buildTaskContext(
    input: string, 
    codeContext: CodeContext, 
    projectContext: ProjectContext
  ): TaskContext {
    const taskContext: TaskContext = {
      type: this.inferTaskType(input),
      complexity: this.inferComplexityLevel(codeContext.complexity || 0),
      domain: this.inferDomain(input, projectContext),
      requirements: this.extractRequirements(input),
      targetOutcome: this.inferTargetOutcome(input)
    };

    if (codeContext.patterns && codeContext.patterns.length > 0) {
      taskContext.currentCode = `Detected patterns: ${codeContext.patterns.join(', ')}`;
    }

    return taskContext;
  }

  private suggestPersonas(
    taskContext: TaskContext,
    codeContext: CodeContext,
    projectContext: ProjectContext
  ): string[] {
    const personas: Set<string> = new Set();

    // Task type based suggestions
    const taskTypePersonas: Record<string, string[]> = {
      'development': ['architect', 'frontend', 'backend'],
      'analysis': ['analyzer', 'performance'],
      'optimization': ['performance', 'refactorer'],
      'security': ['security'],
      'ui': ['frontend'],
      'data': ['backend', 'performance'],
      'testing': ['qa']
    };

    taskTypePersonas[taskContext.type]?.forEach(p => personas.add(p));

    // Pattern based suggestions
    if (codeContext.patterns) {
      codeContext.patterns.forEach(pattern => {
        if (pattern.includes('frontend')) personas.add('frontend');
        if (pattern.includes('backend')) personas.add('backend');
        if (pattern.includes('security')) personas.add('security');
        if (pattern.includes('quality')) personas.add('qa');
        if (pattern.includes('performance')) personas.add('performance');
      });
    }

    // Project type based suggestions
    if (projectContext.projectType === 'crypto-analytics') {
      personas.add('backend'); // For data processing
      personas.add('frontend'); // For visualizations
      personas.add('performance'); // For real-time data
    }

    // Complexity based suggestions
    if (taskContext.complexity === 'high') {
      personas.add('architect');
      personas.add('analyzer');
    }

    return Array.from(personas);
  }

  private inferTaskType(input: string): TaskContext['type'] {
    const typeKeywords = {
      'development': ['build', 'create', 'implement', 'add', 'feature'],
      'analysis': ['analyze', 'investigate', 'debug', 'find', 'check'],
      'optimization': ['optimize', 'improve', 'enhance', 'speed', 'performance'],
      'security': ['secure', 'auth', 'protect', 'encrypt', 'validate'],
      'ui': ['ui', 'interface', 'component', 'design', 'layout'],
      'data': ['data', 'database', 'api', 'fetch', 'store'],
      'testing': ['test', 'spec', 'coverage', 'quality', 'qa']
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(kw => input.toLowerCase().includes(kw))) {
        return type as TaskContext['type'];
      }
    }

    return 'development';
  }

  private inferComplexityLevel(score: number): 'low' | 'medium' | 'high' {
    if (score > 70) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  }

  private inferDomain(input: string, projectContext: ProjectContext): string {
    if (projectContext.projectType === 'crypto-analytics') {
      return 'crypto-trading-analytics';
    }

    const domains = [
      'frontend-development',
      'backend-development',
      'database-management',
      'api-integration',
      'security-implementation',
      'performance-optimization',
      'testing-automation'
    ];

    for (const domain of domains) {
      if (input.toLowerCase().includes(domain.split('-')[0])) {
        return domain;
      }
    }

    return 'general-development';
  }

  private extractRequirements(input: string): string[] {
    const requirements: string[] = [];
    
    // Split by common delimiters
    const parts = input.split(/[,;.\n]/).filter(p => p.trim().length > 10);
    requirements.push(...parts.map(p => p.trim()));

    // Extract bullet points or numbered items
    const bulletPoints = input.matchAll(/[-*•]\s*(.+)/g);
    requirements.push(...Array.from(bulletPoints, m => m[1].trim()));

    const numberedItems = input.matchAll(/\d+\.\s*(.+)/g);
    requirements.push(...Array.from(numberedItems, m => m[1].trim()));

    return requirements.length > 0 ? requirements : [input];
  }

  private inferTargetOutcome(input: string): string {
    const outcomePatterns = [
      { pattern: /implement\s+(.+)/i, template: 'Implement $1' },
      { pattern: /create\s+(.+)/i, template: 'Create $1' },
      { pattern: /fix\s+(.+)/i, template: 'Fix $1' },
      { pattern: /optimize\s+(.+)/i, template: 'Optimize $1' },
      { pattern: /analyze\s+(.+)/i, template: 'Analyze $1' },
      { pattern: /test\s+(.+)/i, template: 'Test $1' }
    ];

    for (const { pattern, template } of outcomePatterns) {
      const match = input.match(pattern);
      if (match) {
        return template.replace('$1', match[1]);
      }
    }

    return 'Complete the requested task';
  }

  private estimateComplexity(input: string): number {
    let score = 0;

    // Length factor
    score += Math.min(input.length / 100, 20);

    // Pattern complexity
    const complexPatterns = [
      /async|await|Promise/g,
      /class|interface|type/g,
      /extends|implements/g,
      /generic|<\w+>/g,
      /try|catch|finally/g
    ];

    complexPatterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    });

    // Nesting depth (approximation)
    const openBraces = (input.match(/{/g) || []).length;
    score += openBraces * 3;

    return Math.min(score, 100);
  }

  private countPatternMatches(input: string, patterns: Record<string, RegExp>): number {
    let count = 0;
    for (const pattern of Object.values(patterns)) {
      if (pattern.test(input)) {
        count++;
      }
    }
    return count;
  }

  private calculateConfidence(
    input: string, 
    codeContext: CodeContext, 
    projectContext: ProjectContext
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on detected patterns
    if (codeContext.patterns && codeContext.patterns.length > 0) {
      confidence += Math.min(codeContext.patterns.length * 0.05, 0.3);
    }

    // Increase confidence if project type is identified
    if (projectContext.projectType !== 'unknown') {
      confidence += 0.1;
    }

    // Increase confidence based on integrations
    if (projectContext.integrations.length > 0) {
      confidence += Math.min(projectContext.integrations.length * 0.05, 0.1);
    }

    return Math.min(confidence, 1.0);
  }
}