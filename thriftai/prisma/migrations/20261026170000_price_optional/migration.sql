-- Open data (B20): products from sources without prices keep the price empty instead of a made-up value.
ALTER TABLE "clothing_products" ALTER COLUMN "currentPrice" DROP NOT NULL;
