-- Open second-hand data (B21): expert inspection grades per physical item.
ALTER TABLE "clothing_products" ADD COLUMN "inspection" JSONB;
