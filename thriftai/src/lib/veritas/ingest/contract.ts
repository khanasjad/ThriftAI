/**
 * The data contract for platforms and brands (B10): three simple feeds, validated row by row.
 * Values arrive messy (CSV strings, vendor wording), so each field is normalised here, in code, with tests.
 * Spec for humans: docs/rpi/04-PLAN-B2B.md §5 and the /developers page.
 */
import { z } from 'zod'

const str = (max = 500) => z.string().trim().min(1).max(max)
const optStr = (max = 500) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined))
const money = z.coerce.number().positive().max(100_000)
const optMoney = z.union([z.literal(''), z.coerce.number().positive().max(100_000)]).optional().transform((v) => (v === '' || v === undefined ? undefined : v))
const optInt = (max: number) => z.union([z.literal(''), z.coerce.number().int().min(0).max(max)]).optional().transform((v) => (v === '' || v === undefined ? undefined : v))
/** Lists in CSV are "a|b|c"; JSON may send arrays. */
const list = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) => (Array.isArray(v) ? v : (v ?? '').split('|')).map((x) => x.trim()).filter(Boolean))
const date = z
  .union([z.string(), z.date()])
  .transform((v, ctx) => {
    const d = v instanceof Date ? v : new Date(v)
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'not a date (use YYYY-MM-DD)' })
      return z.NEVER
    }
    return d
  })

export const catalogRow = z.object({
  external_id: str(200),
  title: str(300),
  brand: str(120),
  category: str(120),
  price: money,
  currency: z.string().trim().length(3).optional().default('USD'),
  url: z.string().trim().url().max(1000),
  seller_id: optStr(200),
  seller_name: optStr(200),
  gender: optStr(40),
  list_price: optMoney,
  sizes: list,
  colors: list,
  /** "cotton:95|elastane:5" or {"cotton":95} */
  materials: z.union([z.record(z.coerce.number()), z.string()]).optional(),
  image_url: z.string().trim().url().max(1000).optional().or(z.literal('').transform(() => undefined)),
  care: optStr(300),
  description: optStr(2000),
  fabric_gsm: optInt(1000),
  units_sold: optInt(10_000_000),
})
export type CatalogRow = z.infer<typeof catalogRow>

export const reviewRow = z.object({
  external_id: str(200),
  product_external_id: str(200),
  rating: z.coerce.number().int().min(1).max(5),
  text: str(5000),
  date,
  title: optStr(300),
  verified: z.union([z.boolean(), z.string()]).optional().transform((v) => v === true || /^(1|true|yes|y)$/i.test(String(v ?? ''))),
  size_bought: optStr(20),
  fit_answer: optStr(40),
  height_cm: optInt(250),
  body_type: optStr(40),
  language: optStr(10),
})
export type ReviewRow = z.infer<typeof reviewRow>

export const returnRow = z.object({
  external_id: str(200),
  product_external_id: str(200),
  reason: str(200),
  date,
  size: optStr(20),
})
export type ReturnRow = z.infer<typeof returnRow>

export const FEEDS = { catalog: catalogRow, reviews: reviewRow, returns: returnRow } as const
export type FeedKind = keyof typeof FEEDS

// ---------------------------------------------------------------------------
// Normalisers (vendor wording → our values)
// ---------------------------------------------------------------------------

/** Product plan: tees and jeans only for now. Anything else is reported, not guessed. */
export function normaliseCategory(category: string, title: string): { category: 'TOPS' | 'BOTTOMS'; subcategory: 'tee' | 'jeans' } | null {
  const t = `${category} ${title}`.toLowerCase()
  if (/\b(jeans?|denim)\b/.test(t)) return { category: 'BOTTOMS', subcategory: 'jeans' }
  if (/\b(t-?shirts?|tees?|tshirts?)\b/.test(t)) return { category: 'TOPS', subcategory: 'tee' }
  return null
}

export function normaliseGender(g: string | undefined): 'WOMENS' | 'MENS' | 'UNISEX' {
  const t = (g ?? '').toLowerCase().trim()
  if (/^(w|f|women|womens|women's|woman|ladies|female)$/.test(t)) return 'WOMENS'
  if (/^(m|men|mens|men's|man|male)$/.test(t)) return 'MENS'
  return 'UNISEX'
}

export function normaliseFitAnswer(f: string | undefined): 'runs_small' | 'true_to_size' | 'runs_large' | null {
  const t = (f ?? '').toLowerCase()
  if (!t) return null
  if (/small|tight|size up/.test(t)) return 'runs_small'
  if (/large|big|loose|size down/.test(t)) return 'runs_large'
  if (/true|tts|as expected|perfect|fits/.test(t)) return 'true_to_size'
  return null
}

const REASONS: [RegExp, string][] = [
  [/too small|small|tight/, 'TOO_SMALL'],
  [/too (large|big)|large|big|loose/, 'TOO_LARGE'],
  [/fit/, 'POOR_FIT'],
  [/defect|damag|broken|hole|tear/, 'DAMAGE_DEFECT'],
  [/quality|cheap|thin|pill|shrank|shrink|fade/, 'POOR_QUALITY'],
  [/colou?r/, 'COLOR_MISMATCH'],
  [/not as (described|pictured)|different|photo|picture/, 'NOT_AS_DESCRIBED'],
  [/wrong item|wrong product/, 'WRONG_ITEM'],
  [/style|didn.?t like|look/, 'STYLE_DISLIKE'],
  [/changed? (my )?mind|no longer|not needed|ordered by mistake/, 'CHANGED_MIND'],
]
export function normaliseReturnReason(r: string): { reason: string; category: 'FIT' | 'QUALITY' | 'STYLE' | 'OTHER' } {
  const t = r.toLowerCase()
  const upper = r.trim().toUpperCase().replace(/[\s-]+/g, '_')
  const reason = REASONS.find(([re]) => re.test(t))?.[1] ?? (['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT', 'POOR_QUALITY', 'NOT_AS_DESCRIBED', 'COLOR_MISMATCH', 'STYLE_DISLIKE', 'DAMAGE_DEFECT', 'WRONG_ITEM', 'CHANGED_MIND'].includes(upper) ? upper : 'OTHER')
  const category = ['TOO_SMALL', 'TOO_LARGE', 'POOR_FIT'].includes(reason) ? 'FIT' : ['POOR_QUALITY', 'DAMAGE_DEFECT'].includes(reason) ? 'QUALITY' : ['NOT_AS_DESCRIBED', 'COLOR_MISMATCH', 'STYLE_DISLIKE'].includes(reason) ? 'STYLE' : 'OTHER'
  return { reason, category }
}

export function parseMaterials(m: CatalogRow['materials']): Record<string, number> {
  if (!m) return {}
  if (typeof m === 'object') return m
  return Object.fromEntries(
    m
      .split('|')
      .map((x) => x.split(':').map((y) => y.trim()))
      .filter(([k, v]) => k && v && !Number.isNaN(Number(v)))
      .map(([k, v]) => [k.toLowerCase(), Number(v)]),
  )
}

// "Catalog cleaner", code part: attributes from messy titles when the feed doesn't send them.
const COLOUR_WORDS = ['black', 'white', 'ecru', 'oatmeal', 'heather grey', 'grey', 'gray', 'navy', 'sage', 'washed red', 'red', 'blue', 'green', 'beige', 'brown', 'pink', 'light vintage', 'mid wash', 'indigo rinse', 'indigo']
export function coloursFromTitle(title: string): string[] {
  const t = ` ${title.toLowerCase()} `
  const found: string[] = []
  for (const c of COLOUR_WORDS) if (t.includes(` ${c} `) && !found.some((f) => f.includes(c))) found.push(c)
  return found.map((c) => c.replace(/\b\w/g, (x) => x.toUpperCase()))
}
export function fitFromTitle(title: string): 'slim' | 'regular' | 'relaxed' | 'oversized' | null {
  const t = title.toLowerCase()
  if (/oversized|boxy/.test(t)) return 'oversized'
  if (/relaxed|loose|baggy|wide/.test(t)) return 'relaxed'
  if (/slim|skinny|fitted/.test(t)) return 'slim'
  if (/regular|classic|straight|crew/.test(t)) return 'regular'
  return null
}
export function silhouetteFromTitle(title: string, sub: 'tee' | 'jeans'): string | null {
  const t = title.toLowerCase()
  if (sub === 'tee') return /v-?neck/.test(t) ? 'v-neck-tee' : /boxy|oversized/.test(t) ? 'boxy-tee' : /longline|long line/.test(t) ? 'longline-tee' : /crew/.test(t) ? 'crew-tee' : 'crew-tee'
  return /wide/.test(t) ? 'wide-leg' : /bootcut|boot cut|flare/.test(t) ? 'bootcut' : /skinny/.test(t) ? 'skinny' : /taper/.test(t) ? 'slim-taper' : /straight/.test(t) ? 'straight' : null
}
