-- B18: photo embeddings for "looks like" search (plain float array; similarity computed in code).
CREATE TABLE "product_embeddings" (
    "productId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "vector" REAL[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_embeddings_pkey" PRIMARY KEY ("productId")
);

ALTER TABLE "product_embeddings" ADD CONSTRAINT "product_embeddings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "clothing_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
