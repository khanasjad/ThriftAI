/**
 * VeritasOrchestrator Tests
 *
 * Tests for MVP scoring engine with weighted aggregation and scam multiplier
 */

import { VeritasOrchestrator } from '@/lib/agents/VeritasOrchestrator';
import { VeritasProductInput } from '@/lib/agents/veritasTypes';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn()
    },
    veritasScore: {
      create: jest.fn()
    },
    veritasCategory: {
      create: jest.fn()
    }
  }
}));

describe('VeritasOrchestrator', () => {
  let orchestrator: VeritasOrchestrator;

  beforeEach(() => {
    orchestrator = new VeritasOrchestrator();
  });

  // ============================================================================
  // Test: Basic Orchestration
  // ============================================================================

  describe('Basic Orchestration', () => {
    it('should call all 5 MVP agents', async () => {
      const product: VeritasProductInput = {
        listing_id: 'test-001',
        title: 'iPhone 14 Pro',
        price: 800,
        category: 'Smartphones',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_total_sales: 500,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true,
          shipping_days: 5
        },
        specifications: {
          storage_gb: 256,
          ram_gb: 6
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Verify all 5 agents produced results
      expect(result.rawAgentResults.specMatch).toBeDefined();
      expect(result.rawAgentResults.price).toBeDefined();
      expect(result.rawAgentResults.trust).toBeDefined();
      expect(result.rawAgentResults.financialValue).toBeDefined();
      expect(result.rawAgentResults.scam).toBeDefined();

      // Verify component scores exist
      expect(result.componentScores.specMatch).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.specMatch).toBeLessThanOrEqual(100);
      expect(result.componentScores.price).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.trust).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.financialValue).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.scamProbability).toBeGreaterThanOrEqual(0);
      expect(result.componentScores.scamProbability).toBeLessThanOrEqual(1);
    });

    it('should return valid Veritas score (0-100)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'test-002',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.veritasScore).toBeGreaterThanOrEqual(0);
      expect(result.veritasScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.veritasScore)).toBe(true);
    });

    it('should return valid confidence (0-1)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'test-003',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // Test: Weighted Aggregation Formula
  // ============================================================================

  describe('Weighted Aggregation Formula', () => {
    it('should apply correct weights (Spec 25%, Price 20%, Trust 15%, Financial 10%)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'weight-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_total_sales: 500,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Verify weights are stored in metadata
      expect(result.metadata.weights.spec_match).toBe(0.25);
      expect(result.metadata.weights.price).toBe(0.20);
      expect(result.metadata.weights.trust).toBe(0.15);
      expect(result.metadata.weights.financial_value).toBe(0.10);

      // Manually verify weighted calculation
      const expectedBase = Math.round(
        (result.componentScores.specMatch * 0.25 +
         result.componentScores.price * 0.20 +
         result.componentScores.trust * 0.15 +
         result.componentScores.financialValue * 0.10) /
        (0.25 + 0.20 + 0.15 + 0.10) // Normalize
      );

      const expectedFinal = Math.round(expectedBase * (1 - result.componentScores.scamProbability));

      expect(result.veritasScore).toBe(expectedFinal);
    });

    it('should support custom weights', async () => {
      const product: VeritasProductInput = {
        listing_id: 'custom-weight-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const customWeights = {
        spec_match: 0.50, // Higher weight on specs
        price: 0.20,
        trust: 0.20,
        financial_value: 0.10
      };

      const result = await orchestrator.scoreProduct(product, undefined, customWeights);

      expect(result.metadata.weights.spec_match).toBe(0.50);
    });
  });

  // ============================================================================
  // Test: Scam Multiplier Logic
  // ============================================================================

  describe('Scam Multiplier Logic', () => {
    it('should apply scam as multiplier (not additive)', async () => {
      // Scenario 1: Legit product with solid data
      const legitProduct: VeritasProductInput = {
        listing_id: 'legit-001',
        title: 'iPhone 14 Pro',
        price: 900,
        category: 'Smartphones',
        seller_profile: {
          seller_rating: 4.8,
          seller_reviews_count: 500,
          seller_total_sales: 1000,
          seller_member_since: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 60,
          shipping_tracking: true,
          image_count: 8,
          description_length: 500
        }
      };

      // Scenario 2: High scam probability product
      const scammyProduct: VeritasProductInput = {
        listing_id: 'scammy-001',
        title: 'iPhone 14 Pro Definitely Real',
        price: 100, // Way too low
        category: 'Smartphones',
        seller_profile: {
          seller_rating: 5.0,
          seller_reviews_count: 1,
          seller_total_sales: 1,
          seller_member_since: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Very new
        },
        quality_signals: {
          image_count: 1,
          description_length: 20
        }
      };

      const legitResult = await orchestrator.scoreProduct(legitProduct);
      const scammyResult = await orchestrator.scoreProduct(scammyProduct);

      // Verify scam flags are present
      const scammyFlags = scammyResult.allFlags;
      const hasScamFlag = scammyFlags.some(flag =>
        flag.includes('PRICE') ||
        flag.includes('NEW_SELLER') ||
        flag.includes('VERY_NEW_SELLER') ||
        flag.includes('QUALITY')
      );

      expect(hasScamFlag).toBe(true);

      // Final score should be significantly lower for scammy product
      // (due to both lower base scores AND scam multiplier)
      expect(scammyResult.veritasScore).toBeLessThan(legitResult.veritasScore);
    });

    it('should not reduce score below 0', async () => {
      const product: VeritasProductInput = {
        listing_id: 'extreme-scam-001',
        title: 'Too Good To Be True',
        price: 1, // $1 for expensive item
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.veritasScore).toBeGreaterThanOrEqual(0);
      expect(result.veritasScore).toBeLessThanOrEqual(100);
    });

    it('should handle perfect scam score (r_scam = 0)', async () => {
      // High-trust, well-priced listing (no scam signals)
      const product: VeritasProductInput = {
        listing_id: 'perfect-001',
        title: 'Product',
        price: 500,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.9,
          seller_reviews_count: 1000,
          seller_total_sales: 2000,
          seller_disputes_count: 0,
          seller_member_since: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString() // 5 years
        },
        quality_signals: {
          return_policy_days: 90,
          free_returns: true,
          shipping_tracking: true,
          shipping_insurance: true,
          image_count: 10,
          description_length: 800
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Scam probability should be low (< 0.5 means more legit than scam)
      expect(result.componentScores.scamProbability).toBeLessThan(0.5);

      // Multiplier should have minimal impact: (1 - 0) = 1
      // So final score ≈ base score
    });
  });

  // ============================================================================
  // Test: Veritas Score SSN Generation
  // ============================================================================

  describe('Veritas Score SSN Generation', () => {
    it('should generate SSN in XXX-XX-XXXX format', async () => {
      const product: VeritasProductInput = {
        listing_id: 'ssn-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      // Verify SSN format: XXX-XX-XXXX
      expect(result.veritasScoreSSN).toMatch(/^\d{3}-\d{2}-[0-9A-F]{4}$/);
    });

    it('should include score in SSN (first 3 digits)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'ssn-score-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      // Extract score from SSN
      const ssnScore = parseInt(result.veritasScoreSSN.substring(0, 3), 10);

      // Should match actual score
      expect(ssnScore).toBe(result.veritasScore);
    });

    it('should generate unique SSNs for different listings', async () => {
      const product1: VeritasProductInput = {
        listing_id: 'unique-product-alpha-12345',
        title: 'Product 1',
        price: 100,
        category: 'Electronics'
      };

      const product2: VeritasProductInput = {
        listing_id: 'unique-product-beta-67890',
        title: 'Product 2',
        price: 200, // Different price to ensure different scores
        category: 'Electronics'
      };

      const result1 = await orchestrator.scoreProduct(product1);
      const result2 = await orchestrator.scoreProduct(product2);

      // SSNs should be different (either different score or different hash)
      // At minimum, scores or hash parts should differ
      const ssn1Parts = result1.veritasScoreSSN.split('-');
      const ssn2Parts = result2.veritasScoreSSN.split('-');

      const isDifferent =
        ssn1Parts[0] !== ssn2Parts[0] || // Different score
        ssn1Parts[2] !== ssn2Parts[2];   // Different hash

      expect(isDifferent).toBe(true);
    });

    it('should pad scores with leading zeros', async () => {
      // Mock a product that will get a low score (< 10)
      const lowScoreProduct: VeritasProductInput = {
        listing_id: 'low-score-001',
        title: 'Bad Product',
        price: 1,
        category: 'Electronics',
        // Minimal data to get low scores
      };

      const result = await orchestrator.scoreProduct(lowScoreProduct);

      // SSN should still be XXX-XX-XXXX format
      expect(result.veritasScoreSSN).toMatch(/^\d{3}-\d{2}-[0-9A-F]{4}$/);

      // If score is single digit, should be padded: 005-XX-XXXX
      if (result.veritasScore < 10) {
        expect(result.veritasScoreSSN.substring(0, 2)).toBe('00');
      }
    });
  });

  // ============================================================================
  // Test: Evidence and Flag Consolidation
  // ============================================================================

  describe('Evidence and Flag Consolidation', () => {
    it('should consolidate evidence from all agents', async () => {
      const product: VeritasProductInput = {
        listing_id: 'evidence-test-001',
        title: 'Product',
        price: 500,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.5,
          seller_reviews_count: 100,
          seller_total_sales: 200,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Should have evidence from multiple agents
      expect(result.allEvidence.length).toBeGreaterThan(0);

      // Evidence should be specific (not vague)
      const hasSpecificEvidence = result.allEvidence.some(e =>
        /\d+/.test(e) // Contains numbers
      );
      expect(hasSpecificEvidence).toBe(true);
    });

    it('should consolidate flags from all agents', async () => {
      const product: VeritasProductInput = {
        listing_id: 'flag-test-001',
        title: 'Product',
        price: 50, // Suspiciously low
        category: 'Electronics',
        seller_profile: {
          seller_rating: 5.0,
          seller_reviews_count: 1, // New seller
          seller_total_sales: 1,
          seller_member_since: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Should have flags from multiple agents
      expect(result.allFlags.length).toBeGreaterThan(0);

      // Flags should be UPPERCASE_UNDERSCORE format
      result.allFlags.forEach(flag => {
        expect(flag).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  // ============================================================================
  // Test: Confidence Aggregation
  // ============================================================================

  describe('Confidence Aggregation', () => {
    it('should aggregate confidence from all agents', async () => {
      const product: VeritasProductInput = {
        listing_id: 'confidence-test-001',
        title: 'Product',
        price: 500,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.7,
          seller_reviews_count: 250,
          seller_total_sales: 500,
          seller_member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 30,
          shipping_tracking: true
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Confidence should be weighted average of component confidences
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);

      // Confidence should reflect data quality
      // More data → higher confidence
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  // ============================================================================
  // Test: Metadata
  // ============================================================================

  describe('Metadata', () => {
    it('should include processing time', async () => {
      const product: VeritasProductInput = {
        listing_id: 'metadata-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.processingTime).toBe('number');
    });

    it('should include agent versions', async () => {
      const product: VeritasProductInput = {
        listing_id: 'version-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.metadata.agentVersions.specMatch).toBeDefined();
      expect(result.metadata.agentVersions.price).toBeDefined();
      expect(result.metadata.agentVersions.trust).toBeDefined();
      expect(result.metadata.agentVersions.financialValue).toBeDefined();
      expect(result.metadata.agentVersions.scam).toBeDefined();
    });

    it('should include ISO 8601 timestamp', async () => {
      const product: VeritasProductInput = {
        listing_id: 'timestamp-test-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
      };

      const result = await orchestrator.scoreProduct(product);

      // Verify ISO 8601 format
      expect(() => new Date(result.metadata.computed_at)).not.toThrow();
      expect(result.metadata.computed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ============================================================================
  // Test: Batch Scoring
  // ============================================================================

  describe('Batch Scoring', () => {
    it('should score multiple products in parallel', async () => {
      const products: VeritasProductInput[] = [
        { listing_id: 'batch-001', title: 'Product 1', price: 100, category: 'Electronics' },
        { listing_id: 'batch-002', title: 'Product 2', price: 200, category: 'Electronics' },
        { listing_id: 'batch-003', title: 'Product 3', price: 300, category: 'Electronics' }
      ];

      const startTime = Date.now();
      const results = await orchestrator.batchScore(products);
      const elapsedTime = Date.now() - startTime;

      expect(results.length).toBe(3);

      // Parallel execution should be faster than sequential
      // (Sequential would be ~3x processing time of single product)
      // Parallel should be closer to single product processing time
      expect(elapsedTime).toBeLessThan(5000); // Reasonable threshold
    });
  });

  // ============================================================================
  // Test: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle minimal product data', async () => {
      const product: VeritasProductInput = {
        listing_id: 'minimal-001',
        title: 'Product',
        price: 100,
        category: 'Electronics'
        // Minimal data
      };

      const result = await orchestrator.scoreProduct(product);

      expect(result.veritasScore).toBeGreaterThanOrEqual(0);
      expect(result.veritasScore).toBeLessThanOrEqual(100);
    });

    it('should handle complete product data', async () => {
      const product: VeritasProductInput = {
        listing_id: 'complete-001',
        title: 'Premium Product',
        price: 1000,
        category: 'Electronics',
        seller_profile: {
          seller_rating: 4.9,
          seller_reviews_count: 1000,
          seller_total_sales: 2000,
          seller_disputes_count: 5,
          seller_member_since: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString()
        },
        quality_signals: {
          return_policy_days: 90,
          free_returns: true,
          restocking_fee: false,
          shipping_tracking: true,
          shipping_insurance: true,
          shipping_days: 2,
          shipping_carrier: 'FedEx',
          shipping_cost: 0,
          image_count: 12,
          description_length: 1000
        },
        specifications: {
          storage_gb: 512,
          ram_gb: 16,
          processor: 'Apple M2 Pro',
          color: 'Space Gray',
          year: 2024,
          condition: 'new'
        }
      };

      const result = await orchestrator.scoreProduct(product);

      // Should get high score with complete data
      expect(result.veritasScore).toBeGreaterThan(50);
      expect(result.confidence).toBeGreaterThan(0.6); // High confidence with complete data
    });
  });
});
