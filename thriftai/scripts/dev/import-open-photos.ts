/**
 * Real photographed garments in development (B21): "Clothing Dataset for Second-Hand Fashion" (RISE / Wargön
 * Innovation, Zenodo 8386668), CC BY 4.0: real items photographed at a textile sorting facility and graded by
 * trained sorters (pilling, condition, stains, damage). No reviews, so no overall score; the photo is read by the
 * photo agent, pilling is real wear-resistance evidence, the rest is shown as facts.
 * Brand names in the source are never imported (CLAUDE.md: never name other companies).
 *   npm run open-photos -- --dry-run            # pick items from the downloaded archive, write nothing
 *   npm run open-photos -- [--per-kind 40]      # resize photos into public/open-images/secondhand/ and import
 * Needs .veritas/real-data/circular/circular_fashion_v1.tar.gz (2.3 GB, MD5 bdb66d53dbdad9a68b6ddd73c651df6c).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { prisma } from '../../src/lib/prisma'
import { env } from '../../src/lib/veritas/env'
import { parseMaterialText as parseMaterial } from '../../src/lib/veritas/ingest/contract'

const ARCHIVE = join(process.cwd(), '.veritas/real-data/circular/circular_fashion_v1.tar.gz')
const WORK = join(process.cwd(), '.veritas/real-data/circular/extract')
const OUT = join(process.cwd(), 'public/open-images/secondhand')
const SOURCE = 'open-data: Clothing Dataset for Second-Hand Fashion (RISE / Wargön Innovation, Zenodo 8386668)'
const LICENCE = 'CC-BY-4.0'
const CREDIT = 'Wargön Innovation / RISE · CC BY 4.0'
const TENANT = { slug: 'open-data-cc0', name: 'Open data' }
const BRAND = { slug: 'second-hand-open-data', name: 'Second-hand items (open data)', description: 'Real garments photographed and graded at a textile sorting facility (public dataset, CC BY 4.0). Brands withheld.' }

/** Source type → what we score. Anything else is skipped. */
const KINDS: { re: RegExp; category: 'TOPS' | 'BOTTOMS'; subcategory: string; label: string }[] = [
  { re: /^t-?shirts?$|^tee/i, category: 'TOPS', subcategory: 'tee', label: 'T-shirt' },
  { re: /^shirts?$|^blouses?$/i, category: 'TOPS', subcategory: 'shirt', label: 'Shirt' },
  { re: /^jeans$/i, category: 'BOTTOMS', subcategory: 'jeans', label: 'Jeans' },
]
const GENDER: Record<string, 'WOMENS' | 'MENS' | 'UNISEX'> = { ladies: 'WOMENS', women: 'WOMENS', men: 'MENS', gentlemen: 'MENS', unisex: 'UNISEX' }

type Labels = { category?: string; type?: string; colors?: string[]; pilling?: number; condition?: number; price?: string; damage?: string; stains?: string; pattern?: string; material?: string; size?: string }
type Item = { key: string; dir: string; ts: string; labels: Labels; kind: (typeof KINDS)[number]; gender: 'WOMENS' | 'MENS' | 'UNISEX' }

/**
 * Items left out after the photo agent read them: a readable brand name on a label or print (CLAUDE.md: never name
 * other companies), or a print of a real person's face. Plain slogans are kept. Keys are `<dir>-<timestamp>`.
 */
const EXCLUDE = new Set([
  '2022_12_01_14_19_56', '2022_12_14_09_49_29', '2023_02_07_08_22_23', '2023_02_08_12_04_41', '2023_02_11_09_34_18', // jeans
  '2022_12_01_14_00_15', '2022_12_08_10_27_21', '2023_02_07_08_37_40', // shirts
  '2023_02_08_08_17_31', '2023_02_08_10_00_47', // tees
])

const arg = (n: string) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined)

/**
 * The sorting-table camera shoots garments lying sideways (collar or waistband to the right), with the table
 * edge, cables and a bracket in frame. Crop to the work area, turn upright, resize to 640 px, drop metadata.
 */
async function framed(src: string, dest: string) {
  const img = sharp(src).rotate()
  const { width = 0, height = 0 } = await img.metadata()
  const left = Math.round(width * 0.14)
  const area = { left, top: 0, width: Math.round(width * 0.92) - left, height: Math.round(height * 0.84) }
  const cropped = await img.extract(area).toBuffer()
  await sharp(cropped).rotate(270).resize({ width: 640, height: 640, fit: 'inside' }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest)
}

function listArchive(): string[] {
  return execFileSync('tar', ['-tzf', ARCHIVE], { maxBuffer: 256 * 1024 * 1024 }).toString().split('\n').filter(Boolean)
}

async function main() {
  if (env().APP_ENV === 'production') throw new Error('Open-data import is for development only.')
  if (!existsSync(ARCHIVE)) throw new Error(`Missing ${ARCHIVE}`)
  const perKind = Number(arg('--per-kind') ?? 40)

  // 1) Labels only (small): extract every labels_*.json once.
  const entries = listArchive()
  const fronts = new Set(entries.filter((e) => /\/front_[\d_]+\.jpg$/.test(e)))
  const labelFiles = entries.filter((e) => /\/labels_[\d_]+\.json$/.test(e))
  if (!existsSync(join(WORK, 'labels.done'))) {
    mkdirSync(WORK, { recursive: true })
    execFileSync('tar', ['-xzf', ARCHIVE, '-C', WORK, '*/labels_*.json'], { stdio: 'ignore' })
    writeFileSync(join(WORK, 'labels.done'), '')
  }
  const items: Item[] = []
  const typeCounts = new Map<string, number>()
  for (const lf of labelFiles) {
    const ts = lf.match(/labels_([\d_]+)\.json$/)![1]
    const dir = lf.slice(0, lf.lastIndexOf('/'))
    if (!fronts.has(`${dir}/front_${ts}.jpg`)) continue
    let labels: Labels
    try {
      labels = JSON.parse(readFileSync(join(WORK, lf), 'utf8')) as Labels
    } catch {
      continue
    }
    const type = (labels.type ?? '').trim()
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1)
    const kind = KINDS.find((k) => k.re.test(type))
    const gender = GENDER[(labels.category ?? '').trim().toLowerCase()]
    if (!kind || !gender || EXCLUDE.has(ts)) continue
    items.push({ key: `${dir.replace(/\//g, '-')}-${ts}`, dir, ts, labels, kind, gender })
  }
  console.log(`${labelFiles.length} labelled items · types: ${[...typeCounts].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t || '?'} ${n}`).join(', ')}`)

  // 2) Pick per kind: items with a pilling grade first, then by time (deterministic).
  const chosen = KINDS.flatMap((k) =>
    items
      .filter((i) => i.kind === k)
      .sort((a, b) => Number(!!b.labels.pilling) - Number(!!a.labels.pilling) || a.key.localeCompare(b.key))
      .slice(0, perKind),
  )
  for (const k of KINDS) console.log(`  ${k.label}: ${items.filter((i) => i.kind === k).length} available, ${chosen.filter((i) => i.kind === k).length} chosen`)
  if (process.argv.includes('--dry-run')) return console.log('Dry run: nothing written.')

  // 3) Photos: extract the chosen fronts, resize to 640 px (no metadata kept), into public/open-images/secondhand/.
  const tmp = join(WORK, 'fronts')
  mkdirSync(tmp, { recursive: true })
  mkdirSync(OUT, { recursive: true })
  const want = chosen.map((i) => `${i.dir}/front_${i.ts}.jpg`).filter((f) => !existsSync(join(OUT, `${f.split('/').slice(0, -1).join('-')}-${f.match(/front_([\d_]+)/)![1]}.jpg`)))
  if (want.length) {
    writeFileSync(join(WORK, 'want.txt'), want.join('\n'))
    execFileSync('tar', ['-xzf', ARCHIVE, '-C', tmp, '-T', join(WORK, 'want.txt')], { stdio: 'ignore' })
  }
  for (const i of chosen) {
    const dest = join(OUT, `${i.key}.jpg`)
    if (existsSync(dest)) continue
    await framed(join(tmp, i.dir, `front_${i.ts}.jpg`), dest)
  }
  rmSync(tmp, { recursive: true, force: true })
  writeFileSync(
    join(OUT, 'CREDITS.txt'),
    `Photos: Clothing Dataset for Second-Hand Fashion, Farrukh Nauman (RISE Research Institutes of Sweden) with Wargön Innovation AB.\nhttps://zenodo.org/records/8386668 · Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)\nChanges: front photos only, resized to 640 px, metadata removed. Brand names withheld.\n`,
  )

  // 4) Products in the private open-data tenant.
  const tenant = await prisma.tenant.upsert({ where: { slug: TENANT.slug }, update: { name: TENANT.name }, create: { ...TENANT, email: 'open-data@veritas.invalid', plan: 'pilot' } })
  const brand = await prisma.brand.upsert({ where: { slug: BRAND.slug }, update: { description: BRAND.description }, create: { ...BRAND, tenantId: tenant.id, source: SOURCE, licence: LICENCE } })
  let created = 0
  const counter = new Map<string, number>()
  for (const i of chosen) {
    const no = (counter.get(i.kind.label) ?? 0) + 1
    counter.set(i.kind.label, no)
    const externalId = `secondhand-${i.key}`
    const L = i.labels
    const n = (x: unknown) => (typeof x === 'number' && x >= 1 && x <= 5 ? x : null)
    const data = {
      name: `Second-hand ${i.kind.label} #${no}`,
      category: i.kind.category,
      subcategory: i.kind.subcategory,
      gender: i.gender,
      description: 'A real second-hand garment, photographed and graded at a textile sorting facility. No reviews in the source, so no overall score.',
      currentPrice: null,
      currency: 'SEK',
      colors: (L.colors ?? []).map((c) => c.trim()).filter((c) => c && !/^none$/i.test(c)),
      sizes: L.size && !/^none$/i.test(L.size.trim()) ? [L.size.trim()] : [],
      materials: parseMaterial(L.material),
      primaryImageUrl: `/open-images/secondhand/${i.key}.jpg`,
      images: [`/open-images/secondhand/${i.key}.jpg`],
      imageCredit: CREDIT,
      inspection: { pilling: n(L.pilling), condition: n(L.condition), stains: L.stains ? /^yes/i.test(L.stains.trim()) : null, damage: L.damage?.trim() || null, priceBand: L.price?.trim() || null, by: `Graded by trained sorters · ${CREDIT}` },
      source: SOURCE,
      licence: LICENCE,
    }
    const existing = await prisma.clothingProduct.findUnique({ where: { tenantId_externalId: { tenantId: tenant.id, externalId } }, select: { id: true } })
    if (existing) await prisma.clothingProduct.update({ where: { id: existing.id }, data })
    else {
      await prisma.clothingProduct.create({ data: { ...data, tenantId: tenant.id, isPrivate: true, externalId, brandId: brand.id, slug: `secondhand-${i.kind.subcategory}-${i.ts.replace(/_/g, '')}`, sku: `${TENANT.slug}:${externalId}` } })
      created++
    }
  }
  console.log(`\n${chosen.length} items in "${BRAND.name}" (${created} new) · photos in public/open-images/secondhand/ (credits in CREDITS.txt)`)
  console.log(`Next: npm run vision -- --tenant ${TENANT.slug} --yes ; npm run embed -- --all ; npm run rate -- --tenant ${TENANT.slug}`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
