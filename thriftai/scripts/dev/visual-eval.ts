/**
 * Spike ($0, local CPU): is an open-source fashion model (Marqo-FashionSigLIP, Apache-2.0) better than
 * our own matching for "find the shirt that looks like X"? Runs on our dev images and the hand-labelled
 * real photos in .veritas/photo-test/. Nothing is written to the database.
 *   npm run visual:eval
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { AutoProcessor, AutoTokenizer, RawImage, SiglipTextModel, SiglipVisionModel } from '@huggingface/transformers'

const MODEL = 'Marqo/marqo-fashionSigLIP'
const DTYPE = 'q8' as const

type Vec = number[]
const dot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0)

async function main() {
  const t0 = Date.now()
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL)
  const textModel = await SiglipTextModel.from_pretrained(MODEL, { dtype: DTYPE })
  const processor = await AutoProcessor.from_pretrained(MODEL)
  const visionModel = await SiglipVisionModel.from_pretrained(MODEL, { dtype: DTYPE })
  console.log(`model loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  const embedTexts = async (texts: string[]): Promise<Vec[]> => {
    const inputs = tokenizer(texts, { padding: 'max_length', truncation: true })
    const { text_embeds } = await textModel(inputs)
    return text_embeds.normalize().tolist()
  }
  let imgMs = 0
  const embedImage = async (path: string): Promise<Vec> => {
    const t = Date.now()
    const image = await RawImage.read(path)
    const { image_embeds } = await visionModel(await processor(image))
    imgMs += Date.now() - t
    return image_embeds.normalize().tolist()[0]
  }

  // 1) Search on dev products: does a shopper's phrase put the right items on top?
  const ds = JSON.parse(readFileSync('prisma/fixtures/dev-dataset.json', 'utf8'))
  const prods: { slug: string; subcategory: string; colors: string[]; _truth: { pattern?: string; print?: string } }[] = ds.products
  const devEmb = new Map<string, Vec>()
  for (const p of prods) devEmb.set(p.slug, await embedImage(join('public/dev-images', `${p.slug}.png`)))
  console.log(`\n52 dev images embedded, ${(imgMs / 52).toFixed(0)} ms each on this CPU`)

  const PRINT_Q: Record<string, string> = { car: 't-shirt with a car printed on it', 'palm-tree': 't-shirt with a palm tree print', 'football-crest': 't-shirt with a football club crest', 'sun-mountains': 't-shirt with a sun and mountains print', guitar: 't-shirt with a guitar print' }
  const PATTERN_Q: Record<string, string> = { floral: 'floral print shirt', striped: 'striped shirt', plaid: 'plaid flannel shirt', 'polka-dot': 'polka dot shirt' }
  const queries: { q: string; want: (p: (typeof prods)[number]) => boolean }[] = [
    ...Object.entries(PRINT_Q).map(([k, q]) => ({ q, want: (p: (typeof prods)[number]) => p._truth.print === k })),
    ...Object.entries(PATTERN_Q).map(([k, q]) => ({ q, want: (p: (typeof prods)[number]) => p._truth.pattern === k })),
  ]
  console.log('\nSearch (precision of the top-N, N = number of right answers):')
  for (const { q, want } of queries) {
    const right = prods.filter(want)
    if (!right.length) continue
    const [qe] = await embedTexts([q])
    const ranked = [...prods].sort((a, b) => dot(qe, devEmb.get(b.slug)!) - dot(qe, devEmb.get(a.slug)!))
    const top = ranked.slice(0, right.length)
    const hits = top.filter(want).length
    console.log(`  ${hits === right.length ? '✓' : '✗'} "${q}": ${hits}/${right.length}${hits < right.length ? `  (top: ${top.map((p) => p.slug).join(', ')})` : ''}`)
  }

  // 1b) Words a shopper might use that never appear in our labels (synonyms, looser phrasing).
  console.log('\nSynonyms (same check):')
  const SYN: [string, (p: (typeof prods)[number]) => boolean][] = [
    ['tee with an automobile on it', (p) => p._truth.print === 'car'],
    ['race car graphic tee', (p) => p._truth.print === 'car'],
    ['shirt with flowers', (p) => p._truth.pattern === 'floral'],
    ['tropical beach t-shirt', (p) => p._truth.print === 'palm-tree'],
    ['soccer team tee', (p) => p._truth.print === 'football-crest'],
    ['pinstripe shirt', (p) => p._truth.pattern === 'striped'],
  ]
  for (const [q, want] of SYN) {
    const right = prods.filter(want)
    const [qe] = await embedTexts([q])
    const top = [...prods].sort((a, b) => dot(qe, devEmb.get(b.slug)!) - dot(qe, devEmb.get(a.slug)!)).slice(0, right.length)
    const hits = top.filter(want).length
    console.log(`  ${hits === right.length ? '✓' : '✗'} "${q}": ${hits}/${right.length}`)
  }

  // 2) Zero-shot labels on real photos vs. hand labels (the same truth.json the Claude reader is scored on).
  const DIR = '.veritas/photo-test'
  if (!existsSync(join(DIR, 'truth.json'))) return
  const manifest: { id: string; file: string; reading?: { pattern: string; colors: { family: string }[] } }[] = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'))
  const truth: Record<string, { garment: string; pattern?: string; colorFamily?: string; motifs?: string[] }> = JSON.parse(readFileSync(join(DIR, 'truth.json'), 'utf8'))
  const PATTERNS = ['solid', 'striped', 'floral', 'polka-dot', 'plaid', 'graphic']
  const patText = await embedTexts(['a plain solid-colour garment', 'a striped garment', 'a floral print garment', 'a polka dot garment', 'a plaid check garment', 'a t-shirt with a graphic print or logo'])
  const COLORS = ['black', 'white', 'grey', 'blue', 'red', 'pink', 'green', 'yellow', 'orange', 'purple', 'brown', 'beige']
  const colText = await embedTexts(COLORS.map((c) => `a ${c} garment`))
  const clothText = await embedTexts(['a photo of clothing', 'a photo with no clothing in it'])
  let n = 0, cl = 0, clOk = 0, pat = 0, patOk = 0, patClaude = 0, col = 0, colOk = 0, colClaude = 0
  const argmax = (e: Vec, ts: Vec[]) => ts.map((t) => dot(e, t)).reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0)
  for (const p of manifest) {
    const t = truth[p.id]
    if (!t) continue
    const e = await embedImage(join(DIR, p.file))
    n++
    cl++
    if ((argmax(e, clothText) === 0) === (t.garment === 'clothing')) clOk++
    if (t.garment !== 'clothing') continue
    if (t.pattern) {
      pat++
      if (PATTERNS[argmax(e, patText)] === t.pattern) patOk++
      if (p.reading?.pattern === t.pattern) patClaude++
    }
    if (t.colorFamily) {
      col++
      if (COLORS[argmax(e, colText)] === t.colorFamily) colOk++
      if (p.reading?.colors[0]?.family === t.colorFamily) colClaude++
    }
  }
  // Print search on real photos: for each labelled print, is that photo in the top 3 of all photos?
  const motifTruth = manifest.filter((p) => truth[p.id]?.motifs?.length)
  const realEmb = new Map<string, Vec>()
  for (const p of manifest) if (truth[p.id]) realEmb.set(p.id, await embedImage(join(DIR, p.file)))
  let mq = 0, mTop3 = 0
  const mMiss: string[] = []
  for (const p of motifTruth) for (const m of truth[p.id].motifs!) {
    mq++
    const [qe] = await embedTexts([`clothing with ${m} on it`])
    const rank = [...realEmb.entries()].sort((a, b) => dot(qe, b[1]) - dot(qe, a[1])).findIndex(([id]) => id === p.id)
    if (rank < 3) mTop3++
    else mMiss.push(`"${m}" (${p.id.slice(0, 8)}) ranked ${rank + 1}`)
  }
  console.log(`\nPrint search on real photos: right photo in top 3 for ${mTop3}/${mq} prints; misses: ${mMiss.join('; ') || 'none'}`)
  const pct = (a: number, b: number) => `${Math.round((100 * a) / b)}% (${a}/${b})`
  console.log(`\nReal photos (${n}), zero-shot FashionSigLIP vs. our Claude reader:`)
  console.log(`  clothing or not: ${pct(clOk, cl)}`)
  console.log(`  pattern:         ${pct(patOk, pat)}   (Claude ${pct(patClaude, pat)})`)
  console.log(`  main colour:     ${pct(colOk, col)}   (Claude ${pct(colClaude, col)})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
