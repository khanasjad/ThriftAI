import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    logger.info('📊 Fetching categories')

    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { category: 'asc' }
    })

    const categoryList = categories.map(c => c.category)

    logger.info('✅ Categories fetched', { count: categoryList.length })

    return NextResponse.json({
      success: true,
      categories: categoryList,
      count: categoryList.length
    })

  } catch (error) {
    logger.error('❌ Categories fetch error', { error })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        categories: []
      },
      { status: 500 }
    )
  }
}
