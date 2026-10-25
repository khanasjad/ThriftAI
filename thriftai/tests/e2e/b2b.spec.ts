import { expect, test } from '@playwright/test'
import { devAccount, signIn, trackErrors } from './helpers'

/** B10/B11/F8: data upload (dry run only, nothing saved), ad previews, social pack, sponsored-slot rule. */

test('platform screen: dry-run upload shows a validation report, ads and social are listed', async ({ page }) => {
  const brand = devAccount('BRAND')
  test.skip(!brand, 'run npm run seed:accounts first')
  const noErrors = trackErrors(page)
  await signIn(page, brand!, '/dashboard/ads')
  await expect(page.getByRole('heading', { name: 'Data and ads' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /2\. Ads/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /3\. Social/ })).toBeVisible()

  const csv = [
    'external_id,title,brand,category,price,url',
    'E2E-1,Black Crew T-Shirt,Harbor Basics,T-Shirts,19.99,https://example.com/p/e2e-1',
    'E2E-2,Floral Maxi Dress,Harbor Basics,Dresses,49.99,https://example.com/p/e2e-2',
  ].join('\n')
  await page.getByLabel('File (.csv or .json)').setInputFiles({ name: 'catalog.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByLabel('Source (who sent it)').fill('e2e test file')
  await expect(page.getByLabel(/Dry run/)).toBeChecked()
  await page.getByRole('button', { name: 'Upload' }).click()
  await expect(page.getByText(/Dry run: nothing saved\. 1 of 2 rows accepted/)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/"Dresses" is not scored yet/)).toBeVisible()
  noErrors()
})

test('demo store: a sponsored slot is labelled and never inside the top 3', async ({ page }) => {
  await page.goto('/demo/store?q=t-shirt')
  const cards = page.locator('main ul > li')
  await expect(cards.first()).toBeVisible()
  const sponsoredIndex = await cards.evaluateAll((els) => els.findIndex((el) => /Sponsored/.test(el.textContent ?? '')))
  if (sponsoredIndex >= 0) expect(sponsoredIndex).toBeGreaterThanOrEqual(3)
  for (let i = 0; i < 3; i++) await expect(cards.nth(i)).not.toContainText('Sponsored')
})

test('brand scorecard: printable page with headline numbers, fixes and pricing that matches the plan', async ({ page }) => {
  const brand = devAccount('BRAND')
  test.skip(!brand, 'run npm run seed:accounts first')
  const noErrors = trackErrors(page)
  await signIn(page, brand!, '/dashboard/scorecard')
  await expect(page.getByText('Veritas scorecard')).toBeVisible()
  for (const t of ['Average Veritas Score', 'Fix these first', 'Costliest return reasons', 'Strongest products']) await expect(page.getByText(t, { exact: true })).toBeVisible()
  await expect(page.getByText(/fictional test data/)).toBeVisible()
  await expect(page.locator('footer')).toContainText('$299/month')
  await expect(page.getByRole('button', { name: /Print or save as PDF/ })).toBeVisible()
  noErrors()
})
