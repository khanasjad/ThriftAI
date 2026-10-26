/**
 * Pilot Applications API
 *
 * POST /api/v1/pilot-applications
 *
 * Handles pilot program application submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendPilotConfirmationEmail, sendPilotAdminNotification } from '@/lib/email/resend'
import { z } from 'zod'
import { fail, rateLimit } from '@/lib/veritas/http'
import { requireApiRole } from '@/lib/veritas/authz'

// Request validation schema
const pilotApplicationSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  productCount: z.string().optional(),
  reviewCount: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
})

/**
 * POST /api/v1/pilot-applications
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  if (!(await rateLimit('pilot', 5, 60 * 60_000))) return fail(429, 'Too many applications from this network. Try again later.')

  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = pilotApplicationSchema.parse(body)

    logger.info('Pilot application received', {
      companyName: validatedData.companyName,
      email: validatedData.email
    })

    // Check if email already exists
    const existingApplication = await prisma.pilotApplication.findUnique({
      where: { email: validatedData.email }
    })

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application already exists',
          message: 'An application with this email already exists. Please check your inbox or contact us at pilot@veritasai.com'
        },
        { status: 409 }
      )
    }

    // Create pilot application in database
    const application = await prisma.pilotApplication.create({
      data: {
        companyName: validatedData.companyName,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        productCount: validatedData.productCount || null,
        reviewCount: validatedData.reviewCount || null,
        website: validatedData.website || null,
        phone: validatedData.phone || null,
        status: 'pending',
      }
    })

    logger.info('Pilot application created', {
      id: application.id,
      companyName: application.companyName,
      email: application.email
    })

    // Send emails in parallel
    const emailPromises = []

    // Send confirmation email to applicant
    if (process.env.RESEND_API_KEY) {
      emailPromises.push(
        sendPilotConfirmationEmail({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          companyName: validatedData.companyName,
        }).catch(error => {
          logger.error('Failed to send confirmation email', {
            error: error instanceof Error ? error.message : String(error),
            email: validatedData.email
          })
          // Don't fail the request if email fails
        })
      )

      // Send notification email to admin
      emailPromises.push(
        sendPilotAdminNotification({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          companyName: validatedData.companyName,
          productCount: validatedData.productCount,
          reviewCount: validatedData.reviewCount,
        }).catch(error => {
          logger.error('Failed to send admin notification email', {
            error: error instanceof Error ? error.message : String(error)
          })
          // Don't fail the request if email fails
        })
      )
    } else {
      logger.warn('RESEND_API_KEY not configured - skipping email notifications')
    }

    await Promise.allSettled(emailPromises)

    const response = {
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        companyName: application.companyName,
        status: application.status,
      },
      metadata: {
        processingTime: Date.now() - startTime
      }
    }

    logger.info('Pilot application processed successfully', {
      id: application.id,
      emailsSent: process.env.RESEND_API_KEY ? true : false,
      processingTime: response.metadata.processingTime
    })

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    logger.error('Pilot application failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application already exists',
          message: 'An application with this email already exists'
        },
        { status: 409 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Application submission failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/pilot-applications — admin list. Contains applicants' personal data: admins only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN'])
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const where = status ? { status } : {}

    const [applications, total] = await Promise.all([
      prisma.pilotApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.pilotApplication.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    logger.error('Failed to fetch pilot applications', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch applications'
      },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
