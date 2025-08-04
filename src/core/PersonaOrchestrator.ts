import { EventEmitter } from 'events';

export interface Persona {
  id: string;
  name: string;
  expertise: string[];
  capabilities: string[];
  triggerPatterns: RegExp[];
  priority: number;
}

export interface TaskContext {
  type: 'development' | 'analysis' | 'optimization' | 'security' | 'ui' | 'data' | 'testing';
  complexity: 'low' | 'medium' | 'high';
  domain: string;
  requirements: string[];
  currentCode?: string;
  targetOutcome: string;
}

export interface PersonaInvocation {
  personaId: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
}

export class PersonaOrchestrator extends EventEmitter {
  private personas: Map<string, Persona> = new Map();
  private activePersonas: Set<string> = new Set();
  private invocationHistory: PersonaInvocation[] = [];

  constructor() {
    super();
    this.initializePersonas();
  }

  private initializePersonas(): void {
    const personas: Persona[] = [
      {
        id: 'architect',
        name: 'System Architect',
        expertise: ['system-design', 'architecture', 'scalability', 'patterns'],
        capabilities: ['design-systems', 'create-blueprints', 'optimize-architecture'],
        triggerPatterns: [
          /architect|design|structure|pattern|scalability/i,
          /system\s+design|high-level|blueprint/i
        ],
        priority: 100
      },
      {
        id: 'frontend',
        name: 'Frontend Specialist',
        expertise: ['react', 'typescript', 'ui-ux', 'accessibility', 'performance'],
        capabilities: ['create-components', 'optimize-ui', 'implement-accessibility'],
        triggerPatterns: [
          /frontend|ui|ux|component|react|interface/i,
          /user\s+interface|visual|layout|style/i
        ],
        priority: 90
      },
      {
        id: 'backend',
        name: 'Backend Engineer',
        expertise: ['nodejs', 'express', 'database', 'api', 'microservices'],
        capabilities: ['create-apis', 'optimize-queries', 'design-schemas'],
        triggerPatterns: [
          /backend|api|server|database|endpoint/i,
          /service|route|middleware|orm/i
        ],
        priority: 90
      },
      {
        id: 'security',
        name: 'Security Expert',
        expertise: ['authentication', 'authorization', 'encryption', 'vulnerabilities'],
        capabilities: ['audit-security', 'implement-auth', 'secure-data'],
        triggerPatterns: [
          /security|auth|encrypt|vulnerability|threat/i,
          /secure|protection|safety|risk/i
        ],
        priority: 95
      },
      {
        id: 'performance',
        name: 'Performance Optimizer',
        expertise: ['optimization', 'caching', 'profiling', 'monitoring'],
        capabilities: ['optimize-code', 'implement-caching', 'reduce-latency'],
        triggerPatterns: [
          /performance|optimize|speed|latency|cache/i,
          /slow|fast|efficient|bottleneck/i
        ],
        priority: 85
      },
      {
        id: 'analyzer',
        name: 'Code Analyzer',
        expertise: ['code-analysis', 'debugging', 'troubleshooting', 'root-cause'],
        capabilities: ['analyze-issues', 'debug-problems', 'find-root-causes'],
        triggerPatterns: [
          /analyze|debug|troubleshoot|investigate|issue/i,
          /problem|error|bug|fix/i
        ],
        priority: 88
      },
      {
        id: 'qa',
        name: 'QA Engineer',
        expertise: ['testing', 'test-automation', 'quality-assurance', 'validation'],
        capabilities: ['write-tests', 'create-test-plans', 'ensure-quality'],
        triggerPatterns: [
          /test|qa|quality|validation|coverage/i,
          /unit\s+test|integration|e2e/i
        ],
        priority: 80
      },
      {
        id: 'refactorer',
        name: 'Code Refactorer',
        expertise: ['refactoring', 'clean-code', 'patterns', 'maintainability'],
        capabilities: ['refactor-code', 'improve-readability', 'reduce-complexity'],
        triggerPatterns: [
          /refactor|clean|improve|simplify|maintainable/i,
          /code\s+smell|duplicate|complexity/i
        ],
        priority: 75
      },
      {
        id: 'devops',
        name: 'DevOps Engineer',
        expertise: ['ci-cd', 'deployment', 'infrastructure', 'automation'],
        capabilities: ['setup-pipelines', 'automate-deployment', 'manage-infrastructure'],
        triggerPatterns: [
          /devops|deploy|ci|cd|pipeline|infrastructure/i,
          /build|release|automation|docker/i
        ],
        priority: 82
      },
      {
        id: 'mentor',
        name: 'Code Mentor',
        expertise: ['teaching', 'best-practices', 'documentation', 'knowledge-sharing'],
        capabilities: ['explain-concepts', 'provide-guidance', 'share-best-practices'],
        triggerPatterns: [
          /explain|teach|mentor|guide|learn/i,
          /how|why|understand|concept/i
        ],
        priority: 70
      },
      {
        id: 'scribe',
        name: 'Documentation Specialist',
        expertise: ['documentation', 'technical-writing', 'api-docs', 'readme'],
        capabilities: ['write-docs', 'create-guides', 'document-apis'],
        triggerPatterns: [
          /document|docs|readme|guide|manual/i,
          /write|describe|specification/i
        ],
        priority: 65
      }
    ];

    personas.forEach(persona => this.personas.set(persona.id, persona));
  }

  analyzeContext(context: TaskContext): PersonaInvocation[] {
    const invocations: PersonaInvocation[] = [];
    
    for (const [id, persona] of this.personas) {
      const confidence = this.calculateConfidence(persona, context);
      
      if (confidence > 0.3) {
        const reasoning = this.generateReasoning(persona, context, confidence);
        const suggestedActions = this.generateActions(persona, context);
        
        invocations.push({
          personaId: id,
          confidence,
          reasoning,
          suggestedActions
        });
      }
    }

    return invocations.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateConfidence(persona: Persona, context: TaskContext): number {
    let confidence = 0;
    
    // Check domain match
    if (persona.expertise.some(exp => context.domain.includes(exp))) {
      confidence += 0.3;
    }
    
    // Check requirement patterns
    const requirementText = context.requirements.join(' ');
    persona.triggerPatterns.forEach(pattern => {
      if (pattern.test(requirementText)) {
        confidence += 0.2;
      }
    });
    
    // Adjust for complexity
    if (context.complexity === 'high' && persona.priority > 85) {
      confidence += 0.1;
    } else if (context.complexity === 'low' && persona.priority < 80) {
      confidence += 0.05;
    }
    
    // Type-specific adjustments
    const typeBoosts: Record<string, string[]> = {
      'development': ['architect', 'frontend', 'backend'],
      'analysis': ['analyzer', 'performance'],
      'optimization': ['performance', 'refactorer'],
      'security': ['security', 'backend'],
      'ui': ['frontend', 'performance'],
      'data': ['backend', 'performance'],
      'testing': ['qa', 'analyzer']
    };
    
    if (typeBoosts[context.type]?.includes(persona.id)) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private generateReasoning(persona: Persona, context: TaskContext, confidence: number): string {
    const reasons = [];
    
    if (persona.expertise.some(exp => context.domain.includes(exp))) {
      reasons.push(`Domain expertise in ${context.domain}`);
    }
    
    const matchedPatterns = persona.triggerPatterns.filter(pattern => 
      pattern.test(context.requirements.join(' '))
    );
    
    if (matchedPatterns.length > 0) {
      reasons.push(`Identified ${matchedPatterns.length} relevant patterns`);
    }
    
    if (context.complexity === 'high' && persona.priority > 85) {
      reasons.push('High priority persona for complex tasks');
    }
    
    return `${persona.name} selected with ${(confidence * 100).toFixed(0)}% confidence. ${reasons.join('. ')}.`;
  }

  private generateActions(persona: Persona, context: TaskContext): string[] {
    const actions: string[] = [];
    
    switch (persona.id) {
      case 'architect':
        actions.push('Design system architecture');
        actions.push('Create component hierarchy');
        actions.push('Define data flow patterns');
        break;
      case 'frontend':
        actions.push('Build React components');
        actions.push('Implement UI/UX requirements');
        actions.push('Ensure accessibility compliance');
        break;
      case 'backend':
        actions.push('Create API endpoints');
        actions.push('Design database schema');
        actions.push('Implement business logic');
        break;
      case 'security':
        actions.push('Implement authentication');
        actions.push('Add authorization checks');
        actions.push('Secure sensitive data');
        break;
      case 'performance':
        actions.push('Profile application performance');
        actions.push('Implement caching strategies');
        actions.push('Optimize database queries');
        break;
      case 'analyzer':
        actions.push('Analyze code structure');
        actions.push('Identify potential issues');
        actions.push('Debug problems');
        break;
      case 'qa':
        actions.push('Write unit tests');
        actions.push('Create integration tests');
        actions.push('Develop test strategies');
        break;
      case 'refactorer':
        actions.push('Improve code structure');
        actions.push('Remove duplication');
        actions.push('Apply design patterns');
        break;
      case 'devops':
        actions.push('Setup CI/CD pipeline');
        actions.push('Configure deployment');
        actions.push('Automate processes');
        break;
      case 'mentor':
        actions.push('Explain concepts');
        actions.push('Provide best practices');
        actions.push('Guide implementation');
        break;
      case 'scribe':
        actions.push('Write documentation');
        actions.push('Create API docs');
        actions.push('Update README');
        break;
    }
    
    return actions;
  }

  async invokePersona(personaId: string, context: TaskContext): Promise<any> {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }
    
    this.activePersonas.add(personaId);
    this.emit('persona:invoked', { personaId, context });
    
    try {
      const result = await this.executePersonaTask(persona, context);
      
      this.invocationHistory.push({
        personaId,
        confidence: 1.0,
        reasoning: `Direct invocation of ${persona.name}`,
        suggestedActions: this.generateActions(persona, context)
      });
      
      return result;
    } finally {
      this.activePersonas.delete(personaId);
      this.emit('persona:completed', { personaId, context });
    }
  }

  private async executePersonaTask(persona: Persona, context: TaskContext): Promise<any> {
    // This would integrate with actual persona implementations
    return {
      personaId: persona.id,
      result: `${persona.name} completed task in ${context.domain}`,
      actions: this.generateActions(persona, context)
    };
  }

  getActivePersonas(): string[] {
    return Array.from(this.activePersonas);
  }

  getInvocationHistory(): PersonaInvocation[] {
    return [...this.invocationHistory];
  }

  clearHistory(): void {
    this.invocationHistory = [];
  }
}