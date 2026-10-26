/**
 * describe-image (B12, B18): product photo → (1) "looks like" fingerprint from the open-source fashion model ($0)
 * and (2) vision agent → normalised attributes → ProductVisual. Images are downloaded by our server and sent as
 * base64. An unchanged image is never re-read or re-fingerprinted (hash of the image bytes + model version).
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import type Anthropic from '@anthropic-ai/sdk'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { VISION_VERSION, makeVisionAgent, type VisualAttributes } from '../agents/vision'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import type { TraceSink } from '../harness/telemetry'
import { embedProduct } from '../visual/store'

export type DescribeResult = { slug: string; status: 'described' | 'unchanged' | 'no_image' | 'not_clothing' | 'error'; attributes?: VisualAttributes; costUsd: number; error?: string; fingerprint?: 'embedded' | 'unchanged' | 'off' | 'error' }

const MEDIA: Record<string, 'image/png' | 'image/jpeg' | 'image/webp'> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000

/** True for loopback, private, link-local and other non-public addresses (SSRF guard). */
export function isPrivateAddress(ip: string): boolean {
  if (ip.includes(':')) {
    const v6 = ip.toLowerCase()
    return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('::ffff:') && isPrivateAddress(v6.slice(7))
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

/**
 * Builds the image block and a hash of the image bytes. Vendor images (https) are downloaded by our server
 * (the Claude API's own URL fetch respects robots.txt, which some image hosts disallow): https only, public
 * addresses only, ≤ 5 MB, image types only, 10 s timeout. Local dev images must sit under public/dev-images.
 */
export async function imageSource(url: string): Promise<{ block: Anthropic.ImageBlockParam; hash: string } | null> {
  if (/^https:\/\//i.test(url)) {
    const host = new URL(url).hostname
    const { lookup } = await import('node:dns/promises')
    const addrs = await lookup(host, { all: true }).catch(() => [])
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow', headers: { 'User-Agent': 'VeritasPhotoReader/1 (reads vendor-supplied product images)' } }).catch(() => null)
    if (!res?.ok) return null
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    const media = ({ 'image/jpeg': 'image/jpeg', 'image/png': 'image/png', 'image/webp': 'image/webp', 'image/gif': 'image/gif' } as const)[type as 'image/jpeg']
    if (!media || Number(res.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES) return null
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) return null
    return { block: { type: 'image', source: { type: 'base64', media_type: media, data: bytes.toString('base64') } }, hash: createHash('sha256').update(bytes).digest('hex') }
  }
  if (url.startsWith('/dev-images/')) {
    const file = normalize(join(process.cwd(), 'public', url))
    if (!file.startsWith(join(process.cwd(), 'public', 'dev-images'))) return null
    const ext = url.split('.').pop()?.toLowerCase() ?? ''
    const media = MEDIA[ext]
    if (!media) return null
    const bytes = readFileSync(file)
    return { block: { type: 'image', source: { type: 'base64', media_type: media, data: bytes.toString('base64') } }, hash: createHash('sha256').update(bytes).digest('hex') }
  }
  return null
}

/** Code-side clean-up of what the agent proposed: lowercase, deduplicate, cap lengths. */
export function normaliseVisual(a: VisualAttributes): VisualAttributes {
  const seen = new Set<string>()
  return {
    ...a,
    colors: a.colors
      .map((c) => ({ name: c.name.trim().toLowerCase().slice(0, 40), family: c.family }))
      .filter((c) => c.name && !seen.has(c.name) && seen.add(c.name))
      .slice(0, 3),
    pattern_detail: a.pattern_detail.trim().slice(0, 80),
    motifs: a.motifs
      .map((m) => ({ ...m, label: m.label.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40) }))
      .filter((m, i, all) => m.label && all.findIndex((x) => x.label === m.label) === i)
      .slice(0, 5),
    print_text: a.print_text.trim().slice(0, 120),
    style_tags: [...new Set(a.style_tags.map((t) => t.trim().toLowerCase().replace(/[^a-z -]/g, '')).filter((t) => t && t.length <= 20))].slice(0, 5),
    description: a.description.trim().split(/\s+/).slice(0, 24).join(' '),
  }
}

/** Reads several products' photos within a time budget (after an upload, or nightly). Unchanged photos cost nothing. */
export async function describeMany(ids: string[], opts: { budgetMs: number; llm?: LlmClient; sink?: TraceSink }) {
  const t0 = Date.now()
  const out = { read: 0, unchanged: 0, skipped: 0, errors: 0, fingerprinted: 0, costUsd: 0, left: 0 }
  for (const [i, id] of ids.entries()) {
    if (Date.now() - t0 > opts.budgetMs) {
      out.left = ids.length - i
      break
    }
    const r = await describeProduct(id, { llm: opts.llm, sink: opts.sink })
    out.costUsd += r.costUsd
    if (r.fingerprint === 'embedded') out.fingerprinted++
    if (r.status === 'described') out.read++
    else if (r.status === 'unchanged') out.unchanged++
    else if (r.status === 'error') out.errors++
    else out.skipped++
  }
  return out
}

export async function describeProduct(slugOrId: string, opts: { llm?: LlmClient; sink?: TraceSink; force?: boolean } = {}): Promise<DescribeResult> {
  const p = await prisma.clothingProduct.findFirst({ where: { OR: [{ slug: slugOrId }, { id: slugOrId }] }, select: { id: true, slug: true, primaryImageUrl: true, visual: { select: { imageHash: true } } } })
  if (!p) return { slug: slugOrId, status: 'error', costUsd: 0, error: 'not found' }
  const src = p.primaryImageUrl ? await imageSource(p.primaryImageUrl) : null
  if (!src) return { slug: p.slug, status: 'no_image', costUsd: 0 }
  // Fingerprint first: free, and independent of whether the vision agent needs to run. Never blocks the reading.
  const fingerprint = await embedProduct(p.id, Buffer.from((src.block.source as { data: string }).data, 'base64')).catch((e) => {
    console.error(`[describe-image] fingerprint failed for ${p.slug}:`, e instanceof Error ? e.message : e)
    return 'error' as const
  })
  const imageHash = createHash('sha256').update(`${VISION_VERSION}|${src.hash}`).digest('hex')
  if (!opts.force && p.visual?.imageHash === imageHash) return { slug: p.slug, status: 'unchanged', costUsd: 0, fingerprint }

  const r = await runAgent(makeVisionAgent(), [src.block, { type: 'text', text: 'Describe this product photo, then call finish.' }], { llm: opts.llm, sink: opts.sink, graph: 'describe-image', productId: p.id, inputsHash: imageHash })
  if (r.status !== 'OK' || !r.finish) return { slug: p.slug, status: 'error', costUsd: r.totals.costUsd, error: r.status, fingerprint }
  const attributes = normaliseVisual(r.finish)
  if (!attributes.is_clothing) return { slug: p.slug, status: 'not_clothing', attributes, costUsd: r.totals.costUsd, fingerprint }
  const data = { imageUrl: p.primaryImageUrl!, imageHash, attributes: attributes as unknown as Prisma.InputJsonValue, runId: r.runId, costUsd: new Prisma.Decimal(r.totals.costUsd) }
  await prisma.productVisual.upsert({ where: { productId: p.id }, update: data, create: { ...data, productId: p.id } })
  return { slug: p.slug, status: 'described', attributes, costUsd: r.totals.costUsd, fingerprint }
}
