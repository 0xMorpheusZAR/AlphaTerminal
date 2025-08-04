import { z } from 'zod';
import { ValidationError } from './error-handler';
import DOMPurify from 'isomorphic-dompurify';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  
  email: z.string().email('Invalid email format'),
  
  url: z.string().url('Invalid URL format'),
  
  dateString: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Date must be in YYYY-MM-DD format'
  ),
  
  timestamp: z.number().int().positive('Invalid timestamp'),
  
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  timeframe: z.enum(['1h', '24h', '7d', '30d', '90d', '1y', 'all']),
  
  cryptoSymbol: z.string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Symbol must be uppercase alphanumeric'),
  
  cryptoAddress: z.string()
    .regex(/^(0x)?[0-9a-fA-F]{40}$/, 'Invalid crypto address'),
  
  percentage: z.number().min(-100).max(100),
  
  positiveNumber: z.number().positive(),
  
  nonNegativeNumber: z.number().nonnegative(),
  
  searchQuery: z.string()
    .min(1)
    .max(100)
    .transform(str => sanitizeString(str))
};

// Sanitization functions
export function sanitizeString(input: string): string {
  // Remove any HTML tags and dangerous characters
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Additional sanitization for common injection patterns
  return cleaned
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeNumber(input: any): number | null {
  const num = Number(input);
  return isNaN(num) || !isFinite(num) ? null : num;
}

export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (input === 'true' || input === '1' || input === 1) return true;
  if (input === 'false' || input === '0' || input === 0) return false;
  return false;
}

export function sanitizeArray<T>(
  input: any[],
  itemSanitizer: (item: any) => T
): T[] {
  if (!Array.isArray(input)) return [];
  return input.map(itemSanitizer).filter(item => item !== null);
}

// Validation schemas for API endpoints
export const apiValidationSchemas = {
  // Market data endpoints
  getMarketData: z.object({
    symbols: z.array(commonSchemas.cryptoSymbol).optional(),
    timeframe: commonSchemas.timeframe.optional(),
    includeHistorical: z.boolean().optional()
  }),
  
  getTokenDetails: z.object({
    tokenId: z.string().min(1).max(100),
    includeMetrics: z.boolean().optional(),
    includeSocial: z.boolean().optional()
  }),
  
  // Trading endpoints
  getPriceHistory: z.object({
    symbol: commonSchemas.cryptoSymbol,
    startDate: commonSchemas.dateString.optional(),
    endDate: commonSchemas.dateString.optional(),
    interval: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).optional()
  }),
  
  // Whale tracking
  getWhaleTransactions: z.object({
    minValue: commonSchemas.positiveNumber.optional(),
    symbols: z.array(commonSchemas.cryptoSymbol).optional(),
    exchanges: z.array(z.string()).optional(),
    ...commonSchemas.pagination.shape
  }),
  
  // DeFi endpoints
  getDefiProtocols: z.object({
    category: z.string().optional(),
    chains: z.array(z.string()).optional(),
    minTvl: commonSchemas.nonNegativeNumber.optional(),
    ...commonSchemas.pagination.shape
  }),
  
  // Sentiment analysis
  getSentiment: z.object({
    symbols: z.array(commonSchemas.cryptoSymbol),
    sources: z.array(z.enum(['twitter', 'reddit', 'news'])).optional(),
    timeframe: commonSchemas.timeframe.optional()
  }),
  
  // Monte Carlo simulation
  runSimulation: z.object({
    tokenId: z.string().min(1).max(100),
    days: z.number().int().min(1).max(365),
    simulations: z.number().int().min(100).max(10000),
    distribution: z.enum(['normal', 'lognormal', 'student-t']).optional(),
    confidenceIntervals: z.array(z.number().min(0).max(100)).optional()
  }),
  
  // User preferences
  updatePreferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().length(2).optional(),
    timezone: z.string().optional(),
    defaultCurrency: z.string().length(3).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      priceAlerts: z.boolean().optional(),
      newsAlerts: z.boolean().optional()
    }).optional()
  })
};

// Validation middleware factory
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      // Combine all request data
      const data = {
        ...req.params,
        ...req.query,
        ...req.body
      };
      
      // Validate and transform
      const validated = schema.parse(data);
      
      // Attach validated data to request
      req.validated = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new ValidationError('Validation failed', details);
      }
      throw error;
    }
  };
}

// SQL injection prevention
export function sanitizeSqlIdentifier(identifier: string): string {
  // Only allow alphanumeric characters and underscores
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

export function buildSafeQuery(
  baseQuery: string,
  conditions: Record<string, any>
): { query: string; params: any[] } {
  const whereClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  for (const [field, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      const safeField = sanitizeSqlIdentifier(field);
      whereClauses.push(`${safeField} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  const query = whereClauses.length > 0
    ? `${baseQuery} WHERE ${whereClauses.join(' AND ')}`
    : baseQuery;
  
  return { query, params };
}

// XSS prevention for API responses
export function sanitizeResponse(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeResponse);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeResponse(value);
    }
    return sanitized;
  }
  
  return data;
}

// Rate limiting validation
export function validateRateLimit(
  key: string,
  limit: number,
  window: number,
  storage: Map<string, { count: number; resetAt: number }>
): boolean {
  const now = Date.now();
  const record = storage.get(key);
  
  if (!record || now > record.resetAt) {
    storage.set(key, {
      count: 1,
      resetAt: now + window
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// File upload validation
export const fileValidationSchemas = {
  image: z.object({
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    size: z.number().max(5 * 1024 * 1024) // 5MB
  }),
  
  csv: z.object({
    mimetype: z.enum(['text/csv', 'application/csv']),
    size: z.number().max(10 * 1024 * 1024) // 10MB
  })
};

// Custom validators
export const customValidators = {
  isValidEthereumAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  isValidBitcoinAddress: (address: string): boolean => {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  },
  
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidJSON: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
};