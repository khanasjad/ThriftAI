import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

/** Real open data (CC0) lives in a private tenant: only its own users see it; shoppers never do. */
const file = join(process.cwd(), '.veritas', 'dev-accounts.json')
const account = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).accounts as { email: string; password: string; role: string }[]).find((a) => a.email === 'open-data@veritas.test') : undefined
const SLUG = 'open-data-knit-top-862'

test.describe('open data (private tenant)', () => {
  test.skip(!account, 'open-data tenant not imported (npm run open-data, then npm run seed:accounts)')

  test('shoppers never see it', async ({ page, request }) => {
    expect((await request.get(`/p/${SLUG}`)).status()).toBe(404)
    await page.goto('/search?q=knit+top')
    await expect(page.locator(`a[href="/p/${SLUG}"]`)).toHaveCount(0)
  })

  test('its own users see the products, real reviews, no made-up price, and the page is not indexed', async ({ page }) => {
    test.setTimeout(60_000)
    await signIn(page, account!, '/dashboard')
    await expect(page.getByText('Knit top #862').first()).toBeVisible({ timeout: 20_000 })
    await page.goto(`/p/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Knit top #862' })).toBeVisible()
    await expect(page.getByText('Private · only your organisation sees this')).toBeVisible()
    await expect(page.getByText('No price in the source', { exact: true })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('second-hand items show the real photo with its credit and the expert inspection', async ({ page, request }) => {
    test.setTimeout(60_000)
    const slug = 'secondhand-tee-20221201132514'
    expect((await request.get(`/p/${slug}`)).status()).toBe(404)
    await signIn(page, account!, '/dashboard')
    await page.goto(`/p/${slug}`)
    const photo = page.locator('img[src^="/open-images/secondhand/"]').first()
    await expect(photo).toBeVisible()
    expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    await expect(page.getByText('Photo: Wargön Innovation / RISE · CC BY 4.0').first()).toBeVisible()
    await expect(page.getByText('Expert inspection', { exact: true })).toBeVisible()
    await expect(page.getByText('Pilling', { exact: true }).first()).toBeVisible()
  })
})
