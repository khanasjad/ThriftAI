/**
 * API Key Authentication Middleware
 *
 * Validates API keys for B2B SaaS tenants
 * - Extracts API key from headers
 * - Validates against database
 * - Checks tenant status and limits
 * - Tracks usage
 */

import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export interface AuthenticatedTenant {
  id: string
  name: string
  email: string
  plan: string
  rateLimit: number
  settings: any
  isActive: boolean
  totalApiCalls: number
  totalProducts: number
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = 'UNAUTHORIZED'
  ) {
    super(message)
    this.name = 'ApiAuthError'
  }
}

/**
 * Validate API key from request headers
 * Returns tenant information if valid
 */
export async function validateApiKey(req: NextRequest): Promise<AuthenticatedTenant> {
  try {
    // Extract API key from header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      throw new ApiAuthError('Missing API key. Include x-api-key header or Authorization: Bearer token', 401, 'MISSING_API_KEY')
    }

    // Find tenant by API key
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        rateLimit: true,
        settings: true,
        isActive: true,
        totalApiCalls: true,
        totalProducts: true,
      }
    })

    if (!tenant) {
      logger.warn('Invalid API key attempted', { apiKey: apiKey.substring(0, 10) + '...' })
      throw new ApiAuthError('Invalid API key', 401, 'INVALID_API_KEY')
    }

    // Check if tenant is active
    if (!tenant.isActive) {
      throw new ApiAuthError('Tenant account is inactive. Please contact support.', 403, 'TENANT_INACTIVE')
    }

    // Update last API call timestamp (async, don't await)
    prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        lastApiCallAt: new Date(),
        totalApiCalls: {
          increment: 1
        }
      }
    }).catch(err => {
      logger.error('Failed to update tenant usage', { tenantId: tenant.id, error: err })
    })

    logger.info('API key validated', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan
    })

    return tenant as AuthenticatedTenant
  } catch (error) {
    if (error instanceof ApiAuthError) {
      throw error
    }

    logger.error('API authentication error', {
      error: error instanceof Error ? error.message : String(error)
    })
    throw new ApiAuthError('Authentication failed', 500, 'AUTH_ERROR')
  }
}

/**
 * Middleware wrapper for API routes
 * Usage:
 *
 * export async function POST(req: NextRequest) {
 *   const tenant = await withApiAuth(req)
 *   // ... your API logic
 * }
 */
export async function withApiAuth(req: NextRequest): Promise<AuthenticatedTenant> {
  return validateApiKey(req)
}

/**
 * Generate a new API key for a tenant
 * Format: vts_live_{32_random_chars} for production
 * Format: vts_test_{32_random_chars} for testing
 */
export function generateApiKey(isTest: boolean = false): string {
  const prefix = isTest ? 'vts_test_' : 'vts_live_'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = ''

  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return prefix + key
}

/**
 * Check if tenant has reached product limit
 */
export async function checkProductLimit(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      totalProducts: true
    }
  })

  if (!tenant) {
    return false
  }

  // Product limits by plan
  const limits: Record<string, number> = {
    free: 100,
    starter: 1000,
    professional: 50000,
    enterprise: Number.MAX_SAFE_INTEGER
  }

  const limit = limits[tenant.plan] || limits.free
  return tenant.totalProducts < limit
}

/**
 * Increment tenant product count
 */
export async function incrementProductCount(tenantId: string, count: number = 1): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      totalProducts: {
        increment: count
      }
    }
  })
}
