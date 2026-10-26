/** Outreach tracker values (B13). Company-level only; no personal contact data. */
import { z } from 'zod'

export const OUTREACH_STATUSES = ['target', 'contacted', 'replied', 'pilot', 'won', 'lost'] as const
export const OUTREACH_KINDS = ['brand', 'marketplace', 'retailer'] as const

const site = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v), 'Use a full website address (https://…)')
  .transform((v) => v || null)

export const outreachCreate = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(OUTREACH_KINDS),
  segment: z.string().trim().max(120).optional().transform((v) => v || null),
  website: site.optional(),
  nextStep: z.string().trim().max(300).optional().transform((v) => v || null),
  owner: z.string().trim().max(80).optional().transform((v) => v || null),
})

export const outreachUpdate = z
  .object({
    status: z.enum(OUTREACH_STATUSES).optional(),
    scorecardSent: z.boolean().optional(),
    nextStep: z.string().trim().max(300).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'Nothing to update')

/** Who to approach first (shown on the tracker). Matches the product plan's starting categories. */
export const TARGET_CRITERIA = [
  'Sells t-shirts or jeans (the categories we score today)',
  'Has its own reviews and return reasons (or sells on a platform that shares them)',
  'Brands: 50–2,500 products, DTC or multi-channel; marketplaces/retailers: many vendors of the same item types',
  'Visible fit or quality complaints in public reviews (a scorecard can show the fix)',
]
