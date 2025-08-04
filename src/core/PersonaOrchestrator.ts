import { EventEmitter } from 'events';

export interface Persona {
  name: string;
  specialization: string[];
  confidence: number;
  isActive: boolean;
}

export interface Task {
  id: string;
  description: string;
  context: any;
  assignedPersonas: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export class PersonaOrchestrator extends EventEmitter {
  private personas: Map<string, Persona> = new Map();
  private activeTasks: Map<string, Task> = new Map();

  constructor() {
    super();
    this.initializePersonas();
  }

  private initializePersonas() {
    const corePersonas = [
      { name: 'architect', specialization: ['design', 'system', 'architecture'], confidence: 0.9, isActive: false },
      { name: 'frontend', specialization: ['ui', 'react', 'components', 'css'], confidence: 0.85, isActive: false },
      { name: 'backend', specialization: ['api', 'server', 'database', 'integration'], confidence: 0.9, isActive: false },
      { name: 'security', specialization: ['auth', 'encryption', 'compliance'], confidence: 0.95, isActive: false },
      { name: 'performance', specialization: ['optimization', 'scaling', 'caching'], confidence: 0.8, isActive: false },
      { name: 'analyzer', specialization: ['market', 'data', 'analytics', 'insights'], confidence: 0.9, isActive: false },
      { name: 'qa', specialization: ['testing', 'quality', 'validation'], confidence: 0.85, isActive: false },
      { name: 'devops', specialization: ['deployment', 'infrastructure', 'monitoring'], confidence: 0.8, isActive: false }
    ];

    corePersonas.forEach(persona => {
      this.personas.set(persona.name, persona);
    });
  }

  selectPersonasForTask(taskDescription: string, context: any): string[] {
    const relevantPersonas: { name: string; score: number }[] = [];

    this.personas.forEach((persona, name) => {
      let score = 0;
      
      // Domain matching
      persona.specialization.forEach(spec => {
        if (taskDescription.toLowerCase().includes(spec)) {
          score += 0.3;
        }
      });

      // Context-based scoring
      if (context.projectType === 'crypto' && name === 'analyzer') score += 0.4;
      if (context.security === 'critical' && name === 'security') score += 0.5;
      if (context.performance === 'high' && name === 'performance') score += 0.4;
      
      // Base confidence
      score += persona.confidence * 0.2;

      if (score > 0.3) {
        relevantPersonas.push({ name, score });
      }
    });

    return relevantPersonas
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(p => p.name);
  }

  async processTask(taskDescription: string, context: any = {}): Promise<any> {
    const taskId = `task_${Date.now()}`;
    const selectedPersonas = this.selectPersonasForTask(taskDescription, context);

    const task: Task = {
      id: taskId,
      description: taskDescription,
      context,
      assignedPersonas: selectedPersonas,
      status: 'pending'
    };

    this.activeTasks.set(taskId, task);
    this.emit('task:created', task);

    // Activate personas
    selectedPersonas.forEach(personaName => {
      const persona = this.personas.get(personaName);
      if (persona) {
        persona.isActive = true;
        this.emit('persona:activated', { persona: personaName, task: taskDescription });
      }
    });

    // Simulate task processing
    task.status = 'in_progress';
    this.emit('task:progress', task);

    return new Promise((resolve) => {
      setTimeout(() => {
        task.status = 'completed';
        this.emit('task:completed', task);

        // Deactivate personas
        selectedPersonas.forEach(personaName => {
          const persona = this.personas.get(personaName);
          if (persona) {
            persona.isActive = false;
            this.emit('persona:deactivated', personaName);
          }
        });

        resolve({
          taskId,
          result: `Task completed by personas: ${selectedPersonas.join(', ')}`,
          personas: selectedPersonas
        });
      }, 2000);
    });
  }

  getActivePersonas(): Persona[] {
    return Array.from(this.personas.values()).filter(p => p.isActive);
  }

  getPersonaStatus(): any {
    const status: any = {};
    this.personas.forEach((persona, name) => {
      status[name] = {
        specialization: persona.specialization,
        confidence: persona.confidence,
        isActive: persona.isActive
      };
    });
    return status;
  }
}