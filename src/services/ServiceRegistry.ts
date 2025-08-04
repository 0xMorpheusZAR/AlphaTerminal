/**
 * @fileoverview Service Registry - Central service management and dependency injection
 * @module ServiceRegistry
 * @version 4.0.0
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { RedisClient } from 'redis';

/**
 * Service lifecycle states
 */
export enum ServiceState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Base service interface
 */
export interface IService {
  name: string;
  state: ServiceState;
  dependencies: string[];
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthCheckResult>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

/**
 * Base service implementation
 */
export abstract class BaseService extends EventEmitter implements IService {
  public name: string;
  public state: ServiceState = ServiceState.UNINITIALIZED;
  public dependencies: string[] = [];
  protected logger: Logger;
  protected config: ServiceConfig;
  
  constructor(name: string, config: ServiceConfig, logger: Logger) {
    super();
    this.name = name;
    this.config = config;
    this.logger = logger;
  }
  
  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    try {
      this.state = ServiceState.INITIALIZING;
      this.logger.info(`Initializing service: ${this.name}`);
      
      await this.onInitialize();
      
      this.state = ServiceState.READY;
      this.logger.info(`Service initialized: ${this.name}`);
      this.emit('initialized');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error(`Failed to initialize service ${this.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Start service
   */
  async start(): Promise<void> {
    if (this.state !== ServiceState.READY) {
      throw new Error(`Service ${this.name} is not ready to start`);
    }
    
    try {
      this.logger.info(`Starting service: ${this.name}`);
      await this.onStart();
      this.emit('started');
    } catch (error) {
      this.state = ServiceState.ERROR;
      this.logger.error(`Failed to start service ${this.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Stop service
   */
  async stop(): Promise<void> {
    try {
      this.state = ServiceState.STOPPING;
      this.logger.info(`Stopping service: ${this.name}`);
      
      await this.onStop();
      
      this.state = ServiceState.STOPPED;
      this.logger.info(`Service stopped: ${this.name}`);
      this.emit('stopped');
    } catch (error) {
      this.logger.error(`Error stopping service ${this.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Health check
   */
  async health(): Promise<HealthCheckResult> {
    const baseHealth: HealthCheckResult = {
      status: this.state === ServiceState.READY ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      details: {
        state: this.state,
        uptime: process.uptime()
      }
    };
    
    try {
      const serviceHealth = await this.onHealthCheck();
      return { ...baseHealth, ...serviceHealth };
    } catch (error) {
      return {
        ...baseHealth,
        status: 'unhealthy',
        message: error.message
      };
    }
  }
  
  /**
   * Service-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;
  
  /**
   * Service-specific start logic
   */
  protected abstract onStart(): Promise<void>;
  
  /**
   * Service-specific stop logic
   */
  protected abstract onStop(): Promise<void>;
  
  /**
   * Service-specific health check
   */
  protected abstract onHealthCheck(): Promise<Partial<HealthCheckResult>>;
}

/**
 * Service Registry - Manages all services
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, IService> = new Map();
  private logger: Logger;
  private startupOrder: string[] = [];
  
  private constructor(logger: Logger) {
    this.logger = logger;
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(logger?: Logger): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      if (!logger) {
        throw new Error('Logger required for first initialization');
      }
      ServiceRegistry.instance = new ServiceRegistry(logger);
    }
    return ServiceRegistry.instance;
  }
  
  /**
   * Register a service
   */
  register(service: IService): void {
    if (this.services.has(service.name)) {
      throw new Error(`Service ${service.name} already registered`);
    }
    
    this.services.set(service.name, service);
    this.logger.info(`Registered service: ${service.name}`);
  }
  
  /**
   * Get a service
   */
  get<T extends IService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }
  
  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    this.logger.info('Initializing all services...');
    
    // Calculate initialization order based on dependencies
    this.startupOrder = this.calculateStartupOrder();
    
    // Initialize services in order
    for (const serviceName of this.startupOrder) {
      const service = this.services.get(serviceName)!;
      await service.initialize();
    }
    
    this.logger.info('All services initialized successfully');
  }
  
  /**
   * Start all services
   */
  async startAll(): Promise<void> {
    this.logger.info('Starting all services...');
    
    for (const serviceName of this.startupOrder) {
      const service = this.services.get(serviceName)!;
      await service.start();
    }
    
    this.logger.info('All services started successfully');
  }
  
  /**
   * Stop all services in reverse order
   */
  async stopAll(): Promise<void> {
    this.logger.info('Stopping all services...');
    
    const reverseOrder = [...this.startupOrder].reverse();
    
    for (const serviceName of reverseOrder) {
      const service = this.services.get(serviceName)!;
      try {
        await service.stop();
      } catch (error) {
        this.logger.error(`Error stopping service ${serviceName}:`, error);
      }
    }
    
    this.logger.info('All services stopped');
  }
  
  /**
   * Get health status of all services
   */
  async healthCheckAll(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    
    for (const [name, service] of this.services) {
      try {
        results[name] = await service.health();
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date()
        };
      }
    }
    
    return results;
  }
  
  /**
   * Calculate service startup order based on dependencies
   */
  private calculateStartupOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      
      visiting.add(name);
      
      const service = this.services.get(name);
      if (!service) {
        throw new Error(`Unknown service dependency: ${name}`);
      }
      
      for (const dep of service.dependencies) {
        visit(dep);
      }
      
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };
    
    for (const name of this.services.keys()) {
      visit(name);
    }
    
    return order;
  }
  
  /**
   * Get service dependency graph
   */
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const [name, service] of this.services) {
      graph[name] = service.dependencies;
    }
    
    return graph;
  }
}

/**
 * Service decorator for automatic registration
 */
export function Service(config: Partial<ServiceConfig> = {}) {
  return function(target: any) {
    target.prototype._serviceConfig = config;
    return target;
  };
}

/**
 * Dependency injection decorator
 */
export function Inject(serviceName: string) {
  return function(target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return ServiceRegistry.getInstance().get(serviceName);
      }
    });
  };
}