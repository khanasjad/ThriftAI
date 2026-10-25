/**
 * Onboard a pilot customer: organisation (tenant) + sign-in, optionally linked to a brand. Works in production.
 *   ORG_PASSWORD='…' npm run org:create -- --name "Larkspur Market" --slug larkspur --email ops@larkspur.com [--plan platform] [--brand "Harbor Basics"]
 *   (or --out ./org-password.txt to generate the password into a file, mode 600; it is never printed)
 * Then create their API key from the dashboard (Settings → API keys) or POST /api/v1/keys.
 */
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const PLANS = ['pilot', 'starter', 'growth', 'pro', 'platform']

async function main() {
  const name = arg('name')
  const email = arg('email')?.toLowerCase().trim()
  const slug = slugify(arg('slug') ?? name ?? '')
  const plan = arg('plan') ?? 'pilot'
  const brandName = arg('brand')
  const out = arg('out')
  if (!name || !email || !slug || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Usage: npm run org:create -- --name "<org>" --email <login email> [--slug s] [--plan pilot|starter|growth|pro|platform] [--brand "<brand>"] [--out file]')
  if (!PLANS.includes(plan)) throw new Error(`--plan must be one of ${PLANS.join(', ')}`)
  if (email.endsWith('@veritas.test')) throw new Error('@veritas.test is reserved for dev accounts.')
  let password = process.env.ORG_PASSWORD
  if (password && password.length < 14) throw new Error('ORG_PASSWORD must be at least 14 characters.')
  if (!password) {
    if (!out) throw new Error('Set ORG_PASSWORD, or pass --out <file> to write a generated password to a file.')
    password = randomBytes(18).toString('base64url')
  }

  const tenant = await prisma.tenant.upsert({ where: { slug }, update: { name, plan }, create: { slug, name, email, plan } })
  if (brandName) {
    const bslug = slugify(brandName)
    await prisma.brand.upsert({ where: { slug: bslug }, update: { tenantId: tenant.id }, create: { slug: bslug, name: brandName, tenantId: tenant.id, source: `onboarding:${slug}` } })
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.upsert({ where: { email }, update: { passwordHash, role: 'BRAND', tenantId: tenant.id }, create: { email, passwordHash, role: 'BRAND', tenantId: tenant.id } })

  console.log(`Organisation "${name}" (${slug}, plan ${plan}) ready; sign-in ${email}${brandName ? `; brand "${brandName}" linked` : ''}.`)
  if (out && !process.env.ORG_PASSWORD) {
    writeFileSync(out, `${email}\n${password}\n`, { mode: 0o600 })
    console.log(`Generated password written to ${out} (readable only by you). Send it securely, then delete the file.`)
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
