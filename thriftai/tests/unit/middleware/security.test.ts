import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders, securityConfigs } from '@/lib/middleware/security'

// Mock NextResponse
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(),
    })),
  },
}))

describe('Security Headers Middleware', () => {
  const createMockRequest = (): NextRequest => ({
    url: 'http://localhost:3000/api/test',
    method: 'GET',
  } as NextRequest)

  const createMockHandler = () => {
    const mockResponse = {
      headers: new Map(),
    }
    mockResponse.headers.set = jest.fn()

    const handler = jest.fn().mockResolvedValue(mockResponse)
    // Store the response for easier access in tests
    handler.mockResponse = mockResponse

    return handler
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset NODE_ENV for consistent testing
    delete process.env.NODE_ENV
  })

  it('should apply all default security headers', async () => {
    const middleware = securityHeaders()
    const request = createMockRequest()
    const handler = createMockHandler()

    const response = await middleware(request, handler)

    expect(response.headers.set).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    )
    expect(response.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    expect(response.headers.set).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block')
    expect(response.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
    expect(response.headers.set).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin')
    expect(response.headers.set).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off')
    expect(response.headers.set).toHaveBeenCalledWith('X-Download-Options', 'noopen')
    expect(response.headers.set).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none')
  })

  it('should apply Content Security Policy with correct directives', async () => {
    const middleware = securityHeaders()
    const request = createMockRequest()
    const handler = createMockHandler()

    await middleware(request, handler)

    const cspCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Content-Security-Policy'
    )

    expect(cspCall).toBeTruthy()
    const cspValue = cspCall[1]

    expect(cspValue).toContain("default-src 'self'")
    expect(cspValue).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net")
    expect(cspValue).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
    expect(cspValue).toContain("font-src 'self' https://fonts.gstatic.com")
    expect(cspValue).toContain("img-src 'self' data: https: blob:")
    expect(cspValue).toContain("connect-src 'self' https://api.anthropic.com https://api.openai.com")
    expect(cspValue).toContain("frame-ancestors 'none'")
    expect(cspValue).toContain("base-uri 'self'")
    expect(cspValue).toContain("form-action 'self'")
    expect(cspValue).toContain("upgrade-insecure-requests")
  })

  it('should apply Permissions Policy with correct permissions', async () => {
    const middleware = securityHeaders()
    const request = createMockRequest()
    const handler = createMockHandler()

    await middleware(request, handler)

    const permissionsCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Permissions-Policy'
    )

    expect(permissionsCall).toBeTruthy()
    const permissionsValue = permissionsCall[1]

    expect(permissionsValue).toContain('camera=()')
    expect(permissionsValue).toContain('microphone=()')
    expect(permissionsValue).toContain('geolocation=()')
    expect(permissionsValue).toContain('interest-cohort=()')
    expect(permissionsValue).toContain('accelerometer=()')
    expect(permissionsValue).toContain('gyroscope=()')
    expect(permissionsValue).toContain('magnetometer=()')
    expect(permissionsValue).toContain('payment=()')
    expect(permissionsValue).toContain('usb=()')
  })

  it('should apply HSTS only in production', async () => {
    // Test in development
    process.env.NODE_ENV = 'development'

    let middleware = securityHeaders()
    let request = createMockRequest()
    let handler = createMockHandler()

    await middleware(request, handler)

    let hstsCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Strict-Transport-Security'
    )
    expect(hstsCall).toBeUndefined()

    // Test in production
    process.env.NODE_ENV = 'production'
    jest.clearAllMocks()

    middleware = securityHeaders()
    request = createMockRequest()
    handler = createMockHandler()

    await middleware(request, handler)

    hstsCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Strict-Transport-Security'
    )
    expect(hstsCall).toBeTruthy()
    expect(hstsCall[1]).toBe('max-age=31536000; includeSubDomains; preload')
  })

  it('should respect custom configuration', async () => {
    const customConfig = {
      contentSecurityPolicy: false,
      frameOptions: false,
      xssProtection: true,
      contentTypeOptions: true,
    }

    const middleware = securityHeaders(customConfig)
    const request = createMockRequest()
    const handler = createMockHandler()

    await middleware(request, handler)

    const cspCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Content-Security-Policy'
    )
    const frameCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'X-Frame-Options'
    )
    const xssCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'X-XSS-Protection'
    )
    const contentTypeCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'X-Content-Type-Options'
    )

    expect(cspCall).toBeUndefined()
    expect(frameCall).toBeUndefined()
    expect(xssCall).toBeTruthy()
    expect(contentTypeCall).toBeTruthy()
  })

  describe('Predefined Configurations', () => {
    it('should have correct API configuration', () => {
      const apiConfig = securityConfigs.api

      expect(apiConfig.contentSecurityPolicy).toBe(false)
      expect(apiConfig.frameOptions).toBe(true)
      expect(apiConfig.xssProtection).toBe(true)
      expect(apiConfig.contentTypeOptions).toBe(true)
      expect(apiConfig.referrerPolicy).toBe(true)
      expect(apiConfig.strictTransportSecurity).toBe(true)
      expect(apiConfig.permissionsPolicy).toBe(false)
    })

    it('should have correct page configuration', () => {
      const pageConfig = securityConfigs.page

      expect(pageConfig.contentSecurityPolicy).toBe(true)
      expect(pageConfig.frameOptions).toBe(true)
      expect(pageConfig.xssProtection).toBe(true)
      expect(pageConfig.contentTypeOptions).toBe(true)
      expect(pageConfig.referrerPolicy).toBe(true)
      expect(pageConfig.strictTransportSecurity).toBe(true)
      expect(pageConfig.permissionsPolicy).toBe(true)
    })
  })

  it('should apply API configuration correctly', async () => {
    const middleware = securityHeaders(securityConfigs.api)
    const request = createMockRequest()
    const handler = createMockHandler()

    await middleware(request, handler)

    const cspCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Content-Security-Policy'
    )
    const permissionsCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Permissions-Policy'
    )
    const frameCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'X-Frame-Options'
    )

    expect(cspCall).toBeUndefined() // CSP disabled for APIs
    expect(permissionsCall).toBeUndefined() // Permissions policy disabled for APIs
    expect(frameCall).toBeTruthy() // Frame options still enabled
  })

  it('should apply page configuration correctly', async () => {
    const middleware = securityHeaders(securityConfigs.page)
    const request = createMockRequest()
    const handler = createMockHandler()

    await middleware(request, handler)

    const cspCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Content-Security-Policy'
    )
    const permissionsCall = (handler.mockResponse.headers.set as jest.Mock).mock.calls.find(
      call => call[0] === 'Permissions-Policy'
    )

    expect(cspCall).toBeTruthy() // CSP enabled for pages
    expect(permissionsCall).toBeTruthy() // Permissions policy enabled for pages
  })
})