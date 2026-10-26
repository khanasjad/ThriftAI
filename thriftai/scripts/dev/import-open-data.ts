/**
 * Real open data in development (B20): "Women's E-Commerce Clothing Reviews", public domain (CC0), via OpenML #43673.
 * 23,486 real reviews from an anonymised online retailer (the company name is replaced with "retailer" in the data).
 * Imported into its own PRIVATE tenant, so the fictional demo, search and tests are untouched.
 *   npm run open-data -- --download      # fetch the file into .veritas/real-data/wecr/ (once)
 *   npm run open-data -- --dry-run       # parse and count, write nothing
 *   npm run open-data                    # import (idempotent: re-running changes nothing)
 * Then rate: npm run rate -- --tenant open-data-cc0 --mode full --yes
 * The source has no prices, photos, sizes or dates: prices stay empty (value factors get no evidence), review
 * dates are set to the dataset's publication date (2018-02-03, "on or before"), reviews without text are skipped.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../src/lib/prisma'
import { env } from '../../src/lib/veritas/env'
import { scanInjection } from '../../src/lib/veritas/harness/guardrails'

const URL_ARFF = 'https://openml.org/data/v1/download/22102498/Womens-E-Commerce-Clothing-Reviews.arff'
const DIR = join(process.cwd(), '.veritas/real-data/wecr')
const FILE = join(DIR, 'reviews.arff')
const SOURCE = "open-data: Women's E-Commerce Clothing Reviews (OpenML 43673)"
const LICENCE = 'CC0-1.0'
const TENANT = { slug: 'open-data-cc0', name: 'Open data (CC0)', email: 'open-data@veritas.invalid' }
const BRAND = { slug: 'anonymised-retailer-open-data', name: 'Anonymised retailer (open data)' }
const PUBLISHED = new Date('2018-02-03T00:00:00Z')
const MIN_REVIEWS = 10
/** Source class → what we score. Blouses aren't always button-ups: kept as shirts with silhouette "blouse". */
const CLASSES: Record<string, { category: 'TOPS' | 'BOTTOMS'; subcategory: string; silhouette: string; label: string }> = {
  Knits: { category: 'TOPS', subcategory: 'tee', silhouette: 'knit-top', label: 'Knit top' },
  Blouses: { category: 'TOPS', subcategory: 'shirt', silhouette: 'blouse', label: 'Blouse' },
  Jeans: { category: 'BOTTOMS', subcategory: 'jeans', silhouette: 'jean', label: 'Jeans' },
}

/** One ARFF data line: comma-separated, strings in single quotes with backslash escapes, "?" = missing. */
export function parseArffLine(line: string): (string | null)[] {
  const out: (string | null)[] = []
  let i = 0
  while (i <= line.length) {
    while (line[i] === ' ') i++
    if (line[i] === "'") {
      let s = ''
      i++
      while (i < line.length && line[i] !== "'") {
        if (line[i] === '\\' && i + 1 < line.length) i++
        s += line[i++]
      }
      i++ // closing quote
      out.push(s)
      while (i < line.length && line[i] !== ',') i++
    } else {
      const j = line.indexOf(',', i)
      const raw = (j === -1 ? line.slice(i) : line.slice(i, j)).trim()
      out.push(raw === '?' ? null : raw)
      i = j === -1 ? line.length : j
    }
    i++ // comma
  }
  return out
}

type Row = { clothingId: string; title: string | null; text: string | null; rating: number; helpful: number; cls: string }

function readRows(): Row[] {
  const text = readFileSync(FILE, 'utf8')
  const data = text.slice(text.toLowerCase().indexOf('@data') + 5)
  const rows: Row[] = []
  for (const line of data.split('\n')) {
    if (!line.trim()) continue
    const f = parseArffLine(line)
    if (f.length !== 11) continue
    // index, Clothing ID, Age, Title, Review Text, Rating, Recommended IND, Positive Feedback Count, Division, Department, Class
    const rating = Number(f[5])
    if (!f[1] || !Number.isInteger(rating) || rating < 1 || rating > 5) continue
    rows.push({ clothingId: f[1], title: f[3]?.trim() || null, text: f[4]?.trim() || null, rating, helpful: Number(f[7]) || 0, cls: f[10] ?? '' })
  }
  return rows
}

async function main() {
  if (env().APP_ENV === 'production') throw new Error('Open-data import is for development only (CLAUDE.md environments).')
  if (process.argv.includes('--download')) {
    mkdirSync(DIR, { recursive: true })
    const res = await fetch(URL_ARFF)
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    writeFileSync(FILE, Buffer.from(await res.arrayBuffer()))
    writeFileSync(join(DIR, 'SOURCE.txt'), `${SOURCE}\nLicence: ${LICENCE} (public domain)\nURL: ${URL_ARFF}\nDownloaded: ${new Date().toISOString()}\n`)
    console.log(`Downloaded to ${FILE.replace(process.cwd() + '/', '')}`)
  }
  if (!existsSync(FILE)) throw new Error('No data file yet: run with --download first.')

  const rows = readRows().filter((r) => CLASSES[r.cls])
  const byProduct = new Map<string, Row[]>()
  for (const r of rows) byProduct.set(`${r.cls}|${r.clothingId}`, [...(byProduct.get(`${r.cls}|${r.clothingId}`) ?? []), r])
  const products = [...byProduct].filter(([, rs]) => rs.length >= MIN_REVIEWS)
  const withText = products.reduce((s, [, rs]) => s + rs.filter((r) => r.text).length, 0)
  const total = products.reduce((s, [, rs]) => s + rs.length, 0)
  console.log(`${products.length} products with ≥ ${MIN_REVIEWS} reviews · ${total} reviews (${withText} with text; the rest have only a star rating and are skipped)`)
  for (const cls of Object.keys(CLASSES)) console.log(`  ${CLASSES[cls].label}: ${products.filter(([k]) => k.startsWith(`${cls}|`)).length} products`)
  if (process.argv.includes('--dry-run')) return console.log('Dry run: nothing written.')

  const tenant = await prisma.tenant.upsert({ where: { slug: TENANT.slug }, update: {}, create: { ...TENANT, plan: 'pilot', settings: { source: SOURCE, licence: LICENCE } } })
  const brand = await prisma.brand.upsert({ where: { slug: BRAND.slug }, update: {}, create: { ...BRAND, tenantId: tenant.id, source: SOURCE, licence: LICENCE } })

  let created = 0, unchanged = 0, reviewsAdded = 0, flagged = 0
  for (const [key, rs] of products) {
    const [cls, id] = key.split('|')
    const c = CLASSES[cls]
    const externalId = `wecr-${cls.toLowerCase()}-${id}`
    const slug = `open-data-${c.label.toLowerCase().replace(/\s+/g, '-')}-${id}`
    const existed = await prisma.clothingProduct.findUnique({ where: { tenantId_externalId: { tenantId: tenant.id, externalId } }, select: { id: true } })
    const product = await prisma.clothingProduct.upsert({
      where: { tenantId_externalId: { tenantId: tenant.id, externalId } },
      update: {},
      create: {
        tenantId: tenant.id,
        isPrivate: true,
        externalId,
        brandId: brand.id,
        slug,
        sku: `${TENANT.slug}:${externalId}`,
        name: `${c.label} #${id}`,
        category: c.category,
        subcategory: c.subcategory,
        silhouette: c.silhouette,
        gender: 'WOMENS',
        description: 'Real customer reviews from an anonymised online retailer (public-domain dataset). The source has no price, photo, sizes or materials.',
        currentPrice: null,
        materials: {},
        source: SOURCE,
        licence: LICENCE,
      },
    })
    if (!existed) created++
    else unchanged++
    const data = rs
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.text)
      .map(({ r, i }) => {
        const injectionFlag = scanInjection(`${r.title ?? ''}\n${r.text}`).flagged
        if (injectionFlag) flagged++
        return {
          productId: product.id,
          externalId: `${externalId}-r${i}`,
          title: r.title,
          content: r.text!,
          rating: r.rating,
          language: 'en',
          helpfulVotes: r.helpful,
          reviewDate: PUBLISHED,
          injectionFlag,
          source: SOURCE,
          licence: LICENCE,
        }
      })
    const res = await prisma.clothingReview.createMany({ data, skipDuplicates: true })
    reviewsAdded += res.count
  }
  // Re-check stored flags against the current guardrails (rules improve; re-running the import keeps flags in sync).
  const stored = await prisma.clothingReview.findMany({ where: { product: { tenantId: tenant.id } }, select: { id: true, title: true, content: true, injectionFlag: true } })
  const fix = stored.filter((r) => scanInjection(`${r.title ?? ''}\n${r.content}`).flagged !== r.injectionFlag)
  for (const r of fix) await prisma.clothingReview.update({ where: { id: r.id }, data: { injectionFlag: !r.injectionFlag } })
  if (fix.length) console.log(`Re-checked injection flags: ${fix.length} updated to the current rules.`)
  flagged = stored.filter((r) => (fix.includes(r) ? !r.injectionFlag : r.injectionFlag)).length
  console.log(`\nTenant "${TENANT.name}" (${TENANT.slug}, private): ${created} products created, ${unchanged} already there · ${reviewsAdded} reviews added · ${flagged} in the source look like prompt injection (flagged, down-weighted when rating)`)
  console.log(`Next: npm run rate -- --tenant ${TENANT.slug} --product <slug> --mode full --yes   (then all)`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
