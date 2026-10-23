/**
 * List Tenants Script
 *
 * Lists all B2B tenants with their stats
 *
 * Usage:
 *   npx tsx scripts/b2b/list-tenants.ts [--detailed]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listTenants(detailed: boolean = false) {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (tenants.length === 0) {
      console.log('=í No tenants found\n')
      console.log('Create your first tenant:')
      console.log('  npx tsx scripts/b2b/create-tenant.ts "My Store" "api@mystore.com"')
      return
    }

    console.log(`\n=Ê Found ${tenants.length} tenant${tenants.length > 1 ? 's' : ''}\n`)
    console.log('')

    for (const tenant of tenants) {
      const status = tenant.isActive ? ' Active' : 'L Inactive'
      const planEmoji = {
        free: '<“',
        starter: '=€',
        professional: '=¼',
        enterprise: '<â'
      }[tenant.plan] || '=æ'

      console.log(`\n${planEmoji} ${tenant.name}`)
      console.log('')
      console.log(`  Status:         ${status}`)
      console.log(`  Email:          ${tenant.email}`)
      console.log(`  Plan:           ${tenant.plan}`)
      console.log(`  Tenant ID:      ${tenant.id}`)

      if (detailed) {
        console.log(`  API Key:        ${tenant.apiKey}`)
      } else {
        console.log(`  API Key:        ${tenant.apiKey.substring(0, 20)}...`)
      }

      console.log(`  Products:       ${tenant._count.products.toLocaleString()}`)
      console.log(`  API Calls:      ${tenant.totalApiCalls.toLocaleString()}`)
      console.log(`  Rate Limit:     ${tenant.rateLimit.toLocaleString()}/hour`)
      console.log(`  Created:        ${tenant.createdAt.toLocaleDateString()}`)

      if (tenant.lastApiCallAt) {
        console.log(`  Last API Call:  ${tenant.lastApiCallAt.toLocaleString()}`)
      }
    }

    console.log('\n')

    // Summary
    const totalProducts = tenants.reduce((sum, t) => sum + t._count.products, 0)
    const totalApiCalls = tenants.reduce((sum, t) => sum + t.totalApiCalls, 0)
    const activeTenants = tenants.filter(t => t.isActive).length

    console.log('\n=È SUMMARY')
    console.log('')
    console.log(`  Total Tenants:     ${tenants.length}`)
    console.log(`  Active Tenants:    ${activeTenants}`)
    console.log(`  Total Products:    ${totalProducts.toLocaleString()}`)
    console.log(`  Total API Calls:   ${totalApiCalls.toLocaleString()}`)
    console.log('\n')

  } catch (error) {
    console.error('L Failed to list tenants:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const detailed = args.includes('--detailed') || args.includes('-d')

listTenants(detailed)
