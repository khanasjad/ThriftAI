import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {
      isAvailable: true
    }

    if (category) {
      where.category = category
    }

    const orderBy: any = { createdAt: 'desc' }

    if (featured === 'true') {
      // For featured products, we could add a featured field or order by some criteria
      orderBy.price = 'asc' // For now, show cheaper items as featured
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              businessName: true,
              rating: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.product.count({ where })
    ])

    // Parse imageUrl JSON strings into arrays for carousel
    const productsWithImages = products.map(product => {
      let images: string[] = []

      // Try to parse imageUrl as JSON array
      if (product.imageUrl) {
        try {
          const parsed = JSON.parse(product.imageUrl)
          images = Array.isArray(parsed) ? parsed : [product.imageUrl]
        } catch {
          // If parsing fails, treat as single image
          images = [product.imageUrl]
        }
      }

      return {
        ...product,
        images
      }
    })

    return NextResponse.json({
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}