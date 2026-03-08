import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: id,
          status: 'APPROVED'
        },
        include: {
          buyer: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          photos: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({
        where: {
          productId: id,
          status: 'APPROVED'
        }
      })
    ])

    // Calculate rating distribution
    const allReviews = await prisma.review.findMany({
      where: {
        productId: id,
        status: 'APPROVED'
      },
      select: { rating: true }
    })

    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length
    }

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalReviews: allReviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution
      }
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      buyerId,
      title,
      content,
      rating,
      conditionRating,
      valueRating,
      sellerRating,
      shippingRating,
      isVerifiedPurchase = false
    } = body

    // Validate required fields
    if (!buyerId || !title || !rating) {
      return NextResponse.json(
        { error: 'Buyer ID, title, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if buyer exists
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      )
    }

    // Check if buyer already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        buyerId,
        productId: id
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        id: uuidv4(),
        buyerId,
        productId: id,
        title,
        content,
        rating,
        conditionRating,
        valueRating,
        sellerRating,
        shippingRating,
        isVerifiedPurchase,
        status: 'PENDING' // Reviews need moderation
      },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      review,
      message: 'Review submitted successfully and is pending moderation'
    }, { status: 201 })

  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}