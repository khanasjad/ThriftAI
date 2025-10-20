/**
 * useABTest Hook
 * Phase 3.5: React hook for A/B testing integration
 *
 * Usage:
 * const { variant, isLoading, trackEvent } = useABTest('sustainability-weight-test');
 * if (variant?.config.sustainabilityWeight) {
 *   // Use treatment weight
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import {
  assignUserToVariant,
  trackEvent as trackEventApi,
  getCurrentUserId,
  getSessionId,
  type VariantConfig
} from '@/services/abTestingService';

interface UseABTestResult {
  /** Current variant assignment */
  variant: VariantConfig | null;
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Track an event for this experiment */
  trackEvent: (
    eventType: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'custom',
    eventData?: Record<string, any>
  ) => Promise<void>;
  /** Whether user is in control group */
  isControl: boolean;
  /** Whether user is in treatment group */
  isTreatment: boolean;
}

/**
 * Hook to use A/B testing in components
 *
 * Automatically assigns user to variant on mount
 * Provides utilities to track events
 *
 * @param experimentId - ID of the experiment
 * @param options - Optional configuration
 */
export function useABTest(
  experimentId: string,
  options?: {
    /** Skip automatic assignment (useful for server-side rendering) */
    skipAutoAssign?: boolean;
    /** User ID (if not using automatic detection) */
    userId?: string;
    /** Session ID (if not using automatic detection) */
    sessionId?: string;
  }
): UseABTestResult {
  const [variant, setVariant] = useState<VariantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = options?.userId || getCurrentUserId();
  const sessionId = options?.sessionId || getSessionId();

  // Assign user to variant on mount
  useEffect(() => {
    if (options?.skipAutoAssign || !userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const assignUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const assignment = await assignUserToVariant(
          experimentId,
          userId,
          sessionId
        );

        if (isMounted) {
          setVariant(assignment);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to assign variant'));
          console.error('A/B test assignment error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    assignUser();

    return () => {
      isMounted = false;
    };
  }, [experimentId, userId, sessionId, options?.skipAutoAssign]);

  // Track event callback
  const trackEvent = useCallback(
    async (
      eventType: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'custom',
      eventData?: Record<string, any>
    ) => {
      if (!userId) {
        console.warn('Cannot track event: User ID not available');
        return;
      }

      try {
        await trackEventApi(
          experimentId,
          userId,
          eventType,
          eventData,
          sessionId
        );
      } catch (err) {
        console.error('Failed to track A/B test event:', err);
        // Don't throw - event tracking failures should not break the app
      }
    },
    [experimentId, userId, sessionId]
  );

  return {
    variant,
    isLoading,
    error,
    trackEvent,
    isControl: variant?.isControl ?? false,
    isTreatment: variant ? !variant.isControl : false
  };
}

/**
 * Hook to track page views for A/B testing
 * Automatically tracks a 'view' event on mount
 *
 * @param experimentId - ID of the experiment
 */
export function useABTestPageView(experimentId: string): void {
  const { trackEvent } = useABTest(experimentId);

  useEffect(() => {
    trackEvent('view');
  }, [trackEvent]);
}

/**
 * Example usage in a component:
 *
 * function ProductPage() {
 *   const { variant, isLoading, trackEvent } = useABTest('sustainability-weight-test');
 *
 *   // Track page view
 *   useEffect(() => {
 *     trackEvent('view');
 *   }, [trackEvent]);
 *
 *   // Use variant config
 *   const sustainabilityWeight = variant?.config.sustainabilityWeight || 0.10;
 *
 *   // Track purchase
 *   const handlePurchase = async () => {
 *     await trackEvent('purchase', { amount: 99.99, productId: 'abc123' });
 *   };
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>Product Page</h1>
 *       {variant && (
 *         <p>Variant: {variant.variantName}</p>
 *       )}
 *     </div>
 *   );
 * }
 */
