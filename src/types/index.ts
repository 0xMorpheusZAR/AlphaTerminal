export interface Persona {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  specializations: string[];
  confidenceFactors: {
    contextMatch: number;
    capabilityMatch: number;
    specializationMatch: number;
    historicalPerformance: number;
  };
}

export interface TaskContext {
  description: string;
  type: TaskType;
  requirements: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  domain?: string;
  technicalStack?: string[];
  estimatedComplexity?: number;
}

export enum TaskType {
  ARCHITECTURE = 'architecture',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  ANALYSIS = 'analysis',
  TRADING = 'trading',
  DATA_INTEGRATION = 'data_integration',
  UI_DESIGN = 'ui_design'
}

export interface PersonaScore {
  personaId: string;
  score: number;
  breakdown: {
    contextMatch: number;
    capabilityMatch: number;
    specializationMatch: number;
    historicalPerformance: number;
  };
}

export interface TaskResult {
  taskId: string;
  personaId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  startTime: Date;
  endTime?: Date;
  metrics?: {
    executionTime?: number;
    resourceUsage?: any;
  };
}

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  circulatingSupply: number;
  totalSupply: number;
  lastUpdated: Date;
}

export interface MarketMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  altcoinSeason: boolean;
}

export interface DashboardConfig {
  layout: 'grid' | 'flex' | 'bloomberg';
  theme: 'dark' | 'light' | 'terminal';
  refreshInterval: number;
  dataProviders: string[];
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  id: string;
  type: 'chart' | 'table' | 'heatmap' | 'ticker' | 'news' | 'analytics';
  position: { x: number; y: number; w: number; h: number };
  dataSource: string;
  refreshRate?: number;
  customConfig?: any;
}

export interface APIProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: {
    requests: number;
    window: number;
  };
  endpoints: Map<string, string>;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'update' | 'error';
  channel: string;
  data: any;
  timestamp: Date;
}