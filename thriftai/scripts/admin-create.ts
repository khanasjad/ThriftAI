/**
 * Create (or reset) an admin account, including in production, without printing the password.
 *   ADMIN_PASSWORD='…' npm run admin:create -- --email you@company.com      # you choose the password
 *   npm run admin:create -- --email you@company.com --out ./admin-password.txt  # generated, written to a file (mode 600)
 * The password is never echoed. Delete the file once you've stored the password in a password manager.
 */
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const email = arg('email')?.toLowerCase().trim()
  const out = arg('out')
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Usage: npm run admin:create -- --email you@company.com [--out file]')
  if (email.endsWith('@veritas.test')) throw new Error('@veritas.test is reserved for dev accounts.')
  let password = process.env.ADMIN_PASSWORD
  if (password && password.length < 14) throw new Error('ADMIN_PASSWORD must be at least 14 characters.')
  if (!password) {
    if (!out) throw new Error('Set ADMIN_PASSWORD, or pass --out <file> to write a generated password to a file.')
    password = randomBytes(18).toString('base64url')
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.upsert({ where: { email }, update: { passwordHash, role: 'ADMIN' }, create: { email, passwordHash, role: 'ADMIN' } })
  if (out && !process.env.ADMIN_PASSWORD) {
    writeFileSync(out, `${email}\n${password}\n`, { mode: 0o600 })
    console.log(`Admin ${email} ready. Generated password written to ${out} (readable only by you). Store it, then delete the file.`)
  } else console.log(`Admin ${email} ready with the password you provided.`)
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
