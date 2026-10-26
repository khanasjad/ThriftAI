/**
 * Live photo test (B17): how well the vision agent reads REAL clothing photos, not our drawings.
 *   npm run photo:test -- --fetch          # download openly licensed photos from Openverse (commercial-use licences)
 *   npm run photo:test -- --read --yes     # run the vision agent on them (~$0.0004 each)
 *   npm run photo:test -- --score          # compare with hand labels in .veritas/photo-test/truth.json
 * Photos, licences and readings stay in .veritas/photo-test/ (gitignored): never served or committed.
 * Every photo records creator, licence and source page (CLAUDE.md: source + licence per record).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { makeVisionAgent, type VisualAttributes } from '../../src/lib/veritas/agents/vision'
import { normaliseVisual } from '../../src/lib/veritas/graph/describe-image'
import { runAgent } from '../../src/lib/veritas/harness/loop'
import { prisma } from '../../src/lib/prisma'

const DIR = join(process.cwd(), '.veritas/photo-test')
const MANIFEST = join(DIR, 'manifest.json')
const QUERIES = ['floral shirt', 'hawaiian shirt', 'striped t-shirt', 'plaid flannel shirt', 'polka dot shirt', 'graphic t-shirt', 'car t-shirt', 'football jersey', 'real madrid shirt', 'band t-shirt', 'blue jeans', 'white t-shirt']
const PER_QUERY = 3

type Photo = { id: string; query: string; title: string; creator: string | null; license: string; licenseUrl: string | null; source: string; landingUrl: string; file: string; reading?: VisualAttributes; costUsd?: number }
type Truth = Record<string, { garment: 'clothing' | 'not-clothing'; pattern?: string; colorFamily?: string; motifs?: string[]; note?: string }>

const load = (): Photo[] => (existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : [])
const save = (p: Photo[]) => writeFileSync(MANIFEST, JSON.stringify(p, null, 1))

async function fetchPhotos() {
  mkdirSync(DIR, { recursive: true })
  const photos = load()
  for (const q of QUERIES) {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&mature=false&page_size=12`
    const res = await fetch(url, { headers: { 'User-Agent': 'veritas-photo-test/1 (internal accuracy test)' } })
    if (!res.ok) {
      console.log(`✗ ${q}: Openverse ${res.status}`)
      continue
    }
    const results = ((await res.json()) as { results: { id: string; title: string; creator: string | null; license: string; license_version: string; license_url: string | null; source: string; foreign_landing_url: string; width: number | null }[] }).results
    let got = 0
    for (const r of results) {
      if (got >= PER_QUERY) break
      if (photos.some((p) => p.id === r.id) || (r.width ?? 0) < 300) continue
      // Openverse's own thumbnail (≈600px): enough for the agent and cheaper than the full image.
      const img = await fetch(`https://api.openverse.org/v1/images/${r.id}/thumb/`, { headers: { 'User-Agent': 'veritas-photo-test/1' } })
      if (!img.ok || !(img.headers.get('content-type') ?? '').startsWith('image/')) continue
      const ext = (img.headers.get('content-type') ?? 'image/jpeg').includes('png') ? 'png' : (img.headers.get('content-type') ?? '').includes('webp') ? 'webp' : 'jpg'
      const file = `${r.id}.${ext}`
      writeFileSync(join(DIR, file), Buffer.from(await img.arrayBuffer()))
      photos.push({ id: r.id, query: q, title: r.title, creator: r.creator, license: `${r.license} ${r.license_version}`.trim(), licenseUrl: r.license_url, source: r.source, landingUrl: r.foreign_landing_url, file })
      got++
    }
    console.log(`${q}: ${got} photos`)
  }
  save(photos)
  console.log(`\n${photos.length} photos in .veritas/photo-test/ (licences in manifest.json)`)
}

async function readPhotos() {
  const photos = load()
  const todo = process.argv.includes('--force') ? photos : photos.filter((p) => !p.reading)
  console.log(`${todo.length} photo(s) to read · estimate ≤ $${(todo.length * 0.0005).toFixed(3)}`)
  if (!process.argv.includes('--yes')) return console.log('Add --yes to run.')
  let cost = 0
  for (const p of todo) {
    const bytes = readFileSync(join(DIR, p.file))
    const media = p.file.endsWith('png') ? 'image/png' : p.file.endsWith('webp') ? 'image/webp' : 'image/jpeg'
    const r = await runAgent(makeVisionAgent(), [{ type: 'image', source: { type: 'base64', media_type: media, data: bytes.toString('base64') } }, { type: 'text', text: 'Describe this product photo, then call finish.' }], { graph: 'photo-test' })
    cost += r.totals.costUsd
    if (r.status === 'OK' && r.finish) {
      p.reading = normaliseVisual(r.finish)
      p.costUsd = r.totals.costUsd
      const a = p.reading
      console.log(`${p.query.padEnd(20)} ${p.id.slice(0, 8)} ${a.is_clothing ? a.garment : 'NOT CLOTHING'} · ${a.pattern} · ${a.colors[0]?.name ?? '-'} · motifs: ${a.motifs.map((m) => m.label).join(', ') || '-'}${a.print_text ? ` · text: "${a.print_text}"` : ''}`)
    } else console.log(`${p.query.padEnd(20)} ${p.id.slice(0, 8)} error ${r.status}`)
    save(photos)
  }
  console.log(`\nModel cost $${cost.toFixed(4)}`)
}

function score() {
  const photos = load()
  const truthFile = join(DIR, 'truth.json')
  if (!existsSync(truthFile)) return console.log('No truth.json yet (hand labels).')
  const truth = JSON.parse(readFileSync(truthFile, 'utf8')) as Truth
  let clothing = 0, clothingOk = 0, pat = 0, patOk = 0, col = 0, colOk = 0, mot = 0, motOk = 0
  const misses: string[] = []
  for (const p of photos) {
    const t = truth[p.id]
    const a = p.reading
    if (!t || !a) continue
    clothing++
    if ((t.garment === 'clothing') === a.is_clothing) clothingOk++
    else misses.push(`${p.id.slice(0, 8)} (${p.query}): clothing? truth ${t.garment}, read ${a.is_clothing}`)
    if (t.garment !== 'clothing') continue
    if (t.pattern) {
      pat++
      if (a.pattern === t.pattern) patOk++
      else misses.push(`${p.id.slice(0, 8)} (${p.query}): pattern truth ${t.pattern}, read ${a.pattern}`)
    }
    if (t.colorFamily) {
      col++
      if (a.colors[0]?.family === t.colorFamily) colOk++
      else misses.push(`${p.id.slice(0, 8)} (${p.query}): colour truth ${t.colorFamily}, read ${a.colors[0]?.family}`)
    }
    for (const m of t.motifs ?? []) {
      mot++
      const squash = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '')
      const hit = a.motifs.some((x) => squash(x.label).includes(squash(m)) || (squash(x.label) && squash(m).includes(squash(x.label)))) || squash(a.print_text).includes(squash(m))
      if (hit) motOk++
      else misses.push(`${p.id.slice(0, 8)} (${p.query}): motif "${m}" not found (read: ${a.motifs.map((x) => x.label).join(', ') || 'none'})`)
    }
  }
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}% (${a}/${b})` : 'n/a')
  console.log(`Clothing or not: ${pct(clothingOk, clothing)} · pattern: ${pct(patOk, pat)} · main colour: ${pct(colOk, col)} · motifs: ${pct(motOk, mot)}`)
  for (const m of misses) console.log(`  ✗ ${m}`)
}

async function main() {
  if (process.argv.includes('--fetch')) await fetchPhotos()
  if (process.argv.includes('--read')) await readPhotos()
  if (process.argv.includes('--score')) score()
  await prisma.$disconnect()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
