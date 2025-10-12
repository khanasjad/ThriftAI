/**
 * iFixit Repairability API Endpoint
 *
 * FREE for non-commercial use
 *
 * Usage:
 * GET /api/integrations/ifixit?product=iPhone 15 Pro&brand=Apple
 * GET /api/integrations/ifixit?product=MacBook Pro&includeParams=true
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchDevice,
  getRepairGuides,
  getRepairabilityData,
  getSustainabilityParameters
} from '@/lib/integrations/ifixit'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product = searchParams.get('product')
    const brand = searchParams.get('brand')
    const includeParams = searchParams.get('includeParams') === 'true'
    const searchOnly = searchParams.get('searchOnly') === 'true'

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: product',
        usage: {
          search: '/api/integrations/ifixit?product=iPhone 15',
          fullData: '/api/integrations/ifixit?product=iPhone 15&brand=Apple',
          parameters: '/api/integrations/ifixit?product=iPhone 15&includeParams=true'
        }
      }, { status: 400 })
    }

    // Search only - return matching devices
    if (searchOnly) {
      const query = brand ? `${brand} ${product}` : product
      const devices = await searchDevice(query)
      return NextResponse.json({
        success: true,
        data: devices,
        count: devices.length,
        source: 'iFixit API',
        cost: '$0 - Free for non-commercial use'
      })
    }

    // Return Veritas Score parameters
    if (includeParams) {
      const parameters = await getSustainabilityParameters(product, brand || undefined)
      return NextResponse.json({
        success: true,
        data: parameters,
        source: 'iFixit API',
        cost: '$0 - Free for non-commercial use'
      })
    }

    // Return full repairability data
    const data = await getRepairabilityData(product, brand || undefined)
    return NextResponse.json({
      success: true,
      data,
      source: 'iFixit API',
      cost: '$0 - Free for non-commercial use'
    })

  } catch (error) {
    console.error('iFixit API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch iFixit data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
