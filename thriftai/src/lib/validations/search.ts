import { z } from 'zod'
import { securityConfig } from '@/config/security.config'

// Safe validation defaults that work without initialization
const getValidationLimits = () => {
  try {
    // Try to get configured values
    const validation = securityConfig.getValidationConfig()
    return {
      maxQueryLength: validation.maxQueryLength || 200,
      maxPrice: validation.maxPrice || 10000,
      maxPage: validation.maxPage || 100,
      maxPageSize: validation.maxPageSize || 50,
    }
  } catch (error) {
    // Fallback to safe defaults if config not initialized
    return {
      maxQueryLength: 200,
      maxPrice: 10000,
      maxPage: 100,
      maxPageSize: 50,
    }
  }
}

// Create dynamic validation schema
const createSearchQuerySchema = () => {
  const validation = getValidationLimits()

  return z.object({
    q: z.string()
      .min(1, 'Search query cannot be empty')
      .max(validation.maxQueryLength, `Search query must be less than ${validation.maxQueryLength} characters`)
      .regex(/^[a-zA-Z0-9\s\-_.&']*$/, 'Search query contains invalid characters')
      .trim(),
    category: z.enum(['CLOTHING', 'SHOES', 'ACCESSORIES', 'ELECTRONICS', 'HOME', 'BOOKS', 'SPORTS']).optional(),
    minPrice: z.number().min(0).max(validation.maxPrice).optional(),
    maxPrice: z.number().min(0).max(validation.maxPrice).optional(),
    page: z.number().int().min(1).max(validation.maxPage).default(1),
    limit: z.number().int().min(1).max(validation.maxPageSize).default(20),
    sortBy: z.enum(['price', 'date', 'popularity']).default('date').optional(),
    condition: z.enum(['New', 'Excellent', 'Very Good', 'Good', 'Fair']).optional(),
  })
}

// Export the schema as a getter function
export const SearchQuerySchema = createSearchQuerySchema()

export type SearchQuery = z.infer<typeof SearchQuerySchema>

// API route validation helper
export function validateSearchParams(searchParams: URLSearchParams): SearchQuery {
  const rawParams = {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    sortBy: searchParams.get('sortBy') || 'date',
    condition: searchParams.get('condition') || undefined,
  }

  return SearchQuerySchema.parse(rawParams)
}

// Claude search validation schema
const createClaudeSearchSchema = () => {
  const validation = getValidationLimits()

  return z.object({
    query: z.string()
      .min(1, 'Query cannot be empty')
      .max(validation.maxQueryLength * 2.5, `Query must be less than ${validation.maxQueryLength * 2.5} characters`) // Allow longer queries for AI
      .trim(),
    maxPrice: z.number().min(0).max(validation.maxPrice).optional(),
    category: z.enum(['CLOTHING', 'SHOES', 'ACCESSORIES', 'ELECTRONICS', 'HOME', 'BOOKS', 'SPORTS']).optional(),
  })
}

export const ClaudeSearchSchema = createClaudeSearchSchema()

export type ClaudeSearchQuery = z.infer<typeof ClaudeSearchSchema>