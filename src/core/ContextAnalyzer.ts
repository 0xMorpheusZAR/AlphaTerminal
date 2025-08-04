export interface AnalysisContext {
  domain: string[];
  complexity: 'low' | 'medium' | 'high';
  projectType: string;
  patterns: string[];
  confidence: number;
}

export class ContextAnalyzer {
  private domainKeywords = {
    crypto: ['bitcoin', 'ethereum', 'token', 'defi', 'trading', 'market', 'blockchain'],
    ui: ['component', 'interface', 'design', 'user', 'frontend', 'react'],
    backend: ['api', 'server', 'database', 'service', 'endpoint'],
    security: ['auth', 'secure', 'encrypt', 'permission', 'validate'],
    performance: ['optimize', 'speed', 'cache', 'scale', 'memory'],
    analytics: ['analyze', 'data', 'metrics', 'insights', 'report']
  };

  private patternKeywords = {
    'dashboard-creation': ['dashboard', 'bloomberg', 'terminal', 'trading'],
    'data-integration': ['integrate', 'api', 'fetch', 'sync', 'realtime'],
    'security-implementation': ['auth', 'login', 'secure', 'encrypt'],
    'performance-optimization': ['optimize', 'cache', 'speed', 'performance'],
    'analytics-processing': ['analyze', 'calculate', 'process', 'insights']
  };

  analyzeContext(input: string, existingContext: any = {}): AnalysisContext {
    const inputLower = input.toLowerCase();
    const words = inputLower.split(/\s+/);

    // Domain analysis
    const domains: string[] = [];
    Object.entries(this.domainKeywords).forEach(([domain, keywords]) => {
      const matches = keywords.filter(keyword => inputLower.includes(keyword));
      if (matches.length > 0) {
        domains.push(domain);
      }
    });

    // Pattern analysis
    const patterns: string[] = [];
    Object.entries(this.patternKeywords).forEach(([pattern, keywords]) => {
      const matches = keywords.filter(keyword => inputLower.includes(keyword));
      if (matches.length > 0) {
        patterns.push(pattern);
      }
    });

    // Complexity analysis
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (words.length > 50 || patterns.length > 2) {
      complexity = 'high';
    } else if (words.length > 20 || patterns.length > 1) {
      complexity = 'medium';
    }

    // Project type detection
    let projectType = 'general';
    if (domains.includes('crypto')) projectType = 'crypto-analytics';
    if (domains.includes('ui') && domains.includes('backend')) projectType = 'full-stack';
    if (patterns.includes('dashboard-creation')) projectType = 'dashboard';

    // Confidence calculation
    const domainScore = domains.length * 0.3;
    const patternScore = patterns.length * 0.4;
    const contextScore = existingContext.projectType ? 0.2 : 0;
    const confidence = Math.min(domainScore + patternScore + contextScore, 1.0);

    return {
      domain: domains,
      complexity,
      projectType,
      patterns,
      confidence
    };
  }

  shouldUsePersona(persona: string, context: AnalysisContext): boolean {
    const personaMapping = {
      'architect': ['dashboard-creation', 'data-integration'],
      'frontend': ['dashboard-creation'],
      'backend': ['data-integration', 'analytics-processing'],
      'security': ['security-implementation'],
      'performance': ['performance-optimization'],
      'analyzer': ['analytics-processing']
    };

    const relevantPatterns = personaMapping[persona as keyof typeof personaMapping] || [];
    return relevantPatterns.some(pattern => context.patterns.includes(pattern));
  }

  getPersonaRecommendations(context: AnalysisContext): string[] {
    const recommendations: string[] = [];

    if (context.domain.includes('crypto')) {
      recommendations.push('analyzer');
    }

    if (context.patterns.includes('dashboard-creation')) {
      recommendations.push('architect', 'frontend', 'backend');
    }

    if (context.patterns.includes('security-implementation')) {
      recommendations.push('security');
    }

    if (context.complexity === 'high') {
      recommendations.push('architect', 'performance');
    }

    return [...new Set(recommendations)];
  }
}