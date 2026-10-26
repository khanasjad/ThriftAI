/**
 * Who can see which products. A platform's imported catalog is private to its tenant (product plan:
 * brand-provided data stays private), marked isPrivate by the ingest. Public pages show only public products;
 * a Score API key sees public products plus its own tenant's private ones.
 */
import type { Prisma } from '@/generated/prisma/client'

export const PUBLIC_PRODUCTS = { isPrivate: false } satisfies Prisma.ClothingProductWhereInput

export function visibleProducts(tenantId: string | null): Prisma.ClothingProductWhereInput {
  return tenantId ? { OR: [PUBLIC_PRODUCTS, { tenantId }] } : PUBLIC_PRODUCTS
}

/** Dashboard scope: a platform or brand user sees their own tenant's products; an admin without a tenant sees public ones. */
export function ownProducts(tenantId: string | null): Prisma.ClothingProductWhereInput {
  return tenantId ? { tenantId } : PUBLIC_PRODUCTS
}
