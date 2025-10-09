#!/bin/bash
# Seed real market products to DEV database

export DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public"

echo "🎯 Seeding REAL market products to DEV database"
echo "================================================"
echo ""

npx tsx scripts/seed-real-products.ts
