import { Persona } from '../types';

export const PERSONAS: Map<string, Persona> = new Map([
  ['architect', {
    id: 'architect',
    name: 'System Architect',
    role: 'Design and plan system architecture',
    capabilities: [
      'system-design',
      'architecture-patterns',
      'scalability-planning',
      'technology-selection',
      'integration-design'
    ],
    specializations: [
      'microservices',
      'event-driven-architecture',
      'distributed-systems',
      'cloud-architecture',
      'api-design'
    ],
    confidenceFactors: {
      contextMatch: 0.9,
      capabilityMatch: 0.85,
      specializationMatch: 0.8,
      historicalPerformance: 0.95
    }
  }],
  
  ['frontend', {
    id: 'frontend',
    name: 'Frontend Developer',
    role: 'Build user interfaces and experiences',
    capabilities: [
      'ui-development',
      'react-development',
      'state-management',
      'responsive-design',
      'websocket-integration'
    ],
    specializations: [
      'bloomberg-terminal-ui',
      'real-time-dashboards',
      'data-visualization',
      'trading-interfaces',
      'charting-libraries'
    ],
    confidenceFactors: {
      contextMatch: 0.85,
      capabilityMatch: 0.9,
      specializationMatch: 0.88,
      historicalPerformance: 0.92
    }
  }],
  
  ['backend', {
    id: 'backend',
    name: 'Backend Developer',
    role: 'Develop server-side logic and APIs',
    capabilities: [
      'api-development',
      'database-design',
      'authentication',
      'data-processing',
      'websocket-server'
    ],
    specializations: [
      'nodejs',
      'express',
      'real-time-systems',
      'high-frequency-data',
      'microservices'
    ],
    confidenceFactors: {
      contextMatch: 0.88,
      capabilityMatch: 0.87,
      specializationMatch: 0.85,
      historicalPerformance: 0.93
    }
  }],
  
  ['security', {
    id: 'security',
    name: 'Security Specialist',
    role: 'Ensure system security and compliance',
    capabilities: [
      'security-auditing',
      'authentication-systems',
      'encryption',
      'api-security',
      'compliance'
    ],
    specializations: [
      'oauth2',
      'jwt',
      'api-key-management',
      'rate-limiting',
      'crypto-security'
    ],
    confidenceFactors: {
      contextMatch: 0.9,
      capabilityMatch: 0.88,
      specializationMatch: 0.86,
      historicalPerformance: 0.94
    }
  }],
  
  ['performance', {
    id: 'performance',
    name: 'Performance Engineer',
    role: 'Optimize system performance',
    capabilities: [
      'performance-profiling',
      'caching-strategies',
      'load-balancing',
      'optimization',
      'monitoring'
    ],
    specializations: [
      'real-time-optimization',
      'websocket-performance',
      'database-tuning',
      'caching-systems',
      'cdn-integration'
    ],
    confidenceFactors: {
      contextMatch: 0.85,
      capabilityMatch: 0.86,
      specializationMatch: 0.84,
      historicalPerformance: 0.91
    }
  }],
  
  ['qa', {
    id: 'qa',
    name: 'Quality Assurance',
    role: 'Test and ensure quality',
    capabilities: [
      'test-planning',
      'automated-testing',
      'integration-testing',
      'performance-testing',
      'security-testing'
    ],
    specializations: [
      'jest',
      'cypress',
      'load-testing',
      'api-testing',
      'real-time-testing'
    ],
    confidenceFactors: {
      contextMatch: 0.83,
      capabilityMatch: 0.85,
      specializationMatch: 0.82,
      historicalPerformance: 0.9
    }
  }],
  
  ['data-analyst', {
    id: 'data-analyst',
    name: 'Data Analyst',
    role: 'Analyze market data and trends',
    capabilities: [
      'data-analysis',
      'statistical-modeling',
      'trend-detection',
      'anomaly-detection',
      'predictive-analytics'
    ],
    specializations: [
      'crypto-markets',
      'technical-analysis',
      'market-metrics',
      'volume-analysis',
      'sentiment-analysis'
    ],
    confidenceFactors: {
      contextMatch: 0.87,
      capabilityMatch: 0.89,
      specializationMatch: 0.9,
      historicalPerformance: 0.92
    }
  }],
  
  ['trader', {
    id: 'trader',
    name: 'Trading Specialist',
    role: 'Implement trading strategies and tools',
    capabilities: [
      'trading-algorithms',
      'risk-management',
      'portfolio-optimization',
      'order-execution',
      'market-making'
    ],
    specializations: [
      'crypto-trading',
      'defi-protocols',
      'arbitrage',
      'technical-indicators',
      'automated-trading'
    ],
    confidenceFactors: {
      contextMatch: 0.88,
      capabilityMatch: 0.91,
      specializationMatch: 0.93,
      historicalPerformance: 0.94
    }
  }],
  
  ['data-engineer', {
    id: 'data-engineer',
    name: 'Data Engineer',
    role: 'Build data pipelines and integrations',
    capabilities: [
      'api-integration',
      'data-pipelines',
      'etl-processes',
      'real-time-streaming',
      'data-aggregation'
    ],
    specializations: [
      'websocket-streams',
      'api-aggregation',
      'data-normalization',
      'cache-management',
      'fault-tolerance'
    ],
    confidenceFactors: {
      contextMatch: 0.86,
      capabilityMatch: 0.88,
      specializationMatch: 0.87,
      historicalPerformance: 0.91
    }
  }],
  
  ['ux-designer', {
    id: 'ux-designer',
    name: 'UX Designer',
    role: 'Design user experiences and interfaces',
    capabilities: [
      'ui-design',
      'user-research',
      'wireframing',
      'prototyping',
      'accessibility'
    ],
    specializations: [
      'financial-interfaces',
      'dashboard-design',
      'data-visualization',
      'mobile-responsive',
      'dark-themes'
    ],
    confidenceFactors: {
      contextMatch: 0.84,
      capabilityMatch: 0.86,
      specializationMatch: 0.85,
      historicalPerformance: 0.89
    }
  }],
  
  ['devops', {
    id: 'devops',
    name: 'DevOps Engineer',
    role: 'Handle deployment and infrastructure',
    capabilities: [
      'ci-cd',
      'containerization',
      'monitoring',
      'logging',
      'infrastructure-as-code'
    ],
    specializations: [
      'docker',
      'kubernetes',
      'github-actions',
      'prometheus',
      'grafana'
    ],
    confidenceFactors: {
      contextMatch: 0.85,
      capabilityMatch: 0.87,
      specializationMatch: 0.84,
      historicalPerformance: 0.9
    }
  }]
]);

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.get(id);
}

export function getAllPersonas(): Persona[] {
  return Array.from(PERSONAS.values());
}

export function getPersonasByCapability(capability: string): Persona[] {
  return getAllPersonas().filter(persona => 
    persona.capabilities.includes(capability)
  );
}

export function getPersonasBySpecialization(specialization: string): Persona[] {
  return getAllPersonas().filter(persona => 
    persona.specializations.includes(specialization)
  );
}