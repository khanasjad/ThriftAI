import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

/**
 * Real open data (CC0 reviews, CC BY photos) lives in its own tenant. In development OPEN_DATA_PUBLIC (default on)
 * shows it to everyone, labelled "Open data"; it is never in the sitemap and its pages are not indexed.
 */
const file = join(process.cwd(), '.veritas', 'dev-accounts.json')
const account = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).accounts as { email: string; password: string; role: string }[]).find((a) => a.email === 'open-data@veritas.test') : undefined
const SLUG = 'open-data-knit-top-862'

test.describe('open data (private tenant)', () => {
  test.skip(!account, 'open-data tenant not imported (npm run open-data, then npm run seed:accounts)')

  test('signed-out visitors see it in dev, labelled Open data, never in the sitemap', async ({ page, request }) => {
    expect((await request.get(`/p/${SLUG}`)).status()).toBe(200)
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('open-data-')
    await page.goto('/search?q=jeans')
    await expect(page.locator('a[href^="/p/open-data-jeans-"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/· Open data/).first()).toBeVisible()
    await page.goto(`/p/${SLUG}`)
    await expect(page.getByText('Open data · development preview')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('search shows real photographed items in their own row, even when many scored items match', async ({ page }) => {
    await page.route('**/api/v1/search', (r) => r.abort())
    await page.goto('/search?q=tee')
    const row = page.getByRole('region', { name: 'Real photographed items' })
    await expect(row).toBeVisible({ timeout: 20_000 })
    const photo = row.locator('img[src^="/open-images/secondhand/"]').first()
    await photo.scrollIntoViewIfNeeded()
    await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    // No score without reviews: the card shows the sorters' grade instead.
    await expect(row.getByText(/Expert-graded · Condition \d\/5/).first()).toBeVisible()
  })

  test('its own users see the products, real reviews, no made-up price, and the page is not indexed', async ({ page }) => {
    test.setTimeout(60_000)
    await signIn(page, account!, '/dashboard')
    await expect(page.getByText('Knit top #862').first()).toBeVisible({ timeout: 20_000 })
    await page.goto(`/p/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Knit top #862' })).toBeVisible()
    await expect(page.getByText('Open data · development preview')).toBeVisible()
    await expect(page.getByText('No price in the source', { exact: true })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('its users find their own items in search and collections', async ({ page }) => {
    test.setTimeout(90_000)
    await signIn(page, account!, '/dashboard')
    await page.goto('/search?q=jeans')
    await expect(page.locator('a[href^="/p/open-data-jeans-"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('a[href^="/p/secondhand-jeans-"]').first()).toBeVisible()
    await expect(page.getByText(/· Open data/).first()).toBeVisible()
    await page.goto('/collections/soft-and-breathable')
    await expect(page.locator('a[href^="/p/open-data-"]').first()).toBeVisible()
  })

  test('second-hand items show the real photo with its credit and the expert inspection', async ({ page }) => {
    test.setTimeout(60_000)
    const slug = 'secondhand-tee-20221201132514'
    await page.goto(`/p/${slug}`)
    const photo = page.locator('img[src^="/open-images/secondhand/"]').first()
    await expect(photo).toBeVisible()
    expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    await expect(page.getByText('Photo: Wargön Innovation / RISE · CC BY 4.0').first()).toBeVisible()
    await expect(page.getByText('Expert inspection', { exact: true })).toBeVisible()
    await expect(page.getByText('Expert grade:')).toBeVisible()
    await expect(page.getByText('Pilling', { exact: true }).first()).toBeVisible()
  })
})
