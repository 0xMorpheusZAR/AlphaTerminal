/**
 * @fileoverview Data aggregation and transformation service
 * @module DataAggregationService
 * @version 4.0.0
 */

import { BaseService, ServiceConfig, HealthCheckResult } from './ServiceRegistry';
import { Logger } from 'winston';
import { CacheService } from './CacheService';
import { WebSocketService } from './WebSocketService';
import { EventEmitter } from 'events';

/**
 * Data aggregation configuration
 */
export interface DataAggregationConfig extends ServiceConfig {
  aggregators: {
    [name: string]: AggregatorConfig;
  };
  transformers: {
    [name: string]: TransformerConfig;
  };
  pipelines: {
    [name: string]: PipelineConfig;
  };
}

/**
 * Aggregator configuration
 */
interface AggregatorConfig {
  type: 'time-series' | 'spatial' | 'statistical' | 'custom';
  interval?: number;
  windowSize?: number;
  fields?: string[];
  groupBy?: string[];
  operations?: AggregationOperation[];
  customFunction?: (data: any[]) => any;
}

/**
 * Transformer configuration
 */
interface TransformerConfig {
  type: 'map' | 'filter' | 'reduce' | 'custom';
  mapFunction?: (item: any) => any;
  filterFunction?: (item: any) => boolean;
  reduceFunction?: (acc: any, item: any) => any;
  initialValue?: any;
  customFunction?: (data: any) => any;
}

/**
 * Pipeline configuration
 */
interface PipelineConfig {
  source: string;
  stages: PipelineStage[];
  destination: string;
  errorHandler?: (error: Error, data: any) => void;
  concurrent?: number;
  batchSize?: number;
}

/**
 * Pipeline stage
 */
interface PipelineStage {
  type: 'aggregator' | 'transformer' | 'enricher' | 'validator';
  name: string;
  config?: any;
}

/**
 * Aggregation operations
 */
interface AggregationOperation {
  field: string;
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'stddev' | 'percentile';
  alias?: string;
  percentile?: number;
}

/**
 * Time series data point
 */
interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * OHLCV candle data
 */
interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Data aggregation and transformation service
 */
export class DataAggregationService extends BaseService {
  private aggregators: Map<string, Aggregator> = new Map();
  private transformers: Map<string, Transformer> = new Map();
  private pipelines: Map<string, Pipeline> = new Map();
  private dataBuffers: Map<string, any[]> = new Map();
  private cacheService?: CacheService;
  private webSocketService?: WebSocketService;
  private aggregationConfig: DataAggregationConfig;
  
  constructor(
    config: DataAggregationConfig,
    logger: Logger,
    cacheService?: CacheService,
    webSocketService?: WebSocketService
  ) {
    super('DataAggregationService', config, logger);
    this.dependencies = [];
    this.aggregationConfig = config;
    this.cacheService = cacheService;
    this.webSocketService = webSocketService;
    
    if (cacheService) this.dependencies.push('CacheService');
    if (webSocketService) this.dependencies.push('WebSocketService');
  }
  
  /**
   * Initialize data aggregation service
   */
  protected async onInitialize(): Promise<void> {
    // Load aggregators
    for (const [name, config] of Object.entries(this.aggregationConfig.aggregators)) {
      this.createAggregator(name, config);
    }
    
    // Load transformers
    for (const [name, config] of Object.entries(this.aggregationConfig.transformers)) {
      this.createTransformer(name, config);
    }
    
    // Load pipelines
    for (const [name, config] of Object.entries(this.aggregationConfig.pipelines)) {
      this.createPipeline(name, config);
    }
    
    // Set up buffer processing
    setInterval(() => {
      this.processBuffers();
    }, 1000); // Every second
  }
  
  /**
   * Start data aggregation service
   */
  protected async onStart(): Promise<void> {
    // Start all pipelines
    for (const pipeline of this.pipelines.values()) {
      pipeline.start();
    }
    
    this.logger.info('Data aggregation service started');
  }
  
  /**
   * Stop data aggregation service
   */
  protected async onStop(): Promise<void> {
    // Stop all pipelines
    for (const pipeline of this.pipelines.values()) {
      pipeline.stop();
    }
    
    this.logger.info('Data aggregation service stopped');
  }
  
  /**
   * Health check
   */
  protected async onHealthCheck(): Promise<Partial<HealthCheckResult>> {
    return {
      status: 'healthy',
      details: {
        aggregators: this.aggregators.size,
        transformers: this.transformers.size,
        pipelines: this.pipelines.size,
        buffers: this.dataBuffers.size
      }
    };
  }
  
  /**
   * Create aggregator
   */
  private createAggregator(name: string, config: AggregatorConfig): Aggregator {
    const aggregator = new Aggregator(name, config, this.logger);
    this.aggregators.set(name, aggregator);
    return aggregator;
  }
  
  /**
   * Create transformer
   */
  private createTransformer(name: string, config: TransformerConfig): Transformer {
    const transformer = new Transformer(name, config, this.logger);
    this.transformers.set(name, transformer);
    return transformer;
  }
  
  /**
   * Create pipeline
   */
  private createPipeline(name: string, config: PipelineConfig): Pipeline {
    const pipeline = new Pipeline(name, config, this.logger, this);
    this.pipelines.set(name, pipeline);
    return pipeline;
  }
  
  /**
   * Aggregate time series data into OHLCV candles
   */
  async aggregateToOHLCV(
    data: TimeSeriesDataPoint[],
    interval: number
  ): Promise<OHLCVData[]> {
    const candles: Map<number, OHLCVData> = new Map();
    
    for (const point of data) {
      const timestamp = Math.floor(point.timestamp.getTime() / interval) * interval;
      
      if (!candles.has(timestamp)) {
        candles.set(timestamp, {
          timestamp: new Date(timestamp),
          open: point.value,
          high: point.value,
          low: point.value,
          close: point.value,
          volume: 1
        });
      } else {
        const candle = candles.get(timestamp)!;
        candle.high = Math.max(candle.high, point.value);
        candle.low = Math.min(candle.low, point.value);
        candle.close = point.value;
        candle.volume++;
      }
    }
    
    return Array.from(candles.values()).sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }
  
  /**
   * Calculate moving average
   */
  calculateMovingAverage(
    data: number[],
    period: number,
    type: 'simple' | 'exponential' = 'simple'
  ): number[] {
    if (data.length < period) return [];
    
    const result: number[] = [];
    
    if (type === 'simple') {
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    } else {
      // Exponential moving average
      const multiplier = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result.push(ema);
      
      for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(data: number[]): number {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate percentile
   */
  calculatePercentile(data: number[], percentile: number): number {
    if (data.length === 0) return 0;
    
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
  
  /**
   * Buffer data for batch processing
   */
  bufferData(key: string, data: any): void {
    if (!this.dataBuffers.has(key)) {
      this.dataBuffers.set(key, []);
    }
    
    this.dataBuffers.get(key)!.push(data);
  }
  
  /**
   * Process buffered data
   */
  private async processBuffers(): Promise<void> {
    for (const [key, buffer] of this.dataBuffers) {
      if (buffer.length === 0) continue;
      
      // Process buffer
      const data = [...buffer];
      buffer.length = 0;
      
      // Emit for processing
      this.emit('buffer:ready', { key, data });
    }
  }
  
  /**
   * Get aggregator
   */
  getAggregator(name: string): Aggregator | undefined {
    return this.aggregators.get(name);
  }
  
  /**
   * Get transformer
   */
  getTransformer(name: string): Transformer | undefined {
    return this.transformers.get(name);
  }
  
  /**
   * Get pipeline
   */
  getPipeline(name: string): Pipeline | undefined {
    return this.pipelines.get(name);
  }
}

/**
 * Aggregator class
 */
class Aggregator {
  private buffer: any[] = [];
  private lastEmit: Date = new Date();
  
  constructor(
    private name: string,
    private config: AggregatorConfig,
    private logger: Logger
  ) {}
  
  /**
   * Add data to aggregator
   */
  add(data: any): void {
    this.buffer.push({
      ...data,
      timestamp: new Date()
    });
    
    // Check if should emit
    if (this.shouldEmit()) {
      this.emit();
    }
  }
  
  /**
   * Check if should emit aggregated data
   */
  private shouldEmit(): boolean {
    if (!this.config.interval) return false;
    
    const now = new Date();
    return now.getTime() - this.lastEmit.getTime() >= this.config.interval;
  }
  
  /**
   * Emit aggregated data
   */
  private emit(): any {
    const result = this.aggregate(this.buffer);
    this.buffer = [];
    this.lastEmit = new Date();
    return result;
  }
  
  /**
   * Perform aggregation
   */
  aggregate(data: any[]): any {
    if (this.config.customFunction) {
      return this.config.customFunction(data);
    }
    
    switch (this.config.type) {
      case 'time-series':
        return this.aggregateTimeSeries(data);
      
      case 'statistical':
        return this.aggregateStatistical(data);
      
      default:
        return data;
    }
  }
  
  /**
   * Aggregate time series data
   */
  private aggregateTimeSeries(data: any[]): any {
    const grouped = this.groupData(data);
    const result: any[] = [];
    
    for (const [key, items] of grouped) {
      const aggregated: any = { key };
      
      if (this.config.operations) {
        for (const op of this.config.operations) {
          aggregated[op.alias || `${op.field}_${op.operation}`] = 
            this.performOperation(items, op);
        }
      }
      
      result.push(aggregated);
    }
    
    return result;
  }
  
  /**
   * Aggregate statistical data
   */
  private aggregateStatistical(data: any[]): any {
    const result: any = {};
    
    if (this.config.operations) {
      for (const op of this.config.operations) {
        result[op.alias || `${op.field}_${op.operation}`] = 
          this.performOperation(data, op);
      }
    }
    
    return result;
  }
  
  /**
   * Group data by fields
   */
  private groupData(data: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    if (!this.config.groupBy || this.config.groupBy.length === 0) {
      grouped.set('all', data);
      return grouped;
    }
    
    for (const item of data) {
      const key = this.config.groupBy
        .map(field => item[field])
        .join(':');
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key)!.push(item);
    }
    
    return grouped;
  }
  
  /**
   * Perform aggregation operation
   */
  private performOperation(data: any[], op: AggregationOperation): number {
    const values = data.map(item => Number(item[op.field])).filter(v => !isNaN(v));
    
    if (values.length === 0) return 0;
    
    switch (op.operation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      
      case 'min':
        return Math.min(...values);
      
      case 'max':
        return Math.max(...values);
      
      case 'count':
        return values.length;
      
      case 'stddev':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      
      case 'percentile':
        return this.calculatePercentile(values, op.percentile || 50);
      
      default:
        return 0;
    }
  }
  
  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) return sorted[lower];
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * Transformer class
 */
class Transformer {
  constructor(
    private name: string,
    private config: TransformerConfig,
    private logger: Logger
  ) {}
  
  /**
   * Transform data
   */
  transform(data: any): any {
    if (this.config.customFunction) {
      return this.config.customFunction(data);
    }
    
    switch (this.config.type) {
      case 'map':
        return Array.isArray(data) 
          ? data.map(this.config.mapFunction!)
          : this.config.mapFunction!(data);
      
      case 'filter':
        return Array.isArray(data)
          ? data.filter(this.config.filterFunction!)
          : (this.config.filterFunction!(data) ? data : null);
      
      case 'reduce':
        return Array.isArray(data)
          ? data.reduce(this.config.reduceFunction!, this.config.initialValue)
          : data;
      
      default:
        return data;
    }
  }
}

/**
 * Pipeline class
 */
class Pipeline extends EventEmitter {
  private running: boolean = false;
  private processedCount: number = 0;
  
  constructor(
    private name: string,
    private config: PipelineConfig,
    private logger: Logger,
    private service: DataAggregationService
  ) {
    super();
  }
  
  /**
   * Start pipeline
   */
  start(): void {
    this.running = true;
    this.logger.info(`Pipeline ${this.name} started`);
  }
  
  /**
   * Stop pipeline
   */
  stop(): void {
    this.running = false;
    this.logger.info(`Pipeline ${this.name} stopped`);
  }
  
  /**
   * Process data through pipeline
   */
  async process(data: any): Promise<any> {
    if (!this.running) return null;
    
    let result = data;
    
    try {
      // Process through stages
      for (const stage of this.config.stages) {
        result = await this.processStage(result, stage);
        
        if (result === null || result === undefined) {
          break;
        }
      }
      
      this.processedCount++;
      this.emit('processed', { data: result, count: this.processedCount });
      
      return result;
    } catch (error) {
      if (this.config.errorHandler) {
        this.config.errorHandler(error, data);
      } else {
        this.logger.error(`Pipeline ${this.name} error:`, error);
      }
      
      this.emit('error', { error, data });
      return null;
    }
  }
  
  /**
   * Process single stage
   */
  private async processStage(data: any, stage: PipelineStage): Promise<any> {
    switch (stage.type) {
      case 'aggregator':
        const aggregator = this.service.getAggregator(stage.name);
        return aggregator ? aggregator.aggregate(data) : data;
      
      case 'transformer':
        const transformer = this.service.getTransformer(stage.name);
        return transformer ? transformer.transform(data) : data;
      
      case 'enricher':
        return this.enrichData(data, stage.config);
      
      case 'validator':
        return this.validateData(data, stage.config) ? data : null;
      
      default:
        return data;
    }
  }
  
  /**
   * Enrich data
   */
  private async enrichData(data: any, config: any): Promise<any> {
    // Add metadata, timestamps, etc.
    return {
      ...data,
      enriched: true,
      timestamp: new Date(),
      pipeline: this.name
    };
  }
  
  /**
   * Validate data
   */
  private validateData(data: any, config: any): boolean {
    // Implement validation logic
    return data !== null && data !== undefined;
  }
  
  /**
   * Get pipeline statistics
   */
  getStats(): {
    name: string;
    running: boolean;
    processed: number;
  } {
    return {
      name: this.name,
      running: this.running,
      processed: this.processedCount
    };
  }
}