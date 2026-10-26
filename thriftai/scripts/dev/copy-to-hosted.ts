/**
 * Copy the local development database (fictional data, ratings, evidence, traces) to the hosted dev database.
 * Saves re-rating everything there (~$0.40). Development only.
 *   npm run dev:hosted:copy            # shows what would happen
 *   npm run dev:hosted:copy -- --yes   # replaces the hosted dev database's contents with the local copy
 * Needs pg_dump + psql, and .env.hosted.local with DIRECT_URL (Supabase direct connection) and ALLOW_HOSTED_DEV_DB=1.
 * Refuses if the target holds anything that isn't fixture data, or looks like production.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createPrismaClient } from '@/lib/prisma'

function fail(msg: string): never {
  console.error(`✖ ${msg}`)
  process.exit(1)
}
const readEnv = (file: string) =>
  existsSync(file) ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m![1], m![2].replace(/^["']|["']$/g, '')])) : {}

/** pg_dump/psql (libpq) reject Prisma-only URL options such as ?schema=, ?pgbouncer=, ?connection_limit=. */
function libpqUrl(url: string) {
  const u = new URL(url)
  for (const k of ['schema', 'pgbouncer', 'connection_limit', 'pool_timeout']) u.searchParams.delete(k)
  return u.toString()
}

async function main() {
  if (process.env.APP_ENV === 'production') fail('Development only.')
  const local = { ...readEnv('.env.development'), ...readEnv('.env.development.local') }.DATABASE_URL
  const hosted = readEnv('.env.hosted.local')
  const target = hosted.DIRECT_URL ?? hosted.DATABASE_URL
  if (!local || !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(local)) fail('Local DATABASE_URL not found in .env.development(.local).')
  if (!target) fail('.env.hosted.local needs DIRECT_URL (the Supabase dev project’s direct connection).')
  if (hosted.ALLOW_HOSTED_DEV_DB !== '1') fail('.env.hosted.local must set ALLOW_HOSTED_DEV_DB=1 (confirms it is the dev project, not production).')
  if (hosted.APP_ENV === 'production') fail('.env.hosted.local must not be production.')
  const host = new URL(target).hostname
  console.log(`From: local veritas_dev  →  To: hosted dev database at ${host}`)

  // Safety: the target may be empty or hold fixture data only.
  const prisma = createPrismaClient(target)
  try {
    const foreign = await prisma.clothingProduct.count({ where: { source: { not: 'dev-fixture' } } }).catch(() => 0)
    if (foreign > 0) fail(`Target has ${foreign} products that are not fixture data. Refusing (is this production?).`)
  } finally {
    await prisma.$disconnect()
  }
  if (!process.argv.includes('--yes')) return console.log('Nothing copied. Add --yes to replace the hosted dev database contents with the local copy.')

  const dump = spawnSync('pg_dump', ['--no-owner', '--no-acl', '--clean', '--if-exists', '--schema=public', libpqUrl(local)], { maxBuffer: 1024 * 1024 * 512 })
  if (dump.status !== 0) fail(`pg_dump failed: ${dump.stderr.toString().slice(0, 300)}`)
  // Keep Supabase's own public schema (and its role grants): drop/recreate tables one by one, never the schema.
  const sql = dump.stdout
    .toString()
    .split('\n')
    .filter((l) => !/^(DROP SCHEMA IF EXISTS public;|CREATE SCHEMA public;|COMMENT ON SCHEMA public IS)/.test(l))
    .join('\n')
  const load = spawnSync('psql', ['--quiet', '--set', 'ON_ERROR_STOP=1', libpqUrl(target)], { input: sql, maxBuffer: 1024 * 1024 * 64 })
  if (load.status !== 0) fail(`psql failed: ${load.stderr.toString().slice(0, 300)}`)
  console.log(`✓ Copied (${(dump.stdout.length / 1e6).toFixed(1)} MB). Rotate the dev sign-in passwords there: DEV_TARGET=hosted npm run seed:accounts`)
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
