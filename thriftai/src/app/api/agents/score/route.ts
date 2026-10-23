/**
 * Agent Scoring API
 *
 * Demonstrates the multi-agent scoring system in action.
 * Scores products using all 7 specialized AI agents.
 *
 * @route POST /api/agents/score
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ScoreRequest {
  product: {
    id?: string;
    name: string;
    price: number;
    brand?: string;
    category?: string;
    description?: string;
    condition?: string;
    seller?: {
      name?: string;
      rating?: number;
      verified?: boolean;
    };
    images?: string[];
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ScoreRequest = await request.json();
    const { product } = body;

    // Validation
    if (!product || !product.name || typeof product.price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid product data. Required: name, price' },
        { status: 400 }
      );
    }

    logger.info('Agent scoring API called', { productName: product.name });

    // Score product using multi-agent system
    const result = await agentOrchestrator.scoreProduct({
      id: product.id || `temp_${Date.now()}`,
      name: product.name,
      price: product.price,
      brand: product.brand,
      category: product.category,
      description: product.description,
      condition: product.condition || 'Good',
      seller: product.seller,
      images: product.images
    });

    const processingTime = Date.now() - startTime;

    logger.info('Agent scoring completed', {
      productName: product.name,
      veritasScore: result.veritasScore,
      processingTime
    });

    return NextResponse.json({
      success: true,
      data: {
        product: {
          name: product.name,
          price: product.price,
          brand: product.brand,
          category: product.category
        },
        scoring: {
          veritasScore: result.veritasScore,
          confidence: result.confidence,
          componentScores: result.componentScores,
          explanation: result.explanation
        },
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          agentCount: Object.keys(result.componentScores).length
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Agent scoring API error', {
      error: error instanceof Error ? error.message : String(error),
      processingTime
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Scoring failed',
        message: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : 'An error occurred while scoring the product',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to retrieve agent system status
 */
export async function GET() {
  try {
    const stats = agentOrchestrator.getStats();
    const health = await agentOrchestrator.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        system: 'Agentic AI Orchestrator',
        version: '2.0.0',
        status: 'operational',
        agents: {
          count: stats.agentCount,
          health,
          weights: stats.weights,
          capabilities: Object.keys(stats.capabilities)
        },
        taskHistory: {
          total: stats.taskHistorySize
        }
      }
    });

  } catch (error) {
    logger.error('Agent status API error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve agent status'
      },
      { status: 500 }
    );
  }
}
