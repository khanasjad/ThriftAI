#!/bin/bash
cd "$(dirname "$0")/.."
export DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public"
npx tsx scripts/enrich-with-real-images.ts
