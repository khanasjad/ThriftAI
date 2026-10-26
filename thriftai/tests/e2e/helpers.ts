import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export async function expectAccessible(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
}

export async function expectNoHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
}

/** Collects uncaught page errors; call the returned function to assert none happened. */
/**
 * Fails on uncaught exceptions and on console errors (hydration mismatches, CSP violations, React warnings).
 * Ignored: failed network requests, which some tests cause on purpose by aborting API routes.
 */
export function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|Failed to fetch/.test(m.text())) errors.push(m.text().slice(0, 300))
  })
  return () => expect(errors).toEqual([])
}

type Account = { email: string; password: string; role: string }
const ACCOUNTS = join(process.cwd(), '.veritas', 'dev-accounts.json')

/** Dev accounts from `npm run seed:accounts`; null when not created yet (auth tests then skip). */
export function devAccount(role: 'ADMIN' | 'BRAND'): Account | null {
  if (!existsSync(ACCOUNTS)) return null
  return (JSON.parse(readFileSync(ACCOUNTS, 'utf8')).accounts as Account[]).find((a) => a.role === role) ?? null
}

export async function signIn(page: Page, a: Account, next: string) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`)
  await page.getByLabel('Email').fill(a.email)
  await page.getByLabel('Password').fill(a.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => u.pathname.startsWith(next))
}
