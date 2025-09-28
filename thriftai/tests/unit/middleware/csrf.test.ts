import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection } from '@/lib/middleware/csrf'
import { getServerSession } from 'next-auth'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

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
      response.cookies = {
        set: jest.fn(),
      }
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }
      return response
    })
  }
}))

describe('CSRF Protection', () => {
  let csrf: CSRFProtection
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

  beforeEach(() => {
    jest.clearAllMocks()
    csrf = new CSRFProtection({
      secret: 'test-secret',
      tokenLength: 16,
      maxAge: 60000, // 1 minute
    })
  })

  describe('Token Generation', () => {
    it('should generate a token of correct length', () => {
      const token = csrf.generateToken()
      expect(token).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(typeof token).toBe('string')
    })

    it('should generate unique tokens', () => {
      const token1 = csrf.generateToken()
      const token2 = csrf.generateToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('Token Signing and Verification', () => {
    it('should sign and verify tokens correctly', () => {
      const token = 'test-token'
      const sessionId = 'test-session'

      const signature = csrf.signToken(token, sessionId)
      const isValid = csrf.verifyToken(token, signature, sessionId)

      expect(isValid).toBe(true)
    })

    it('should reject tokens with wrong signature', () => {
      const token = 'test-token'
      const sessionId = 'test-session'
      const correctSignature = csrf.signToken(token, sessionId)
      const wrongSignature = 'a'.repeat(correctSignature.length) // Same length but wrong content

      const isValid = csrf.verifyToken(token, wrongSignature, sessionId)

      expect(isValid).toBe(false)
    })

    it('should reject tokens with wrong session ID', () => {
      const token = 'test-token'
      const sessionId = 'test-session'
      const wrongSessionId = 'wrong-session'

      const signature = csrf.signToken(token, sessionId)
      const isValid = csrf.verifyToken(token, signature, wrongSessionId)

      expect(isValid).toBe(false)
    })
  })

  describe('Session Token Management', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any)
    })

    it('should generate token for new session', async () => {
      const token = await csrf.getTokenForSession('test-session')
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should reuse token for existing session', async () => {
      const sessionId = 'test-session'
      const token1 = await csrf.getTokenForSession(sessionId)
      const token2 = await csrf.getTokenForSession(sessionId)

      expect(token1).toBe(token2)
    })
  })

  describe('Protection Middleware', () => {
    const createMockRequest = (method = 'POST', headers: Record<string, string> = {}): NextRequest => {
      const headerMap = new Map()
      Object.entries(headers).forEach(([key, value]) => {
        headerMap.set(key, value)
      })

      return {
        method,
        ip: '127.0.0.1',
        headers: headerMap,
        formData: jest.fn().mockResolvedValue(new Map()),
      } as any as NextRequest
    }

    const createMockHandler = () => jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any)
    })

    it('should allow GET requests without CSRF token', async () => {
      const middleware = csrf.protect()
      const request = createMockRequest('GET')
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should allow HEAD requests without CSRF token', async () => {
      const middleware = csrf.protect()
      const request = createMockRequest('HEAD')
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should allow OPTIONS requests without CSRF token', async () => {
      const middleware = csrf.protect()
      const request = createMockRequest('OPTIONS')
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should reject POST requests without CSRF token', async () => {
      const middleware = csrf.protect()
      const request = createMockRequest('POST')
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).not.toHaveBeenCalled()
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request'
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    })

    it('should accept POST requests with valid CSRF token in header', async () => {
      const sessionId = 'test@example.com'
      const token = await csrf.getTokenForSession(sessionId)

      const middleware = csrf.protect()
      const request = createMockRequest('POST', { 'x-csrf-token': token })
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should reject POST requests with invalid CSRF token', async () => {
      const middleware = csrf.protect()
      const request = createMockRequest('POST', { 'x-csrf-token': 'invalid-token' })
      const handler = createMockHandler()

      await middleware(request, handler)

      expect(handler).not.toHaveBeenCalled()
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid CSRF token',
          message: 'CSRF token is invalid or expired'
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    })
  })

  describe('Token Endpoint', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      } as any)
    })

    it('should return CSRF token via API endpoint', async () => {
      const request = {
        ip: '127.0.0.1'
      } as NextRequest

      const response = await csrf.getTokenEndpoint(request)

      expect(NextResponse.json).toHaveBeenCalledWith({
        csrfToken: expect.any(String)
      })
    })

    it('should set token in cookie', async () => {
      const request = {
        ip: '127.0.0.1'
      } as NextRequest

      const response = await csrf.getTokenEndpoint(request)

      expect(response.cookies.set).toHaveBeenCalledWith(
        '__csrf-token',
        expect.any(String),
        {
          httpOnly: false,
          secure: false, // NODE_ENV is not production in tests
          sameSite: 'strict',
          maxAge: 60, // 60 seconds (maxAge converted from ms)
        }
      )
    })
  })
})