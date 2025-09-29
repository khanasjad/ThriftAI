import { NextRequest, NextResponse } from 'next/server'
import { mockAmazonService } from '@/lib/services/mockAmazonService'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info('Fetching available filters')

    // Get all available filter options from the database
    const availableFilters = await mockAmazonService.getAvailableFilters()

    logger.info('Available filters retrieved', {
      categoriesCount: availableFilters.categories.length,
      brandsCount: availableFilters.brands.length,
      conditionsCount: availableFilters.conditions.length,
      sizesCount: availableFilters.sizes.length,
      priceRange: availableFilters.priceRange
    })

    return NextResponse.json(availableFilters)

  } catch (error) {
    logger.error('Filters API error', { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        error: 'Failed to fetch filters',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}