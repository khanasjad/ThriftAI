#!/bin/bash
# Scrape products directly to DEV database

export DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public"

echo "🎯 Scraping to DEV database: thriftai_nextjs_dev"
echo "================================================"
echo ""

npx tsx scripts/scrape-and-enrich-products.ts --target 1000
