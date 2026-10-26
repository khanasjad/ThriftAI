/**
 * Prisma CLI config (Prisma 7). The CLI no longer reads .env files: run database commands through
 * `node scripts/with-env.mjs …` (the npm db:* scripts do), which loads the same env files Next.js uses.
 * Migrations use the direct connection (DIRECT_URL) when set; the app itself connects in src/lib/prisma.ts.
 * Read with process.env, not prisma/config's env(): `prisma generate` must work without any database URL.
 */
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
})
