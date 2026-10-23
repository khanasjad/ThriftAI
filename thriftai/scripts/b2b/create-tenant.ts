/**
 * Create Tenant Script
 *
 * Creates a new B2B tenant with API key
 *
 * Usage:
 *   npx tsx scripts/b2b/create-tenant.ts <name> <email> [plan] [isTest]
 *
 * Examples:
 *   npx tsx scripts/b2b/create-tenant.ts "Acme Store" "api@acme.com"
 *   npx tsx scripts/b2b/create-tenant.ts "Test Store" "test@example.com" "professional" true
 */

import { PrismaClient } from '@prisma/client'
import { generateApiKey } from '../../src/lib/middleware/apiAuth'

const prisma = new PrismaClient()

interface TenantOptions {
  name: string
  email: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  isTest?: boolean
  rateLimit?: number
}

// Plan limits
const PLAN_LIMITS = {
  free: {
    rateLimit: 1000,      // 1K requests/hour
    maxProducts: 100
  },
  starter: {
    rateLimit: 10000,     // 10K requests/hour
    maxProducts: 1000
  },
  professional: {
    rateLimit: 100000,    // 100K requests/hour
    maxProducts: 50000
  },
  enterprise: {
    rateLimit: 1000000,   // 1M requests/hour
    maxProducts: Number.MAX_SAFE_INTEGER
  }
}

async function createTenant(options: TenantOptions) {
  const { name, email, plan = 'free', isTest = false } = options

  try {
    // Check if email already exists
    const existing = await prisma.tenant.findUnique({
      where: { email }
    })

    if (existing) {
      console.error(`L Tenant with email ${email} already exists`)
      console.log('\nExisting tenant:')
      console.log(`  ID: ${existing.id}`)
      console.log(`  Name: ${existing.name}`)
      console.log(`  Plan: ${existing.plan}`)
      console.log(`  API Key: ${existing.apiKey}`)
      process.exit(1)
    }

    // Generate API key
    const apiKey = generateApiKey(isTest)

    // Get plan limits
    const limits = PLAN_LIMITS[plan]

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        apiKey,
        plan,
        rateLimit: options.rateLimit || limits.rateLimit,
        isActive: true,
        settings: {
          maxProducts: limits.maxProducts,
          scoring: {
            product_quality_weight: 0.30,
            seller_trust_weight: 0.25,
            market_value_weight: 0.20,
            sustainability_weight: 0.12,
            security_safety_weight: 0.05,
            user_experience_weight: 0.05,
            product_specification_weight: 0.13,
            company_performance_weight: 0.05
          }
        }
      }
    })

    console.log(' Tenant created successfully!\n')
    console.log('')
    console.log('=Ë TENANT DETAILS')
    console.log('\n')
    console.log(`  Tenant ID:     ${tenant.id}`)
    console.log(`  Name:          ${tenant.name}`)
    console.log(`  Email:         ${tenant.email}`)
    console.log(`  Plan:          ${tenant.plan}`)
    console.log(`  Rate Limit:    ${tenant.rateLimit.toLocaleString()} requests/hour`)
    console.log(`  Max Products:  ${limits.maxProducts === Number.MAX_SAFE_INTEGER ? 'Unlimited' : limits.maxProducts.toLocaleString()}`)
    console.log(`  Is Active:     ${tenant.isActive}`)
    console.log(`  Created:       ${tenant.createdAt.toISOString()}`)
    console.log('\n')
    console.log('= API KEY (SAVE THIS - IT WON\'T BE SHOWN AGAIN)')
    console.log('\n')
    console.log(`  ${tenant.apiKey}`)
    console.log('\n')
    console.log('=Ý QUICK START')
    console.log('\n')
    console.log('  Test the API:')
    console.log(`  curl -X POST http://localhost:3000/api/v1/search \\`)
    console.log(`    -H "x-api-key: ${tenant.apiKey}" \\`)
    console.log(`    -H "Content-Type: application/json" \\`)
    console.log(`    -d '{"query": "test", "limit": 10}'`)
    console.log('\n  Add products:')
    console.log(`  curl -X POST http://localhost:3000/api/v1/products/ingest \\`)
    console.log(`    -H "x-api-key: ${tenant.apiKey}" \\`)
    console.log(`    -H "Content-Type: application/json" \\`)
    console.log(`    -d '{"products": [{"name": "Test Product", "category": "Test", "price": 9.99}]}'`)
    console.log('\n\n')

  } catch (error) {
    console.error('L Failed to create tenant:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('Usage: npx tsx scripts/b2b/create-tenant.ts <name> <email> [plan] [isTest]')
  console.error('\nPlans: free, starter, professional, enterprise')
  console.error('isTest: true/false (generates test API key)')
  console.error('\nExamples:')
  console.error('  npx tsx scripts/b2b/create-tenant.ts "Acme Store" "api@acme.com"')
  console.error('  npx tsx scripts/b2b/create-tenant.ts "Test Store" "test@example.com" professional true')
  process.exit(1)
}

const [name, email, plan, isTest] = args

createTenant({
  name,
  email,
  plan: (plan as any) || 'free',
  isTest: isTest === 'true'
})
