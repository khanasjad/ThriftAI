import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAffiliateUrl, getAffiliateSource } from '@/lib/affiliate'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const url = searchParams.get('url')
    const source = searchParams.get('source')
    const title = searchParams.get('title')
    const price = searchParams.get('price')

    if (!url || !source) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Generate affiliate URL with tracking parameters
    const affiliateUrl = generateAffiliateUrl(url, source)

    // Track the click
    try {
      await prisma.affiliateClick.create({
        data: {
          userId: userId || null,
          sessionId,
          source: source.toUpperCase() as any,
          externalProductId: productId || '',
          productTitle: title || '',
          affiliateUrl,
          referralCode: source,
          estimatedPrice: price ? parseFloat(price) : 0,
          clicked: true,
          clickedAt: new Date()
        }
      })

      console.log('✅ Affiliate click tracked and redirecting:', {
        productId,
        source,
        url: affiliateUrl
      })
    } catch (error) {
      console.error('⚠️ Failed to track click, but continuing redirect:', error)
    }

    // Redirect to affiliate URL
    const response = NextResponse.redirect(affiliateUrl, 302)

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
    console.error('❌ Affiliate redirect error:', error)
    
    // Fallback: redirect to original URL without tracking
    const url = new URL(request.url).searchParams.get('url')
    if (url) {
      return NextResponse.redirect(url, 302)
    }

    return NextResponse.json(
      { error: error.message || 'Redirect failed' },
      { status: 500 }
    )
  }
}
