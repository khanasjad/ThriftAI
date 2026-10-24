#!/usr/bin/env node
// Runs a command with the same env files Next.js uses.
// APP_ENV=production loads .env.production(.local); anything else loads .env.development(.local).
// Usage: node scripts/with-env.mjs <command> [...args]
import { spawnSync } from 'node:child_process'
import nextEnv from '@next/env'

const isProd = process.env.APP_ENV === 'production'
nextEnv.loadEnvConfig(process.cwd(), !isProd)

const [cmd, ...args] = process.argv.slice(2)
if (!cmd) {
  console.error('Usage: node scripts/with-env.mjs <command> [...args]')
  process.exit(1)
}
const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(result.status ?? 1)
