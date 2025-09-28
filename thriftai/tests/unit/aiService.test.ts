// Mock Prisma with a factory function to avoid circular dependency
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: jest.fn(),
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    seller: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock Anthropic and OpenAI
jest.mock('@anthropic-ai/sdk')
jest.mock('openai')

import { AIService } from '@/lib/services/aiService'
import { prisma } from '@/lib/prisma'

// Get the mocked prisma instance for type assertion
const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchProducts', () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Car Charger Dual USB',
        price: 8.99,
        originalPrice: 19.99,
        brand: 'Belkin',
        category: 'ELECTRONICS',
        condition: 'Good',
        description: 'Dual USB car charger with fast charging capability',
        imageUrl: 'test-image.jpg',
        isAvailable: true,
        sellerId: 'seller1',
        createdAt: new Date(),
        updatedAt: new Date(),
        storeId: null,
        size: 'Small',
        seller: {
          businessName: 'Test Store',
          rating: 4.5
        }
      },
      {
        id: '2',
        name: 'Silk Scarf',
        price: 185,
        originalPrice: 400,
        brand: 'Hermès',
        category: 'ACCESSORIES',
        condition: 'Excellent',
        description: 'Luxury silk scarf with beautiful pattern',
        imageUrl: null,
        isAvailable: true,
        sellerId: 'seller1',
        createdAt: new Date(),
        updatedAt: new Date(),
        storeId: null,
        size: 'One Size',
        seller: {
          businessName: 'Test Store',
          rating: 4.5
        }
      },
      {
        id: '3',
        name: 'Car Phone Holder Mount',
        price: 15.99,
        originalPrice: 29.99,
        brand: 'iOttie',
        category: 'ACCESSORIES',
        condition: 'Good',
        description: 'Universal car phone holder with adjustable mount',
        imageUrl: 'test-image2.jpg',
        isAvailable: true,
        sellerId: 'seller1',
        createdAt: new Date(),
        updatedAt: new Date(),
        storeId: null,
        size: 'Universal',
        seller: {
          businessName: 'Test Store',
          rating: 4.5
        }
      }
    ]

    it('should filter out substring matches like "Silk Scarf" when searching for "car"', async () => {
      // Mock the raw SQL query to fail (simulating word boundary failure)
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error('Word boundary search failed'))

      // Mock the regular Prisma query
      prismaMock.product.findMany.mockResolvedValue(mockProducts)

      const results = await AIService.searchProducts('car')

      expect(results).toHaveLength(2) // Should exclude Silk Scarf
      expect(results.map(p => p.name)).toEqual([
        'Car Charger Dual USB',
        'Car Phone Holder Mount'
      ])
      expect(results.map(p => p.name)).not.toContain('Silk Scarf')
    })

    it('should return exact word matches when word boundary search succeeds', async () => {
      const carProducts = mockProducts.filter(p =>
        p.name.toLowerCase().includes('car') &&
        !p.name.toLowerCase().includes('scarf')
      )

      prismaMock.$queryRawUnsafe.mockResolvedValue(carProducts)

      const results = await AIService.searchProducts('car')

      expect(results).toHaveLength(2)
      expect(results.map(p => p.name)).toEqual([
        'Car Charger Dual USB',
        'Car Phone Holder Mount'
      ])
    })

    it('should apply budget filtering correctly', async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error('Word boundary search failed'))
      prismaMock.product.findMany.mockResolvedValue(mockProducts.filter(p => p.price <= 20))

      const results = await AIService.searchProducts('car', 20)

      expect(results).toHaveLength(2)
      expect(results.every(p => p.price <= 20)).toBe(true)
    })

    it('should handle empty search results gracefully', async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error('Word boundary search failed'))
      prismaMock.product.findMany.mockResolvedValue([])

      const results = await AIService.searchProducts('nonexistent')

      expect(results).toHaveLength(0)
    })

    it('should properly map product data structure', async () => {
      prismaMock.$queryRawUnsafe.mockRejectedValue(new Error('Word boundary search failed'))
      prismaMock.product.findMany.mockResolvedValue([mockProducts[0]])

      const results = await AIService.searchProducts('car')

      expect(results[0]).toEqual({
        id: '1',
        name: 'Car Charger Dual USB',
        price: 8.99,
        originalPrice: 19.99,
        brand: 'Belkin',
        category: 'ELECTRONICS',
        condition: 'Good',
        imageUrl: 'test-image.jpg',
        seller: {
          businessName: 'Test Store',
          rating: 4.5
        }
      })
    })
  })

  describe('isClaudeAvailable', () => {
    it('should return false when Anthropic is not configured', () => {
      // Reset the static property
      AIService['anthropic'] = null
      expect(AIService.isClaudeAvailable()).toBe(false)
    })
  })

  describe('isOpenAIAvailable', () => {
    it('should return false when OpenAI is not configured', () => {
      // Reset the static property
      AIService['openai'] = null
      expect(AIService.isOpenAIAvailable()).toBe(false)
    })
  })

  describe('generateSearchSuggestions', () => {
    it('should provide car-related suggestions for car queries', () => {
      const suggestions = AIService['generateSearchSuggestions']('car accessories')
      expect(suggestions).toContain('phone holder')
      expect(suggestions).toContain('charger')
      expect(suggestions).toContain('bluetooth')
      expect(suggestions).toContain('accessories')
    })

    it('should provide electronics suggestions for tech queries', () => {
      const suggestions = AIService['generateSearchSuggestions']('phone case')
      expect(suggestions).toContain('iPhone')
      expect(suggestions).toContain('Samsung')
      expect(suggestions).toContain('MacBook')
      expect(suggestions).toContain('electronics')
    })

    it('should provide fallback suggestions for unknown queries', () => {
      const suggestions = AIService['generateSearchSuggestions']('random query')
      expect(suggestions).toContain('Nike')
      expect(suggestions).toContain('iPhone')
      expect(suggestions).toContain('jacket')
      expect(suggestions).toContain('accessories')
    })
  })
})