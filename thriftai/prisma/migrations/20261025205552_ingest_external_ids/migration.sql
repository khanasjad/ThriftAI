-- DropIndex
DROP INDEX "public"."sellers_name_key";

-- AlterTable
ALTER TABLE "public"."clothing_products" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."clothing_reviews" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."return_events" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."sellers" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "public"."ingest_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "licence" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "rows" INTEGER NOT NULL,
    "accepted" INTEGER NOT NULL,
    "rejected" INTEGER NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingest_runs_tenantId_createdAt_idx" ON "public"."ingest_runs"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_products_tenantId_externalId_key" ON "public"."clothing_products"("tenantId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_reviews_productId_externalId_key" ON "public"."clothing_reviews"("productId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "price_snapshots_productId_sellerId_observedAt_key" ON "public"."price_snapshots"("productId", "sellerId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "return_events_productId_externalId_key" ON "public"."return_events"("productId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_tenantId_externalId_key" ON "public"."sellers"("tenantId", "externalId");

