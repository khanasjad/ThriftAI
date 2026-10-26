/**
 * Calibration report ($0): how well do our scores agree with what owners and experts say?
 *   npm run calibrate                                   # owner stars + keep-vs-return (automatic, from the database)
 *   npm run calibrate -- --experts picks.csv            # + expert picks (columns: product, rating, source[, note])
 *   npm run calibrate -- --simulate-experts             # dev only: a fictional expert panel built from the dataset's hidden truth
 * Writes .veritas/calibration/report-<date>.json. Never changes weights; it suggests, a person decides.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { prisma } from '../src/lib/prisma'
import { env } from '../src/lib/veritas/env'
import { calibrate, type Reference, type ScoredProduct } from '../src/lib/veritas/evals/calibrate'

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined)

/** Minimal CSV: header row, comma-separated, quotes allowed around fields. */
function parseCsv(text: string): Record<string, string>[] {
  const rows = text.split(/\r?\n/).filter((l) => l.trim())
  const split = (l: string) => [...l.matchAll(/("([^"]*(?:""[^"]*)*)"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => (m[2] !== undefined ? m[2].replace(/""/g, '"') : m[1]).trim())
  const head = split(rows[0]).map((h) => h.toLowerCase())
  return rows.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])))
}

const ExpertRow = z.object({
  product: z.string().trim().min(1),
  rating: z.coerce.number().finite(),
  source: z.string().trim().min(2, 'source is required (who rated it)'),
  note: z.string().optional(),
})

async function main() {
  const rows = await prisma.clothingProduct.findMany({
    where: { productScore: { isNot: null } },
    select: {
      id: true,
      slug: true,
      externalId: true,
      name: true,
      category: true,
      unitsSold: true,
      productScore: { select: { overall: true, fit: true, quality: true, styleValue: true, comfort: true, earlyScore: true } },
      reviews: { select: { rating: true } },
      _count: { select: { returns: true } },
    },
  })
  const products: ScoredProduct[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    overall: r.productScore!.overall,
    pillars: { FIT: r.productScore!.fit, QUALITY: r.productScore!.quality, STYLE_VALUE: r.productScore!.styleValue, COMFORT: r.productScore!.comfort },
    earlyScore: r.productScore!.earlyScore,
    reviewCount: r.reviews.length,
  }))

  const refs: Reference[] = [
    {
      key: 'owners',
      label: 'Owner stars',
      independent: false,
      note: 'Average review stars (products with ≥ 3 reviews). Reviews also feed the score, so some agreement is built in.',
      values: new Map(rows.filter((r) => r.reviews.length >= 3).map((r) => [r.id, r.reviews.reduce((s, x) => s + x.rating, 0) / r.reviews.length])),
    },
    {
      key: 'keep',
      label: 'Kept, not returned',
      independent: false,
      note: '1 − returns ÷ units sold (products with ≥ 20 sold). Return reasons feed the fit pillar, so partly built in.',
      values: new Map(rows.filter((r) => (r.unitsSold ?? 0) >= 20).map((r) => [r.id, 1 - r._count.returns / r.unitsSold!])),
    },
  ]

  const file = arg('--experts')
  if (file) {
    if (!existsSync(file)) throw new Error(`No file ${file}`)
    const parsed = parseCsv(readFileSync(file, 'utf8')).map((r, i) => ({ i: i + 2, r: ExpertRow.safeParse(r) }))
    const bad = parsed.filter((x) => !x.r.success)
    for (const b of bad.slice(0, 10)) console.log(`  ✗ row ${b.i}: ${b.r.error!.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`)
    const values = new Map<string, number>()
    let unknown = 0
    for (const x of parsed) {
      if (!x.r.success) continue
      const p = rows.find((r) => r.slug === x.r.data!.product || r.externalId === x.r.data!.product)
      if (p) values.set(p.id, x.r.data!.rating)
      else unknown++
    }
    const sources = [...new Set(parsed.flatMap((x) => (x.r.success ? [x.r.data!.source] : [])))]
    console.log(`Expert picks: ${values.size} matched, ${unknown} unknown products, ${bad.length} bad rows · sources: ${sources.join(', ')}`)
    refs.push({ key: 'experts', label: 'Expert picks', independent: true, note: `From ${file} (${sources.join(', ')}). Ratings on any scale; compared by rank.`, values })
  }

  if (process.argv.includes('--simulate-experts')) {
    if (env().APP_ENV === 'production') throw new Error('--simulate-experts is for development only')
    // A fictional panel that knows the generator's hidden truth, with some disagreement between "experts".
    const ds = JSON.parse(readFileSync('prisma/fixtures/dev-dataset.json', 'utf8')) as { products: { slug: string; _truth: Record<string, number> }[] }
    const truth = new Map(ds.products.map((p) => [p.slug, p._truth]))
    let seed = 7
    const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.12
    const values = new Map<string, number>()
    for (const r of rows) {
      const t = truth.get(r.slug)
      if (!t) continue
      const fit = 1 - Math.min(1, Math.abs(t.fitOffset ?? 0) * 4)
      const q = [t.fabric, t.construction, t.washDurability, 1 - (t.pillingRisk ?? 0.5), t.softness].filter((x) => typeof x === 'number')
      values.set(r.id, 0.35 * fit + 0.65 * (q.reduce((s, x) => s + x, 0) / q.length) + noise())
    }
    refs.push({ key: 'experts', label: 'Simulated experts (dev)', independent: true, note: 'Fictional panel from the dev dataset’s hidden truth (fit offset, fabric, construction, wash, pilling, softness) plus noise. Tests the tool, not the product.', values })
  }

  const report = calibrate(products, refs)
  const pct = (x: number | null) => (x === null ? 'n/a' : x.toFixed(2))
  console.log(`\nCalibration · ${products.length} scored products · re-weigh check: max ${report.reweighCheck.maxDiff} points off stored scores (${report.reweighCheck.n} products)\n`)
  for (const r of report.references) {
    console.log(`${r.label}${r.independent ? '' : ' (partly built in)'} · n=${r.n} · agreement ρ=${pct(r.rho)}${r.topAgreement ? ` · top ${r.topAgreement.k}: ${r.topAgreement.shared} shared` : ''}`)
    console.log(`  per category: ${r.perCategory.map((c) => `${c.category} ${pct(c.rho)} (n=${c.n})`).join(' · ')}`)
    console.log(`  per pillar:   ${Object.entries(r.perPillar).map(([k, v]) => `${k} ${pct(v)}`).join(' · ')}`)
    for (const d of r.disagreements.slice(0, 3)) console.log(`  ↔ ${d.slug}: our #${d.ourRank}, theirs #${d.refRank} (score ${d.overall}; fit ${d.pillars.FIT} quality ${d.pillars.QUALITY} style/value ${d.pillars.STYLE_VALUE} comfort ${d.pillars.COMFORT})`)
    console.log(`  ${r.note}\n`)
  }
  const s = report.suggestion
  if (s) {
    const w = (x: typeof s.current) => Object.entries(x).map(([k, v]) => `${k} ${v}`).join(' / ')
    console.log(`Weights (tuned on ${s.basis} only):`)
    console.log(`  today ${w(s.current)} → ρ ${pct(s.rhoNow)}`)
    console.log(`  best nearby ${w(s.best)} → ρ ${pct(s.rhoBest)}`)
    console.log(`  ${s.worthIt ? '→ worth considering' : '→ no change'}: ${s.reason}`)
  } else console.log('Weights: no independent reference yet (add --experts picks.csv). Owner stars and returns already feed the score, so they are not used to tune weights.')

  const dir = join(process.cwd(), '.veritas/calibration')
  mkdirSync(dir, { recursive: true })
  const out = join(dir, `report-${new Date().toISOString().slice(0, 10)}.json`)
  writeFileSync(out, JSON.stringify(report, null, 1))
  console.log(`\nSaved ${out.replace(process.cwd() + '/', '')}`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
