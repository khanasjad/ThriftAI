/**
 * TrustReliabilityAgent Tests
 *
 * Tests for Bayesian rating aggregation, seller history analysis,
 * return policy assessment, and shipping reliability scoring.
 */

import { TrustReliabilityAgent } from '@/lib/agents/specialized/TrustReliabilityAgent';
import {
  VeritasProductInput,
  VeritasSellerProfile,
  VeritasQualitySignals,
  VeritasAgentResult
} from '@/lib/agents/veritasTypes';

describe('TrustReliabilityAgent', () => {
  let agent: TrustReliabilityAgent;

  beforeEach(() => {
    agent = new TrustReliabilityAgent();
  });

  // ============================================================================
  // Test: Agent Metadata
  // ============================================================================

  describe('Agent Metadata', () => {
    it('should have correct agent properties', () => {
      expect(agent.name).toBe('TrustReliabilityAgent');
      expect(agent.version).toBe('v1.0');
      expect(agent.weight).toBe(0.15);
      expect(agent.description).toContain('trustworthiness');
    });

    it('should list all possible flags', () => {
      const flags = agent.getPossibleFlags();
      expect(flags).toContain('VERY_NEW_SELLER');
      expect(flags).toContain('NO_RETURN_POLICY');
      expect(flags).toContain('NO_TRACKING');
      expect(flags).toContain('HIGH_DISPUTE_RATE');
      expect(flags.length).toBeGreaterThan(10);
    });
  });

  // ============================================================================
  // Test: Bayesian Rating (Wilson Score)
  // ============================================================================

  describe('Bayesian Rating Aggregation', () => {
    it('should penalize new seller with 1 perfect review vs established seller', async () => {
      // Scenario: New seller (5.0/5, n=1) vs Established seller (4.8/5, n=1000)

      const newSellerProduct: VeritasProductInput = {
        listing_id: 'new-seller-001',
        title: 'iPhone 14',
        price: 800,
        category: 'Smartphones',
        seller_profile: {
          seller_rating: 5.0,
          seller_reviews_count: 1,
          seller_total_sales: 1,
          seller_member_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const establishedSellerProduct: VeritasProductInput = {
        listing_id: 'established-seller-001',
        title: 'iPhone 14',
        price: 800,
        category: 'Smartphones',
        seller_profile: {
          seller_rating: 4.8,
          seller_reviews_count: 1000,
          seller_total_sales: 1000,
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString() // 2 years ago
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const newSellerResult = await agent.analyzeVeritas(newSellerProduct);
      const establishedSellerResult = await agent.analyzeVeritas(establishedSellerProduct);

      // Established seller should score higher despite lower average rating
      expect(establishedSellerResult.score).toBeGreaterThan(newSellerResult.score);

      // New seller should have lower confidence
      expect(newSellerResult.confidence).toBeLessThan(establishedSellerResult.confidence);

      // New seller should be flagged
      expect(newSellerResult.flags).toContain('NEW_SELLER');
    });

    it('should handle no rating data gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-rating-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          // No rating data
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeLessThan(0.5); // Low confidence
      expect(result.evidence).toContain('No seller rating data available - using neutral baseline');
    });

    it('should calculate Wilson score correctly for various sample sizes', async () => {
      // Test cases: (rating, n, expected behavior)
      const testCases = [
        { rating: 5.0, n: 1, expectedLower: true }, // Low confidence, penalized
        { rating: 5.0, n: 10, expectedLower: true },
        { rating: 5.0, n: 100, expectedHigher: true },
        { rating: 4.5, n: 1000, expectedHigher: true } // High confidence
      ];

      const results: number[] = [];

      for (const testCase of testCases) {
        const product: VeritasProductInput = {
          listing_id: `wilson-test-${testCase.n}`,
          title: 'Test Product',
          price: 100,
          category: 'Electronics',
          seller_profile: {
            seller_rating: testCase.rating,
            seller_reviews_count: testCase.n,
            seller_total_sales: testCase.n,
            seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          quality_signals: {
            return_policy_days: 30,
            shipping_tracking: true
          }
        };

        const result = await agent.analyzeVeritas(product);
        results.push(result.score);
      }

      // Verify scores increase with sample size (for same average rating)
      expect(results[2]).toBeGreaterThan(results[0]); // n=100 > n=1
    });
  });

  // ============================================================================
  // Test: Seller History Analysis
  // ============================================================================

  describe('Seller History Analysis', () => {
    it('should give high score to established seller with good history', async () => {
      const product: VeritasProductInput = {
        listing_id: 'established-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.8,
          seller_reviews_count: 500,
          seller_total_sales: 1000,
          seller_disputes_count: 5, // 0.5% dispute rate
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString() // 2 years
        },
        quality_signals: {
          return_policy_days: 60,
          free_returns: true,
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.evidence.some(e => e.includes('Account age'))).toBe(true);
      expect(result.evidence.some(e => e.includes('Total sales'))).toBe(true);
      expect(result.flags).not.toContain('NEW_SELLER');
    });

    it('should flag very new sellers (< 1 month)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'very-new-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 5.0,
          seller_reviews_count: 2,
          seller_total_sales: 2,
          seller_member_since: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('VERY_NEW_SELLER');
      expect(result.evidence.some(e => e.includes('Very new seller'))).toBe(true);
    });

    it('should flag sellers with no sales history', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-sales-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_total_sales: 0,
          seller_member_since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('NO_SALES_HISTORY');
      expect(result.evidence).toContain('Warning: Seller has no sales history');
    });

    it('should flag high dispute rates (> 5%)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'high-disputes-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.0,
          seller_reviews_count: 100,
          seller_total_sales: 100,
          seller_disputes_count: 8, // 8% dispute rate
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('HIGH_DISPUTE_RATE');
      expect(result.evidence.some(e => e.includes('High dispute rate'))).toBe(true);
    });

    it('should handle missing seller data gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'missing-data-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          // Minimal data
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.flags).toContain('MISSING_SELLER_DATA');
    });
  });

  // ============================================================================
  // Test: Return Policy Assessment
  // ============================================================================

  describe('Return Policy Assessment', () => {
    it('should give high score for 90+ day returns with free shipping', async () => {
      const product: VeritasProductInput = {
        listing_id: 'excellent-returns-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 90,
          free_returns: true,
          restocking_fee: false,
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThan(70);
      expect(result.evidence.some(e => e.includes('90+ day return window'))).toBe(true);
      expect(result.evidence.some(e => e.includes('Free return shipping'))).toBe(true);
    });

    it('should flag products with no return policy', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-returns-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          // No return policy
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('NO_RETURN_POLICY');
      expect(result.evidence).toContain('No return policy available');
    });

    it('should flag short return windows (< 30 days)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'short-returns-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 14,
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('SHORT_RETURN_WINDOW');
      expect(result.evidence.some(e => e.includes('Short return window'))).toBe(true);
    });

    it('should penalize restocking fees', async () => {
      const productWithFee: VeritasProductInput = {
        listing_id: 'with-fee-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          restocking_fee: true,
          shipping_tracking: true
        }
      };

      const productWithoutFee: VeritasProductInput = {
        ...productWithFee,
        listing_id: 'without-fee-001',
        quality_signals: {
          return_policy_days: 30,
          restocking_fee: false,
          shipping_tracking: true
        }
      };

      const resultWithFee = await agent.analyzeVeritas(productWithFee);
      const resultWithoutFee = await agent.analyzeVeritas(productWithoutFee);

      expect(resultWithFee.score).toBeLessThan(resultWithoutFee.score);
      expect(resultWithFee.flags).toContain('RESTOCKING_FEE');
    });

    it('should flag paid returns', async () => {
      const product: VeritasProductInput = {
        listing_id: 'paid-returns-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          free_returns: false,
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('PAID_RETURNS');
    });
  });

  // ============================================================================
  // Test: Shipping Reliability
  // ============================================================================

  describe('Shipping Reliability Assessment', () => {
    it('should give high score for fast tracked shipping with insurance', async () => {
      const product: VeritasProductInput = {
        listing_id: 'excellent-shipping-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true,
          shipping_insurance: true,
          shipping_days: 2,
          shipping_carrier: 'FedEx'
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThan(70);
      expect(result.evidence.some(e => e.includes('Tracking number provided'))).toBe(true);
      expect(result.evidence.some(e => e.includes('Shipping insurance included'))).toBe(true);
      expect(result.evidence.some(e => e.includes('Fast shipping'))).toBe(true);
    });

    it('should flag missing tracking information', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-tracking-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: false
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('NO_TRACKING');
      expect(result.evidence.some(e => e.includes('No tracking information'))).toBe(true);
    });

    it('should flag slow shipping (> 14 days)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'slow-shipping-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true,
          shipping_days: 21
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.flags).toContain('SLOW_SHIPPING');
      expect(result.evidence.some(e => e.includes('Slow shipping'))).toBe(true);
    });

    it('should recognize major carriers (UPS, FedEx, USPS)', async () => {
      const carriers = ['UPS', 'FedEx', 'USPS', 'DHL'];

      for (const carrier of carriers) {
        const product: VeritasProductInput = {
          listing_id: `carrier-test-${carrier}`,
          title: 'Product',
          price: 100,
          category: 'Electronics',
          seller_profile: {
            seller_rating: 4.5,
            seller_reviews_count: 100,
            seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          quality_signals: {
            return_policy_days: 30,
            shipping_tracking: true,
            shipping_carrier: carrier
          }
        };

        const result = await agent.analyzeVeritas(product);

        expect(result.evidence.some(e => e.includes(`Carrier: ${carrier}`))).toBe(true);
        expect(result.score).toBeGreaterThan(50); // Should get bonus for known carrier
      }
    });
  });

  // ============================================================================
  // Test: Weighted Final Score
  // ============================================================================

  describe('Weighted Final Score Calculation', () => {
    it('should combine all factors with correct weights', async () => {
      const product: VeritasProductInput = {
        listing_id: 'weighted-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.8,
          seller_reviews_count: 500,
          seller_total_sales: 500,
          seller_disputes_count: 2, // 0.4% dispute rate
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 60,
          free_returns: true,
          restocking_fee: false,
          shipping_tracking: true,
          shipping_insurance: true,
          shipping_days: 3,
          shipping_carrier: 'UPS'
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Should get high score with all positive factors
      expect(result.score).toBeGreaterThan(80);
      expect(result.confidence).toBeGreaterThan(0.7);

      // Should have metadata showing factor scores
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.factorScores).toBeDefined();
      expect(result.metadata?.factorScores.bayesianRating).toBeGreaterThan(0);
      expect(result.metadata?.factorScores.sellerHistory).toBeGreaterThan(0);
      expect(result.metadata?.factorScores.returnPolicy).toBeGreaterThan(0);
      expect(result.metadata?.factorScores.shippingReliability).toBeGreaterThan(0);
    });

    it('should prioritize Bayesian rating (45% weight)', async () => {
      // Excellent rating but poor other factors
      const excellentRating: VeritasProductInput = {
        listing_id: 'excellent-rating-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.9,
          seller_reviews_count: 1000,
          seller_total_sales: 1000,
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          // No returns, no tracking
          shipping_tracking: false
        }
      };

      // Poor rating but excellent other factors
      const poorRating: VeritasProductInput = {
        listing_id: 'poor-rating-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 3.0, // Lower rating (3.0 vs 4.9) to create bigger gap
          seller_reviews_count: 1000,
          seller_total_sales: 1000,
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 90,
          free_returns: true,
          shipping_tracking: true,
          shipping_insurance: true,
          shipping_days: 2,
          shipping_carrier: 'FedEx'
        }
      };

      const excellentRatingResult = await agent.analyzeVeritas(excellentRating);
      const poorRatingResult = await agent.analyzeVeritas(poorRating);

      // Excellent rating should score higher due to 45% weight
      expect(excellentRatingResult.score).toBeGreaterThan(poorRatingResult.score);

      // Verify Bayesian rating has highest weight in metadata
      expect(excellentRatingResult.metadata?.weights.bayesianRating).toBe(0.45);
    });
  });

  // ============================================================================
  // Test: Veritas Contract Compliance
  // ============================================================================

  describe('Veritas Contract Compliance', () => {
    it('should return valid Veritas agent result', async () => {
      const product: VeritasProductInput = {
        listing_id: 'veritas-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Check required fields
      expect(result.agent).toBe('TrustReliabilityAgent');
      expect(result.listing_id).toBe('veritas-test-001');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(Array.isArray(result.flags)).toBe(true);
      expect(result.model_version).toBe('trustreliability-v1.0');
      expect(result.computed_at).toBeDefined();

      // Computed_at should be valid ISO 8601
      expect(() => new Date(result.computed_at)).not.toThrow();
    });

    it('should provide specific evidence (not vague)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'evidence-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.7,
          seller_reviews_count: 250,
          seller_total_sales: 300,
          seller_disputes_count: 3,
          seller_member_since: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 45,
          free_returns: true,
          shipping_tracking: true,
          shipping_days: 5,
          shipping_carrier: 'USPS'
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Evidence should be specific
      expect(result.evidence.length).toBeGreaterThan(0);

      // Should contain specific numbers
      const hasSpecificEvidence = result.evidence.some(e =>
        e.includes('4.7') || // Rating
        e.includes('250') || // Review count
        e.includes('300') || // Sales
        e.includes('45') ||  // Return days
        e.includes('5')      // Shipping days
      );

      expect(hasSpecificEvidence).toBe(true);

      // Should NOT contain vague statements
      const hasVagueEvidence = result.evidence.some(e =>
        e.includes('Good seller') ||
        e.includes('Reliable') ||
        e.includes('Trustworthy')
      );

      expect(hasVagueEvidence).toBe(false);
    });
  });

  // ============================================================================
  // Test: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing product data gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'minimal-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
        // No seller_profile, no quality_signals
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.evidence.length).toBeGreaterThan(0);
    });
  });
});
