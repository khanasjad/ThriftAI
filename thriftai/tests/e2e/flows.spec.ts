import { expect, test } from '@playwright/test'
import { devAccount, signIn, trackErrors } from './helpers'

test('home search leads to conversational search with the query read back', async ({ page }) => {
  const noErrors = trackErrors(page)
  await page.goto('/')
  await page.getByLabel('Describe what you’re looking for').fill('relaxed jeans for winter under $80')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.waitForURL(/\/search\?q=/)
  for (const chip of ['Jeans', 'Under $80', 'Relaxed fit', 'Cold weather']) await expect(page.getByText(chip, { exact: true }).first()).toBeVisible()
  // Either picks (once products are rated) or the honest "none rated yet" message.
  await expect(page.getByText(/Best overall|none (is|are) rated yet|No products match/).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'All matching products' })).toBeVisible()
  noErrors()
})

test('⌘K palette opens and jumps to a page', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+k')
  await page.getByPlaceholder('Search pages and actions…').fill('pricing')
  await page.keyboard.press('Enter')
  await page.waitForURL('**/brands/pricing')
})

test('product page: evidence sections, price history and more reviews on demand', async ({ page }) => {
  await page.goto('/p/lumen-basics-curved-hem-longline-tee')
  for (const h of ['What reviewers say about fit', 'Price history', 'Why people sent it back']) await expect(page.getByRole('heading', { name: h })).toBeVisible()
  const reviews = page.locator('section[aria-labelledby="reviews-h"] article')
  await expect(reviews).toHaveCount(5)
  await page.getByRole('button', { name: /more reviews/ }).click()
  await expect(reviews).toHaveCount(25)
})

test('pilot form shows success (API mocked, nothing stored)', async ({ page }) => {
  await page.route('**/api/v1/pilot-applications', (r) => r.fulfill({ status: 201, json: { success: true } }))
  await page.goto('/pilot')
  await page.getByLabel('Company').fill('E2E Test Co')
  await page.getByLabel('First name').fill('Test')
  await page.getByLabel('Last name').fill('Person')
  await page.getByLabel('Work email').fill('e2e@example.com')
  await page.getByRole('button', { name: 'Apply for the free scorecard' }).click()
  await expect(page.getByText('Application received')).toBeVisible()
})

test('fit profile: save then delete (leaves nothing behind)', async ({ page }) => {
  await page.goto('/profile')
  await page.getByLabel('Height (cm)').fill('172')
  await page.getByRole('radio', { name: 'Athletic' }).click()
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile saved').first()).toBeVisible()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Delete my profile' }).click()
  await expect(page.getByText('Profile deleted').first()).toBeVisible()
  expect((await (await page.request.get('/api/v1/profile')).json()).data).toBeNull()
})

test('brand and admin areas reject anonymous visitors', async ({ page, request }) => {
  for (const path of ['/admin/runs', '/dashboard']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/sign-in\?next=/)
  }
  for (const api of ['/api/v1/admin/runs', '/api/v1/brands/velo-thread/insights', '/api/v1/keys']) expect((await request.get(api)).status()).toBe(401)
})

test('brand sign-in opens only that brand’s dashboard', async ({ page }) => {
  const brand = devAccount('BRAND')
  test.skip(!brand, 'run npm run seed:accounts first')
  await signIn(page, brand!, '/dashboard')
  await expect(page.getByRole('heading', { name: 'Top problems by estimated cost' })).toBeVisible()
  const own = (await page.locator('h1').innerText()).trim()
  await page.goto('/dashboard?brand=velo-thread')
  await expect(page.locator('h1')).toHaveText(own) // never another brand
  expect((await page.request.get('/api/v1/pilot-applications')).status()).toBe(403)
})

test('admin sign-in opens the agent harness and evals', async ({ page }) => {
  const admin = devAccount('ADMIN')
  test.skip(!admin, 'run npm run seed:accounts first')
  await signIn(page, admin!, '/admin/runs')
  await expect(page.getByRole('heading', { name: 'Agent harness' })).toBeVisible()
  await page.getByRole('link', { name: 'Evals' }).click()
  await expect(page).toHaveURL(/\/admin\/evals/)
})
