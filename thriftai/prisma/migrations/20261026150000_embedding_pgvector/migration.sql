-- B18b: photo fingerprints move to pgvector (vector(768) + HNSW index for nearest-neighbour search at catalog scale).
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "product_embeddings" ADD COLUMN "embedding" vector(768);
UPDATE "product_embeddings" SET "embedding" = "vector"::vector(768) WHERE "vector" IS NOT NULL;
ALTER TABLE "product_embeddings" DROP COLUMN "vector";

CREATE INDEX "product_embeddings_embedding_idx" ON "product_embeddings" USING hnsw ("embedding" vector_cosine_ops);
