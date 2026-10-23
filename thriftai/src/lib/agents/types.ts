/**
 * Agent System Type Definitions
 *
 * Core types for the multi-agent AI system
 */

export interface AgentTask {
  type: string;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: number;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data: any;
  explanation?: string;
  confidence: number;
  cost?: number;
  processingTime: number;
  error?: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
}

export interface AgentMemory {
  shortTerm: Map<string, any>;
  longTerm: Map<string, any>;
  episodic: any[];
}

export abstract class BaseAgent {
  protected name: string;
  protected model: string;
  protected capabilities: AgentCapability[];
  protected memory: AgentMemory;

  constructor(name: string, model: string) {
    this.name = name;
    this.model = model;
    this.capabilities = [];
    this.memory = {
      shortTerm: new Map(),
      longTerm: new Map(),
      episodic: []
    };
  }

  abstract execute(task: AgentTask): Promise<AgentResult>;

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  getName(): string {
    return this.name;
  }

  getModel(): string {
    return this.model;
  }

  // Memory management
  remember(key: string, value: any, term: 'short' | 'long' = 'short'): void {
    if (term === 'short') {
      this.memory.shortTerm.set(key, value);
    } else {
      this.memory.longTerm.set(key, value);
    }
  }

  recall(key: string, term: 'short' | 'long' = 'short'): any {
    return term === 'short'
      ? this.memory.shortTerm.get(key)
      : this.memory.longTerm.get(key);
  }

  addEpisode(episode: any): void {
    this.memory.episodic.push({
      ...episode,
      timestamp: Date.now()
    });

    // Keep only last 100 episodes
    if (this.memory.episodic.length > 100) {
      this.memory.episodic.shift();
    }
  }
}

export interface ProductScoringInput {
  id: string;
  name: string;
  price: number;
  brand?: string;
  category?: string;
  description?: string;
  condition?: string;
  seller?: any;
  images?: string[];
  metadata?: Record<string, any>;
}

export interface ScoringResult {
  score: number; // 0-100
  confidence: number; // 0-1
  reasoning: string;
  factors: Record<string, number>;
  warnings?: string[];
  recommendations?: string[];
}
