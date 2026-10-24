/**
 * Products API
 *
 * GET /api/v1/products - List all products with quality scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClothingCategory, ClothingGender } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const category = searchParams.get('category') as ClothingCategory | null;
    const gender = searchParams.get('gender') as ClothingGender | null;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : null;
    const maxScore = searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : null;
    const brandId = searchParams.get('brandId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'score'; // score, name, price, newest

    // Build where clause
    const where: any = {
      isAvailable: true,
    };

    if (category) {
      where.category = category;
    }

    if (gender) {
      where.gender = gender;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    // Fetch products with scores
    const [products, total] = await Promise.all([
      prisma.clothingProduct.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              reputationScore: true,
              sustainabilityRating: true,
            },
          },
          productScore: true,
          _count: {
            select: {
              reviews: true,
              returns: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy:
          sortBy === 'score'
            ? { productScore: { overall: 'desc' } }
            : sortBy === 'price'
            ? { currentPrice: 'asc' }
            : sortBy === 'newest'
            ? { createdAt: 'desc' }
            : { name: 'asc' },
      }),
      prisma.clothingProduct.count({ where }),
    ]);

    // Filter by score range if specified
    let filteredProducts = products;
    if (minScore !== null || maxScore !== null) {
      filteredProducts = products.filter((p) => {
        const score = p.productScore?.overall || 0;
        if (minScore !== null && score < minScore) return false;
        if (maxScore !== null && score > maxScore) return false;
        return true;
      });
    }

    // Transform data for frontend
    const transformedProducts = filteredProducts.map((product) => {
      // Calculate return rate
      const returnRate =
        product._count.reviews > 0
          ? Math.round((product._count.returns / product._count.reviews) * 100)
          : 0;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        currentPrice: Number(product.currentPrice),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        currency: product.currency,
        images: product.images,
        primaryImageUrl: product.primaryImageUrl,
        gender: product.gender,
        sizes: product.sizes,
        colors: product.colors,
        isAvailable: product.isAvailable,

        // Quality Scores
        overallScore: product.productScore?.overall || 0,
        grade: product.productScore?.grade || 'N/A',
        fitScore: product.productScore?.fit || 0,
        qualityScore: product.productScore?.quality || 0,
        styleScore: product.productScore?.styleValue || 0,
        comfortScore: product.productScore?.comfort || 0,
        sustainabilityScore: product.productScore?.sustainability || 0,
        confidence: product.productScore?.confidence || 'LOW',

        // Metrics
        reviewCount: product._count.reviews,
        returnCount: product._count.returns,
        returnRate,

        // Timestamps
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // Response
    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + filteredProducts.length < total,
      },
      filters: {
        category: category || 'all',
        gender: gender || 'all',
        minScore,
        maxScore,
        brandId,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
