import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find product by ID
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        veritasScore: true,
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        },
        reviews: {
          select: {
            rating: true,
            content: true,
            createdAt: true,
            buyer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse imageUrl JSON string into array for carousel
    let images: string[] = []
    if (product.imageUrl) {
      try {
        const parsed = JSON.parse(product.imageUrl)
        images = Array.isArray(parsed) ? parsed : [product.imageUrl]
      } catch {
        // If parsing fails, treat as single image
        images = [product.imageUrl]
      }
    }

    // Transform the product data
    const transformedProduct = {
      ...product,
      images,
      reviews: product.reviews.map(review => ({
        rating: review.rating,
        comment: review.content,
        date: review.createdAt.toISOString().split('T')[0],
        userName: review.buyer
          ? `${review.buyer.firstName} ${review.buyer.lastName?.charAt(0)}.`
          : 'Anonymous'
      })),
      rating: product.rating || 0,
      reviewCount: product.reviews.length,
      veritasScore: product.veritasScore
        ? {
            overallScore: Number(product.veritasScore.overallScore),
            confidence: Number(product.veritasScore.confidence),
            breakdown: product.veritasScore.breakdown as Record<string, number> || {}
          }
        : null
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    )
  }
}
