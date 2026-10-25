import { expect, test } from '@playwright/test'
import { expectAccessible, expectNoHorizontalScroll, trackErrors } from './helpers'

const PAGES: [string, RegExp][] = [
  ['/', /Is it worth buying\?/],
  ['/search?q=relaxed+jeans', /Search/],
  ['/p/velo-thread-longline-tee', /Longline Tee/],
  ['/demo/store?q=t-shirt', /results for/],
  ['/demo/store/hollow-pine-supply-everyday-crew-tee', /Everyday Crew Tee/],
  ['/collections', /Collections/],
  ['/collections/built-to-last', /Built to last/],
  ['/how-it-works', /One score for/],
  ['/brands', /Sales data shows you what sells/],
  ['/brands/pricing', /Pay for insight and freshness/],
  ['/pilot', /See your catalog the way your customers do/],
  ['/developers', /The Score API/],
  ['/about', /A clothing purchase is a dozen quiet questions/],
  ['/profile', /Your fit profile/],
  ['/sign-in', /Sign in/],
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme })
    for (const [path, heading] of PAGES) {
      test(`${path} renders, is accessible and fits the screen`, async ({ page }) => {
        const noErrors = trackErrors(page)
        // Never call the live shopkeeper from tests.
        await page.route('**/api/v1/search', (r) =>
          r.fulfill({ json: { success: true, data: { sessionId: 's', reply: 'What cut do you like?', intent: { category: 'BOTTOMS', priorities: {}, terms: [] }, offTopic: false, question: { slot: 'cut', question: 'What cut do you like?', chips: ['wide-leg', 'bootcut'] }, asked: 1, maxQuestions: 4, picks: [], provisional: true, rated: 0, unrated: 0, usedAgent: true } } }),
        )
        await page.addInitScript((t) => localStorage.setItem('veritas-theme', t), theme)
        const res = await page.goto(path, { waitUntil: 'networkidle' })
        expect(res?.status()).toBe(200)
        await expect(page.locator('h1').first()).toHaveText(heading)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expectAccessible(page)
        await expectNoHorizontalScroll(page)
        noErrors()
      })
    }
  })
}

test('unknown pages show the not-found page with noindex', async ({ page }) => {
  await page.goto('/p/does-not-exist')
  await expect(page.getByRole('heading', { name: 'We couldn’t find that product' })).toBeVisible()
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
})
