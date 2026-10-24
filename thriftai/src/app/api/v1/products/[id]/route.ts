/**
 * Single Product API
 *
 * GET /api/v1/products/:id - Get detailed product information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch product with all related data
    const product = await prisma.clothingProduct.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            reputationScore: true,
            sustainabilityRating: true,
            website: true,
          },
        },
        productScore: {
          include: {
            factors: true,
            evidenceTags: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            title: true,
            text: true,
            fitRating: true,
            qualityRating: true,
            comfortRating: true,
            styleRating: true,
            valueRating: true,
            purchasedSize: true,
            height: true,
            weight: true,
            bodyType: true,
            fitFeedback: true,
            wearDuration: true,
            qualityIssues: true,
            isVerifiedPurchase: true,
            helpfulCount: true,
            createdAt: true,
          },
        },
        returns: {
          select: {
            reason: true,
            category: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            returns: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Calculate return rate
    const returnRate =
      product._count.reviews > 0
        ? Math.round((product._count.returns / product._count.reviews) * 100)
        : 0;

    // Group return reasons
    const returnReasons = product.returns.reduce((acc: any, ret) => {
      const reason = ret.reason || 'OTHER';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    // Calculate average ratings from reviews
    const avgRatings = product.reviews.reduce(
      (acc, review) => ({
        fit: acc.fit + (review.fitRating || 0),
        quality: acc.quality + (review.qualityRating || 0),
        comfort: acc.comfort + (review.comfortRating || 0),
        style: acc.style + (review.styleRating || 0),
        value: acc.value + (review.valueRating || 0),
      }),
      { fit: 0, quality: 0, comfort: 0, style: 0, value: 0 }
    );

    const reviewCount = product.reviews.length;
    if (reviewCount > 0) {
      avgRatings.fit = Math.round((avgRatings.fit / reviewCount) * 10) / 10;
      avgRatings.quality = Math.round((avgRatings.quality / reviewCount) * 10) / 10;
      avgRatings.comfort = Math.round((avgRatings.comfort / reviewCount) * 10) / 10;
      avgRatings.style = Math.round((avgRatings.style / reviewCount) * 10) / 10;
      avgRatings.value = Math.round((avgRatings.value / reviewCount) * 10) / 10;
    }

    // Transform data for frontend
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,

      // Pricing
      currentPrice: Number(product.currentPrice),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      currency: product.currency,
      discount: product.originalPrice
        ? Math.round((1 - Number(product.currentPrice) / Number(product.originalPrice)) * 100)
        : 0,

      // Product Details
      sku: product.sku,
      gender: product.gender,
      ageGroup: product.ageGroup,
      sizes: product.sizes,
      colors: product.colors,
      materials: product.materials,
      careInstructions: product.careInstructions,
      isAvailable: product.isAvailable,

      // Images
      images: product.images,
      primaryImageUrl: product.primaryImageUrl,

      // Quality Scores (5 Pillars)
      overallScore: product.productScore?.overall || 0,
      grade: product.productScore?.grade || 'N/A',
      fitScore: product.productScore?.fit || 0,
      qualityScore: product.productScore?.quality || 0,
      styleScore: product.productScore?.styleValue || 0,
      comfortScore: product.productScore?.comfort || 0,
      sustainabilityScore: product.productScore?.sustainability || 0,
      confidence: product.productScore?.confidence || 'LOW',

      // 27 Factor Scores
      factors: product.productScore?.factors || [],
      evidenceTags: product.productScore?.evidenceTags || [],

      // Metrics
      reviewCount: product._count.reviews,
      returnCount: product._count.returns,
      returnRate,
      returnReasons,
      avgRatings,

      // Reviews
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        text: review.text,
        fitRating: review.fitRating,
        qualityRating: review.qualityRating,
        comfortRating: review.comfortRating,
        styleRating: review.styleRating,
        valueRating: review.valueRating,
        purchasedSize: review.purchasedSize,
        height: review.height,
        weight: review.weight,
        bodyType: review.bodyType,
        fitFeedback: review.fitFeedback,
        wearDuration: review.wearDuration,
        qualityIssues: review.qualityIssues,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
      })),

      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error('❌ Failed to fetch product:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
