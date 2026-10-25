/**
 * GET / PUT / DELETE /api/v1/profile — the shopper's optional fit profile for this browser.
 * Built only from what the shopper enters; deletable in one click (product plan, "Privacy").
 */
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { fail, ok, rateLimit, sessionId, zodFail } from '@/lib/veritas/http'

const PILLARS = ['FIT', 'QUALITY', 'STYLE_VALUE', 'COMFORT', 'SUSTAINABILITY'] as const
const slug = z.string().regex(/^[a-z0-9-]{1,64}$/)

const profileSchema = z.object({
  heightCm: z.number().int().min(120).max(220).nullable(),
  bodyType: z.enum(['slim', 'average', 'athletic', 'curvy', 'plus']).nullable(),
  preferredFit: z.enum(['slim', 'regular', 'relaxed', 'oversized']).nullable(),
  sizeTops: z.string().max(8).nullable(),
  sizeBottoms: z.string().max(8).nullable(),
  climate: z.enum(['hot', 'mild', 'cold', 'varies']).nullable(),
  budgetMax: z.number().int().min(5).max(5000).nullable(),
  priorities: z.array(z.enum(PILLARS)).max(5),
  brandDeny: z.array(slug).max(50),
  sustainabilityOn: z.boolean(),
})

const toResponse = (p: Awaited<ReturnType<typeof prisma.shopperProfile.findUnique>>) =>
  p && {
    heightCm: p.heightCm,
    bodyType: p.bodyType,
    preferredFit: p.preferredFit,
    sizeTops: (p.sizePreferences as { tops?: string } | null)?.tops ?? null,
    sizeBottoms: (p.sizePreferences as { bottoms?: string } | null)?.bottoms ?? null,
    climate: p.climate,
    budgetMax: p.budgetMax,
    priorities: Object.keys((p.priorities as Record<string, number> | null) ?? {}),
    brandDeny: p.brandDeny,
    sustainabilityOn: p.sustainabilityOn,
    updatedAt: p.updatedAt,
  }

export async function GET() {
  const p = await prisma.shopperProfile.findUnique({ where: { sessionId: await sessionId() } })
  return ok(toResponse(p))
}

export async function PUT(req: Request) {
  if (!(await rateLimit('profile', 30, 60_000))) return fail(429, 'Too many requests')
  const parsed = profileSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return zodFail(parsed.error)
  const d = parsed.data
  const sid = await sessionId()
  const data = {
    heightCm: d.heightCm,
    bodyType: d.bodyType,
    preferredFit: d.preferredFit,
    sizePreferences: { ...(d.sizeTops && { tops: d.sizeTops }), ...(d.sizeBottoms && { bottoms: d.sizeBottoms }) },
    climate: d.climate,
    budgetMax: d.budgetMax,
    priorities: Object.fromEntries(d.priorities.map((p) => [p, 1.5])),
    brandDeny: d.brandDeny,
    sustainabilityOn: d.sustainabilityOn,
  }
  const p = await prisma.shopperProfile.upsert({ where: { sessionId: sid }, create: { sessionId: sid, ...data }, update: data })
  return ok(toResponse(p))
}

export async function DELETE() {
  const { count } = await prisma.shopperProfile.deleteMany({ where: { sessionId: await sessionId() } })
  return ok({ deleted: count > 0 })
}
