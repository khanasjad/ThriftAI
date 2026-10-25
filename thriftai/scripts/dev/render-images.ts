/**
 * Dev only: renders each fictional product as a 512×640 PNG (its illustration in its colour, with its known
 * pattern) into public/dev-images/, and points the product's primaryImageUrl at it. These stand in for vendor
 * photos so the vision agent can be tested and measured. Needs the dev server running (npm run dev).
 *   npm run dev:images
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { prisma } from '../../src/lib/prisma'

if (process.env.APP_ENV === 'production') {
  console.error('Refusing to run in production.')
  process.exit(1)
}

const BASE = process.env.DEV_BASE_URL ?? 'http://localhost:3000'

async function main() {
  const dir = join(process.cwd(), 'public/dev-images')
  mkdirSync(dir, { recursive: true })
  const products = await prisma.clothingProduct.findMany({ where: { source: 'dev-fixture' }, select: { id: true, slug: true }, orderBy: { slug: 'asc' } })
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 512, height: 640 } })
  for (const p of products) {
    await page.goto(`${BASE}/dev/image/${p.slug}`, { waitUntil: 'load' })
    // Hide the Next.js dev badge so it never appears in a product image.
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
    await page.locator('#shot').first().screenshot({ path: join(dir, `${p.slug}.png`) })
    await prisma.clothingProduct.update({ where: { id: p.id }, data: { primaryImageUrl: `/dev-images/${p.slug}.png`, images: [`/dev-images/${p.slug}.png`] } })
  }
  await browser.close()
  console.log(`Rendered ${products.length} images → public/dev-images/`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
