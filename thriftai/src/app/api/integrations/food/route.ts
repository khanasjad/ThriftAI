/**
 * Open Food Facts API Endpoint
 *
 * FREE - No authentication required
 *
 * Usage:
 * GET /api/integrations/food?product=Coca Cola
 * GET /api/integrations/food?barcode=5449000000996
 * GET /api/integrations/food?product=Organic Milk&includeParams=true
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchFoodProducts,
  getProductByBarcode,
  getFoodParameters
} from '@/lib/integrations/open-food-facts'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product = searchParams.get('product')
    const barcode = searchParams.get('barcode')
    const includeParams = searchParams.get('includeParams') === 'true'
    const searchOnly = searchParams.get('searchOnly') === 'true'

    // Get by barcode
    if (barcode) {
      const foodProduct = await getProductByBarcode(barcode)

      if (!foodProduct) {
        return NextResponse.json({
          success: false,
          error: 'Product not found',
          barcode
        }, { status: 404 })
      }

      if (includeParams) {
        const parameters = await getFoodParameters(foodProduct.product_name, barcode)
        return NextResponse.json({
          success: true,
          data: parameters,
          source: 'Open Food Facts',
          cost: '$0 - Free open database'
        })
      }

      return NextResponse.json({
        success: true,
        data: foodProduct,
        source: 'Open Food Facts',
        cost: '$0 - Free open database'
      })
    }

    // Search by product name
    if (product) {
      if (searchOnly) {
        const results = await searchFoodProducts(product)
        return NextResponse.json({
          success: true,
          data: results,
          count: results.length,
          source: 'Open Food Facts',
          cost: '$0 - Free open database'
        })
      }

      if (includeParams) {
        const parameters = await getFoodParameters(product)
        return NextResponse.json({
          success: true,
          data: parameters,
          source: 'Open Food Facts',
          cost: '$0 - Free open database'
        })
      }

      // Get full product data
      const results = await searchFoodProducts(product)
      const firstProduct = results[0] || null

      if (!firstProduct) {
        return NextResponse.json({
          success: false,
          error: 'No products found',
          query: product
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: firstProduct,
        source: 'Open Food Facts',
        cost: '$0 - Free open database'
      })
    }

    // No parameters provided
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters',
      usage: {
        searchByName: '/api/integrations/food?product=Coca Cola',
        searchByBarcode: '/api/integrations/food?barcode=5449000000996',
        getParameters: '/api/integrations/food?product=Coca Cola&includeParams=true',
        searchMultiple: '/api/integrations/food?product=Coca Cola&searchOnly=true'
      }
    }, { status: 400 })

  } catch (error) {
    console.error('Food API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch food data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
