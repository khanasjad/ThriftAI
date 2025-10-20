/**
 * A/B Testing Service
 * Phase 3.5: Integration with ML Inference API
 *
 * Provides client-side and server-side utilities for A/B testing
 */

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface VariantConfig {
  variantId: string;
  variantName: string;
  config: Record<string, any>;
  isControl: boolean;
}

export interface ExperimentVariant {
  name: string;
  description?: string;
  trafficPercentage: number;
  config: Record<string, any>;
  isControl: boolean;
}

export interface CreateExperimentRequest {
  name: string;
  description?: string;
  durationDays: number;
  primaryMetric: string;
  secondaryMetrics?: string[];
  variants: ExperimentVariant[];
}

export interface ExperimentResults {
  experimentId: string;
  status: string;
  daysRunning: number;
  totalUsers: number;
  results: {
    control: {
      users: number;
      conversions: number;
      conversionRate: number;
      avgOrderValue: number;
    };
    treatment: {
      users: number;
      conversions: number;
      conversionRate: number;
      avgOrderValue: number;
    };
  };
  analysis: {
    conversionRateLift: number;
    pValue: number;
    confidence: number;
    recommendation: string;
  };
}

// ============================================================================
// Client-Side API Calls
// ============================================================================

/**
 * Create a new A/B test experiment
 */
export async function createExperiment(
  request: CreateExperimentRequest
): Promise<{ experimentId: string; status: string }> {
  const response = await fetch(`${ML_API_URL}/api/ml/ab-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create experiment');
  }

  return response.json();
}

/**
 * Get experiment results with statistical analysis
 */
export async function getExperimentResults(
  experimentId: string
): Promise<ExperimentResults> {
  const response = await fetch(`${ML_API_URL}/api/ml/ab-test/${experimentId}/results`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get experiment results');
  }

  return response.json();
}

/**
 * Assign user to a variant
 * Returns variant configuration to use
 */
export async function assignUserToVariant(
  experimentId: string,
  userId: string,
  sessionId?: string
): Promise<VariantConfig> {
  const url = new URL(`${ML_API_URL}/api/ml/ab-test/${experimentId}/assign/${userId}`);
  if (sessionId) {
    url.searchParams.set('session_id', sessionId);
  }

  const response = await fetch(url.toString(), { method: 'POST' });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to assign user');
  }

  return response.json();
}

/**
 * Track an event for A/B test analysis
 */
export async function trackEvent(
  experimentId: string,
  userId: string,
  eventType: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'custom',
  eventData?: Record<string, any>,
  sessionId?: string
): Promise<void> {
  const response = await fetch(`${ML_API_URL}/api/ml/ab-test/${experimentId}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      session_id: sessionId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to track event');
  }
}

/**
 * Update experiment status
 */
export async function updateExperimentStatus(
  experimentId: string,
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
): Promise<{ status: string; startDate?: string; endDate?: string }> {
  const response = await fetch(`${ML_API_URL}/api/ml/ab-test/${experimentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update experiment status');
  }

  return response.json();
}

// ============================================================================
// Server-Side Utilities (for API routes)
// ============================================================================

/**
 * Server-side variant assignment using Prisma
 */
export async function assignUserToVariantServer(
  experimentId: string,
  userId: string,
  sessionId?: string
): Promise<VariantConfig> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check if user already assigned
    const existingAssignment = await prisma.abAssignment.findUnique({
      where: {
        uq_experiment_user: {
          experimentId,
          userId
        }
      },
      include: {
        variant: true
      }
    });

    if (existingAssignment) {
      return {
        variantId: existingAssignment.variant.id,
        variantName: existingAssignment.variant.name,
        config: existingAssignment.variant.config as Record<string, any>,
        isControl: existingAssignment.variant.isControl
      };
    }

    // Get all variants for this experiment
    const variants = await prisma.abVariant.findMany({
      where: { experimentId },
      orderBy: { trafficPercentage: 'asc' }
    });

    if (variants.length === 0) {
      throw new Error('No variants found for experiment');
    }

    // Weighted random selection
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedVariant = variants[0];

    for (const variant of variants) {
      cumulative += variant.trafficPercentage;
      if (random <= cumulative) {
        selectedVariant = variant;
        break;
      }
    }

    // Create assignment
    await prisma.abAssignment.create({
      data: {
        experimentId,
        userId,
        variantId: selectedVariant.id,
        sessionId,
        assignedBy: 'system'
      }
    });

    return {
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      config: selectedVariant.config as Record<string, any>,
      isControl: selectedVariant.isControl
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Server-side event tracking using Prisma
 */
export async function trackEventServer(
  experimentId: string,
  userId: string,
  eventType: string,
  eventData?: Record<string, any>,
  sessionId?: string
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Get user's variant assignment
    const assignment = await prisma.abAssignment.findUnique({
      where: {
        uq_experiment_user: {
          experimentId,
          userId
        }
      }
    });

    if (!assignment) {
      console.warn(`User ${userId} not assigned to experiment ${experimentId}`);
      return;
    }

    // Track event
    await prisma.abEvent.create({
      data: {
        experimentId,
        userId,
        variantId: assignment.variantId,
        eventType,
        eventData: eventData || {},
        sessionId,
        eventDate: new Date()
      }
    });

    // Update cached variant statistics if it's a purchase
    if (eventType === 'purchase') {
      await prisma.$executeRaw`
        UPDATE ab_variants
        SET
          conversion_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM ab_events
            WHERE variant_id = ${assignment.variantId} AND event_type = 'purchase'
          ),
          total_revenue = (
            SELECT COALESCE(SUM((event_data->>'amount')::DECIMAL), 0)
            FROM ab_events
            WHERE variant_id = ${assignment.variantId} AND event_type = 'purchase'
          )
        WHERE id = ${assignment.variantId}
      `;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user ID from session
 * This is a placeholder - implement based on your auth system
 */
export function getCurrentUserId(): string | null {
  // TODO: Implement based on your authentication system
  // For now, return a guest ID from localStorage
  if (typeof window !== 'undefined') {
    let guestId = localStorage.getItem('guest_user_id');
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('guest_user_id', guestId);
    }
    return guestId;
  }
  return null;
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
  return '';
}
