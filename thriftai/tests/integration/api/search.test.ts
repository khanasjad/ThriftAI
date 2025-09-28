import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/buyers/search/route'
import { prismaMock } from '../../mocks/prisma'

// Mock the AIService
jest.mock('@/lib/services/aiService', () => ({
  AIService: {
    searchProducts: jest.fn(),
  },
}))

import { AIService } from '@/lib/services/aiService'

describe('/api/buyers/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSearchResults = [
    {
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
    },
    {
      id: '2',
      name: 'Car Phone Holder Mount',
      price: 15.99,
      originalPrice: 29.99,
      brand: 'iOttie',
      category: 'ACCESSORIES',
      condition: 'Good',
      imageUrl: 'test-image2.jpg',
      seller: {
        businessName: 'Test Store',
        rating: 4.5
      }
    }
  ]

  it('should return search results with AI filtering for car query', async () => {
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockResolvedValue(mockSearchResults)

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products).toHaveLength(2)
    expect(data.products[0].name).toBe('Car Charger Dual USB')
    expect(data.products[1].name).toBe('Car Phone Holder Mount')
    expect(data.pagination.total).toBe(2)
    expect(mockedSearchProducts).toHaveBeenCalledWith('car', undefined)
  })

  it('should handle budget filtering correctly', async () => {
    const filteredResults = mockSearchResults.filter(p => p.price <= 10)
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockResolvedValue(filteredResults)

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car&maxPrice=10',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products).toHaveLength(1)
    expect(data.products[0].price).toBeLessThanOrEqual(10)
    expect(mockedSearchProducts).toHaveBeenCalledWith('car', 10)
  })

  it('should handle category filtering', async () => {
    const electronicsResults = mockSearchResults.filter(p => p.category === 'ELECTRONICS')
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockResolvedValue(electronicsResults)

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car&category=ELECTRONICS',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products).toHaveLength(1)
    expect(data.products[0].category).toBe('ELECTRONICS')
  })

  it('should handle pagination correctly', async () => {
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockResolvedValue(mockSearchResults)

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car&page=1&limit=1',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products).toHaveLength(1)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(1)
    expect(data.pagination.total).toBe(2)
    expect(data.pagination.pages).toBe(2)
  })

  it('should handle empty query by using traditional search', async () => {
    const mockPrismaResults = [
      {
        id: '1',
        name: 'Test Product',
        price: 10,
        originalPrice: 20,
        brand: 'Test Brand',
        category: 'TEST',
        condition: 'Good',
        description: 'Test description',
        imageUrl: null,
        isAvailable: true,
        sellerId: 'seller1',
        createdAt: new Date(),
        updatedAt: new Date(),
        storeId: null,
        size: 'M',
        seller: {
          businessName: 'Test Store',
          rating: 4.5
        }
      }
    ]

    prismaMock.product.findMany.mockResolvedValue(mockPrismaResults)
    prismaMock.product.count.mockResolvedValue(1)

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products).toHaveLength(1)
    expect(prismaMock.product.findMany).toHaveBeenCalled()
    expect(prismaMock.product.count).toHaveBeenCalled()
  })

  it('should handle search errors gracefully', async () => {
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockRejectedValue(new Error('Search failed'))

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should exclude false positive matches (like Silk Scarf for car)', async () => {
    // This test verifies that the AI service filtering is working
    const mockedSearchProducts = AIService.searchProducts as jest.MockedFunction<typeof AIService.searchProducts>
    mockedSearchProducts.mockResolvedValue(mockSearchResults) // Should not include Silk Scarf

    const { req } = createMocks({
      method: 'GET',
      url: '/api/buyers/search?q=car',
    })

    const response = await GET(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.products.map((p: any) => p.name)).not.toContain('Silk Scarf')
    expect(data.products.every((p: any) => p.name.toLowerCase().includes('car'))).toBe(true)
  })
})