import { TaskContext, TaskType } from '../types';
import winston from 'winston';

export interface ContextAnalysis {
  primaryDomain: string;
  suggestedPersonas: string[];
  complexity: 'low' | 'medium' | 'high' | 'critical';
  requiresCollaboration: boolean;
  estimatedDuration: number; // in milliseconds
  keywords: string[];
  technicalRequirements: string[];
  riskFactors: string[];
}

export class ContextAnalyzer {
  private domainPatterns: Map<string, RegExp[]> = new Map();
  private complexityIndicators: Map<string, number> = new Map();
  private collaborationTriggers: string[] = [];

  constructor(private logger: winston.Logger) {
    this.initializeDomainPatterns();
    this.initializeComplexityIndicators();
    this.initializeCollaborationTriggers();
  }

  private initializeDomainPatterns(): void {
    this.domainPatterns = new Map([
      ['trading', [
        /trad(e|ing)/i,
        /order/i,
        /position/i,
        /portfolio/i,
        /arbitrage/i,
        /market.?making/i
      ]],
      ['analytics', [
        /analyz/i,
        /metric/i,
        /statistic/i,
        /predict/i,
        /forecast/i,
        /trend/i
      ]],
      ['security', [
        /secur/i,
        /auth/i,
        /encrypt/i,
        /permission/i,
        /access.?control/i,
        /vulnerabil/i
      ]],
      ['performance', [
        /perform/i,
        /optimiz/i,
        /speed/i,
        /latency/i,
        /cache/i,
        /scale/i
      ]],
      ['ui', [
        /ui/i,
        /interface/i,
        /dashboard/i,
        /component/i,
        /frontend/i,
        /display/i
      ]],
      ['data', [
        /data/i,
        /api/i,
        /integration/i,
        /pipeline/i,
        /stream/i,
        /websocket/i
      ]]
    ]);
  }

  private initializeComplexityIndicators(): void {
    this.complexityIndicators = new Map([
      ['simple', 1],
      ['basic', 1],
      ['complex', 3],
      ['advanced', 3],
      ['critical', 4],
      ['urgent', 4],
      ['multi', 2],
      ['integrate', 2],
      ['optimize', 3],
      ['scale', 3],
      ['real-time', 3],
      ['high-frequency', 4]
    ]);
  }

  private initializeCollaborationTriggers(): void {
    this.collaborationTriggers = [
      'full-stack',
      'end-to-end',
      'integrate',
      'multiple',
      'various',
      'comprehensive',
      'complete system',
      'entire platform'
    ];
  }

  async analyze(context: TaskContext): Promise<ContextAnalysis> {
    const startTime = Date.now();
    this.logger.debug('Analyzing context', { context });

    const analysis: ContextAnalysis = {
      primaryDomain: this.identifyPrimaryDomain(context),
      suggestedPersonas: this.suggestPersonas(context),
      complexity: this.assessComplexity(context),
      requiresCollaboration: this.checkCollaborationNeeded(context),
      estimatedDuration: this.estimateDuration(context),
      keywords: this.extractKeywords(context),
      technicalRequirements: this.identifyTechnicalRequirements(context),
      riskFactors: this.identifyRiskFactors(context)
    };

    const analysisTime = Date.now() - startTime;
    this.logger.info('Context analysis completed', { 
      analysisTime, 
      primaryDomain: analysis.primaryDomain,
      complexity: analysis.complexity 
    });

    return analysis;
  }

  private identifyPrimaryDomain(context: TaskContext): string {
    const text = `${context.description} ${context.requirements?.join(' ') || ''}`.toLowerCase();
    const domainScores = new Map<string, number>();

    for (const [domain, patterns] of this.domainPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      domainScores.set(domain, score);
    }

    // Also consider the explicit task type
    const typeMapping: Partial<Record<TaskType, string>> = {
      [TaskType.TRADING]: 'trading',
      [TaskType.ANALYSIS]: 'analytics',
      [TaskType.SECURITY]: 'security',
      [TaskType.PERFORMANCE]: 'performance',
      [TaskType.FRONTEND]: 'ui',
      [TaskType.UI_DESIGN]: 'ui',
      [TaskType.DATA_INTEGRATION]: 'data'
    };

    const mappedDomain = typeMapping[context.type];
    if (mappedDomain) {
      const currentScore = domainScores.get(mappedDomain) || 0;
      domainScores.set(mappedDomain, currentScore + 5);
    }

    // Find domain with highest score
    let maxDomain = 'general';
    let maxScore = 0;
    for (const [domain, score] of domainScores) {
      if (score > maxScore) {
        maxScore = score;
        maxDomain = domain;
      }
    }

    return maxDomain;
  }

  private suggestPersonas(context: TaskContext): string[] {
    const personas: Set<string> = new Set();
    
    // Primary persona based on task type
    const typeToPersona: Partial<Record<TaskType, string>> = {
      [TaskType.ARCHITECTURE]: 'architect',
      [TaskType.FRONTEND]: 'frontend',
      [TaskType.BACKEND]: 'backend',
      [TaskType.SECURITY]: 'security',
      [TaskType.PERFORMANCE]: 'performance',
      [TaskType.TESTING]: 'qa',
      [TaskType.ANALYSIS]: 'data-analyst',
      [TaskType.TRADING]: 'trader',
      [TaskType.DATA_INTEGRATION]: 'data-engineer',
      [TaskType.UI_DESIGN]: 'ux-designer',
      [TaskType.DEPLOYMENT]: 'devops'
    };

    const primaryPersona = typeToPersona[context.type];
    if (primaryPersona) {
      personas.add(primaryPersona);
    }

    // Additional personas based on requirements
    const requirementToPersona: Map<string, string> = new Map([
      ['api', 'backend'],
      ['database', 'backend'],
      ['ui', 'frontend'],
      ['dashboard', 'frontend'],
      ['security', 'security'],
      ['performance', 'performance'],
      ['test', 'qa'],
      ['deploy', 'devops'],
      ['analyze', 'data-analyst'],
      ['trade', 'trader'],
      ['data', 'data-engineer'],
      ['design', 'ux-designer']
    ]);

    if (context.requirements) {
      for (const req of context.requirements) {
        const reqLower = req.toLowerCase();
        for (const [keyword, persona] of requirementToPersona) {
          if (reqLower.includes(keyword)) {
            personas.add(persona);
          }
        }
      }
    }

    // Add personas based on technical stack
    if (context.technicalStack) {
      const techToPersona: Map<string, string> = new Map([
        ['react', 'frontend'],
        ['vue', 'frontend'],
        ['angular', 'frontend'],
        ['node', 'backend'],
        ['express', 'backend'],
        ['docker', 'devops'],
        ['kubernetes', 'devops'],
        ['websocket', 'backend'],
        ['redis', 'performance'],
        ['postgres', 'backend'],
        ['mongodb', 'backend']
      ]);

      for (const tech of context.technicalStack) {
        const techLower = tech.toLowerCase();
        for (const [keyword, persona] of techToPersona) {
          if (techLower.includes(keyword)) {
            personas.add(persona);
          }
        }
      }
    }

    return Array.from(personas);
  }

  private assessComplexity(context: TaskContext): 'low' | 'medium' | 'high' | 'critical' {
    let complexityScore = 0;
    
    // Check description for complexity indicators
    const text = context.description.toLowerCase();
    for (const [indicator, weight] of this.complexityIndicators) {
      if (text.includes(indicator)) {
        complexityScore += weight;
      }
    }

    // Factor in number of requirements
    if (context.requirements) {
      complexityScore += context.requirements.length * 0.5;
    }

    // Factor in explicit complexity if provided
    if (context.estimatedComplexity) {
      complexityScore += context.estimatedComplexity;
    }

    // Factor in priority
    const priorityWeights = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 4
    };
    complexityScore += priorityWeights[context.priority];

    // Determine complexity level
    if (complexityScore >= 10) return 'critical';
    if (complexityScore >= 6) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }

  private checkCollaborationNeeded(context: TaskContext): boolean {
    const text = context.description.toLowerCase();
    
    // Check for collaboration triggers
    for (const trigger of this.collaborationTriggers) {
      if (text.includes(trigger)) {
        return true;
      }
    }

    // Check if multiple personas are suggested
    const suggestedPersonas = this.suggestPersonas(context);
    if (suggestedPersonas.length > 2) {
      return true;
    }

    // Check complexity
    const complexity = this.assessComplexity(context);
    if (complexity === 'critical' || complexity === 'high') {
      return true;
    }

    return false;
  }

  private estimateDuration(context: TaskContext): number {
    const complexity = this.assessComplexity(context);
    const baseTime = {
      low: 5000,      // 5 seconds
      medium: 30000,  // 30 seconds
      high: 120000,   // 2 minutes
      critical: 300000 // 5 minutes
    };

    let duration = baseTime[complexity];

    // Adjust based on collaboration needs
    if (this.checkCollaborationNeeded(context)) {
      duration *= 1.5;
    }

    // Adjust based on number of requirements
    if (context.requirements) {
      duration += context.requirements.length * 2000;
    }

    return Math.min(duration, 600000); // Cap at 10 minutes
  }

  private extractKeywords(context: TaskContext): string[] {
    const text = `${context.description} ${context.requirements?.join(' ') || ''}`;
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Count word frequency
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Sort by frequency and return top keywords
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private identifyTechnicalRequirements(context: TaskContext): string[] {
    const requirements: Set<string> = new Set();

    // Add explicit requirements
    if (context.requirements) {
      context.requirements.forEach(req => requirements.add(req));
    }

    // Add from technical stack
    if (context.technicalStack) {
      context.technicalStack.forEach(tech => requirements.add(tech));
    }

    // Extract from description
    const technicalKeywords = [
      'api', 'database', 'cache', 'websocket', 'authentication',
      'encryption', 'monitoring', 'logging', 'testing', 'deployment',
      'scaling', 'load-balancing', 'cdn', 'real-time', 'streaming'
    ];

    const descLower = context.description.toLowerCase();
    for (const keyword of technicalKeywords) {
      if (descLower.includes(keyword)) {
        requirements.add(keyword);
      }
    }

    return Array.from(requirements);
  }

  private identifyRiskFactors(context: TaskContext): string[] {
    const risks: string[] = [];

    // High complexity tasks
    const complexity = this.assessComplexity(context);
    if (complexity === 'critical' || complexity === 'high') {
      risks.push('high-complexity');
    }

    // Security-related tasks
    if (context.type === TaskType.SECURITY || 
        context.description.toLowerCase().includes('security')) {
      risks.push('security-sensitive');
    }

    // Performance-critical tasks
    if (context.type === TaskType.PERFORMANCE || 
        context.description.toLowerCase().includes('performance')) {
      risks.push('performance-critical');
    }

    // Real-time requirements
    if (context.description.toLowerCase().includes('real-time') ||
        context.description.toLowerCase().includes('websocket')) {
      risks.push('real-time-constraints');
    }

    // Trading-related tasks
    if (context.type === TaskType.TRADING || 
        context.description.toLowerCase().includes('trading')) {
      risks.push('financial-risk');
    }

    return risks;
  }
}