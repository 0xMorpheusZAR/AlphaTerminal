// API Configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  ENDPOINTS: {
    COINGECKO: 'https://pro-api.coingecko.com/api/v3',
    VELO: 'https://api.velo.com/v1',
    WHALE_ALERT: 'https://api.whale-alert.io/v1',
    DEFILLAMA: 'https://api.llama.fi',
    DUNE: 'https://api.dune.com/api/v1'
  },
  
  RATE_LIMITS: {
    COINGECKO: {
      PRO: { requests: 500, window: 60000 }, // per minute
      FREE: { requests: 10, window: 60000 }
    },
    WHALE_ALERT: { requests: 60, window: 60000 },
    OPENAI: { requests: 60, window: 60000 }
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  TTL: {
    MARKET_DATA: 30, // 30 seconds
    COIN_DETAILS: 300, // 5 minutes
    HISTORICAL_DATA: 3600, // 1 hour
    STATIC_DATA: 86400, // 24 hours
    NEWS_DATA: 60, // 1 minute
    WHALE_DATA: 60, // 1 minute
    SENTIMENT_DATA: 300 // 5 minutes
  },
  
  MAX_KEYS: {
    MARKET_DATA: 500,
    COIN_DETAILS: 1000,
    HISTORICAL_DATA: 200,
    STATIC_DATA: 100,
    NEWS_DATA: 300
  }
};

// Validation Constants
export const VALIDATION = {
  LIMITS: {
    MAX_PAGE_SIZE: 100,
    MAX_SYMBOLS_PER_REQUEST: 50,
    MAX_SEARCH_LENGTH: 100,
    MAX_SIMULATION_DAYS: 365,
    MAX_SIMULATION_RUNS: 10000,
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
  },
  
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CRYPTO_SYMBOL: /^[A-Z0-9]+$/,
    ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
    BTC_ADDRESS: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    DATE_ISO: /^\d{4}-\d{2}-\d{2}$/
  }
};

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
  
  TIMEFRAMES: {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  }
};

// Market Constants
export const MARKET = {
  CATEGORIES: [
    'defi',
    'nft',
    'gaming',
    'layer1',
    'layer2',
    'oracle',
    'privacy',
    'storage',
    'exchange',
    'stablecoin',
    'meme',
    'ai'
  ],
  
  CHAINS: [
    'ethereum',
    'bitcoin',
    'binance-smart-chain',
    'polygon',
    'arbitrum',
    'optimism',
    'avalanche',
    'solana',
    'cardano',
    'polkadot'
  ],
  
  EXCHANGES: [
    'binance',
    'coinbase',
    'kraken',
    'okx',
    'kucoin',
    'bybit',
    'gate.io',
    'huobi',
    'bitfinex',
    'gemini'
  ],
  
  SENTIMENT_LEVELS: {
    EXTREME_FEAR: { min: 0, max: 20 },
    FEAR: { min: 20, max: 40 },
    NEUTRAL: { min: 40, max: 60 },
    GREED: { min: 60, max: 80 },
    EXTREME_GREED: { min: 80, max: 100 }
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  VALIDATION_FAILED: 'Invalid input data',
  RATE_LIMITED: 'Too many requests, please try again later',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  
  API: {
    CONNECTION_FAILED: 'Failed to connect to API service',
    INVALID_RESPONSE: 'Received invalid response from API',
    TIMEOUT: 'Request timed out',
    KEY_MISSING: 'API key not configured',
    KEY_INVALID: 'Invalid API key'
  },
  
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format',
    OUT_OF_RANGE: 'Value out of allowed range',
    TOO_LONG: 'Value exceeds maximum length',
    TOO_SHORT: 'Value below minimum length'
  }
};

// UI Constants
export const UI = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 768,
    DESKTOP: 1024,
    WIDE: 1280
  },
  
  COLORS: {
    BULLISH: '#10b981',
    BEARISH: '#ef4444',
    NEUTRAL: '#6b7280',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
    SUCCESS: '#10b981',
    ERROR: '#ef4444'
  },
  
  CHART_COLORS: [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16'  // lime
  ]
};

// Monte Carlo Simulation Constants
export const SIMULATION = {
  DEFAULTS: {
    DAYS: 30,
    RUNS: 1000,
    CONFIDENCE_INTERVALS: [5, 25, 50, 75, 95],
    DISTRIBUTION: 'lognormal' as const
  },
  
  DISTRIBUTIONS: {
    NORMAL: 'normal',
    LOGNORMAL: 'lognormal',
    STUDENT_T: 'student-t'
  },
  
  LIMITS: {
    MIN_DAYS: 1,
    MAX_DAYS: 365,
    MIN_RUNS: 100,
    MAX_RUNS: 10000
  }
};

// Feature Flags
export const FEATURES = {
  ENABLE_LIVE_DATA: process.env.NODE_ENV === 'production',
  ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
  ENABLE_CACHING: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_WEBSOCKETS: true,
  ENABLE_NOTIFICATIONS: true
};

// Regex Patterns (for reuse)
export const PATTERNS = {
  // Crypto addresses
  ETHEREUM: /^0x[a-fA-F0-9]{40}$/,
  BITCOIN: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  SOLANA: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  
  // Common formats
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
  
  // Financial
  CURRENCY: /^[A-Z]{3}$/,
  DECIMAL: /^\d+(\.\d{1,8})?$/,
  PERCENTAGE: /^-?\d+(\.\d{1,2})?$/
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};