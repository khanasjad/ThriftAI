import { NextRequest, NextResponse } from 'next/server'

export interface SecurityConfig {
  contentSecurityPolicy?: boolean
  frameOptions?: boolean
  xssProtection?: boolean
  contentTypeOptions?: boolean
  referrerPolicy?: boolean
  strictTransportSecurity?: boolean
  permissionsPolicy?: boolean
}

const defaultConfig: Required<SecurityConfig> = {
  contentSecurityPolicy: true,
  frameOptions: true,
  xssProtection: true,
  contentTypeOptions: true,
  referrerPolicy: true,
  strictTransportSecurity: true,
  permissionsPolicy: true,
}

export function securityHeaders(config: SecurityConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return function securityMiddleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    return handler().then(response => {
      // Content Security Policy
      if (finalConfig.contentSecurityPolicy) {
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://api.anthropic.com https://api.openai.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests"
        ].join('; ')

        response.headers.set('Content-Security-Policy', csp)
      }

      // X-Frame-Options
      if (finalConfig.frameOptions) {
        response.headers.set('X-Frame-Options', 'DENY')
      }

      // X-XSS-Protection
      if (finalConfig.xssProtection) {
        response.headers.set('X-XSS-Protection', '1; mode=block')
      }

      // X-Content-Type-Options
      if (finalConfig.contentTypeOptions) {
        response.headers.set('X-Content-Type-Options', 'nosniff')
      }

      // Referrer-Policy
      if (finalConfig.referrerPolicy) {
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      }

      // Strict-Transport-Security (only in production)
      if (finalConfig.strictTransportSecurity && process.env.NODE_ENV === 'production') {
        response.headers.set(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        )
      }

      // Permissions-Policy
      if (finalConfig.permissionsPolicy) {
        const permissions = [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'interest-cohort=()',
          'accelerometer=()',
          'gyroscope=()',
          'magnetometer=()',
          'payment=()',
          'usb=()',
        ].join(', ')

        response.headers.set('Permissions-Policy', permissions)
      }

      // Additional security headers
      response.headers.set('X-DNS-Prefetch-Control', 'off')
      response.headers.set('X-Download-Options', 'noopen')
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

      return response
    })
  }
}

// Predefined security configurations
export const securityConfigs = {
  // Strict security for API routes
  api: {
    contentSecurityPolicy: false, // APIs don't need CSP
    frameOptions: true,
    xssProtection: true,
    contentTypeOptions: true,
    referrerPolicy: true,
    strictTransportSecurity: true,
    permissionsPolicy: false, // APIs don't need permissions policy
  },

  // Full security for pages
  page: {
    contentSecurityPolicy: true,
    frameOptions: true,
    xssProtection: true,
    contentTypeOptions: true,
    referrerPolicy: true,
    strictTransportSecurity: true,
    permissionsPolicy: true,
  },
}