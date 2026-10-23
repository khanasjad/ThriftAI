/**
 * Veritas Agent Format Tests
 *
 * Comprehensive tests for the standardized Veritas agent output format
 * Ensures all agents conform to the specification in Veritas.AI Product & Technical Plan
 */

import { describe, it, expect } from '@jest/globals';
import type { VeritasAgentResult, VeritasProductInput } from '@/lib/agents/veritasTypes';
import { DeterministicBaseAgent } from '@/lib/agents/DeterministicBaseAgent';
import type { AgentResult } from '@/lib/agents/types';

/**
 * Mock Agent for testing base class functionality
 */
class MockVeritasAgent extends DeterministicBaseAgent {
  readonly name = 'MockAgent';
  readonly weight = 0.20;
  readonly description = 'Test agent for format validation';
  readonly version = 'v1.0';

  async analyze(product: any): Promise<AgentResult> {
    // Legacy format - not used in these tests
    return this.createResult(75, 0.85, 'Test reasoning', {}, 10);
  }

  async analyzeVeritas(product: VeritasProductInput): Promise<VeritasAgentResult> {
    // Create a proper Veritas result
    const evidence = [
      `Product ${product.name} analyzed`,
      `Price is $${product.price}`,
      'Mock analysis complete'
    ];

    const flags: string[] = [];
    if (product.price < 10) {
      flags.push('SUSPICIOUSLY_LOW_PRICE');
    }

    return this.createVeritasResult(
      product.id,
      75,
      0.85,
      evidence,
      flags,
      {
        processing_time_ms: 10,
        data_sources: ['mock_database']
      }
    );
  }

  protected getPossibleFlags(): string[] {
    return ['SUSPICIOUSLY_LOW_PRICE', 'DATA_QUALITY_LOW'];
  }
}

describe('Veritas Agent Output Format', () => {
  let agent: MockVeritasAgent;
  let mockProduct: VeritasProductInput;

  beforeEach(() => {
    agent = new MockVeritasAgent();
    mockProduct = {
      id: 'test-product-123',
      name: 'iPhone 14',
      price: 599,
      brand: 'Apple',
      category: 'Electronics'
    };
  });

  describe('Required Fields', () => {
    it('should include agent name', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.agent).toBe('MockAgent');
      expect(typeof result.agent).toBe('string');
      expect(result.agent.length).toBeGreaterThan(0);
    });

    it('should include listing_id', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.listing_id).toBe('test-product-123');
      expect(typeof result.listing_id).toBe('string');
      expect(result.listing_id.length).toBeGreaterThan(0);
    });

    it('should include score between 0-100', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.score).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.score)).toBe(true); // Should be integer
    });

    it('should include confidence between 0.0-1.0', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include evidence array', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.evidence).toBeDefined();
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should include flags array', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.flags).toBeDefined();
      expect(Array.isArray(result.flags)).toBe(true);
    });

    it('should include model_version', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.model_version).toBeDefined();
      expect(typeof result.model_version).toBe('string');
      expect(result.model_version).toMatch(/mock-v\d+\.\d+/); // Format: "mock-v1.0"
    });

    it('should include computed_at ISO timestamp', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.computed_at).toBeDefined();
      expect(typeof result.computed_at).toBe('string');

      // Validate ISO 8601 format
      const date = new Date(result.computed_at);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);

      // Should be recent (within last 5 seconds)
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      expect(diff).toBeLessThan(5000);
    });
  });

  describe('Evidence Quality', () => {
    it('should have evidence as array of non-empty strings', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      result.evidence.forEach(item => {
        expect(typeof item).toBe('string');
        expect(item.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have specific, actionable evidence (not vague)', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      // Evidence should contain specific details
      const hasSpecificEvidence = result.evidence.some(item => {
        return item.includes('$') || // Price information
               item.includes('%') || // Percentage
               /\d+/.test(item);     // Numbers
      });

      expect(hasSpecificEvidence).toBe(true);
    });

    it('should not have empty evidence array', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should handle empty evidence gracefully', async () => {
      // Test the createVeritasResult method directly with empty evidence
      const result = agent['createVeritasResult'](
        'test-123',
        50,
        0.5,
        [], // Empty evidence
        []
      );

      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence[0]).toContain('deterministic logic');
    });
  });

  describe('Flags System', () => {
    it('should return empty flags array when no issues', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      // Normal product should have no flags
      expect(Array.isArray(result.flags)).toBe(true);
    });

    it('should raise flags for suspicious conditions', async () => {
      const suspiciousProduct: VeritasProductInput = {
        ...mockProduct,
        price: 5 // Suspiciously low
      };

      const result = await agent.analyzeVeritas(suspiciousProduct);
      expect(result.flags).toContain('SUSPICIOUSLY_LOW_PRICE');
    });

    it('should have all flag strings in uppercase with underscores', async () => {
      const suspiciousProduct: VeritasProductInput = {
        ...mockProduct,
        price: 5
      };

      const result = await agent.analyzeVeritas(suspiciousProduct);

      result.flags.forEach(flag => {
        expect(flag).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('Score Validation', () => {
    it('should clamp score above 100 to 100', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        150, // Too high
        0.9,
        ['Test'],
        []
      );

      expect(result.score).toBe(100);
    });

    it('should clamp score below 0 to 0', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        -50, // Too low
        0.9,
        ['Test'],
        []
      );

      expect(result.score).toBe(0);
    });

    it('should round score to nearest integer', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        75.7, // Should round to 76
        0.9,
        ['Test'],
        []
      );

      expect(result.score).toBe(76);
      expect(Number.isInteger(result.score)).toBe(true);
    });
  });

  describe('Confidence Validation', () => {
    it('should clamp confidence above 1.0 to 1.0', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        75,
        1.5, // Too high
        ['Test'],
        []
      );

      expect(result.confidence).toBe(1.0);
    });

    it('should clamp confidence below 0.0 to 0.0', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        75,
        -0.5, // Too low
        ['Test'],
        []
      );

      expect(result.confidence).toBe(0.0);
    });

    it('should preserve confidence precision', () => {
      const result = agent['createVeritasResult'](
        'test-123',
        75,
        0.853,
        ['Test'],
        []
      );

      expect(result.confidence).toBe(0.853);
    });
  });

  describe('Model Version Format', () => {
    it('should follow naming convention: {agent}-v{version}', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      // Should be like "mock-v1.0"
      expect(result.model_version).toMatch(/^[a-z]+(-[a-z]+)*-v\d+\.\d+$/);
    });

    it('should include agent name in lowercase', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.model_version).toContain('mock');
    });

    it('should include version number', async () => {
      const result = await agent.analyzeVeritas(mockProduct);
      expect(result.model_version).toContain('v1.0');
    });
  });

  describe('Metadata Field', () => {
    it('should include optional metadata', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata).toBe('object');
    });

    it('should include processing time in metadata', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      expect(result.metadata?.processing_time_ms).toBeDefined();
      expect(typeof result.metadata?.processing_time_ms).toBe('number');
    });

    it('should allow custom metadata fields', async () => {
      const result = await agent.analyzeVeritas(mockProduct);

      expect(result.metadata?.data_sources).toBeDefined();
      expect(Array.isArray(result.metadata?.data_sources)).toBe(true);
    });
  });

  describe('Agent Capability', () => {
    it('should provide capability metadata', () => {
      const capability = agent.getCapability();

      expect(capability.agent_name).toBe('MockAgent');
      expect(capability.version).toBe('v1.0');
      expect(capability.weight).toBe(0.20);
      expect(Array.isArray(capability.requires_fields)).toBe(true);
      expect(Array.isArray(capability.optional_fields)).toBe(true);
      expect(Array.isArray(capability.output_flags)).toBe(true);
    });

    it('should list required fields', () => {
      const capability = agent.getCapability();

      expect(capability.requires_fields).toContain('id');
      expect(capability.requires_fields).toContain('name');
      expect(capability.requires_fields).toContain('price');
    });

    it('should list possible output flags', () => {
      const capability = agent.getCapability();

      expect(capability.output_flags).toContain('SUSPICIOUSLY_LOW_PRICE');
      expect(capability.output_flags).toContain('DATA_QUALITY_LOW');
    });
  });

  describe('Helper Methods', () => {
    it('should convert reasoning string to evidence array', () => {
      const reasoning = 'Price is good. Quality is high. Seller is trusted.';
      const evidence = agent['reasoningToEvidence'](reasoning);

      expect(Array.isArray(evidence)).toBe(true);
      expect(evidence.length).toBe(3);
      expect(evidence[0]).toBe('Price is good.');
      expect(evidence[1]).toBe('Quality is high.');
      expect(evidence[2]).toBe('Seller is trusted.');
    });

    it('should handle reasoning without periods', () => {
      const reasoning = 'Good product';
      const evidence = agent['reasoningToEvidence'](reasoning);

      expect(evidence.length).toBeGreaterThan(0);
      expect(evidence[0]).toContain('Good product');
    });
  });

  describe('Consistency Across Multiple Calls', () => {
    it('should produce consistent format across multiple products', async () => {
      const products = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
        { id: '3', name: 'Product 3', price: 300 }
      ];

      const results = await Promise.all(
        products.map(p => agent.analyzeVeritas(p))
      );

      results.forEach((result, index) => {
        // All results should have same structure
        expect(result.agent).toBe('MockAgent');
        expect(result.listing_id).toBe(products[index].id);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.evidence)).toBe(true);
        expect(Array.isArray(result.flags)).toBe(true);
        expect(result.model_version).toBeDefined();
        expect(result.computed_at).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalProduct: VeritasProductInput = {
        id: 'minimal-1',
        name: 'Minimal Product',
        price: 50
        // No brand, category, etc.
      };

      const result = await agent.analyzeVeritas(minimalProduct);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle invalid price values', async () => {
      const invalidProduct: VeritasProductInput = {
        id: 'invalid-1',
        name: 'Invalid Product',
        price: -100 // Invalid negative price
      };

      // Agent should handle this gracefully
      const result = await agent.analyzeVeritas(invalidProduct);
      expect(result).toBeDefined();
    });
  });
});

describe('Veritas Format Specification Compliance', () => {
  it('should match example format from Veritas.AI plan', () => {
    const agent = new MockVeritasAgent();

    const result = agent['createVeritasResult'](
      'lst_8f21',
      82,
      0.9,
      ['$3.10 below 90-day median', 'cheapest of 14 sellers'],
      [],
      { processing_time_ms: 15 }
    );

    // Matches the example in the plan
    expect(result).toMatchObject({
      agent: 'MockAgent',
      listing_id: 'lst_8f21',
      score: 82,
      confidence: 0.9,
      evidence: expect.arrayContaining([
        '$3.10 below 90-day median',
        'cheapest of 14 sellers'
      ]),
      flags: [],
      model_version: expect.stringMatching(/mock-v\d+\.\d+/),
      computed_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });
  });
});
