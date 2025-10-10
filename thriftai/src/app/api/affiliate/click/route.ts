import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      productTitle,
      affiliateUrl,
      source,
      estimatedPrice
    } = body

    if (!productId || !affiliateUrl || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get session ID from cookies or generate new one
    let sessionId = request.cookies.get('sessionId')?.value
    if (!sessionId) {
      sessionId = uuidv4()
    }

    // Get user ID if authenticated (optional)
    const userId = request.cookies.get('userId')?.value

    // Track the click
    const affiliateClick = await prisma.affiliateClick.create({
      data: {
        userId: userId || null,
        sessionId,
        source: source.toUpperCase() as any,
        externalProductId: productId,
        productTitle: productTitle || '',
        affiliateUrl,
        referralCode: source,
        estimatedPrice: estimatedPrice || 0,
        clicked: true,
        clickedAt: new Date()
      }
    })

    console.log('✅ Affiliate click tracked:', {
      id: affiliateClick.id,
      productId,
      source
    })

    const response = NextResponse.json({
      success: true,
      clickId: affiliateClick.id
    })

    // Set session cookie if new
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response
  } catch (error: any) {
    console.error('❌ Failed to track affiliate click:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to track click' },
      { status: 500 }
    )
  }
}
