/**
 * Barcode/UPC Lookup API Endpoint
 *
 * FREE - No authentication required
 *
 * Usage:
 * GET /api/integrations/barcode?code=5449000000996
 * GET /api/integrations/barcode?code=012345678905&validate=true
 * POST /api/integrations/barcode/batch (with JSON body of barcodes array)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  lookupBarcode,
  lookupBarcodes,
  validateBarcode,
  getCategoryFromBarcode
} from '@/lib/integrations/barcode-lookup'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const validate = searchParams.get('validate') === 'true'

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: code',
        usage: {
          lookup: '/api/integrations/barcode?code=5449000000996',
          validate: '/api/integrations/barcode?code=012345678905&validate=true'
        }
      }, { status: 400 })
    }

    // Validate only
    if (validate) {
      const validation = validateBarcode(code)
      const category = validation.valid ? getCategoryFromBarcode(code) : null

      return NextResponse.json({
        success: true,
        data: {
          barcode: code,
          validation,
          suggestedCategory: category
        },
        source: 'Barcode Validator',
        cost: '$0 - Free validation'
      })
    }

    // Lookup product
    const product = await lookupBarcode(code)

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        barcode: code,
        suggestion: 'Try validating the barcode first or search by product name'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: product,
      source: `Barcode Lookup (${product.source})`,
      cost: '$0 - Free lookup'
    })

  } catch (error) {
    console.error('Barcode API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to lookup barcode',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcodes } = body

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid barcodes array',
        usage: {
          example: {
            barcodes: ['5449000000996', '012345678905', '7613034626844']
          }
        }
      }, { status: 400 })
    }

    if (barcodes.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Too many barcodes (max 50 per request)',
        received: barcodes.length
      }, { status: 400 })
    }

    // Lookup all barcodes
    const results = await lookupBarcodes(barcodes)

    return NextResponse.json({
      success: true,
      data: {
        requested: barcodes.length,
        found: results.size,
        products: Object.fromEntries(results)
      },
      source: 'Barcode Batch Lookup',
      cost: '$0 - Free batch lookup'
    })

  } catch (error) {
    console.error('Barcode batch API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process batch barcode lookup',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
