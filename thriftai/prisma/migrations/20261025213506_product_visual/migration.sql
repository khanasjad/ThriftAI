-- CreateTable
CREATE TABLE "public"."product_visuals" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "runId" TEXT,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_visuals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_visuals_productId_key" ON "public"."product_visuals"("productId");

-- AddForeignKey
ALTER TABLE "public"."product_visuals" ADD CONSTRAINT "product_visuals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

