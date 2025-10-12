/**
 * CPSC Recalls API Endpoint
 *
 * FREE API - No authentication required
 *
 * Usage:
 * GET /api/integrations/cpsc?product=iPhone&brand=Apple
 * GET /api/integrations/cpsc/recent?days=30
 * GET /api/integrations/cpsc/manufacturer?name=Apple
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchRecalls,
  getRecentRecalls,
  searchByManufacturer,
  getSafetyParameters
} from '@/lib/integrations/cpsc-recalls'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product = searchParams.get('product')
    const brand = searchParams.get('brand')
    const manufacturer = searchParams.get('manufacturer')
    const days = searchParams.get('days')
    const includeParams = searchParams.get('includeParams') === 'true'

    // Search by manufacturer
    if (manufacturer) {
      const recalls = await searchByManufacturer(manufacturer)
      return NextResponse.json({
        success: true,
        data: recalls,
        count: recalls.length,
        source: 'CPSC Recalls API',
        cost: '$0 - Free government API'
      })
    }

    // Get recent recalls
    if (days) {
      const recalls = await getRecentRecalls(parseInt(days))
      return NextResponse.json({
        success: true,
        data: recalls,
        count: recalls.length,
        source: 'CPSC Recalls API',
        cost: '$0 - Free government API'
      })
    }

    // Search by product
    if (product) {
      if (includeParams) {
        // Return Veritas Score parameters
        const parameters = await getSafetyParameters(product, brand || undefined)
        return NextResponse.json({
          success: true,
          data: parameters,
          source: 'CPSC Recalls API',
          cost: '$0 - Free government API'
        })
      } else {
        // Return full recall data
        const result = await searchRecalls(product, brand || undefined)
        return NextResponse.json({
          success: true,
          data: result,
          source: 'CPSC Recalls API',
          cost: '$0 - Free government API'
        })
      }
    }

    // No parameters provided
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
      usage: {
        searchByProduct: '/api/integrations/cpsc?product=iPhone&brand=Apple',
        searchByManufacturer: '/api/integrations/cpsc?manufacturer=Apple',
        getRecent: '/api/integrations/cpsc?days=30',
        getParameters: '/api/integrations/cpsc?product=iPhone&includeParams=true'
      }
    }, { status: 400 })

  } catch (error) {
    console.error('CPSC API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch CPSC data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
