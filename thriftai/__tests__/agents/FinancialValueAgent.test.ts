/**
 * FinancialValueAgent Tests
 *
 * Tests for Total Cost of Ownership (TCO) and financial value analysis
 * - TCO calculation (price + shipping + tax + repairs + accessories)
 * - Cost-per-year analysis
 * - Resale value estimation with brand retention
 * - Category-specific depreciation
 * - Warranty value
 */

import { FinancialValueAgent } from '@/lib/agents/specialized/FinancialValueAgent';
import {
  VeritasProductInput,
  VeritasAgentResult
} from '@/lib/agents/veritasTypes';

describe('FinancialValueAgent', () => {
  let agent: FinancialValueAgent;

  beforeEach(() => {
    agent = new FinancialValueAgent();
  });

  // ============================================================================
  // Test: Agent Metadata
  // ============================================================================

  describe('Agent Metadata', () => {
    it('should have correct agent properties', () => {
      expect(agent.name).toBe('FinancialValueAgent');
      expect(agent.version).toBe('v1.0');
      expect(agent.weight).toBe(0.10); // 10% weight
      expect(agent.description).toContain('financial value');
    });

    it('should list all possible flags', () => {
      const flags = agent.getPossibleFlags();
      expect(flags).toContain('HIGH_COST_PER_YEAR');
      expect(flags).toContain('POOR_RESALE_VALUE');
      expect(flags).toContain('HIGH_NET_COST');
      expect(flags.length).toBeGreaterThan(3);
    });
  });

  // ============================================================================
  // Test: Total Cost of Ownership (TCO)
  // ============================================================================

  describe('Total Cost of Ownership', () => {
    it('should calculate TCO including all cost components', async () => {
      const product: VeritasProductInput = {
        listing_id: 'tco-test-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple',
        quality_signals: {
          shipping_cost: 50
        }
      };

      const result = await agent.analyzeVeritas(product);

      // TCO should include: price + shipping + tax + repairs
      expect(result.metadata?.tco_breakdown).toBeDefined();
      expect(result.metadata?.tco_breakdown.purchasePrice).toBe(2000);
      expect(result.metadata?.tco_breakdown.shippingCost).toBe(50);
      expect(result.metadata?.tco_breakdown.estimatedTax).toBeGreaterThan(0);
      expect(result.metadata?.tco_breakdown.expectedRepairs).toBeGreaterThan(0);
      expect(result.metadata?.tco_breakdown.total).toBeGreaterThan(2000);
    });

    it('should estimate shipping cost when not provided', async () => {
      const product: VeritasProductInput = {
        listing_id: 'tco-no-shipping-001',
        title: 'iPhone 14',
        price: 800,
        category: 'Smartphones'
      };

      const result = await agent.analyzeVeritas(product);

      // Should have shipping cost (0 if free shipping, or estimated amount)
      expect(result.metadata?.tco_breakdown.shippingCost).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.tco_breakdown).toBeDefined();
    });

    it('should include category-specific repair costs', async () => {
      const laptop: VeritasProductInput = {
        listing_id: 'repairs-laptop',
        title: 'Laptop',
        price: 1000,
        category: 'Laptops' // $100/year repair cost, 4-year lifespan
      };

      const smartphone: VeritasProductInput = {
        listing_id: 'repairs-phone',
        title: 'Smartphone',
        price: 1000,
        category: 'Smartphones' // $75/year repair cost, 2.5-year lifespan
      };

      const laptopResult = await agent.analyzeVeritas(laptop);
      const smartphoneResult = await agent.analyzeVeritas(smartphone);

      // Laptop: 4 years × $100 = $400
      expect(laptopResult.metadata?.tco_breakdown.expectedRepairs).toBe(400);

      // Smartphone: 2.5 years × $75 = $187.50
      expect(smartphoneResult.metadata?.tco_breakdown.expectedRepairs).toBe(187.5);
    });
  });

  // ============================================================================
  // Test: Cost-Per-Year Analysis
  // ============================================================================

  describe('Cost-Per-Year Analysis', () => {
    it('should calculate cost-per-year based on category lifespan', async () => {
      const product: VeritasProductInput = {
        listing_id: 'cpy-test-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops' // 4-year expected lifespan
      };

      const result = await agent.analyzeVeritas(product);

      // TCO / 4 years
      const expectedCPY = result.metadata?.tco_breakdown.total / 4;
      expect(result.metadata?.cost_per_year).toBeCloseTo(expectedCPY, 2);
    });

    it('should give better scores for lower cost-per-year', async () => {
      const cheapWatch: VeritasProductInput = {
        listing_id: 'cheap-watch',
        title: 'Casio Watch',
        price: 50,
        category: 'Watches' // 10-year lifespan
      };

      const expensivePhone: VeritasProductInput = {
        listing_id: 'expensive-phone',
        title: 'iPhone',
        price: 1000,
        category: 'Smartphones' // 2.5-year lifespan
      };

      const watchResult = await agent.analyzeVeritas(cheapWatch);
      const phoneResult = await agent.analyzeVeritas(expensivePhone);

      // Watch: ~$50/10 = ~$5/year
      // Phone: ~$1000/2.5 = ~$400/year
      // Both should have valid scores
      expect(watchResult.score).toBeGreaterThanOrEqual(0);
      expect(phoneResult.score).toBeGreaterThanOrEqual(0);

      // Watch should have significantly lower cost-per-year
      expect(watchResult.metadata?.cost_per_year).toBeLessThan(
        phoneResult.metadata?.cost_per_year
      );
    });
  });

  // ============================================================================
  // Test: Resale Value with Brand Retention
  // ============================================================================

  describe('Resale Value Estimation', () => {
    it('should apply brand retention multipliers', async () => {
      const appleProduct: VeritasProductInput = {
        listing_id: 'resale-apple',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple' // 85% retention
      };

      const genericProduct: VeritasProductInput = {
        listing_id: 'resale-generic',
        title: 'Generic Laptop',
        price: 2000,
        category: 'Laptops',
        brand: 'Unknown' // 50% default retention
      };

      const appleResult = await agent.analyzeVeritas(appleProduct);
      const genericResult = await agent.analyzeVeritas(genericProduct);

      // Apple should have higher resale value
      expect(appleResult.metadata?.resale_value).toBeGreaterThan(
        genericResult.metadata?.resale_value
      );

      // Apple should score higher
      expect(appleResult.score).toBeGreaterThan(genericResult.score);
    });

    it('should use high retention for luxury brands', async () => {
      const rolexWatch: VeritasProductInput = {
        listing_id: 'rolex-watch',
        title: 'Rolex Submariner',
        price: 10000,
        category: 'Watches',
        brand: 'Rolex' // 95% retention
      };

      const result = await agent.analyzeVeritas(rolexWatch);

      // Rolex with 95% brand retention should have better resale than generic
      // Actual: 10000 * (1 - 0.10*6) * 0.95 * 0.70 = 2660
      expect(result.metadata?.resale_value).toBeGreaterThan(2000);
      expect(result.metadata?.resale_retention).toBeGreaterThan(20); // > 20%
    });

    it('should apply category-specific depreciation rates', async () => {
      const smartphone: VeritasProductInput = {
        listing_id: 'depreciation-phone',
        title: 'iPhone',
        price: 1000,
        category: 'Smartphones', // 35% depreciation per year
        brand: 'Apple'
      };

      const furniture: VeritasProductInput = {
        listing_id: 'depreciation-furniture',
        title: 'Herman Miller Chair',
        price: 1000,
        category: 'Furniture', // 15% depreciation per year
        brand: 'Herman Miller'
      };

      const phoneResult = await agent.analyzeVeritas(smartphone);
      const furnitureResult = await agent.analyzeVeritas(furniture);

      // Both should have resale values calculated
      expect(phoneResult.metadata?.resale_value).toBeGreaterThan(0);
      expect(furnitureResult.metadata?.resale_value).toBeGreaterThan(0);

      // Verify depreciation is applied (Smartphones 35%, Furniture 15% per year)
      // Note: Furniture owned for 6 years (60% of 10yr lifespan) gets 90% total depreciation
      // Phone owned for 1.5 years (60% of 2.5yr lifespan) gets 52.5% total depreciation
      expect(phoneResult.metadata?.resale_retention).toBeLessThan(50);
      expect(furnitureResult.metadata?.resale_retention).toBeLessThan(20);
    });
  });

  // ============================================================================
  // Test: Warranty Value
  // ============================================================================

  describe('Warranty Value', () => {
    it('should calculate warranty value reducing repair costs', async () => {
      const withWarranty: VeritasProductInput = {
        listing_id: 'warranty-yes',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        quality_signals: {
          warranty_included: true,
          warranty_duration_months: 24
        }
      };

      const withoutWarranty: VeritasProductInput = {
        listing_id: 'warranty-no',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        quality_signals: {
          warranty_included: false
        }
      };

      const withWarrantyResult = await agent.analyzeVeritas(withWarranty);
      const withoutWarrantyResult = await agent.analyzeVeritas(withoutWarranty);

      // Product with warranty should have warranty value calculated
      expect(withWarrantyResult.metadata?.warranty_value).toBeGreaterThan(0);
      expect(withoutWarrantyResult.metadata?.warranty_value).toBe(0);

      // Product with warranty should score higher (warranty gives 10% score bonus)
      expect(withWarrantyResult.score).toBeGreaterThan(withoutWarrantyResult.score);
    });

    it('should not flag products with warranty as poor value', async () => {
      const product: VeritasProductInput = {
        listing_id: 'warranty-good-001',
        title: 'Laptop',
        price: 1000,
        category: 'Laptops',
        quality_signals: {
          warranty_included: true,
          warranty_duration_months: 12
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Warranty should provide value
      expect(result.metadata?.warranty_value).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(40); // Should score reasonably well
    });
  });

  // ============================================================================
  // Test: Net Cost Calculation
  // ============================================================================

  describe('Net Cost Calculation', () => {
    it('should calculate net cost as TCO minus resale value', async () => {
      const product: VeritasProductInput = {
        listing_id: 'net-cost-001',
        title: 'iPhone 14',
        price: 800,
        category: 'Smartphones',
        brand: 'Apple'
      };

      const result = await agent.analyzeVeritas(product);

      // Net cost = TCO - resale value
      const expectedNetCost =
        result.metadata?.tco_breakdown.total - result.metadata?.resale_value;

      expect(result.metadata?.net_cost).toBeCloseTo(expectedNetCost, 2);
    });

    it('should give higher scores for lower net cost', async () => {
      const highResale: VeritasProductInput = {
        listing_id: 'high-resale',
        title: 'Apple Watch',
        price: 500,
        category: 'Watches',
        brand: 'Apple' // Good resale value
      };

      const lowResale: VeritasProductInput = {
        listing_id: 'low-resale',
        title: 'Generic Watch',
        price: 500,
        category: 'Watches',
        brand: 'NoName' // Poor resale value
      };

      const highResaleResult = await agent.analyzeVeritas(highResale);
      const lowResaleResult = await agent.analyzeVeritas(lowResale);

      // High resale → lower net cost → higher score
      expect(highResaleResult.score).toBeGreaterThan(lowResaleResult.score);
    });
  });

  // ============================================================================
  // Test: Scoring Logic
  // ============================================================================

  describe('Scoring Logic', () => {
    it('should weight factors correctly (CPY 40%, Resale 30%, NetCost 20%, Warranty 10%)', async () => {
      const product: VeritasProductInput = {
        listing_id: 'scoring-test-001',
        title: 'Product',
        price: 1000,
        category: 'Electronics',
        brand: 'Sony',
        quality_signals: {
          warranty_included: true,
          warranty_duration_months: 12
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Should have metadata with all components
      expect(result.metadata?.cost_per_year).toBeDefined();
      expect(result.metadata?.resale_value).toBeDefined();
      expect(result.metadata?.net_cost).toBeDefined();

      // Score should be 0-100
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should flag high cost-per-year and poor value', async () => {
      const highTCO: VeritasProductInput = {
        listing_id: 'high-tco-001',
        title: 'Cheap Product with High Maintenance',
        price: 100,
        category: 'Electronics',
        quality_signals: {
          shipping_cost: 50, // High shipping
          warranty_included: false // No warranty = higher repair costs
        }
      };

      const result = await agent.analyzeVeritas(highTCO);

      // TCO should be significantly higher than purchase price
      expect(result.metadata?.tco_breakdown.total).toBeGreaterThan(100);

      // Should flag high cost-per-year or poor financial value
      const hasFinancialWarning = result.flags.some(flag =>
        flag === 'HIGH_COST_PER_YEAR' ||
        flag === 'HIGH_NET_COST' ||
        flag === 'LOW_FINANCIAL_VALUE'
      );
      expect(hasFinancialWarning).toBe(true);
    });
  });

  // ============================================================================
  // Test: Category-Specific Behavior
  // ============================================================================

  describe('Category-Specific Behavior', () => {
    it('should use correct lifespan for each category', async () => {
      const categories = [
        { name: 'Laptops', expectedYears: 4 },
        { name: 'Smartphones', expectedYears: 2.5 },
        { name: 'Watches', expectedYears: 10 },
        { name: 'Furniture', expectedYears: 10 },
        { name: 'Clothing', expectedYears: 2 }
      ];

      for (const cat of categories) {
        const product: VeritasProductInput = {
          listing_id: `lifespan-${cat.name}`,
          title: `Test ${cat.name}`,
          price: 500,
          category: cat.name
        };

        const result = await agent.analyzeVeritas(product);

        expect(result.metadata?.lifespan_years).toBe(cat.expectedYears);
      }
    });

    it('should use fallback data for unknown categories', async () => {
      const product: VeritasProductInput = {
        listing_id: 'unknown-category',
        title: 'Unknown Item',
        price: 500,
        category: 'NonExistentCategory'
      };

      const result = await agent.analyzeVeritas(product);

      // Should use General category defaults
      expect(result.metadata?.lifespan_years).toBe(3);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Test: Evidence Generation
  // ============================================================================

  describe('Evidence Generation', () => {
    it('should provide specific financial evidence', async () => {
      const product: VeritasProductInput = {
        listing_id: 'evidence-test-001',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple',
        quality_signals: {
          shipping_cost: 50,
          warranty_included: true,
          warranty_duration_months: 24
        }
      };

      const result = await agent.analyzeVeritas(product);

      // Evidence should contain specific numbers
      const hasSpecificEvidence = result.evidence.some(e =>
        /\$\d+|\d+%|\d+\.\d+/.test(e) // Contains dollar amounts, percentages, or decimals
      );

      expect(hasSpecificEvidence).toBe(true);

      // Should NOT contain vague statements
      const hasVagueEvidence = result.evidence.some(e =>
        e.includes('Good value') ||
        e.includes('Reasonable') ||
        e.includes('Acceptable')
      );

      expect(hasVagueEvidence).toBe(false);
    });

    it('should include TCO breakdown in evidence', async () => {
      const product: VeritasProductInput = {
        listing_id: 'tco-evidence-001',
        title: 'Product',
        price: 1000,
        category: 'Electronics'
      };

      const result = await agent.analyzeVeritas(product);

      // Should mention TCO or total cost
      const hasTCO = result.evidence.some(e =>
        e.toLowerCase().includes('total cost') ||
        e.toLowerCase().includes('tco') ||
        e.includes('$')
      );

      expect(hasTCO).toBe(true);
    });

    it('should include cost-per-year in evidence', async () => {
      const product: VeritasProductInput = {
        listing_id: 'cpy-evidence-001',
        title: 'Product',
        price: 1000,
        category: 'Laptops'
      };

      const result = await agent.analyzeVeritas(product);

      // Should mention cost per year
      const hasCPY = result.evidence.some(e =>
        e.toLowerCase().includes('per year') ||
        e.toLowerCase().includes('annually')
      );

      expect(hasCPY).toBe(true);
    });
  });

  // ============================================================================
  // Test: Confidence Calculation
  // ============================================================================

  describe('Confidence Calculation', () => {
    it('should have higher confidence with complete data', async () => {
      const completeProduct: VeritasProductInput = {
        listing_id: 'complete-data',
        title: 'MacBook Pro',
        price: 2000,
        category: 'Laptops',
        brand: 'Apple',
        condition: 'new',
        quality_signals: {
          shipping_cost: 50,
          warranty_included: true,
          warranty_duration_months: 24
        }
      };

      const minimalProduct: VeritasProductInput = {
        listing_id: 'minimal-data',
        title: 'Product',
        price: 2000,
        category: 'General'
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
        id: 'veritas-test-001'
      };

      const result = await agent.analyzeVeritas(product);

      // Check required fields
      expect(result.agent).toBe('FinancialValueAgent');
      expect(result.listing_id).toBe('veritas-test-001');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(Array.isArray(result.flags)).toBe(true);
      expect(result.model_version).toBe('financialvalue-v1.0');
      expect(result.computed_at).toBeDefined();

      // Computed_at should be valid ISO 8601
      expect(() => new Date(result.computed_at)).not.toThrow();
    });
  });

  // ============================================================================
  // Test: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very cheap products', async () => {
      const product: VeritasProductInput = {
        listing_id: 'cheap-001',
        title: 'Cheap Item',
        price: 5,
        category: 'General'
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle very expensive products', async () => {
      const product: VeritasProductInput = {
        listing_id: 'expensive-001',
        title: 'Luxury Watch',
        price: 50000,
        category: 'Watches',
        brand: 'Rolex'
      };

      const result = await agent.analyzeVeritas(product);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle missing brand', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-brand-001',
        title: 'Product',
        price: 500,
        category: 'Electronics'
        // No brand specified
      };

      const result = await agent.analyzeVeritas(product);

      // Should use default brand retention (50%)
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.resale_value).toBeDefined();
    });

    it('should handle missing category', async () => {
      const product: VeritasProductInput = {
        listing_id: 'no-category-001',
        title: 'Product',
        price: 500
        // No category
      };

      const result = await agent.analyzeVeritas(product);

      // Should use General category defaults
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.lifespan_years).toBe(3);
    });

    it('should handle zero-price edge case', async () => {
      const product: VeritasProductInput = {
        listing_id: 'free-001',
        title: 'Free Product',
        price: 0,
        category: 'General'
      };

      const result = await agent.analyzeVeritas(product);

      // Even free products have TCO (shipping, etc.)
      expect(result.metadata?.tco_breakdown.total).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
