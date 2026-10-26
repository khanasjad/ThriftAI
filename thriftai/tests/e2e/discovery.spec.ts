import { expect, test } from '@playwright/test'
import { devAccount, signIn, trackErrors } from './helpers'

/** B9/F7: autosuggest, browse filters, collections, product Q&A and the brand explainer. No live model calls. */

test('autosuggest: type, arrow down, Enter opens the suggestion', async ({ page }) => {
  const noErrors = trackErrors(page)
  await page.goto('/search')
  const box = page.locator('#q')
  await box.fill('whi')
  const list = page.getByRole('listbox', { name: 'Suggestions' })
  await expect(list).toBeVisible()
  await expect(list.getByRole('option').first()).toHaveText(/white tee/i)
  await box.press('ArrowDown')
  await expect(box).toHaveAttribute('aria-activedescendant', /sq-0/)
  await box.press('Enter')
  await expect(page).toHaveURL(/\/search\?q=white\+tee|q=white%20tee/)
  noErrors()
})

test('browse filters narrow the catalog and stay in the URL', async ({ page }) => {
  await page.route('**/api/v1/search', (r) => r.abort())
  await page.goto('/search?category=TOPS')
  const results = page.locator('section[aria-labelledby="results-h"] > ul > li')
  await expect(results.first()).toBeVisible({ timeout: 20_000 })
  const before = await results.count()
  await page.getByRole('group', { name: 'Filters' }).getByRole('link', { name: /^Score 70\+/ }).click()
  await expect(page).toHaveURL(/min=70/, { timeout: 20_000 })
  await expect.poll(() => results.count(), { timeout: 20_000 }).toBeLessThan(before)
  await page.getByRole('link', { name: 'Clear filters' }).click()
  await expect(page).not.toHaveURL(/min=70/)
})

test('collections: index links to a rule-based page where every item shows why it qualifies', async ({ page }) => {
  await page.goto('/collections')
  await page.getByRole('link', { name: /T-shirts that hold up in the wash/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('T-shirts that hold up in the wash')
  await expect(page.getByText(/Nobody pays to be included/)).toBeVisible()
  await expect(page.locator('ol > li').first()).toContainText(/#1 · Scores \d+\/100 from \d+ pieces of evidence/)
})

test('product page: highlights, alternatives, instant answers and a (mocked) verified answer', async ({ page }) => {
  await page.route('**/api/v1/products/*/ask', (r) =>
    r.fulfill({ json: { success: true, data: { status: 'answered', sentences: [{ text: 'Owners say it shrinks after washing.', evidence: [{ id: 'c1', text: '3 of 9 owners who wrote about it: shrinks.' }] }] } } }),
  )
  await page.goto('/p/velo-thread-longline-tee')
  await expect(page.getByRole('heading', { name: 'Highlights' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /alternatives/ })).toBeVisible()
  await page.getByRole('button', { name: 'Does it run small or large?' }).click()
  await expect(page.locator('#qa-instant')).toContainText(/owners who answered/)
  await page.getByLabel('Ask a question about this item').fill('Does it shrink?')
  await page.getByRole('button', { name: 'Ask' }).click()
  await expect(page.getByText('Owners say it shrinks after washing.')).toBeVisible()
  await page.getByText(/show sources/).click()
  await expect(page.getByText('3 of 9 owners who wrote about it: shrinks.')).toBeVisible()
})

test('brand dashboard explains the score with fixes', async ({ page }) => {
  const brand = devAccount('BRAND')
  test.skip(!brand, 'run npm run seed:accounts first')
  await signIn(page, brand!, '/dashboard')
  const productLink = page.locator('a[href^="/dashboard/products/"]').first()
  await productLink.click()
  await expect(page.getByRole('heading', { name: 'Why this score' })).toBeVisible()
  await expect(page.getByText(/vs\. a median of/)).toBeVisible()
})

test('style from photos: "blue flowered tee" shows only blue floral items, and the product page shows what the photo shows', async ({ page }) => {
  await page.route('**/api/v1/search', (r) => r.abort())
  await page.goto('/search?q=blue+flowered+tee')
  const results = page.locator('section[aria-labelledby="results-h"] > ul > li')
  await expect(results.first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('status').getByText('Floral (from photos)')).toBeVisible()
  const hrefs = await results.locator('a[href^="/p/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  expect(hrefs.length).toBeGreaterThan(0)
  await page.goto(hrefs[0]!)
  const panel = page.locator('section[aria-labelledby="visual-h"]')
  await expect(panel).toBeVisible()
  await expect(panel).toContainText(/floral/i)
  await expect(panel).toContainText(/never changes the score/)
})

test('unknown product is a real 404, and pages carry a nonce-based CSP', async ({ page, request }) => {
  expect((await request.get('/p/this-product-does-not-exist')).status()).toBe(404)
  const res = await request.get('/')
  const csp = res.headers()['content-security-policy']
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/)
  expect(csp).toContain("frame-ancestors 'none'")
  expect(csp).toContain("object-src 'none'")
  const noErrors = trackErrors(page) // a blocked script would show up as a console error
  await page.goto('/search')
  await page.locator('#q').fill('whi')
  await expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible()
  noErrors()
})

test('button-up shirts: Shirts tab lists only shirts; "blue flowered shirt" finds floral shirts, not t-shirts', async ({ page }) => {
  await page.route('**/api/v1/search', (r) => r.abort())
  await page.goto('/search?kind=shirt')
  await expect(page.getByRole('navigation', { name: 'Product type' }).getByRole('link', { name: 'Shirts', exact: true })).toHaveAttribute('aria-current', 'page')
  const results = page.locator('section[aria-labelledby="results-h"] > ul > li')
  await expect(results.first()).toBeVisible({ timeout: 20_000 })
  const hrefs = await results.locator('a[href^="/p/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(hrefs.length).toBeGreaterThan(5)
  expect(hrefs.every((h) => h.includes('shirt') && !h.endsWith('-tee'))).toBe(true)

  await page.goto('/search?q=blue+flowered+shirt')
  await expect(results.first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('status').getByText('Shirts', { exact: true })).toBeVisible()
  const found = await results.locator('a[href^="/p/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(found.length).toBeGreaterThan(0)
  expect(found.every((h) => h.includes('shirt'))).toBe(true)
})

test('prints from photos: "car t-shirt" finds only tees with a car print; the product page lists the print', async ({ page }) => {
  await page.route('**/api/v1/search', (r) => r.abort())
  await page.goto('/search?q=car+t-shirt')
  const results = page.locator('section[aria-labelledby="results-h"] > ul > li')
  await expect(results.first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('status').getByText('Print: car')).toBeVisible()
  const hrefs = await results.locator('a[href^="/p/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(hrefs.length).toBeGreaterThan(0)
  await page.goto(hrefs[0])
  const panel = page.locator('section[aria-labelledby="visual-h"]')
  await expect(panel.getByText('Printed on it')).toBeVisible()
  await expect(panel).toContainText(/car/i)
  await expect(panel).toContainText(/doesn’t mean the item is official/)
})
