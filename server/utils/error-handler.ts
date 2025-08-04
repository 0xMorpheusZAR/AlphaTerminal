import { Response } from 'express';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
  isOperational: boolean;
}

export class ApplicationError extends Error implements AppError {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorCode.AUTHENTICATION_ERROR, message, 401);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.AUTHORIZATION_ERROR, message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(ErrorCode.RATE_LIMIT_ERROR, message, 429, { retryAfter });
  }
}

export class ApiError extends ApplicationError {
  constructor(service: string, message: string, details?: any) {
    super(ErrorCode.API_ERROR, `${service} API error: ${message}`, 502, details);
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(ErrorCode.DATABASE_ERROR, `Database error: ${message}`, 500, details);
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(ErrorCode.NETWORK_ERROR, `Network error: ${message}`, 503, details);
  }
}

export class TimeoutError extends ApplicationError {
  constructor(service: string, timeout: number) {
    super(ErrorCode.TIMEOUT_ERROR, `${service} request timed out after ${timeout}ms`, 504);
  }
}

export function handleError(error: Error | AppError, res: Response): void {
  if (error instanceof ApplicationError) {
    const { statusCode, code, message, details } = error;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  } else {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { 
          originalError: error.message,
          stack: error.stack 
        })
      }
    });
  }
}

export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleError(error, res);
    });
  };
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof ApplicationError) {
    return error.isOperational;
  }
  return false;
}

export function logError(error: Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  
  if (error instanceof ApplicationError) {
    console.error(`${timestamp} ${contextStr} ${error.code}: ${error.message}`, {
      details: error.details,
      stack: error.stack
    });
  } else {
    console.error(`${timestamp} ${contextStr} Unhandled error:`, error);
  }
}

export const errorMessages = {
  validation: {
    required: (field: string) => `${field} is required`,
    invalid: (field: string) => `${field} is invalid`,
    minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
    maxLength: (field: string, max: number) => `${field} must not exceed ${max} characters`,
    range: (field: string, min: number, max: number) => `${field} must be between ${min} and ${max}`,
    enum: (field: string, values: string[]) => `${field} must be one of: ${values.join(', ')}`
  },
  api: {
    unavailable: (service: string) => `${service} service is temporarily unavailable`,
    rateLimit: (service: string) => `${service} API rate limit exceeded`,
    invalidResponse: (service: string) => `Invalid response from ${service} API`
  }
};