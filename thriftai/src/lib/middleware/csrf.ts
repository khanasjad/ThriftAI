import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { logger } from '@/lib/logger'
import { getCsrfConfig } from '@/config/security.config'

// CSRF token storage (use Redis/database in production)
const csrfTokenStore = new Map<string, { token: string; expires: number }>()

interface CSRFConfig {
  cookieName?: string
  headerName?: string
  secret?: string
  tokenLength?: number
  maxAge?: number // in milliseconds
}

export class CSRFProtection {
  private config: Required<CSRFConfig>

  constructor(config: CSRFConfig = {}) {
    try {
      const securityConfig = getCsrfConfig()
      this.config = {
        cookieName: config.cookieName || securityConfig.cookieName,
        headerName: config.headerName || securityConfig.headerName,
        secret: config.secret || securityConfig.secret,
        tokenLength: config.tokenLength || securityConfig.tokenLength,
        maxAge: config.maxAge || securityConfig.maxAge,
      }

      logger.debug('CSRF Protection initialized', {
        component: 'CSRF',
        metadata: {
          cookieName: this.config.cookieName,
          headerName: this.config.headerName,
          tokenLength: this.config.tokenLength,
          maxAge: this.config.maxAge,
        },
      })
    } catch (error) {
      logger.error('Failed to initialize CSRF Protection', error, {
        component: 'CSRF',
      })
      throw new Error('CSRF Protection initialization failed')
    }
  }

  // Generate a new CSRF token
  generateToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex')
  }

  // Create HMAC signature for token
  signToken(token: string, sessionId: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secret)
    hmac.update(`${token}:${sessionId}`)
    return hmac.digest('hex')
  }

  // Verify HMAC signature
  verifyToken(token: string, signature: string, sessionId: string): boolean {
    const expectedSignature = this.signToken(token, sessionId)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Get or generate CSRF token for session
  async getTokenForSession(sessionId: string): Promise<string> {
    const now = Date.now()

    // Clean up expired tokens
    for (const [key, value] of csrfTokenStore.entries()) {
      if (value.expires <= now) {
        csrfTokenStore.delete(key)
      }
    }

    // Check if valid token exists
    const existing = csrfTokenStore.get(sessionId)
    if (existing && existing.expires > now) {
      return existing.token
    }

    // Generate new token
    const token = this.generateToken()
    csrfTokenStore.set(sessionId, {
      token,
      expires: now + this.config.maxAge
    })

    return token
  }

  // Middleware for protecting routes
  protect() {
    return async (req: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return handler()
      }

      // Get session to use as identifier
      const session = await getServerSession()
      const sessionId = session?.user?.email || req.ip || 'anonymous'

      // Get token from header or form data
      let providedToken = req.headers.get(this.config.headerName)

      if (!providedToken && req.method === 'POST') {
        try {
          const formData = await req.formData()
          providedToken = formData.get('_csrf') as string
        } catch {
          // If parsing form data fails, continue without token
        }
      }

      if (!providedToken) {
        return new NextResponse(
          JSON.stringify({
            error: 'CSRF token missing',
            message: 'CSRF token is required for this request'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Get expected token for session
      const expectedToken = await this.getTokenForSession(sessionId)

      // Verify token
      if (providedToken !== expectedToken) {
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid CSRF token',
            message: 'CSRF token is invalid or expired'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return handler()
    }
  }

  // API endpoint to get CSRF token
  async getTokenEndpoint(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession()
    const sessionId = session?.user?.email || req.ip || 'anonymous'

    const token = await this.getTokenForSession(sessionId)

    const response = NextResponse.json({ csrfToken: token })

    // Set token in cookie as well
    response.cookies.set(this.config.cookieName, token, {
      httpOnly: false, // Allow client-side access for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.config.maxAge / 1000, // Convert to seconds
    })

    return response
  }
}

// Default CSRF protection instance
export const csrf = new CSRFProtection()

// Helper function to get CSRF token on client side
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === '__csrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}