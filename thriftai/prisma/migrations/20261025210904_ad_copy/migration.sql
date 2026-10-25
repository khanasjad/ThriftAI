-- CreateTable
CREATE TABLE "public"."ad_copies" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "inputsHash" TEXT NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "runIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_copies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_copies_productId_key" ON "public"."ad_copies"("productId");

-- AddForeignKey
ALTER TABLE "public"."ad_copies" ADD CONSTRAINT "ad_copies_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

