/**
 * Photo condition test (B23): can the condition agent see what trained sorters graded (stains, damage, pilling,
 * overall condition) from a garment's front and back photos? Measuring only: nothing here touches scores.
 *   npm run photo:condition -- --pick [--per-grade 20]   # held-out graded items (not our 105), 20 per condition grade
 *   npm run photo:condition -- --read [--limit 5] --yes   # run the agent (live; prints an estimate first)
 *   npm run photo:condition -- --score                    # compare with the sorters' grades
 *   add --size 1568 to any step for a full-resolution set (own folder; ~4× the cost per item)
 * Photos and readings stay in .veritas/photo-condition/ (gitignored): never served or committed. The label
 * close-up photo (brand names) is never used.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONDITION_GRADE, PILLING_GRADE, makeConditionAgent, type ConditionReading } from '../../src/lib/veritas/agents/condition'
import { runAgent } from '../../src/lib/veritas/harness/loop'
import { env } from '../../src/lib/veritas/env'
import { prisma } from '../../src/lib/prisma'
import { ARCHIVE, WORK, framed } from './lib/secondhand'

const arg = (n: string) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined)
const ROOT = join(process.cwd(), '.veritas/photo-condition')
/** Photo size (long side). 800 is the default set; other sizes (e.g. --size 1568) get their own folder and manifest. */
const SIZE = Number(arg('--size') ?? 800)
const DIR = SIZE === 800 ? ROOT : join(ROOT, `s${SIZE}`)
const MANIFEST = join(DIR, 'manifest.json')
const TYPES = /^(t-?shirts?|tee.*|shirts?|blouses?|jeans)$/i
/** Measured on the first live runs of this agent; the script re-prints the real cost after each item. */
const EST_PER_ITEM = 0.0004 // at 800 px

type Labels = { type?: string; pilling?: number; condition?: number; stains?: string; damage?: string; holes?: string }
type Truth = { stains: 'none' | 'minor' | 'major' | 'yes'; damage: 'none' | 'present' | null; pilling: number | null; condition: number }
type Item = { key: string; dir: string; ts: string; type: string; truth: Truth; reading?: ConditionReading; costUsd?: number }

const load = (): Item[] => (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : [])
const save = (x: Item[]) => writeFileSync(MANIFEST, JSON.stringify(x, null, 1))
const grade = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 5 ? x : null)

/** Sorter labels → comparable truth. Damage is blank on most items: unknown, not "none". */
export function truthOf(L: Labels): Truth | null {
  const condition = grade(L.condition)
  const s = (L.stains ?? '').trim().toLowerCase()
  if (!condition || !['no', 'none', 'minor', 'major', 'yes'].includes(s)) return null
  const d = (L.damage ?? '').trim().toLowerCase()
  const damage = d === '' ? null : ['0', 'none', 'no'].includes(d) ? 'none' : 'present'
  return { stains: s === 'no' ? 'none' : (s as Truth['stains']), damage, pilling: grade(L.pilling), condition }
}

function listArchive(): string[] {
  const cache = join(WORK, 'archive-list.txt')
  if (!existsSync(cache)) writeFileSync(cache, execFileSync('tar', ['-tzf', ARCHIVE], { maxBuffer: 256 * 1024 * 1024 }))
  return readFileSync(cache, 'utf8').split('\n').filter(Boolean)
}

async function pick() {
  if (!existsSync(join(WORK, 'labels.done'))) throw new Error('Run npm run open-photos -- --dry-run first (extracts the labels).')
  const perGrade = Number(arg('--per-grade') ?? 20)
  const entries = new Set(listArchive())
  // Held out: never one of the items we show.
  const shown = new Set((await prisma.clothingProduct.findMany({ where: { slug: { startsWith: 'secondhand-' } }, select: { slug: true } })).map((p) => p.slug.split('-').pop()!))
  const pool: Item[] = []
  for (const lf of [...entries].filter((e) => /\/labels_[\d_]+\.json$/.test(e))) {
    const ts = lf.match(/labels_([\d_]+)\.json$/)![1]
    const dir = lf.slice(0, lf.lastIndexOf('/'))
    if (shown.has(ts.replace(/_/g, '')) || !entries.has(`${dir}/front_${ts}.jpg`) || !entries.has(`${dir}/back_${ts}.jpg`)) continue
    let L: Labels
    try {
      L = JSON.parse(readFileSync(join(WORK, lf), 'utf8')) as Labels
    } catch {
      continue
    }
    const type = (L.type ?? '').trim()
    const truth = TYPES.test(type) ? truthOf(L) : null
    if (truth) pool.push({ key: `${dir.replace(/\//g, '-')}-${ts}`, dir, ts, type, truth })
  }
  // Same number per condition grade, deterministic (sorted by key, then every n-th item to spread over months).
  const chosen = [1, 2, 3, 4, 5].flatMap((g) => {
    const xs = pool.filter((i) => i.truth.condition === g).sort((a, b) => a.key.localeCompare(b.key))
    const step = Math.max(1, Math.floor(xs.length / perGrade))
    return xs.filter((_, i) => i % step === 0).slice(0, perGrade)
  })
  console.log(`${pool.length} graded tees/shirts/blouses/jeans with front + back (excluding our ${shown.size}) · chosen ${chosen.length}: ${[1, 2, 3, 4, 5].map((g) => `grade ${g}: ${chosen.filter((c) => c.truth.condition === g).length}`).join(', ')}`)

  mkdirSync(DIR, { recursive: true })
  const tmp = join(DIR, 'tmp')
  mkdirSync(tmp, { recursive: true })
  const want = chosen.flatMap((i) => [`${i.dir}/front_${i.ts}.jpg`, `${i.dir}/back_${i.ts}.jpg`])
  writeFileSync(join(tmp, 'want.txt'), want.join('\n'))
  execFileSync('tar', ['-xzf', ARCHIVE, '-C', tmp, '-T', join(tmp, 'want.txt')], { stdio: 'ignore' })
  for (const i of chosen)
    for (const side of ['front', 'back'] as const) {
      const dest = join(DIR, `${i.key}-${side}.jpg`)
      if (!existsSync(dest)) await framed(join(tmp, i.dir, `${side}_${i.ts}.jpg`), dest, SIZE)
    }
  rmSync(tmp, { recursive: true, force: true })
  const old = new Map(load().map((x) => [x.key, x]))
  save(chosen.map((c) => ({ ...c, reading: old.get(c.key)?.reading, costUsd: old.get(c.key)?.costUsd })))
  console.log(`Photos (${SIZE} px) and manifest in ${DIR.replace(process.cwd() + '/', '')}/`)
}

async function read() {
  const items = load()
  const limit = Number(arg('--limit') ?? Infinity)
  const todo = items.filter((i) => !i.reading || process.argv.includes('--force')).slice(0, limit)
  console.log(`${todo.length} item(s) to read (2 photos each, ${SIZE} px) · estimate ≈ $${(todo.length * EST_PER_ITEM * (SIZE / 800) ** 2).toFixed(3)}`)
  if (!process.argv.includes('--yes')) return console.log('Add --yes to run.')
  let cost = 0
  for (const i of todo) {
    const img = (side: string) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: readFileSync(join(DIR, `${i.key}-${side}.jpg`)).toString('base64') } })
    const r = await runAgent(makeConditionAgent(), [{ type: 'text', text: 'Front:' }, img('front'), { type: 'text', text: 'Back:' }, img('back'), { type: 'text', text: 'Inspect this garment, then call finish.' }], { graph: 'photo-condition-test' })
    cost += r.totals.costUsd
    if (r.status === 'OK' && r.finish) {
      i.reading = r.finish
      i.costUsd = r.totals.costUsd
      const a = r.finish
      console.log(`${i.type.padEnd(8)} truth c${i.truth.condition} p${i.truth.pilling ?? '?'} stains:${i.truth.stains} dmg:${i.truth.damage ?? '?'}  →  read ${a.condition} · pilling ${a.pilling} · stains ${a.stains} · damage ${a.damage} · fading ${a.fading} · ${a.confidence}  $${r.totals.costUsd.toFixed(4)}`)
    } else console.log(`${i.key} error ${r.status}`)
    save(items)
  }
  console.log(`\nModel cost $${cost.toFixed(4)} (${todo.length ? `$${(cost / todo.length).toFixed(4)} per item` : '-'})`)
}

/** Binary agreement: precision, recall, accuracy, and what always answering the commoner class would score. */
function binary(name: string, rows: { truth: boolean; read: boolean | null }[]) {
  const known = rows.filter((r) => r.read !== null) as { truth: boolean; read: boolean }[]
  const tp = known.filter((r) => r.truth && r.read).length
  const fp = known.filter((r) => !r.truth && r.read).length
  const fn = known.filter((r) => r.truth && !r.read).length
  const acc = known.filter((r) => r.truth === r.read).length / (known.length || 1)
  const pos = known.filter((r) => r.truth).length / (known.length || 1)
  const pct = (x: number) => `${Math.round(100 * x)}%`
  console.log(
    `${name.padEnd(22)} n=${known.length} (can't tell ${rows.length - known.length}) · accuracy ${pct(acc)} (always-the-commoner-answer ${pct(Math.max(pos, 1 - pos))}) · precision ${tp + fp ? pct(tp / (tp + fp)) : 'n/a'} · recall ${tp + fn ? pct(tp / (tp + fn)) : 'n/a'}`,
  )
}

function spearman(a: number[], b: number[]) {
  const rank = (x: number[]) => {
    const s = x.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0])
    const r = new Array<number>(x.length)
    for (let i = 0; i < s.length; ) {
      let j = i
      while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++
      for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2
      i = j + 1
    }
    return r
  }
  const ra = rank(a), rb = rank(b)
  const m = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length
  const ma = m(ra), mb = m(rb)
  const cov = ra.reduce((s, v, i) => s + (v - ma) * (rb[i] - mb), 0)
  const sd = (x: number[], mx: number) => Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0))
  return cov / (sd(ra, ma) * sd(rb, mb) || 1)
}

function score() {
  const items = load().filter((i) => i.reading?.garment_visible)
  if (!items.length) return console.log('Nothing read yet.')
  console.log(`\n${items.length} items read at ${SIZE} px · agent vs. trained sorters\n`)
  binary('Stains (any)', items.map((i) => ({ truth: i.truth.stains !== 'none', read: i.reading!.stains === 'cant_tell' ? null : i.reading!.stains !== 'none' })))
  binary('Stains (major)', items.filter((i) => i.truth.stains !== 'yes').map((i) => ({ truth: i.truth.stains === 'major', read: i.reading!.stains === 'cant_tell' ? null : i.reading!.stains === 'major' })))
  binary('Damage', items.filter((i) => i.truth.damage).map((i) => ({ truth: i.truth.damage === 'present', read: i.reading!.damage === 'cant_tell' ? null : i.reading!.damage === 'present' })))
  binary('Visible pilling (≤3)', items.filter((i) => i.truth.pilling).map((i) => ({ truth: i.truth.pilling! <= 3, read: i.reading!.pilling === 'cant_tell' ? null : PILLING_GRADE[i.reading!.pilling] <= 3 })))
  const c = items.map((i) => [i.truth.condition, CONDITION_GRADE[i.reading!.condition]] as const)
  const exact = c.filter(([t, r]) => t === r).length / c.length
  const near = c.filter(([t, r]) => Math.abs(t - r) <= 1).length / c.length
  console.log(`Condition 1–5          n=${c.length} · exact ${Math.round(100 * exact)}% (chance ≈ 20%) · within ±1 ${Math.round(100 * near)}% · rank agreement ρ ${spearman(c.map((x) => x[0]), c.map((x) => x[1])).toFixed(2)}`)
  const confusion = [1, 2, 3, 4, 5].map((t) => `  sorter ${t}: read ${[1, 2, 3, 4, 5].map((r) => c.filter(([a, b]) => a === t && b === r).length).join(' ')}`)
  console.log('Condition confusion (read 1 2 3 4 5):\n' + confusion.join('\n'))
  const cost = items.reduce((s, i) => s + (i.costUsd ?? 0), 0)
  console.log(`\nCost so far $${cost.toFixed(4)} ($${(cost / items.length).toFixed(4)} per item)`)
  const out = join(process.cwd(), '.veritas/evals')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, `photo-condition${SIZE === 800 ? '' : `-s${SIZE}`}.json`), JSON.stringify({ at: new Date().toISOString(), size: SIZE, n: items.length, exact, near, cost }, null, 1))
}

async function main() {
  if (env().APP_ENV === 'production') throw new Error('Development only.')
  if (process.argv.includes('--pick')) await pick()
  if (process.argv.includes('--read')) await read()
  if (process.argv.includes('--score')) score()
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
