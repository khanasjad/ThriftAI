/**
 * Example A/B Testing API Route
 * Phase 3.5: Demonstrates server-side A/B testing integration
 *
 * This example shows how to:
 * 1. Create an experiment
 * 2. Assign users to variants
 * 3. Track events
 * 4. Get experiment results
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  assignUserToVariantServer,
  trackEventServer,
  createExperiment,
  getExperimentResults,
  updateExperimentStatus
} from '@/services/abTestingService';

const prisma = new PrismaClient();

/**
 * Example 1: Create a Veritas Weight A/B Test
 *
 * POST /api/ab-testing/example?action=create
 */
async function handleCreateExperiment(): Promise<NextResponse> {
  try {
    const result = await createExperiment({
      name: 'Sustainability Weight Test',
      description: 'Test impact of increasing sustainability weight from 0.10 to 0.15',
      durationDays: 14,
      primaryMetric: 'conversion_rate',
      secondaryMetrics: ['avg_order_value', 'customer_satisfaction'],
      variants: [
        {
          name: 'Control (0.10)',
          description: 'Current sustainability weight',
          trafficPercentage: 50,
          config: {
            veritasWeights: {
              productQuality: 0.25,
              marketValue: 0.20,
              sellerReliability: 0.15,
              sustainability: 0.10,
              logistics: 0.10,
              brandReputation: 0.10,
              customerSentiment: 0.05,
              priceToValue: 0.05
            }
          },
          isControl: true
        },
        {
          name: 'Treatment (0.15)',
          description: 'Increased sustainability weight',
          trafficPercentage: 50,
          config: {
            veritasWeights: {
              productQuality: 0.23,
              marketValue: 0.18,
              sellerReliability: 0.15,
              sustainability: 0.15,
              logistics: 0.10,
              brandReputation: 0.10,
              customerSentiment: 0.05,
              priceToValue: 0.04
            }
          },
          isControl: false
        }
      ]
    });

    // Activate the experiment
    await updateExperimentStatus(result.experimentId, 'ACTIVE');

    return NextResponse.json({
      success: true,
      message: 'Experiment created and activated',
      experimentId: result.experimentId
    });
  } catch (error) {
    console.error('Failed to create experiment:', error);
    return NextResponse.json(
      { error: 'Failed to create experiment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example 2: Assign User and Get Variant
 *
 * GET /api/ab-testing/example?action=assign&experimentId=xxx&userId=yyy
 */
async function handleAssignUser(experimentId: string, userId: string): Promise<NextResponse> {
  try {
    const variant = await assignUserToVariantServer(experimentId, userId);

    return NextResponse.json({
      success: true,
      variant: {
        id: variant.variantId,
        name: variant.variantName,
        isControl: variant.isControl,
        weights: variant.config.veritasWeights
      }
    });
  } catch (error) {
    console.error('Failed to assign user:', error);
    return NextResponse.json(
      { error: 'Failed to assign user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example 3: Track Purchase Event
 *
 * POST /api/ab-testing/example?action=track
 * Body: { experimentId, userId, eventType, eventData }
 */
async function handleTrackEvent(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { experimentId, userId, eventType, eventData } = body;

    await trackEventServer(experimentId, userId, eventType, eventData);

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    return NextResponse.json(
      { error: 'Failed to track event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example 4: Get Experiment Results
 *
 * GET /api/ab-testing/example?action=results&experimentId=xxx
 */
async function handleGetResults(experimentId: string): Promise<NextResponse> {
  try {
    const results = await getExperimentResults(experimentId);

    return NextResponse.json({
      success: true,
      results: {
        status: results.status,
        daysRunning: results.daysRunning,
        totalUsers: results.totalUsers,
        control: {
          users: results.results.control.users,
          conversions: results.results.control.conversions,
          conversionRate: `${(results.results.control.conversionRate * 100).toFixed(2)}%`,
          avgOrderValue: `$${results.results.control.avgOrderValue.toFixed(2)}`
        },
        treatment: {
          users: results.results.treatment.users,
          conversions: results.results.treatment.conversions,
          conversionRate: `${(results.results.treatment.conversionRate * 100).toFixed(2)}%`,
          avgOrderValue: `$${results.results.treatment.avgOrderValue.toFixed(2)}`
        },
        analysis: {
          lift: `${results.analysis.conversionRateLift.toFixed(1)}%`,
          pValue: results.analysis.pValue,
          confidence: `${results.analysis.confidence}%`,
          recommendation: results.analysis.recommendation,
          isStatisticallySignificant: results.analysis.pValue < 0.05
        }
      }
    });
  } catch (error) {
    console.error('Failed to get results:', error);
    return NextResponse.json(
      { error: 'Failed to get results', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example 5: List All Active Experiments
 *
 * GET /api/ab-testing/example?action=list
 */
async function handleListExperiments(): Promise<NextResponse> {
  try {
    const experiments = await prisma.ab_experiments.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            trafficPercentage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      experiments: experiments.map((exp: any) => ({
        id: exp.id,
        name: exp.name,
        status: exp.status,
        primaryMetric: exp.primaryMetric,
        daysRunning: exp.startDate
          ? Math.floor((new Date().getTime() - new Date(exp.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        variants: exp.variants
      }))
    });
  } catch (error) {
    console.error('Failed to list experiments:', error);
    return NextResponse.json(
      { error: 'Failed to list experiments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// Route Handlers
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'assign': {
      const experimentId = searchParams.get('experimentId');
      const userId = searchParams.get('userId');

      if (!experimentId || !userId) {
        return NextResponse.json(
          { error: 'Missing experimentId or userId' },
          { status: 400 }
        );
      }

      return handleAssignUser(experimentId, userId);
    }

    case 'results': {
      const experimentId = searchParams.get('experimentId');

      if (!experimentId) {
        return NextResponse.json(
          { error: 'Missing experimentId' },
          { status: 400 }
        );
      }

      return handleGetResults(experimentId);
    }

    case 'list':
      return handleListExperiments();

    default:
      return NextResponse.json(
        {
          error: 'Invalid action',
          validActions: ['create', 'assign', 'track', 'results', 'list']
        },
        { status: 400 }
      );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'create':
      return handleCreateExperiment();

    case 'track':
      return handleTrackEvent(request);

    default:
      return NextResponse.json(
        {
          error: 'Invalid action',
          validActions: ['create', 'track']
        },
        { status: 400 }
      );
  }
}

/**
 * Example Usage:
 *
 * 1. Create experiment:
 *    POST /api/ab-testing/example?action=create
 *
 * 2. Assign user to variant:
 *    GET /api/ab-testing/example?action=assign&experimentId=xxx&userId=user123
 *
 * 3. Track event:
 *    POST /api/ab-testing/example?action=track
 *    Body: {
 *      "experimentId": "xxx",
 *      "userId": "user123",
 *      "eventType": "purchase",
 *      "eventData": { "amount": 99.99, "productId": "abc123" }
 *    }
 *
 * 4. Get results:
 *    GET /api/ab-testing/example?action=results&experimentId=xxx
 *
 * 5. List active experiments:
 *    GET /api/ab-testing/example?action=list
 */
