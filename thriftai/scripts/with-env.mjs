#!/usr/bin/env node
// Runs a command with the same env files Next.js uses.
// APP_ENV=production loads .env.production(.local); anything else loads .env.development(.local).
// Usage: node scripts/with-env.mjs <command> [...args]
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import nextEnv from '@next/env'

const isProd = process.env.APP_ENV === 'production'

// DEV_TARGET=hosted: point development commands at the hosted dev database (Supabase dev project) by loading
// .env.hosted.local first (gitignored; holds that project's URLs and ALLOW_HOSTED_DEV_DB=1). Never with production.
if (process.env.DEV_TARGET === 'hosted') {
  if (isProd) {
    console.error('DEV_TARGET=hosted is for development only.')
    process.exit(1)
  }
  if (!existsSync('.env.hosted.local')) {
    console.error('Missing .env.hosted.local (see docs/rpi/05-RUNBOOK-PRODUCTION.md, "Hosted development").')
    process.exit(1)
  }
  for (const line of readFileSync('.env.hosted.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') // set before Next's loader, which never overrides
  }
  if (process.env.APP_ENV === 'production') {
    console.error('.env.hosted.local must not set APP_ENV=production.')
    process.exit(1)
  }
}
nextEnv.loadEnvConfig(process.cwd(), !isProd)

const [cmd, ...args] = process.argv.slice(2)
if (!cmd) {
  console.error('Usage: node scripts/with-env.mjs <command> [...args]')
  process.exit(1)
}
const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(result.status ?? 1)
