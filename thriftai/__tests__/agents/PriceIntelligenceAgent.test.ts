/**
 * Price Intelligence Agent Tests
 *
 * Comprehensive test suite for PriceIntelligenceAgent
 */

import { PriceIntelligenceAgent } from '@/lib/agents/specialized/PriceIntelligenceAgent';
import type { ProductInput } from '@/lib/agents/DeterministicBaseAgent';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      aggregate: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

import { prisma } from '@/lib/prisma';

describe('PriceIntelligenceAgent', () => {
  let agent: PriceIntelligenceAgent;

  beforeEach(() => {
    agent = new PriceIntelligenceAgent();
    jest.clearAllMocks();
  });

  describe('Agent Properties', () => {
    test('should have correct name', () => {
      expect(agent.name).toBe('PriceIntelligenceAgent');
    });

    test('should have weight between 0 and 1', () => {
      expect(agent.weight).toBeGreaterThan(0);
      expect(agent.weight).toBeLessThanOrEqual(1);
    });

    test('should have a description', () => {
      expect(agent.description).toBeTruthy();
      expect(typeof agent.description).toBe('string');
    });
  });

  describe('Price Analysis - Excellent Deals', () => {
    test('should score 90+ for 40% below median price', async () => {
      // Mock category stats: median = $500
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 550 },
        _min: { price: 200 },
        _max: { price: 1000 },
        _count: 100
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 500 }
      ]);

      const product: ProductInput = {
        id: '1',
        name: 'iPhone 14 Pro',
        price: 300, // 40% below median of $500
        category: 'Electronics',
        condition: 'Like New'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.agentName).toBe('PriceIntelligenceAgent');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasoning).toContain('below');
    });

    test('should score 85-90 for 20-30% below median', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 1000 },
        _min: { price: 500 },
        _max: { price: 1500 },
        _count: 50
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 1000 }
      ]);

      const product: ProductInput = {
        id: '2',
        name: 'MacBook Air M2',
        price: 750, // 25% below median
        category: 'Computers',
        condition: 'Good'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.score).toBeLessThanOrEqual(90);
    });
  });

  describe('Price Analysis - Average to Fair', () => {
    test('should score 60-70 for price at median', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 50 },
        _max: { price: 200 },
        _count: 30
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '3',
        name: 'Headphones',
        price: 100, // Exactly at median
        category: 'Audio',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThanOrEqual(70);
    });
  });

  describe('Price Analysis - Expensive', () => {
    test('should score below 50 for 20%+ above median', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 500 },
        _min: { price: 300 },
        _max: { price: 800 },
        _count: 40
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 500 }
      ]);

      const product: ProductInput = {
        id: '4',
        name: 'Gaming Console',
        price: 650, // 30% above median
        category: 'Gaming',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeLessThan(50);
      expect(result.reasoning).toContain('above');
    });
  });

  describe('Scam Detection - Suspiciously Low Prices', () => {
    test('should cap score at 40 for suspiciously low prices (70%+ discount)', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 1000 },
        _min: { price: 800 },
        _max: { price: 1200 },
        _count: 60
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 1000 }
      ]);

      const product: ProductInput = {
        id: '5',
        name: 'Brand New iPhone 15 Pro Max',
        price: 200, // 80% below median - too good to be true
        category: 'Electronics',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeLessThanOrEqual(40);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.factors.suspiciouslyLow).toBe(true);
    });

    test('should include warning for suspiciously low price', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 1000 },
        _min: { price: 800 },
        _max: { price: 1200 },
        _count: 50
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 1000 }
      ]);

      const product: ProductInput = {
        id: '6',
        name: 'Luxury Watch',
        price: 100, // Should be ~$1000
        category: 'Watches',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      const hasScamWarning = result.warnings?.some(w =>
        w.toLowerCase().includes('authenticity') ||
        w.toLowerCase().includes('too low')
      );

      expect(hasScamWarning).toBe(true);
    });
  });

  describe('Data Quality Handling', () => {
    test('should have lower confidence with limited data points', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 80 },
        _max: { price: 120 },
        _count: 3 // Very few data points
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '7',
        name: 'Rare Collectible',
        price: 90,
        category: 'Collectibles',
        condition: 'Used'
      };

      const result = await agent.analyze(product);

      expect(result.confidence).toBeLessThan(0.6);
      expect(result.factors.dataPoints).toBe(3);
    });

    test('should include warning for limited data', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 90 },
        _max: { price: 110 },
        _count: 2
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '8',
        name: 'Niche Product',
        price: 95,
        category: 'Specialty',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      const hasDataWarning = result.warnings?.some(w =>
        w.toLowerCase().includes('limited') ||
        w.toLowerCase().includes('data')
      );

      expect(hasDataWarning).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return fallback score when database query fails', async () => {
      (prisma.product.aggregate as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const product: ProductInput = {
        id: '9',
        name: 'Test Product',
        price: 100,
        category: 'Test',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      // Agent continues with fallback data (median=100) instead of hard-coded 50
      // Price $100 vs median $100 = 0% discount = ~55 score
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.score).toBeLessThanOrEqual(60);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    test('should handle missing category gracefully', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 50 },
        _max: { price: 200 },
        _count: 20
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '10',
        name: 'Uncategorized Product',
        price: 95,
        // No category provided
        condition: 'Good'
      };

      const result = await agent.analyze(product);

      expect(result.score).toBeGreaterThan(0);
      expect(result.agentName).toBe('PriceIntelligenceAgent');
    });
  });

  describe('Performance', () => {
    test('should complete analysis in under 500ms', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 50 },
        _max: { price: 200 },
        _count: 50
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '11',
        name: 'Performance Test Product',
        price: 85,
        category: 'Electronics',
        condition: 'New'
      };

      const result = await agent.analyze(product);

      expect(result.processingTime).toBeLessThan(500);
    });
  });

  describe('Result Structure', () => {
    test('should return properly structured result', async () => {
      (prisma.product.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 100 },
        _min: { price: 50 },
        _max: { price: 200 },
        _count: 30
      });

      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { price: 100 }
      ]);

      const product: ProductInput = {
        id: '12',
        name: 'Structure Test',
        price: 90,
        category: 'Test',
        condition: 'Good'
      };

      const result = await agent.analyze(product);

      expect(result).toHaveProperty('agentName');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('processingTime');

      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);

      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });
});
