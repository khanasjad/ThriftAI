/**
 * Agentic AI Orchestrator - Master Coordinator
 *
 * Central intelligence that coordinates all specialized agents.
 * Uses Claude Sonnet 4 for high-level decision making and task distribution.
 *
 * Capabilities:
 * - Multi-agent coordination
 * - Task planning and distribution
 * - Conflict resolution
 * - Autonomous decision making
 *
 * @version 2.0.0 - 2026 Agentic AI
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropicClient, isAnthropicConfigured } from '@/lib/anthropic-client'
import { logger } from '@/lib/logger';
import { BaseAgent, AgentTask, AgentResult, AgentCapability } from './types';
import { PriceAgent } from './specialized/PriceAgent';
import { QualityAgent } from './specialized/QualityAgent';
import { SustainabilityAgent } from './specialized/SustainabilityAgent';
import { TrustAgent } from './specialized/TrustAgent';
import { MarketDemandAgent } from './specialized/MarketDemandAgent';
import { SpecMatcherAgent } from './specialized/SpecMatcherAgent';
import { FinancialValueAgent } from './specialized/FinancialValueAgent';

export interface OrchestrationPlan {
  task: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  requiredAgents: string[];
  executionOrder: 'parallel' | 'sequential';
  confidenceThreshold: number;
  estimatedCost: number;
  estimatedTime: number;
}

export interface OrchestrationResult {
  success: boolean;
  results: Record<string, AgentResult>;
  consensus?: any;
  explanation: string;
  cost: number;
  processingTime: number;
}

export class AgentOrchestrator {
  private anthropic: Anthropic;
  private agents: Map<string, BaseAgent>;
  private taskHistory: AgentTask[] = [];
  private learningWeights: Record<string, number>;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    // Initialize specialized agents
    this.agents = new Map([
      ['price', new PriceAgent()],
      ['quality', new QualityAgent()],
      ['sustainability', new SustainabilityAgent()],
      ['trust', new TrustAgent()],
      ['demand', new MarketDemandAgent()],
      ['specs', new SpecMatcherAgent()],
      ['financial', new FinancialValueAgent()]
    ]);

    // Default learning weights (adjusted based on user behavior)
    this.learningWeights = {
      price: 0.25,
      quality: 0.20,
      sustainability: 0.10,
      trust: 0.15,
      demand: 0.10,
      specs: 0.10,
      financial: 0.10
    };

    logger.info('Agent Orchestrator initialized', {
      agentCount: this.agents.size,
      weights: this.learningWeights
    });
  }

  /**
   * Master planning: Analyze task and create execution plan
   */
  async planExecution(task: string, context?: any): Promise<OrchestrationPlan> {
    const startTime = Date.now();

    try {
      logger.info('Planning task execution', { task });

      // Use Claude Sonnet 4 for high-level planning
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.3,
        system: `You are the Master AI Orchestrator for ThriftAI, coordinating specialized agents.

Your role:
- Analyze user tasks
- Determine which specialized agents are needed
- Plan optimal execution strategy
- Estimate costs and time

Available agents:
1. price - Analyzes pricing, deals, market value
2. quality - Assesses product condition, authenticity, durability
3. sustainability - Evaluates environmental impact, second-hand value
4. trust - Checks seller reliability, fraud risk
5. demand - Analyzes market popularity, trends
6. specs - Matches product specifications to user needs
7. financial - Calculates ROI, total cost of ownership

Output format (JSON):
{
  "complexity": "simple|medium|complex|expert",
  "requiredAgents": ["agent1", "agent2"],
  "executionOrder": "parallel|sequential",
  "confidenceThreshold": 0.8,
  "reasoning": "why these agents and strategy"
}`,
        messages: [{
          role: 'user',
          content: `Task: ${task}\n\nContext: ${JSON.stringify(context || {}, null, 2)}\n\nCreate execution plan.`
        }]
      });

      const content = response.content[0];
      const planText = content.type === 'text' ? content.text : '';

      // Parse JSON from response
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      const planData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        complexity: 'medium',
        requiredAgents: ['price', 'quality', 'trust'],
        executionOrder: 'parallel'
      };

      const plan: OrchestrationPlan = {
        task,
        complexity: planData.complexity || 'medium',
        requiredAgents: planData.requiredAgents || ['price', 'quality'],
        executionOrder: planData.executionOrder || 'parallel',
        confidenceThreshold: planData.confidenceThreshold || 0.7,
        estimatedCost: this.estimateCost(planData.requiredAgents?.length || 2),
        estimatedTime: Date.now() - startTime
      };

      logger.info('Execution plan created', { plan });
      return plan;

    } catch (error) {
      logger.error('Planning failed, using fallback', { error });

      // Fallback plan
      return {
        task,
        complexity: 'medium',
        requiredAgents: ['price', 'quality', 'trust'],
        executionOrder: 'parallel',
        confidenceThreshold: 0.7,
        estimatedCost: 0.015,
        estimatedTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute task using multiple agents
   */
  async executeTask(
    task: string,
    data: any,
    plan?: OrchestrationPlan
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();

    try {
      // Create plan if not provided
      const executionPlan = plan || await this.planExecution(task, data);

      logger.info('Executing task with agents', {
        task,
        agents: executionPlan.requiredAgents,
        order: executionPlan.executionOrder
      });

      // Execute agents
      const results: Record<string, AgentResult> = {};
      let totalCost = 0;

      if (executionPlan.executionOrder === 'parallel') {
        // Parallel execution
        const promises = executionPlan.requiredAgents.map(async (agentName) => {
          const agent = this.agents.get(agentName);
          if (!agent) {
            logger.warn(`Agent not found: ${agentName}`);
            return null;
          }

          const result = await agent.execute({
            type: task,
            data,
            priority: 'normal',
            deadline: Date.now() + 30000 // 30 second timeout
          });

          return { agentName, result };
        });

        const agentResults = await Promise.all(promises);

        agentResults.forEach(item => {
          if (item && item.result) {
            results[item.agentName] = item.result;
            totalCost += item.result.cost || 0;
          }
        });

      } else {
        // Sequential execution
        for (const agentName of executionPlan.requiredAgents) {
          const agent = this.agents.get(agentName);
          if (!agent) continue;

          const result = await agent.execute({
            type: task,
            data: { ...data, previousResults: results },
            priority: 'normal',
            deadline: Date.now() + 30000
          });

          results[agentName] = result;
          totalCost += result.cost || 0;
        }
      }

      // Build consensus from agent results
      const consensus = await this.buildConsensus(results, data);

      const processingTime = Date.now() - startTime;

      logger.info('Task execution completed', {
        task,
        agentCount: Object.keys(results).length,
        processingTime,
        cost: totalCost
      });

      return {
        success: true,
        results,
        consensus,
        explanation: this.explainDecision(results, consensus),
        cost: totalCost,
        processingTime
      };

    } catch (error) {
      logger.error('Task execution failed', { task, error });
      throw error;
    }
  }

  /**
   * Score a product using all applicable agents
   */
  async scoreProduct(product: any): Promise<{
    veritasScore: number;
    componentScores: Record<string, number>;
    explanation: string;
    confidence: number;
  }> {
    const startTime = Date.now();

    try {
      logger.info('Scoring product', { productId: product.id, productName: product.name });

      // Execute all scoring agents in parallel
      const agentResults = await this.executeTask('score_product', product);

      if (!agentResults.success) {
        throw new Error('Agent execution failed');
      }

      // Extract scores from each agent
      const componentScores: Record<string, number> = {};
      let totalWeightedScore = 0;
      let totalWeight = 0;

      Object.entries(agentResults.results).forEach(([agentName, result]) => {
        if (result.success && typeof result.data?.score === 'number') {
          const weight = this.learningWeights[agentName] || 0.1;
          componentScores[agentName] = result.data.score;
          totalWeightedScore += result.data.score * weight;
          totalWeight += weight;
        }
      });

      // Calculate final Veritas Score (0-100)
      const veritasScore = totalWeight > 0
        ? Math.round((totalWeightedScore / totalWeight) * 100)
        : 50; // Default fallback

      // Calculate confidence based on agent agreement
      const scores = Object.values(componentScores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) =>
        sum + Math.pow(score - avgScore, 2), 0
      ) / scores.length;
      const confidence = Math.max(0, 1 - (Math.sqrt(variance) / 50)); // 0-1 scale

      logger.info('Product scored', {
        productId: product.id,
        veritasScore,
        confidence,
        processingTime: Date.now() - startTime
      });

      return {
        veritasScore,
        componentScores,
        explanation: agentResults.explanation,
        confidence
      };

    } catch (error) {
      logger.error('Product scoring failed', { productId: product.id, error });

      // Return default scores on error
      return {
        veritasScore: 50,
        componentScores: {},
        explanation: 'Scoring failed, using default values',
        confidence: 0.5
      };
    }
  }

  /**
   * Build consensus from multiple agent results
   */
  private async buildConsensus(
    results: Record<string, AgentResult>,
    originalData: any
  ): Promise<any> {
    try {
      // If only one agent, return its result directly
      const resultEntries = Object.entries(results);
      if (resultEntries.length === 1) {
        return resultEntries[0][1].data;
      }

      // Use Claude to synthesize multiple agent opinions
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.3,
        system: 'You are synthesizing results from multiple AI agents. Create a unified consensus.',
        messages: [{
          role: 'user',
          content: `Agent results:\n${JSON.stringify(results, null, 2)}\n\nSynthesize into consensus.`
        }]
      });

      const content = response.content[0];
      const consensusText = content.type === 'text' ? content.text : '';

      return {
        synthesis: consensusText,
        agentResults: results
      };

    } catch (error) {
      logger.error('Consensus building failed', { error });
      return { agentResults: results };
    }
  }

  /**
   * Explain the decision-making process
   */
  private explainDecision(
    results: Record<string, AgentResult>,
    consensus: any
  ): string {
    const explanations: string[] = [];

    Object.entries(results).forEach(([agentName, result]) => {
      if (result.success && result.explanation) {
        explanations.push(`${agentName}: ${result.explanation}`);
      }
    });

    return explanations.join('\n');
  }

  /**
   * Learn from user feedback and adjust weights
   */
  async learnFromFeedback(feedback: {
    productId: string;
    userChoice: any;
    ourRecommendation: any;
    action: 'clicked' | 'purchased' | 'ignored';
  }): Promise<void> {
    try {
      logger.info('Learning from user feedback', { feedback });

      // Analyze which agent scores aligned with user choice
      // Agents that predicted user preference get weight boost
      // This is simplified - full implementation would use reinforcement learning

      // For now, adjust weights based on action
      if (feedback.action === 'clicked' || feedback.action === 'purchased') {
        // User engaged - reinforce current weights slightly
        Object.keys(this.learningWeights).forEach(agent => {
          this.learningWeights[agent] *= 1.01; // 1% boost
        });
      }

      // Normalize weights to sum to 1.0
      const totalWeight = Object.values(this.learningWeights).reduce((a, b) => a + b, 0);
      Object.keys(this.learningWeights).forEach(agent => {
        this.learningWeights[agent] /= totalWeight;
      });

      logger.debug('Learning weights updated', { weights: this.learningWeights });

    } catch (error) {
      logger.error('Learning failed', { error });
    }
  }

  /**
   * Get current agent statistics
   */
  getStats(): {
    agentCount: number;
    weights: Record<string, number>;
    taskHistorySize: number;
    capabilities: Record<string, AgentCapability[]>;
  } {
    const capabilities: Record<string, AgentCapability[]> = {};

    this.agents.forEach((agent, name) => {
      capabilities[name] = agent.getCapabilities();
    });

    return {
      agentCount: this.agents.size,
      weights: { ...this.learningWeights },
      taskHistorySize: this.taskHistory.length,
      capabilities
    };
  }

  /**
   * Estimate cost for agent execution
   */
  private estimateCost(agentCount: number): number {
    // Rough estimate: $0.005 per agent execution
    return agentCount * 0.005;
  }

  /**
   * Health check for all agents
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [name, agent] of this.agents.entries()) {
      try {
        // Simple health check - can agent respond?
        const result = await agent.execute({
          type: 'health_check',
          data: {},
          priority: 'low',
          deadline: Date.now() + 5000
        });
        health[name] = result.success;
      } catch {
        health[name] = false;
      }
    }

    return health;
  }
}

// Export singleton
export const agentOrchestrator = new AgentOrchestrator();
