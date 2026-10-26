/**
 * Ingest engine (B10): validates feed rows, upserts them for one tenant, and writes a report.
 * - Idempotent: everything is keyed by the platform's own ids, so re-sending a file changes nothing.
 * - Price history: each catalog import records one price snapshot per product, seller and day.
 * - Dry run: validates and resolves references, writes nothing except the report.
 * Scores are NOT recomputed here; the rating graph picks up changed inputs via its inputs hash.
 */
import { createHash } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { scanInjection } from '../harness/guardrails'
import {
  FEEDS,
  coloursFromTitle,
  fitFromTitle,
  normaliseCategory,
  normaliseFitAnswer,
  normaliseGender,
  normaliseReturnReason,
  parseMaterials,
  silhouetteFromTitle,
  type CatalogRow,
  type FeedKind,
  type ReturnRow,
  type ReviewRow,
} from './contract'

export const MAX_ROWS = 5000
const MAX_ERRORS_IN_REPORT = 50

export type IngestError = { row: number; field?: string; message: string }
export type IngestReport = {
  runId: string | null
  kind: FeedKind
  dryRun: boolean
  rows: number
  accepted: number
  rejected: number
  created: number
  updated: number
  unchanged: number
  /** Products whose inputs changed: the next rating run re-scores exactly these. */
  productsChanged: number
  /** Products with a new or changed photo: the photo agent reads these right after the upload (B17). */
  photosToRead: number
  errors: IngestError[]
}

type Ctx = { tenantId: string; tenantSlug: string; tenantName: string; source: string; licence: string | null; dryRun: boolean; now: Date }

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const short = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 8)
const dayStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

function validate<K extends FeedKind>(kind: K, raw: unknown[]) {
  const ok: { row: number; data: K extends 'catalog' ? CatalogRow : K extends 'reviews' ? ReviewRow : ReturnRow }[] = []
  const errors: IngestError[] = []
  raw.forEach((r, i) => {
    const parsed = FEEDS[kind].safeParse(r)
    if (parsed.success) ok.push({ row: i + 1, data: parsed.data as never })
    else for (const issue of parsed.error.issues.slice(0, 3)) errors.push({ row: i + 1, field: issue.path.join('.') || undefined, message: issue.message })
  })
  return { ok, errors }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

async function ingestCatalog(rows: { row: number; data: CatalogRow }[], ctx: Ctx, errors: IngestError[]) {
  let created = 0
  let updated = 0
  let unchanged = 0
  const changed = new Set<string>()
  const photos = new Set<string>()

  // A product may appear once per seller (marketplace offers): product fields from the first row, a price per seller.
  const byProduct = new Map<string, { row: number; data: CatalogRow }[]>()
  for (const r of rows) {
    const cat = normaliseCategory(r.data.category, r.data.title)
    if (!cat) {
      errors.push({ row: r.row, field: 'category', message: `"${r.data.category}" is not scored yet (Veritas scores t-shirts, shirts and jeans for now)` })
      continue
    }
    byProduct.set(r.data.external_id, [...(byProduct.get(r.data.external_id) ?? []), r])
  }

  const day = dayStart(ctx.now)
  for (const [externalId, offers] of byProduct) {
    const d = offers[0].data
    const cat = normaliseCategory(d.category, d.title)!
    const materials = parseMaterials(d.materials)
    const colours = d.colors.length ? d.colors : coloursFromTitle(d.title)
    const fields = {
      name: d.title,
      category: cat.category,
      subcategory: cat.subcategory,
      gender: normaliseGender(d.gender),
      description: d.description ?? null,
      currentPrice: new Prisma.Decimal(Math.min(...offers.map((o) => o.data.price))),
      currency: d.currency,
      sizes: d.sizes,
      colors: colours,
      materials,
      fabricWeightGsm: d.fabric_gsm ?? null,
      elastanePct: Object.entries(materials).find(([k]) => /elastane|spandex|lycra/.test(k))?.[1] ?? (Object.keys(materials).length ? 0 : null),
      fitType: fitFromTitle(d.title),
      silhouette: silhouetteFromTitle(d.title, cat.subcategory),
      careInstructions: d.care ?? null,
      url: d.url,
      primaryImageUrl: d.image_url ?? null,
      images: d.image_url ? [d.image_url] : [],
      unitsSold: d.units_sold ?? null,
      source: ctx.source,
      licence: ctx.licence,
    }

    const existing = await prisma.clothingProduct.findUnique({ where: { tenantId_externalId: { tenantId: ctx.tenantId, externalId } } })
    if (ctx.dryRun) {
      if (existing) updated++
      else created++
      continue
    }

    const brandSlug = slugify(d.brand)
    const brand = await prisma.brand.upsert({ where: { slug: brandSlug }, update: {}, create: { slug: brandSlug, name: d.brand, source: ctx.source, licence: ctx.licence } })

    let productId: string
    if (!existing) {
      const p = await prisma.clothingProduct.create({
        data: {
          ...fields,
          tenantId: ctx.tenantId,
          isPrivate: true,
          externalId,
          brandId: brand.id,
          slug: `${slugify(`${d.brand} ${d.title}`).slice(0, 80)}-${short(`${ctx.tenantId}|${externalId}`)}`,
          sku: `${ctx.tenantSlug}:${externalId}`.slice(0, 190),
        },
      })
      productId = p.id
      created++
      changed.add(productId)
      if (fields.primaryImageUrl) photos.add(productId)
    } else {
      productId = existing.id
      const same =
        existing.name === fields.name &&
        existing.brandId === brand.id &&
        Number(existing.currentPrice) === Number(fields.currentPrice) &&
        JSON.stringify([existing.sizes, existing.colors, existing.materials, existing.gender, existing.careInstructions, existing.fabricWeightGsm, existing.unitsSold, existing.url, existing.primaryImageUrl, existing.description]) ===
          JSON.stringify([fields.sizes, fields.colors, fields.materials, fields.gender, fields.careInstructions, fields.fabricWeightGsm, fields.unitsSold, fields.url, fields.primaryImageUrl, fields.description])
      if (same) unchanged++
      else {
        await prisma.clothingProduct.update({ where: { id: productId }, data: { ...fields, brandId: brand.id } })
        updated++
        changed.add(productId)
        if (fields.primaryImageUrl && fields.primaryImageUrl !== existing.primaryImageUrl) photos.add(productId)
      }
    }

    // One price snapshot per product, seller and day (re-sending the same day overwrites, never duplicates).
    for (const o of offers) {
      const sellerExt = o.data.seller_id ?? '_store'
      const seller = await prisma.seller.upsert({
        where: { tenantId_externalId: { tenantId: ctx.tenantId, externalId: sellerExt } },
        update: o.data.seller_name ? { name: o.data.seller_name } : {},
        create: {
          tenantId: ctx.tenantId,
          externalId: sellerExt,
          name: o.data.seller_name ?? (sellerExt === '_store' ? ctx.tenantName : sellerExt),
          slug: `${ctx.tenantSlug}-${slugify(sellerExt) || 'store'}-${short(sellerExt)}`,
          source: ctx.source,
          licence: ctx.licence,
        },
      })
      const price = new Prisma.Decimal(o.data.price)
      const listPrice = o.data.list_price && o.data.list_price > o.data.price ? new Prisma.Decimal(o.data.list_price) : null
      const prev = await prisma.priceSnapshot.findUnique({ where: { productId_sellerId_observedAt: { productId, sellerId: seller.id, observedAt: day } } })
      if (prev && Number(prev.price) === Number(price) && Number(prev.listPrice ?? 0) === Number(listPrice ?? 0)) continue
      await prisma.priceSnapshot.upsert({
        where: { productId_sellerId_observedAt: { productId, sellerId: seller.id, observedAt: day } },
        update: { price, listPrice, isPromo: !!listPrice },
        create: { productId, sellerId: seller.id, price, listPrice, isPromo: !!listPrice, currency: o.data.currency, observedAt: day, source: ctx.source, licence: ctx.licence },
      })
      changed.add(productId)
    }
  }
  return { created, updated, unchanged, changed, photos }
}

// ---------------------------------------------------------------------------
// Reviews and returns
// ---------------------------------------------------------------------------

async function productIds(ctx: Ctx, externalIds: string[]) {
  const rows = await prisma.clothingProduct.findMany({ where: { tenantId: ctx.tenantId, externalId: { in: [...new Set(externalIds)] } }, select: { id: true, externalId: true } })
  return new Map(rows.map((r) => [r.externalId!, r.id]))
}

async function ingestReviews(rows: { row: number; data: ReviewRow }[], ctx: Ctx, errors: IngestError[]) {
  let created = 0
  let updated = 0
  let unchanged = 0
  const changed = new Set<string>()
  const ids = await productIds(ctx, rows.map((r) => r.data.product_external_id))
  for (const { row, data: d } of rows) {
    const productId = ids.get(d.product_external_id)
    if (!productId) {
      errors.push({ row, field: 'product_external_id', message: `unknown product "${d.product_external_id}" (send it in the catalog feed first)` })
      continue
    }
    const fields = {
      title: d.title ?? null,
      content: d.text,
      rating: d.rating,
      language: d.language ?? 'en',
      reviewDate: d.date,
      isVerifiedPurchase: d.verified,
      sizePurchased: d.size_bought ?? null,
      fitsAs: normaliseFitAnswer(d.fit_answer),
      heightCm: d.height_cm ?? null,
      bodyType: d.body_type?.toLowerCase() ?? null,
      // Flag manipulation attempts at the door; the rating graph down-weights them.
      injectionFlag: scanInjection(`${d.title ?? ''}\n${d.text}`).flagged,
      source: ctx.source,
      licence: ctx.licence,
    }
    const existing = await prisma.clothingReview.findUnique({ where: { productId_externalId: { productId, externalId: d.external_id } } })
    if (existing && existing.content === fields.content && existing.rating === fields.rating && existing.fitsAs === fields.fitsAs && existing.reviewDate.getTime() === fields.reviewDate.getTime()) {
      unchanged++
      continue
    }
    if (!ctx.dryRun) {
      await prisma.clothingReview.upsert({ where: { productId_externalId: { productId, externalId: d.external_id } }, update: fields, create: { ...fields, productId, externalId: d.external_id } })
      changed.add(productId)
    }
    if (existing) updated++
    else created++
  }
  return { created, updated, unchanged, changed }
}

async function ingestReturns(rows: { row: number; data: ReturnRow }[], ctx: Ctx, errors: IngestError[]) {
  let created = 0
  let updated = 0
  let unchanged = 0
  const changed = new Set<string>()
  const ids = await productIds(ctx, rows.map((r) => r.data.product_external_id))
  for (const { row, data: d } of rows) {
    const productId = ids.get(d.product_external_id)
    if (!productId) {
      errors.push({ row, field: 'product_external_id', message: `unknown product "${d.product_external_id}" (send it in the catalog feed first)` })
      continue
    }
    const { reason, category } = normaliseReturnReason(d.reason)
    const fields = { returnReason: reason as never, returnCategory: category as never, detailedReason: d.reason, sizePurchased: d.size ?? null, returnDate: d.date, source: ctx.source, licence: ctx.licence }
    const existing = await prisma.returnEvent.findUnique({ where: { productId_externalId: { productId, externalId: d.external_id } } })
    if (existing && existing.returnReason === reason && existing.detailedReason === d.reason) {
      unchanged++
      continue
    }
    if (!ctx.dryRun) {
      await prisma.returnEvent.upsert({ where: { productId_externalId: { productId, externalId: d.external_id } }, update: fields, create: { ...fields, productId, externalId: d.external_id } })
      changed.add(productId)
    }
    if (existing) updated++
    else created++
  }
  return { created, updated, unchanged, changed }
}

// ---------------------------------------------------------------------------

export async function ingest(input: { tenantId: string; kind: FeedKind; rows: unknown[]; source: string; licence?: string | null; dryRun?: boolean; now?: Date }): Promise<IngestReport & { photoProductIds: string[] }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId }, select: { id: true, slug: true, name: true } })
  if (!tenant) throw new Error('Unknown tenant')
  if (input.rows.length > MAX_ROWS) throw new Error(`Too many rows: ${input.rows.length} (max ${MAX_ROWS} per upload; split the file)`)
  const ctx: Ctx = { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, source: input.source, licence: input.licence ?? null, dryRun: !!input.dryRun, now: input.now ?? new Date() }

  const { ok, errors } = validate(input.kind, input.rows)
  const r =
    input.kind === 'catalog'
      ? await ingestCatalog(ok as { row: number; data: CatalogRow }[], ctx, errors)
      : input.kind === 'reviews'
        ? await ingestReviews(ok as { row: number; data: ReviewRow }[], ctx, errors)
        : await ingestReturns(ok as { row: number; data: ReturnRow }[], ctx, errors)

  const rejectedRows = new Set(errors.map((e) => e.row)).size
  const report: IngestReport = {
    runId: null,
    kind: input.kind,
    dryRun: ctx.dryRun,
    rows: input.rows.length,
    accepted: input.rows.length - rejectedRows,
    rejected: rejectedRows,
    created: r.created,
    updated: r.updated,
    unchanged: r.unchanged,
    productsChanged: r.changed.size,
    photosToRead: 'photos' in r ? (r.photos as Set<string>).size : 0,
    errors: errors.sort((a, b) => a.row - b.row).slice(0, MAX_ERRORS_IN_REPORT),
  }
  const run = await prisma.ingestRun.create({
    data: { tenantId: ctx.tenantId, kind: input.kind, source: ctx.source, licence: ctx.licence, dryRun: ctx.dryRun, rows: report.rows, accepted: report.accepted, rejected: report.rejected, report: report as unknown as Prisma.InputJsonValue },
  })
  return { ...report, runId: run.id, photoProductIds: 'photos' in r ? [...(r.photos as Set<string>)] : [] }
}
