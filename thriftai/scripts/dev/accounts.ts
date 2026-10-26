/**
 * Creates dev sign-in accounts: one admin, and one tenant + brand user per fictional brand.
 *   npm run seed:accounts
 * Passwords are generated and written to .veritas/dev-accounts.json (gitignored), never printed.
 * For the hosted dev database (DEV_TARGET=hosted) they go to .veritas/dev-accounts.hosted.json instead.
 * Refuses in production and on non-local databases. Re-running rotates the passwords.
 */
import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { createPrismaClient } from '@/lib/prisma'

function fail(msg: string): never {
  console.error(`✖ refused: ${msg}`)
  process.exit(1)
}

async function main() {
  if (process.env.APP_ENV === 'production') fail('APP_ENV=production. Dev accounts never go to production.')
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(process.env.DATABASE_URL ?? '') && process.env.ALLOW_HOSTED_DEV_DB !== '1') fail('DATABASE_URL is not a local database (for the hosted dev database use DEV_TARGET=hosted).')
  const prisma = createPrismaClient()
  const pw = () => randomBytes(12).toString('base64url')
  const accounts: { email: string; password: string; role: string; brand?: string }[] = []
  try {
    const adminPw = pw()
    await prisma.user.upsert({
      where: { email: 'admin@veritas.test' },
      create: { email: 'admin@veritas.test', firstName: 'Dev', lastName: 'Admin', role: 'ADMIN', passwordHash: await bcrypt.hash(adminPw, 10) },
      update: { role: 'ADMIN', tenantId: null, passwordHash: await bcrypt.hash(adminPw, 10) },
    })
    accounts.push({ email: 'admin@veritas.test', password: adminPw, role: 'ADMIN' })

    const brands = await prisma.brand.findMany({ where: { source: 'dev-fixture' }, orderBy: { name: 'asc' } })
    for (const b of brands) {
      const email = `${b.slug}@veritas.test`
      const tenant = await prisma.tenant.upsert({
        where: { slug: b.slug },
        create: { name: b.name, slug: b.slug, email, plan: 'pilot' },
        update: { name: b.name },
      })
      await prisma.brand.update({ where: { id: b.id }, data: { tenantId: tenant.id } })
      await prisma.clothingProduct.updateMany({ where: { brandId: b.id }, data: { tenantId: tenant.id } })
      const p = pw()
      await prisma.user.upsert({
        where: { email },
        create: { email, firstName: b.name, role: 'BRAND', tenantId: tenant.id, passwordHash: await bcrypt.hash(p, 10) },
        update: { role: 'BRAND', tenantId: tenant.id, passwordHash: await bcrypt.hash(p, 10) },
      })
      accounts.push({ email, password: p, role: 'BRAND', brand: b.name })
    }

    const dir = join(process.cwd(), '.veritas')
    mkdirSync(dir, { recursive: true })
    const name = process.env.DEV_TARGET === 'hosted' ? 'dev-accounts.hosted.json' : 'dev-accounts.json'
    const file = join(dir, name)
    writeFileSync(file, JSON.stringify({ note: 'Dev-only sign-in accounts for fictional brands. Re-run npm run seed:accounts to rotate.', accounts }, null, 2), { mode: 0o600 })
    console.log(`✓ ${accounts.length} accounts (1 admin, ${accounts.length - 1} brands). Emails and passwords: .veritas/${name}`)
    for (const a of accounts) console.log(`  ${a.role.padEnd(6)} ${a.email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()
