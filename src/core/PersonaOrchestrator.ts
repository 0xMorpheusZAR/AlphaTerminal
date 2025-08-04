import { EventEmitter } from 'events';
import { Persona, TaskContext, TaskResult, PersonaScore } from '../types';
import { getAllPersonas, getPersona } from '../personas';
import winston from 'winston';

export class PersonaOrchestrator extends EventEmitter {
  private activePersonas: Map<string, PersonaInstance>;
  private taskQueue: TaskQueueItem[];
  private maxConcurrent: number;
  private logger: winston.Logger;
  private metrics: {
    tasksProcessed: number;
    totalExecutionTime: number;
    successCount: number;
    failureCount: number;
  };

  constructor(maxConcurrent: number = 5, logger: winston.Logger) {
    super();
    this.maxConcurrent = maxConcurrent;
    this.activePersonas = new Map();
    this.taskQueue = [];
    this.logger = logger;
    this.metrics = {
      tasksProcessed: 0,
      totalExecutionTime: 0,
      successCount: 0,
      failureCount: 0
    };
  }

  async evaluatePersonas(context: TaskContext): Promise<PersonaScore[]> {
    const personas = getAllPersonas();
    const scores: PersonaScore[] = [];

    for (const persona of personas) {
      const score = this.calculatePersonaScore(persona, context);
      scores.push({
        personaId: persona.id,
        score: score.total,
        breakdown: score.breakdown
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private calculatePersonaScore(persona: Persona, context: TaskContext): {
    total: number;
    breakdown: PersonaScore['breakdown'];
  } {
    const breakdown = {
      contextMatch: 0,
      capabilityMatch: 0,
      specializationMatch: 0,
      historicalPerformance: persona.confidenceFactors.historicalPerformance
    };

    // Context matching
    const contextKeywords = this.extractKeywords(context.description);
    const roleKeywords = this.extractKeywords(persona.role);
    breakdown.contextMatch = this.calculateSimilarity(contextKeywords, roleKeywords) * 
                            persona.confidenceFactors.contextMatch;

    // Capability matching
    const requiredCapabilities = context.requirements || [];
    const matchedCapabilities = requiredCapabilities.filter(req => 
      persona.capabilities.some(cap => cap.includes(req) || req.includes(cap))
    );
    breakdown.capabilityMatch = (matchedCapabilities.length / Math.max(requiredCapabilities.length, 1)) * 
                               persona.confidenceFactors.capabilityMatch;

    // Specialization matching
    if (context.technicalStack) {
      const matchedSpecs = context.technicalStack.filter(tech => 
        persona.specializations.some(spec => spec.includes(tech) || tech.includes(spec))
      );
      breakdown.specializationMatch = (matchedSpecs.length / context.technicalStack.length) * 
                                    persona.confidenceFactors.specializationMatch;
    }

    // Calculate total score (weighted average)
    const total = (
      breakdown.contextMatch * 0.25 +
      breakdown.capabilityMatch * 0.35 +
      breakdown.specializationMatch * 0.25 +
      breakdown.historicalPerformance * 0.15
    );

    return { total, breakdown };
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['and', 'the', 'for', 'with', 'from'].includes(word));
  }

  private calculateSimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async executeTask(personaId: string, context: TaskContext): Promise<TaskResult> {
    const taskId = this.generateTaskId();
    const startTime = new Date();

    try {
      // Check if we can execute immediately or need to queue
      if (this.activePersonas.size >= this.maxConcurrent) {
        return await this.queueTask(taskId, personaId, context);
      }

      // Activate persona
      const personaInstance = await this.activatePersona(personaId, taskId);
      
      // Execute task
      const result = await personaInstance.execute(context);
      
      // Update metrics
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      this.metrics.tasksProcessed++;
      this.metrics.totalExecutionTime += executionTime;
      this.metrics.successCount++;

      // Deactivate persona
      this.deactivatePersona(personaId);

      const taskResult: TaskResult = {
        taskId,
        personaId,
        status: 'completed',
        result,
        startTime,
        endTime,
        metrics: { executionTime }
      };

      this.emit('persona:completed', taskResult);
      
      // Process next queued task if any
      this.processNextInQueue();

      return taskResult;

    } catch (error) {
      this.metrics.failureCount++;
      this.deactivatePersona(personaId);
      
      this.emit('persona:failed', error, personaId);
      this.processNextInQueue();

      throw error;
    }
  }

  private async activatePersona(personaId: string, taskId: string): Promise<PersonaInstance> {
    const persona = getPersona(personaId);
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    const instance = new PersonaInstance(persona, taskId, this.logger);
    this.activePersonas.set(personaId, instance);
    this.emit('persona:activated', personaId);

    return instance;
  }

  private deactivatePersona(personaId: string): void {
    this.activePersonas.delete(personaId);
    this.emit('persona:deactivated', personaId);
  }

  private async queueTask(taskId: string, personaId: string, context: TaskContext): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        taskId,
        personaId,
        context,
        resolve,
        reject
      });
      this.logger.info(`Task ${taskId} queued for persona ${personaId}`);
    });
  }

  private processNextInQueue(): void {
    if (this.taskQueue.length === 0 || this.activePersonas.size >= this.maxConcurrent) {
      return;
    }

    const task = this.taskQueue.shift();
    if (task) {
      this.executeTask(task.personaId, task.context)
        .then(task.resolve)
        .catch(task.reject);
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActivePersonas(): string[] {
    return Array.from(this.activePersonas.keys());
  }

  getTaskCount(): number {
    return this.metrics.tasksProcessed;
  }

  getAverageExecutionTime(): number {
    return this.metrics.tasksProcessed > 0 
      ? this.metrics.totalExecutionTime / this.metrics.tasksProcessed 
      : 0;
  }

  getSuccessRate(): number {
    const total = this.metrics.successCount + this.metrics.failureCount;
    return total > 0 ? this.metrics.successCount / total : 0;
  }

  shutdown(): void {
    // Clear all active personas
    this.activePersonas.clear();
    
    // Reject all queued tasks
    this.taskQueue.forEach(task => {
      task.reject(new Error('Orchestrator shutdown'));
    });
    this.taskQueue = [];
  }
}

interface TaskQueueItem {
  taskId: string;
  personaId: string;
  context: TaskContext;
  resolve: (result: TaskResult) => void;
  reject: (error: Error) => void;
}

class PersonaInstance {
  constructor(
    private persona: Persona,
    private taskId: string,
    private logger: winston.Logger
  ) {}

  async execute(context: TaskContext): Promise<any> {
    this.logger.info(`Persona ${this.persona.id} executing task ${this.taskId}`);
    
    // Simulate persona-specific task execution
    // In a real implementation, this would delegate to specific handlers
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          personaId: this.persona.id,
          taskId: this.taskId,
          message: `Task completed by ${this.persona.name}`,
          context
        });
      }, Math.random() * 1000 + 500); // Simulate 0.5-1.5s execution
    });
  }
}