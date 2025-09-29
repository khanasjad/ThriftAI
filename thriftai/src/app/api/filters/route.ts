import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationService } from '@/lib/services/configurationService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // Get database-driven filter options
    const [
      categories,
      categoryDisplayNames,
      allProducts,
      brands,
      conditions,
      sizes
    ] = await Promise.all([
      ConfigurationService.getAllActiveCategories(),
      ConfigurationService.getCategoryDisplayNames(),
      prisma.product.findMany({
        where: { isAvailable: true },
        select: {
          category: true,
          brand: true,
          condition: true,
          size: true,
          price: true
        }
      }),
      prisma.product.groupBy({
        by: ['brand'],
        where: {
          isAvailable: true,
          brand: { not: null }
        },
        _count: {
          brand: true
        },
        orderBy: {
          _count: {
            brand: 'desc'
          }
        }
      }),
      prisma.product.groupBy({
        by: ['condition'],
        where: {
          isAvailable: true,
          condition: { not: null }
        },
        _count: {
          condition: true
        }
      }),
      prisma.product.groupBy({
        by: ['size'],
        where: {
          isAvailable: true,
          size: { not: null }
        },
        _count: {
          size: true
        }
      })
    ])

    // Build category options with counts
    const categoryStats = allProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categoryOptions = categories.map(category => ({
      value: category,
      label: categoryDisplayNames.get(category) || category,
      count: categoryStats[category] || 0
    })).filter(cat => cat.count > 0)

    // Build brand options
    const brandOptions = brands
      .filter(b => b.brand)
      .map(b => ({
        value: b.brand!,
        label: b.brand!,
        count: b._count.brand
      }))

    // Build condition options
    const conditionOptions = conditions
      .filter(c => c.condition)
      .map(c => ({
        value: c.condition!,
        label: c.condition!,
        count: c._count.condition
      }))

    // Build size options
    const sizeOptions = sizes
      .filter(s => s.size)
      .map(s => ({
        value: s.size!,
        label: s.size!,
        count: s._count.size
      }))

    // Calculate price range
    const prices = allProducts.map(p => p.price)
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }

    // If there's a search query, get relevant categories for better filtering
    let relevantCategories: string[] = []
    if (query) {
      try {
        relevantCategories = await ConfigurationService.getRelevantCategoriesForIntent(query)
      } catch (error) {
        console.warn('Failed to get relevant categories for query:', query, error)
      }
    }

    const filterOptions = {
      categories: categoryOptions,
      brands: brandOptions.slice(0, 20), // Limit to top 20 brands
      conditions: conditionOptions,
      sizes: sizeOptions.slice(0, 15), // Limit to top 15 sizes
      priceRange,
      relevantCategories: relevantCategories.length > 0 ? relevantCategories : categories.slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      filters: filterOptions,
      metadata: {
        totalProducts: allProducts.length,
        totalCategories: categoryOptions.length,
        totalBrands: brandOptions.length,
        query: query || null,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Filter options API error:', error)

    // Return fallback filter options
    return NextResponse.json({
      success: false,
      error: 'Failed to load filter options',
      filters: {
        categories: [
          { value: 'CLOTHING', label: 'Clothing & Apparel', count: 0 },
          { value: 'SHOES', label: 'Footwear & Shoes', count: 0 },
          { value: 'ELECTRONICS', label: 'Electronics & Gadgets', count: 0 },
          { value: 'ACCESSORIES', label: 'Accessories & Jewelry', count: 0 }
        ],
        brands: [],
        conditions: [
          { value: 'New', label: 'New', count: 0 },
          { value: 'Excellent', label: 'Excellent', count: 0 },
          { value: 'Good', label: 'Good', count: 0 },
          { value: 'Fair', label: 'Fair', count: 0 }
        ],
        sizes: [],
        priceRange: { min: 0, max: 1000 },
        relevantCategories: ['CLOTHING', 'SHOES', 'ELECTRONICS', 'ACCESSORIES']
      },
      metadata: {
        totalProducts: 0,
        totalCategories: 0,
        totalBrands: 0,
        query: null,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// POST method for more complex filter requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, categories, brands, priceRange } = body

    // Get configuration-enhanced filter options based on current selections
    const [
      allCategories,
      categoryDisplayNames,
      relevantCategories,
      excludedCategories
    ] = await Promise.all([
      ConfigurationService.getAllActiveCategories(),
      ConfigurationService.getCategoryDisplayNames(),
      query ? ConfigurationService.getRelevantCategoriesForIntent(query) : [],
      query ? ConfigurationService.getExcludedCategoriesForIntent(query) : []
    ])

    // Build dynamic where clause based on current filters
    const where: any = {
      isAvailable: true
    }

    if (categories && categories.length > 0) {
      where.category = { in: categories }
    }

    if (brands && brands.length > 0) {
      where.brand = { in: brands }
    }

    if (priceRange) {
      where.price = {
        gte: priceRange.min || 0,
        lte: priceRange.max || 10000
      }
    }

    // Get filtered products
    const products = await prisma.product.findMany({
      where,
      select: {
        category: true,
        brand: true,
        condition: true,
        size: true,
        price: true
      }
    })

    // Recalculate available options based on current filters
    const availableCategories = [...new Set(products.map(p => p.category))]
    const availableBrands = [...new Set(products.map(p => p.brand).filter(Boolean))]
    const availableConditions = [...new Set(products.map(p => p.condition).filter(Boolean))]
    const availableSizes = [...new Set(products.map(p => p.size).filter(Boolean))]

    const updatedFilters = {
      categories: availableCategories.map(cat => ({
        value: cat,
        label: categoryDisplayNames.get(cat) || cat,
        count: products.filter(p => p.category === cat).length,
        relevant: relevantCategories.includes(cat),
        excluded: excludedCategories.includes(cat)
      })),
      brands: availableBrands.map(brand => ({
        value: brand,
        label: brand,
        count: products.filter(p => p.brand === brand).length
      })),
      conditions: availableConditions.map(condition => ({
        value: condition,
        label: condition,
        count: products.filter(p => p.condition === condition).length
      })),
      sizes: availableSizes.map(size => ({
        value: size,
        label: size,
        count: products.filter(p => p.size === size).length
      })),
      priceRange: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price))
      }
    }

    return NextResponse.json({
      success: true,
      filters: updatedFilters,
      metadata: {
        totalProducts: products.length,
        appliedFilters: { query, categories, brands, priceRange },
        relevantCategories,
        excludedCategories,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dynamic filter API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update filter options'
    }, { status: 500 })
  }
}