/**
 * B10 gate: a fictional marketplace sends its three feeds; we check the whole ingest path.
 *   npm run ingest:gate [-- --keep]
 * 1. Writes sample feeds (CSV, the format pilots will send) to prisma/fixtures/sample-feeds/.
 * 2. Dry run writes nothing. 3. Real import: counts, bad rows reported with reasons.
 * 4. Re-sending the same files changes nothing. 5. Next day's catalog with 10 price changes → exactly 10 products changed.
 * 6. Imported products stay private (not on public pages). 7. Cleans up unless --keep.
 * Everything is fictional. Refuses to run in production.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../../src/lib/prisma'
import { parseCsv, toCsv } from '../../src/lib/veritas/ingest/csv'
import { ingest, type IngestReport } from '../../src/lib/veritas/ingest/run'
import { PUBLIC_PRODUCTS } from '../../src/lib/veritas/scope'

if (process.env.APP_ENV === 'production') {
  console.error('Refusing to run the ingest gate in production.')
  process.exit(1)
}

// Deterministic randomness
let seed = 4242
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

const TENANT = { slug: 'gate-larkspur-market', name: 'Larkspur Market (fictional)', email: 'gate@larkspur.example' }
const BRANDS = ['Fernwood Studio', 'Quill & Loom', 'Harbor Basics', 'Nimbus Denim', 'Oakline Apparel']
const SELLERS = [
  ['s-101', 'Bramble Outfitters'],
  ['s-102', 'Cobalt Closet'],
  ['s-103', 'Juniper Lane Shop'],
] as const
const TEES = ['Classic Crew T-Shirt', 'Relaxed V-Neck Tee', 'Oversized Boxy Tee', 'Longline Tee', 'Slim Fit Crew Tee']
const JEANS = ['Straight Leg Jeans', 'Wide Leg Jeans', 'Skinny Jeans', 'Slim Taper Jeans', 'Bootcut Jeans']
const COLOURS = ['Black', 'White', 'Navy', 'Heather Grey', 'Sage', 'Ecru', 'Mid Wash', 'Indigo Rinse']
const LINES = {
  small: ['Runs small, size up.', 'Way too tight, order one size up.'],
  tts: ['True to size, fits perfectly.', 'Ordered my usual size, fits great.'],
  large: ['Runs large, size down.', 'Very loose for my usual size.'],
  goodQ: ['Still looks new after 10 washes.', 'Thick fabric, solid stitching.', 'Soft and breathable.'],
  badQ: ['Shrank after the first wash.', 'Started pilling within weeks.', 'Seam came undone after a month.'],
}

function buildFeeds() {
  const catalog: Record<string, string | number>[] = []
  const reviews: Record<string, string | number>[] = []
  const returns: Record<string, string | number>[] = []
  for (let i = 1; i <= 200; i++) {
    const tee = i % 2 === 0
    const brand = pick(BRANDS)
    const title = `${pick(COLOURS)} ${tee ? pick(TEES) : pick(JEANS)}`
    const id = `LM-${String(i).padStart(4, '0')}`
    const price = tee ? int(12, 45) + 0.99 : int(39, 120) + 0.99
    const fit = pick(['small', 'tts', 'tts', 'large'] as const)
    const good = rand() > 0.35
    // A third of products are sold by two sellers (marketplace offers).
    const offers = rand() < 0.33 ? [SELLERS[0], SELLERS[1]] : [pick(SELLERS)]
    offers.forEach(([sid, sname], k) =>
      catalog.push({
        external_id: id,
        title,
        brand,
        category: tee ? 'Women > Tops > T-Shirts' : 'Men > Bottoms > Jeans',
        price: k === 0 ? price : Math.round((price * 1.06) * 100) / 100,
        currency: 'USD',
        url: `https://larkspur.example/p/${id}`,
        seller_id: sid,
        seller_name: sname,
        gender: tee ? 'women' : 'men',
        list_price: i % 17 === 0 ? Math.round(price * 1.6) : '',
        sizes: tee ? 'XS|S|M|L|XL' : '28|30|32|34|36',
        colors: '',
        materials: tee ? 'cotton:100' : 'cotton:98|elastane:2',
        image_url: '',
        care: 'Machine wash cold',
        fabric_gsm: tee ? int(120, 220) : int(280, 420),
        units_sold: int(80, 900),
      }),
    )
    for (let r = 0; r < 10; r++) {
      const lines = [pick(LINES[fit]), pick(good ? LINES.goodQ : LINES.badQ)]
      reviews.push({
        external_id: `${id}-R${r}`,
        product_external_id: id,
        rating: good ? int(4, 5) : int(1, 3),
        text: lines.join(' '),
        date: `2026-${String(int(1, 9)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
        verified: rand() > 0.2 ? 'yes' : 'no',
        size_bought: tee ? pick(['S', 'M', 'L']) : pick(['30', '32', '34']),
        fit_answer: fit === 'small' ? 'Runs small' : fit === 'large' ? 'Runs large' : 'True to size',
      })
    }
    for (let r = 0; r < int(2, 8); r++)
      returns.push({ external_id: `${id}-X${r}`, product_external_id: id, reason: fit === 'small' ? 'Too small' : fit === 'large' ? 'Too big' : pick(['Changed my mind', 'Poor quality', 'Colour not as pictured']), date: '2026-09-15' })
  }
  // Deliberately bad rows: the report must name each one.
  catalog.push({ external_id: 'LM-BAD-1', title: 'Floral Maxi Dress', brand: 'Harbor Basics', category: 'Dresses', price: 49.99, currency: 'USD', url: 'https://larkspur.example/p/bad1' })
  catalog.push({ external_id: 'LM-BAD-2', title: 'Black Crew Tee', brand: 'Harbor Basics', category: 'T-Shirts', price: 'free', currency: 'USD', url: 'https://larkspur.example/p/bad2' })
  catalog.push({ external_id: 'LM-BAD-3', title: 'Navy Tee', brand: 'Harbor Basics', category: 'T-Shirts', price: 19.99, currency: 'USD', url: 'not-a-url' })
  reviews.push({ external_id: 'R-BAD-1', product_external_id: 'LM-9999', rating: 5, text: 'Great', date: '2026-05-01' })
  reviews.push({ external_id: 'R-BAD-2', product_external_id: 'LM-0002', rating: 9, text: 'Rating out of range', date: '2026-05-01' })
  reviews.push({ external_id: 'R-BAD-3', product_external_id: 'LM-0002', rating: 4, text: 'Bad date', date: 'yesterday' })
  return { catalog, reviews, returns }
}

const CAT_COLS = ['external_id', 'title', 'brand', 'category', 'price', 'currency', 'url', 'seller_id', 'seller_name', 'gender', 'list_price', 'sizes', 'colors', 'materials', 'image_url', 'care', 'fabric_gsm', 'units_sold']
const REV_COLS = ['external_id', 'product_external_id', 'rating', 'text', 'date', 'verified', 'size_bought', 'fit_answer']
const RET_COLS = ['external_id', 'product_external_id', 'reason', 'date']

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const line = (r: IngestReport) => `rows ${r.rows} · accepted ${r.accepted} · rejected ${r.rejected} · created ${r.created} · updated ${r.updated} · unchanged ${r.unchanged} · products changed ${r.productsChanged}`

async function cleanup(tenantId: string) {
  await prisma.clothingProduct.deleteMany({ where: { tenantId } }) // reviews, returns, prices cascade
  await prisma.seller.deleteMany({ where: { tenantId } })
  await prisma.ingestRun.deleteMany({ where: { tenantId } })
  // Brands the gate's feed created (fictional), once they have no products left.
  await prisma.brand.deleteMany({ where: { source: 'larkspur-market-feed (fictional)', products: { none: {} } } })
}

async function main() {
  const feeds = buildFeeds()
  const dir = join(process.cwd(), 'prisma/fixtures/sample-feeds')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'catalog.csv'), toCsv(feeds.catalog, CAT_COLS))
  writeFileSync(join(dir, 'reviews.csv'), toCsv(feeds.reviews, REV_COLS))
  writeFileSync(join(dir, 'returns.csv'), toCsv(feeds.returns, RET_COLS))
  // Read back through the CSV parser, exactly as an upload would arrive.
  const csv = (f: string) => parseCsv(readFileSync(join(dir, f), 'utf8'))
  const [catalog, reviews, returns] = [csv('catalog.csv'), csv('reviews.csv'), csv('returns.csv')]
  console.log(`Sample feeds: ${catalog.length} catalog rows (200 products + 3 bad), ${reviews.length} reviews, ${returns.length} returns → ${dir}\n`)

  const tenant = await prisma.tenant.upsert({ where: { slug: TENANT.slug }, update: {}, create: { ...TENANT, plan: 'platform' } })
  await cleanup(tenant.id)
  const opts = { tenantId: tenant.id, source: 'larkspur-market-feed (fictional)', licence: 'pilot agreement (fictional)' }
  const day1 = new Date('2026-10-24T09:00:00Z')

  const dry = await ingest({ ...opts, kind: 'catalog', rows: catalog, dryRun: true, now: day1 })
  console.log(`dry run catalog: ${line(dry)}`)
  check('dry run writes no products', (await prisma.clothingProduct.count({ where: { tenantId: tenant.id } })) === 0)
  check('dry run still reports bad rows', dry.rejected === 3, dry.errors.map((e) => `row ${e.row}: ${e.message}`).join(' | '))

  const t0 = Date.now()
  const c1 = await ingest({ ...opts, kind: 'catalog', rows: catalog, now: day1 })
  const r1 = await ingest({ ...opts, kind: 'reviews', rows: reviews, now: day1 })
  const x1 = await ingest({ ...opts, kind: 'returns', rows: returns, now: day1 })
  console.log(`\ncatalog: ${line(c1)}\nreviews: ${line(r1)}\nreturns: ${line(x1)}\n(took ${((Date.now() - t0) / 1000).toFixed(1)} s)`)
  check('200 products created', c1.created === 200)
  check('3 bad catalog rows rejected with reasons', c1.rejected === 3 && c1.errors.every((e) => e.message.length > 5), c1.errors.map((e) => `${e.field}: ${e.message}`).join(' | '))
  check('2,000 reviews created, 3 bad ones rejected', r1.created === 2000 && r1.rejected === 3, r1.errors.map((e) => `${e.field}: ${e.message}`).join(' | '))
  check('returns created', x1.created === returns.length && x1.rejected === 0)
  const snaps = await prisma.priceSnapshot.count({ where: { product: { tenantId: tenant.id } } })
  check('one price snapshot per offer', snaps === catalog.length - 3, `${snaps} snapshots`)
  const p2 = await prisma.clothingProduct.findFirst({ where: { tenantId: tenant.id, externalId: 'LM-0002' }, select: { category: true, gender: true, colors: true, fitType: true, silhouette: true, elastanePct: true, unitsSold: true } })
  check('vendor values normalised (category, gender, colour from title)', !!p2 && p2.category === 'TOPS' && p2.gender === 'WOMENS' && p2.colors.length === 1, JSON.stringify(p2))
  const flagged = await prisma.clothingReview.count({ where: { product: { tenantId: tenant.id }, fitsAs: { not: null } } })
  check('fit answers mapped', flagged === 2000)

  const c2 = await ingest({ ...opts, kind: 'catalog', rows: catalog, now: day1 })
  const r2 = await ingest({ ...opts, kind: 'reviews', rows: reviews, now: day1 })
  const x2 = await ingest({ ...opts, kind: 'returns', rows: returns, now: day1 })
  check('re-sending the same files changes nothing', [c2, r2, x2].every((r) => r.created === 0 && r.updated === 0 && r.productsChanged === 0), [c2, r2, x2].map(line).join(' / '))

  // Next day: 10 products change price; everything else is identical.
  const day2 = new Date('2026-10-25T09:00:00Z')
  const changedIds = new Set(Array.from({ length: 10 }, (_, k) => `LM-${String(k * 7 + 3).padStart(4, '0')}`))
  const next = catalog.map((r) => (changedIds.has(r.external_id) ? { ...r, price: String(Math.round(Number(r.price) * 0.8 * 100) / 100) } : r))
  const c3 = await ingest({ ...opts, kind: 'catalog', rows: next, now: day2 })
  console.log(`day 2 catalog: ${line(c3)}`)
  check('next day: only the 10 re-priced products count as changed for re-rating', c3.updated === 10, `updated ${c3.updated}`)
  const snaps2 = await prisma.priceSnapshot.count({ where: { product: { tenantId: tenant.id } } })
  check('next day adds a snapshot per offer (price history builds up)', snaps2 === snaps * 2, `${snaps2} snapshots`)

  const leaked = await prisma.clothingProduct.count({ where: { AND: [PUBLIC_PRODUCTS, { tenantId: tenant.id }] } })
  check('imported products are private (not in the public catalog)', leaked === 0)

  if (process.argv.includes('--keep')) console.log(`\nKept tenant ${TENANT.slug} and its data.`)
  else {
    await cleanup(tenant.id)
    await prisma.tenant.delete({ where: { id: tenant.id } })
    console.log('\nCleaned up the gate tenant and its products, sellers and ingest runs.')
  }
  console.log(failures ? `\n${failures} check(s) failed.` : '\nB10 gate: all checks passed.')
  process.exit(failures ? 1 : 0)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
