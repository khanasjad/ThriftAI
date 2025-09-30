import { NextRequest, NextResponse } from 'next/server'
import { MarketplaceAggregator } from '@/lib/services/marketplaceAggregator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, category, minPrice, maxPrice, sources } = body

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate sources if provided
    const validSources = ['thriftai', 'amazon', 'ebay', 'nike', 'adidas']
    if (sources && !Array.isArray(sources)) {
      return NextResponse.json(
        { error: 'Sources must be an array' },
        { status: 400 }
      )
    }

    if (sources && sources.some((s: string) => !validSources.includes(s))) {
      return NextResponse.json(
        { error: `Invalid source. Valid sources are: ${validSources.join(', ')}` },
        { status: 400 }
      )
    }

    // Create aggregator and search
    const aggregator = new MarketplaceAggregator()
    const results = await aggregator.searchAllMarketplaces({
      query,
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sources: sources || ['thriftai', 'amazon', 'ebay']
    })

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('Marketplace comparison error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compare marketplace prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sources = searchParams.get('sources')?.split(',')

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Create aggregator and search
    const aggregator = new MarketplaceAggregator()
    const results = await aggregator.searchAllMarketplaces({
      query,
      category: category || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sources: sources || ['thriftai', 'amazon', 'ebay']
    })

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('Marketplace comparison error:', error)
    return NextResponse.json(
      {
        error: 'Failed to compare marketplace prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}