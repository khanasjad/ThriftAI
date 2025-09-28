import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitConfigs, rateLimitStore } from '@/lib/middleware/rateLimit'

// Mock NextResponse
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextResponse: class MockNextResponse {
    constructor(body, init) {
      this.status = init?.status || 200
      this.headers = new Map()
      this.body = body
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }

    static json = jest.fn((data, init) => {
      const response = new MockNextResponse(JSON.stringify(data), init)
      response.json = async () => data
      response.headers = new Map()
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }
      return response
    })
  }
}))

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear the rate limit store between tests
    rateLimitStore.clear()
  })

  const createMockRequest = (ip = '127.0.0.1'): NextRequest => ({
    ip,
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    headers: new Map(),
  } as NextRequest)

  const createMockHandler = () => jest.fn().mockResolvedValue(
    NextResponse.json({ success: true })
  )

  it('should allow requests within rate limit', async () => {
    const config = { windowMs: 60000, maxRequests: 5 }
    const middleware = rateLimit(config)
    const request = createMockRequest()
    const handler = createMockHandler()

    const response = await middleware(request, handler)

    expect(handler).toHaveBeenCalled()
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
  })

  it('should block requests exceeding rate limit', async () => {
    const config = { windowMs: 60000, maxRequests: 2 }
    const middleware = rateLimit(config)
    const request = createMockRequest()
    const handler = createMockHandler()

    // Make 3 requests (should block the 3rd)
    await middleware(request, handler)
    await middleware(request, handler)
    const response = await middleware(request, handler)

    expect(NextResponse.json).toHaveBeenLastCalledWith(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: expect.any(Number),
      },
      { status: 429 }
    )
  })

  it('should handle different IPs independently', async () => {
    const config = { windowMs: 60000, maxRequests: 1 }
    const middleware = rateLimit(config)
    const request1 = createMockRequest('192.168.1.1')
    const request2 = createMockRequest('192.168.1.2')
    const handler = createMockHandler()

    const response1 = await middleware(request1, handler)
    const response2 = await middleware(request2, handler)

    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('should respect predefined search rate limit config', () => {
    const searchConfig = rateLimitConfigs.search
    expect(searchConfig.windowMs).toBe(60 * 1000) // 1 minute
    expect(searchConfig.maxRequests).toBe(30)
  })

  it('should respect predefined AI search rate limit config', () => {
    const aiSearchConfig = rateLimitConfigs.aiSearch
    expect(aiSearchConfig.windowMs).toBe(60 * 1000) // 1 minute
    expect(aiSearchConfig.maxRequests).toBe(10)
  })

  it('should add correct rate limit headers', async () => {
    const config = { windowMs: 60000, maxRequests: 10 }
    const middleware = rateLimit(config)
    const request = createMockRequest('192.168.100.1') // Use unique IP for this test
    const handler = createMockHandler()

    // Make first request
    const response = await middleware(request, handler)

    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('should handle requests with missing IP gracefully', async () => {
    const config = { windowMs: 60000, maxRequests: 5 }
    const middleware = rateLimit(config)
    const request = createMockRequest(undefined)
    const handler = createMockHandler()

    const response = await middleware(request, handler)

    expect(handler).toHaveBeenCalled()
  })
})