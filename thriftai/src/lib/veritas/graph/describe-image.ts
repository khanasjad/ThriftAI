/**
 * describe-image (B12): product photo → vision agent → normalised attributes → ProductVisual.
 * Vendor images (https) are sent by URL; local dev images (/dev-images/…) as base64. An unchanged image is never
 * re-read (hash of the image source + agent version).
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import type Anthropic from '@anthropic-ai/sdk'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { VISION_VERSION, makeVisionAgent, type VisualAttributes } from '../agents/vision'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import type { TraceSink } from '../harness/telemetry'

export type DescribeResult = { slug: string; status: 'described' | 'unchanged' | 'no_image' | 'not_clothing' | 'error'; attributes?: VisualAttributes; costUsd: number; error?: string }

const MEDIA: Record<string, 'image/png' | 'image/jpeg' | 'image/webp'> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

/** Builds the image block and a hash of the image. Local files must sit under public/dev-images (no path tricks). */
export function imageSource(url: string): { block: Anthropic.ImageBlockParam; hash: string } | null {
  if (/^https:\/\//i.test(url)) return { block: { type: 'image', source: { type: 'url', url } }, hash: createHash('sha256').update(url).digest('hex') }
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
    style_tags: [...new Set(a.style_tags.map((t) => t.trim().toLowerCase().replace(/[^a-z -]/g, '')).filter((t) => t && t.length <= 20))].slice(0, 5),
    description: a.description.trim().split(/\s+/).slice(0, 24).join(' '),
  }
}

export async function describeProduct(slugOrId: string, opts: { llm?: LlmClient; sink?: TraceSink; force?: boolean } = {}): Promise<DescribeResult> {
  const p = await prisma.clothingProduct.findFirst({ where: { OR: [{ slug: slugOrId }, { id: slugOrId }] }, select: { id: true, slug: true, primaryImageUrl: true, visual: { select: { imageHash: true } } } })
  if (!p) return { slug: slugOrId, status: 'error', costUsd: 0, error: 'not found' }
  const src = p.primaryImageUrl ? imageSource(p.primaryImageUrl) : null
  if (!src) return { slug: p.slug, status: 'no_image', costUsd: 0 }
  const imageHash = createHash('sha256').update(`${VISION_VERSION}|${src.hash}`).digest('hex')
  if (!opts.force && p.visual?.imageHash === imageHash) return { slug: p.slug, status: 'unchanged', costUsd: 0 }

  const r = await runAgent(makeVisionAgent(), [src.block, { type: 'text', text: 'Describe this product photo, then call finish.' }], { llm: opts.llm, sink: opts.sink, graph: 'describe-image', productId: p.id, inputsHash: imageHash })
  if (r.status !== 'OK' || !r.finish) return { slug: p.slug, status: 'error', costUsd: r.totals.costUsd, error: r.status }
  const attributes = normaliseVisual(r.finish)
  if (!attributes.is_clothing) return { slug: p.slug, status: 'not_clothing', attributes, costUsd: r.totals.costUsd }
  const data = { imageUrl: p.primaryImageUrl!, imageHash, attributes: attributes as unknown as Prisma.InputJsonValue, runId: r.runId, costUsd: new Prisma.Decimal(r.totals.costUsd) }
  await prisma.productVisual.upsert({ where: { productId: p.id }, update: data, create: { ...data, productId: p.id } })
  return { slug: p.slug, status: 'described', attributes, costUsd: r.totals.costUsd }
}
