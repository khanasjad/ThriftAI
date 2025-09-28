import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      country = 'US',
      preferences = {}
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Check if buyer email already exists
    const existingBuyer = await prisma.buyer.findUnique({
      where: { email }
    })

    if (existingBuyer) {
      return NextResponse.json(
        { error: 'Buyer account already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user and buyer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          id: uuidv4(),
          email,
          firstName,
          lastName,
          passwordHash
        }
      })

      // Create buyer profile
      const buyer = await tx.buyer.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          address,
          city,
          state,
          zipCode,
          country,

          // Preferences
          buyerType: preferences.buyerType || 'CASUAL',
          notificationFrequency: preferences.notificationFrequency || 'WEEKLY',
          receiveNewsletters: preferences.receiveNewsletters !== false,
          receiveSms: preferences.receiveSms === true,
          receiveDeals: preferences.receiveDeals !== false,
          maxBudget: preferences.maxBudget || 1000.0,
          minDiscountThreshold: preferences.minDiscountThreshold || 10.0,

          // Categories and preferences
          preferredCategories: preferences.categories || [],
          preferredBrands: preferences.brands || [],
          preferredSizes: preferences.sizes || []
        }
      })

      return { user, buyer }
    })

    // Remove sensitive data from response
    const response = {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName
      },
      buyer: {
        id: result.buyer.id,
        firstName: result.buyer.firstName,
        lastName: result.buyer.lastName,
        email: result.buyer.email,
        buyerType: result.buyer.buyerType,
        isActive: result.buyer.isActive
      }
    }

    return NextResponse.json({
      ...response,
      message: 'Registration successful'
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}