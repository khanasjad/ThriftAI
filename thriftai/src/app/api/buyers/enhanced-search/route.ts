import { NextRequest, NextResponse } from 'next/server'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query = '',
      filters = {},
      pagination = { page: 1, limit: 20 },
      sorting = { field: 'relevance', direction: 'desc' },
      includeMetadata = true
    } = body

    logger.info('Enhanced search request', {
      query,
      filters,
      pagination,
      sorting,
      includeMetadata
    })

    // Use the enhanced search method
    const searchResults = await mockAmazonService.searchProductsEnhanced(query, {
      filters,
      pagination,
      sorting,
      includeMetadata
    })

    logger.info('Enhanced search completed', {
      totalResults: searchResults.metadata.total,
      page: searchResults.metadata.page,
      resultsReturned: searchResults.products.length
    })

    return NextResponse.json(searchResults)

  } catch (error) {
    logger.error('Enhanced search API error', { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}