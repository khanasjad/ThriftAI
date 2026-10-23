/**
 * SpecMatcherAgent Tests
 *
 * Tests for the highest weighted MVP agent (25%)
 * - Hard constraints (storage, RAM, budget, features, excluded brands)
 * - Soft preferences (brands, colors, condition)
 * - Budget fit with exponential penalty
 * - Spec coverage assessment
 */

import { SpecMatcherAgent } from '@/lib/agents/specialized/SpecMatcherAgent';
import {
  VeritasProductInput,
  VeritasUserContext,
  VeritasAgentResult
} from '@/lib/agents/veritasTypes';

describe('SpecMatcherAgent', () => {
  let agent: SpecMatcherAgent;

  beforeEach(() => {
    agent = new SpecMatcherAgent();
  });

  // ============================================================================
  // Test: Agent Metadata
  // ============================================================================

  describe('Agent Metadata', () => {
    it('should have correct agent properties', () => {
      expect(agent.name).toBe('SpecMatcherAgent');
      expect(agent.version).toBe('v1.0');
      expect(agent.weight).toBe(0.25); // 25% - HIGHEST in MVP
      expect(agent.description).toContain('specifications');
    });

    it('should list all possible flags', () => {
      const flags = agent.getPossibleFlags();
      expect(flags).toContain('CONSTRAINTS_NOT_MET');
      expect(flags).toContain('OVER_BUDGET');
      expect(flags).toContain('POOR_SPEC_COVERAGE');
      expect(flags.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================================================
  // Test: Hard Constraints - Storage
  // ============================================================================

  describe('Hard Constraints - Storage', () => {
    it('should pass when storage meets requirement', async () => {
      const product: VeritasProductInput = {
        listing_id: 'storage-pass-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 512
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB storage',
        hard_constraints: {
          min_storage_gb: 512
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeGreaterThan(70);
      expect(result.flags).not.toContain('CONSTRAINTS_NOT_MET');
      expect(result.evidence.some(e => e.includes('512GB'))).toBe(true);
    });

    it('should fail when storage is insufficient', async () => {
      const product: VeritasProductInput = {
        listing_id: 'storage-fail-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 256
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB storage',
        hard_constraints: {
          min_storage_gb: 512
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(80); // Penalty for failed constraint
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
      expect(result.evidence.some(e => e.includes('256GB') && e.includes('512GB'))).toBe(true);
    });

    it('should handle missing storage gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'storage-missing-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {}
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB storage',
        hard_constraints: {
          min_storage_gb: 512
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(80);
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
      expect(result.flags).toContain('POOR_SPEC_COVERAGE');
    });
  });

  // ============================================================================
  // Test: Hard Constraints - RAM
  // ============================================================================

  describe('Hard Constraints - RAM', () => {
    it('should pass when RAM meets requirement', async () => {
      const product: VeritasProductInput = {
        listing_id: 'ram-pass-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          ram_gb: 16
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 16GB RAM',
        hard_constraints: {
          min_ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeGreaterThan(70);
      expect(result.flags).not.toContain('CONSTRAINTS_NOT_MET');
    });

    it('should fail when RAM is insufficient', async () => {
      const product: VeritasProductInput = {
        listing_id: 'ram-fail-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          ram_gb: 8
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 16GB RAM',
        hard_constraints: {
          min_ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(80);
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
    });
  });

  // ============================================================================
  // Test: Hard Constraints - Multiple Constraints
  // ============================================================================

  describe('Hard Constraints - Multiple', () => {
    it('should pass when all constraints are met', async () => {
      const product: VeritasProductInput = {
        listing_id: 'multi-pass-001',
        title: 'MacBook Pro 16GB/512GB',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 512,
          ram_gb: 16
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB and 16GB RAM',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeGreaterThan(70);
      expect(result.flags).not.toContain('CONSTRAINTS_NOT_MET');
      expect(result.metadata?.hard_constraints_met).toBe(true);
    });

    it('should fail when any constraint is not met', async () => {
      const product: VeritasProductInput = {
        listing_id: 'multi-fail-001',
        title: 'MacBook Pro 16GB/256GB',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 256, // Fails
          ram_gb: 16      // Passes
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB and 16GB RAM',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(80);
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
      expect(result.metadata?.hard_constraints_met).toBe(false);
      expect(result.metadata?.constraints_failed).toBe(1);
      expect(result.metadata?.constraints_passed).toBe(1);
    });

    it('should apply multiple penalties for multiple failures', async () => {
      const product: VeritasProductInput = {
        listing_id: 'multi-fail-002',
        title: 'MacBook Pro 8GB/128GB',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 128, // Fails
          ram_gb: 8        // Fails
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB and 16GB RAM',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(70); // Penalty for 2 failed constraints
      expect(result.metadata?.constraints_failed).toBe(2);
    });
  });

  // ============================================================================
  // Test: Budget Fit - Exponential Penalty
  // ============================================================================

  describe('Budget Fit - Exponential Penalty', () => {
    it('should give perfect score when within budget', async () => {
      const product: VeritasProductInput = {
        listing_id: 'budget-within-001',
        title: 'MacBook Pro',
        price: 1500,
        category: 'Laptops'
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook under $2000',
        hard_constraints: {
          max_price: 2000
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeGreaterThan(70);
      expect(result.flags).not.toContain('OVER_BUDGET');
    });

    it('should apply exponential penalty when over budget', async () => {
      const productAt10Percent: VeritasProductInput = {
        listing_id: 'budget-over-10pct',
        title: 'MacBook Pro',
        price: 2200, // 10% over $2000 budget
        category: 'Laptops'
      };

      const productAt50Percent: VeritasProductInput = {
        listing_id: 'budget-over-50pct',
        title: 'MacBook Pro',
        price: 3000, // 50% over $2000 budget
        category: 'Laptops'
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook under $2000',
        hard_constraints: {
          max_price: 2000
        }
      };

      const result10 = await agent.analyzeVeritas(productAt10Percent, userContext);
      const result50 = await agent.analyzeVeritas(productAt50Percent, userContext);

      // 50% over should have significantly lower score than 10% over
      expect(result50.score).toBeLessThan(result10.score);

      // Both should have BUDGET_EXCEEDED flag
      expect(result10.flags).toContain('OVER_BUDGET');
      expect(result50.flags).toContain('OVER_BUDGET');
    });

    it('should handle no budget constraint gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-budget-001',
        title: 'MacBook Pro',
        price: 5000,
        category: 'Laptops'
      };

      const result = await agent.analyzeVeritas(product); // No userContext

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.metadata?.budget_exceeded).toBe(false);
    });
  });

  // ============================================================================
  // Test: Soft Preferences
  // ============================================================================

  describe('Soft Preferences', () => {
    it('should give bonus for matching preferred brand', async () => {
      const appleProduct: VeritasProductInput = {
        listing_id: 'brand-match-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple'
      };

      const dellProduct: VeritasProductInput = {
        listing_id: 'brand-nomatch-001',
        title: 'Dell XPS',
        price: 2000,
        category: 'Laptops',
        brand: 'Dell'
      };

      const userContext: VeritasUserContext = {
        query: 'Laptop, prefer Apple',
        soft_preferences: {
          brands: ['Apple']
        }
      };

      const appleResult = await agent.analyzeVeritas(appleProduct, userContext);
      const dellResult = await agent.analyzeVeritas(dellProduct, userContext);

      // Both products should have valid scores
      expect(appleResult.score).toBeGreaterThanOrEqual(0);
      expect(dellResult.score).toBeGreaterThanOrEqual(0);

      // Apple result should indicate preference match in metadata
      expect(appleResult.metadata?.preference_match_rate).toBeGreaterThan(0);
    });

    it('should give bonus for matching preferred color', async () => {
      const blackProduct: VeritasProductInput = {
        listing_id: 'color-match-001',
        title: 'iPhone 14 Pro',
        price: 1000,
        category: 'Smartphones',
        specifications: {
          color: 'Space Black'
        }
      };

      const whiteProduct: VeritasProductInput = {
        listing_id: 'color-nomatch-001',
        title: 'iPhone 14 Pro',
        price: 1000,
        category: 'Smartphones',
        specifications: {
          color: 'Silver'
        }
      };

      const userContext: VeritasUserContext = {
        query: 'iPhone, prefer black',
        soft_preferences: {
          colors: ['black', 'Space Black']
        }
      };

      const blackResult = await agent.analyzeVeritas(blackProduct, userContext);
      const whiteResult = await agent.analyzeVeritas(whiteProduct, userContext);

      // Both products should have valid scores
      expect(blackResult.score).toBeGreaterThanOrEqual(0);
      expect(whiteResult.score).toBeGreaterThanOrEqual(0);

      // Black result should indicate preference match
      expect(blackResult.metadata?.preference_match_rate).toBeGreaterThan(0);
    });

    it('should handle no soft preferences gracefully', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-prefs-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops'
      };

      const result = await agent.analyzeVeritas(product); // No userContext

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // Test: Spec Coverage Assessment
  // ============================================================================

  describe('Spec Coverage Assessment', () => {
    it('should give high coverage score for complete specs', async () => {
      const product: VeritasProductInput = {
        listing_id: 'complete-specs-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        description: 'Brand new MacBook Pro with M2 chip, excellent condition, comes with all original accessories and warranty',
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
        specifications: {
          storage_gb: 512,
          ram_gb: 16,
          processor: 'Apple M2 Pro',
          color: 'Space Gray',
          year: 2024,
          condition: 'new'
        }
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.metadata?.spec_coverage).toBeGreaterThan(70);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.flags).not.toContain('POOR_SPEC_COVERAGE');
    });

    it('should give low coverage score for minimal specs', async () => {
      const product: VeritasProductInput = {
        listing_id: 'minimal-specs-001',
        title: 'Laptop',
        price: 500,
        category: 'Laptops'
        // No description, images, or specifications
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.metadata?.spec_coverage).toBeLessThan(30);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.flags).toContain('POOR_SPEC_COVERAGE');
    });

    it('should reward each spec field present', async () => {
      const noSpecs: VeritasProductInput = {
        listing_id: 'no-specs',
        title: 'Laptop',
        price: 1000,
        category: 'Laptops'
      };

      const fewSpecs: VeritasProductInput = {
        listing_id: 'few-specs',
        title: 'Laptop',
        price: 1000,
        category: 'Laptops',
        specifications: {
          storage_gb: 512,
          ram_gb: 16
        }
      };

      const manySpecs: VeritasProductInput = {
        listing_id: 'many-specs',
        title: 'Laptop',
        price: 1000,
        category: 'Laptops',
        specifications: {
          storage_gb: 512,
          ram_gb: 16,
          processor: 'Intel i7',
          color: 'Silver',
          year: 2024,
          condition: 'new'
        }
      };

      const result0 = await agent.analyzeVeritas(noSpecs);
      const result2 = await agent.analyzeVeritas(fewSpecs);
      const result6 = await agent.analyzeVeritas(manySpecs);

      // Coverage should increase with more specs
      expect(result2.metadata?.spec_coverage).toBeGreaterThan(result0.metadata?.spec_coverage || 0);
      expect(result6.metadata?.spec_coverage).toBeGreaterThan(result2.metadata?.spec_coverage || 0);
    });
  });

  // ============================================================================
  // Test: Scoring Logic
  // ============================================================================

  describe('Scoring Logic', () => {
    it('should start at 100 and apply penalties', async () => {
      // Perfect product: all constraints met, within budget, good coverage
      const perfectProduct: VeritasProductInput = {
        listing_id: 'perfect-001',
        title: 'MacBook Pro 16GB/512GB',
        price: 1800,
        category: 'Laptops',
        brand: 'Apple',
        description: 'Excellent condition MacBook Pro',
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        specifications: {
          storage_gb: 512,
          ram_gb: 16,
          processor: 'M2 Pro',
          color: 'Space Gray',
          year: 2024,
          condition: 'new'
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB and 16GB RAM',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16,
          max_price: 2000
        },
        soft_preferences: {
          brands: ['Apple'],
          colors: ['Space Gray']
        }
      };

      const result = await agent.analyzeVeritas(perfectProduct, userContext);

      // Should be close to 100 with all preferences met
      expect(result.score).toBeGreaterThan(85);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata?.hard_constraints_met).toBe(true);
      expect(result.metadata?.preference_match_rate).toBeGreaterThan(0.8);
    });

    it('should apply -30 penalty per failed hard constraint', async () => {
      const productFailingOne: VeritasProductInput = {
        listing_id: 'fail-one-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 256, // Fails (need 512)
          ram_gb: 16       // Passes
        }
      };

      const productFailingTwo: VeritasProductInput = {
        listing_id: 'fail-two-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {
          storage_gb: 256, // Fails
          ram_gb: 8        // Fails
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16
        }
      };

      const result1 = await agent.analyzeVeritas(productFailingOne, userContext);
      const result2 = await agent.analyzeVeritas(productFailingTwo, userContext);

      // Two failures should score ~30 points lower than one failure
      expect(result2.score).toBeLessThan(result1.score - 20);
    });
  });

  // ============================================================================
  // Test: Excluded Brands
  // ============================================================================

  describe('Excluded Brands', () => {
    it('should fail products from excluded brands', async () => {
      const product: VeritasProductInput = {
        listing_id: 'excluded-brand-001',
        title: 'Generic Laptop',
        price: 500,
        category: 'Laptops',
        brand: 'NoName'
      };

      const userContext: VeritasUserContext = {
        query: 'Laptop, but not NoName brand',
        hard_constraints: {
          excluded_brands: ['NoName', 'Generic']
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(80);
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
    });

    it('should pass products not in excluded list', async () => {
      const product: VeritasProductInput = {
        listing_id: 'allowed-brand-001',
        title: 'Apple MacBook',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple'
      };

      const userContext: VeritasUserContext = {
        query: 'Laptop, but not Dell',
        hard_constraints: {
          excluded_brands: ['Dell', 'HP']
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.flags).not.toContain('EXCLUDED_BRAND');
    });
  });

  // ============================================================================
  // Test: Required Features
  // ============================================================================

  describe('Required Features', () => {
    it('should pass when all required features are present', async () => {
      const product: VeritasProductInput = {
        listing_id: 'features-pass-001',
        title: 'MacBook Pro with Touch Bar and Retina Display',
        price: 2000,
        category: 'Laptops',
        features: ['Touch Bar', 'Retina Display', 'Thunderbolt 3']
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with Touch Bar and Retina Display',
        hard_constraints: {
          required_features: ['Touch Bar', 'Retina Display']
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      // Should have a valid score
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should fail when required features are missing', async () => {
      const product: VeritasProductInput = {
        listing_id: 'features-fail-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        features: ['Retina Display']
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with Touch Bar and Retina Display',
        hard_constraints: {
          required_features: ['Touch Bar', 'Retina Display']
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.score).toBeLessThan(50);
      expect(result.flags).toContain('CONSTRAINTS_NOT_MET');
    });
  });

  // ============================================================================
  // Test: Confidence Calculation
  // ============================================================================

  describe('Confidence Calculation', () => {
    it('should have higher confidence with complete specs', async () => {
      const completeProduct: VeritasProductInput = {
        listing_id: 'complete-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        description: 'Detailed description with lots of information',
        images: ['1', '2', '3', '4', '5'],
        specifications: {
          storage_gb: 512,
          ram_gb: 16,
          processor: 'M2 Pro',
          color: 'Space Gray',
          year: 2024,
          condition: 'new'
        }
      };

      const minimalProduct: VeritasProductInput = {
        listing_id: 'minimal-001',
        title: 'Laptop',
        price: 2000,
        category: 'Laptops'
      };

      const completeResult = await agent.analyzeVeritas(completeProduct);
      const minimalResult = await agent.analyzeVeritas(minimalProduct);

      expect(completeResult.confidence).toBeGreaterThan(minimalResult.confidence);
    });
  });

  // ============================================================================
  // Test: Veritas Contract Compliance
  // ============================================================================

  describe('Veritas Contract Compliance', () => {
    it('should return valid Veritas agent result', async () => {
      const product: VeritasProductInput = {
        listing_id: 'veritas-test-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        id: 'veritas-test-001', // SpecMatcherAgent uses "id" field
        specifications: {
          storage_gb: 512,
          ram_gb: 16
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Check required fields
      expect(result.agent).toBe('SpecMatcherAgent');
      expect(result.listing_id).toBe('veritas-test-001');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(Array.isArray(result.flags)).toBe(true);
      expect(result.model_version).toBe('specmatcher-v1.0');
      expect(result.computed_at).toBeDefined();

      // Computed_at should be valid ISO 8601
      expect(() => new Date(result.computed_at)).not.toThrow();
    });

    it('should provide specific evidence (not vague)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'evidence-test-001',
        title: 'MacBook Pro',
        price: 1800,
        category: 'Laptops',
        specifications: {
          storage_gb: 512,
          ram_gb: 16
        }
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook with 512GB and 16GB RAM',
        hard_constraints: {
          min_storage_gb: 512,
          min_ram_gb: 16,
          max_price: 2000
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      // Evidence should contain specific numbers/facts
      const hasSpecificEvidence = result.evidence.some(e =>
        /\d+/.test(e) // Contains numbers
      );

      expect(hasSpecificEvidence).toBe(true);

      // Should NOT contain vague statements
      const hasVagueEvidence = result.evidence.some(e =>
        e.includes('Good match') ||
        e.includes('Suitable') ||
        e.includes('Acceptable')
      );

      expect(hasVagueEvidence).toBe(false);
    });
  });

  // ============================================================================
  // Test: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle product with no user context', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-context-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops'
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle product with empty specifications', async () => {
      const product: VeritasProductInput = {
        listing_id: 'empty-specs-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        specifications: {}
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle price exactly at budget', async () => {
      const product: VeritasProductInput = {
        listing_id: 'exact-budget-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops'
      };

      const userContext: VeritasUserContext = {
        query: 'MacBook under $2000',
        hard_constraints: {
          max_price: 2000
        }
      };

      const result = await agent.analyzeVeritas(product, userContext);

      expect(result.flags).not.toContain('OVER_BUDGET');
    });
  });
});
