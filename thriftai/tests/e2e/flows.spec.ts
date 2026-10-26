import { expect, test } from '@playwright/test'
import { devAccount, signIn, trackErrors } from './helpers'

/** Canned shopkeeper turns: the UI is tested without calling Claude. */
const pick = (role: string, slug: string, name: string, price: number) => ({
  role, slug, name, brand: 'Test Brand', category: 'BOTTOMS', subcategory: 'jeans', score: 66, label: 'MEDIUM', match: 80,
  pillars: { FIT: 70, QUALITY: 65, STYLE_VALUE: 60, COMFORT: 70 }, reasons: ['Relaxed fit, as you asked'], summary: null, sizeAdvice: null, downside: null,
  priceMin: price, priceMax: price, sellerCount: 2, overBudget: false,
})
const turn = (over: Record<string, unknown>) => ({
  success: true,
  data: { sessionId: 's1', reply: '', intent: { priorities: {}, terms: [] }, offTopic: false, question: null, asked: 0, maxQuestions: 4, picks: [], provisional: false, rated: 3, unrated: 0, usedAgent: true, ...over },
})

test('shopkeeper chat: question with chips, free-text refinement, picks update (API mocked)', async ({ page }) => {
  const noErrors = trackErrors(page)
  const bodies: unknown[] = []
  await page.route('**/api/v1/search', async (r) => {
    // Warm-up pings (GET, sent when a search box gets focus) aren't shopkeeper turns.
    if (r.request().method() !== 'POST') return r.fulfill({ json: { success: true, data: { visual: 'off' } } })
    const body = r.request().postDataJSON()
    bodies.push(body)
    // Answer by message, not by count: in dev, React runs the first effect twice (the first request is cancelled).
    if (body.message === 'jeans for the weekend')
      return r.fulfill({ json: turn({ reply: 'Jeans it is. What cut do you like?', intent: { category: 'BOTTOMS', priorities: {}, terms: [] }, question: { slot: 'cut', question: 'What cut do you like?', chips: ['wide-leg', 'bootcut'] }, asked: 1, provisional: true, picks: [pick('best_overall', 'a', 'Bootcut Jean II', 44)] }) })
    if (body.message === 'wide-leg')
      return r.fulfill({ json: turn({ reply: 'Wide-leg noted. What budget?', intent: { category: 'BOTTOMS', cuts: ['wide-leg'], priorities: {}, terms: [] }, question: { slot: 'budget', question: 'What budget?', chips: ['Under $70', 'No limit'] }, asked: 2, provisional: true, picks: [pick('best_overall', 'b', 'Wide Leg Jean', 67)] }) })
    return r.fulfill({ json: turn({ reply: 'Got it, cheaper and no black.', intent: { category: 'BOTTOMS', cuts: ['wide-leg'], maxPrice: 70, excludeColors: ['Black'], priorities: {}, terms: [] }, picks: [pick('best_overall', 'b', 'Wide Leg Jean', 67), pick('best_value', 'c', 'Relaxed Wide Jean', 55)] }) })
  })

  await page.goto('/')
  await page.getByLabel('Describe what you’re looking for').fill('jeans for the weekend')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.waitForURL(/\/search\?q=/)
  await expect(page.getByText('Jeans it is. What cut do you like?')).toBeVisible()
  await expect(page.getByText('Question 1 of 4')).toBeVisible()
  await expect(page.getByText('Best so far (updates as you answer)')).toBeVisible()

  // Question card: big option tiles (labels prettified), number keys also work.
  await expect(page.getByRole('heading', { name: 'What cut do you like?' })).toBeVisible()
  await page.getByRole('button', { name: /^Wide leg/ }).click()
  await expect(page.getByText('Wide-leg noted. What budget?')).toBeVisible()
  await expect(page.getByText('Question 2 of 4')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Under \$70/ })).toBeVisible()

  await page.getByLabel('Message the shopkeeper').fill('cheaper and not black')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Got it, cheaper and no black.')).toBeVisible()
  await expect(page.getByText('Our three picks for you')).toBeVisible()
  for (const chip of ['Jeans', 'Under $70', 'Not Black', 'wide leg']) await expect(page.getByText(chip, { exact: true }).first()).toBeVisible()
  expect(bodies).toEqual(expect.arrayContaining([{ message: 'jeans for the weekend' }, { sessionId: 's1', message: 'wide-leg' }, { sessionId: 's1', message: 'cheaper and not black' }]))
  noErrors()
})

test('"Just show me" stops the questions', async ({ page }) => {
  await page.route('**/api/v1/search', async (r) => {
    // Warm-up pings (GET, sent when a search box gets focus) aren't shopkeeper turns.
    if (r.request().method() !== 'POST') return r.fulfill({ json: { success: true, data: { visual: 'off' } } })
    const body = r.request().postDataJSON()
    if (body.action === 'show') return r.fulfill({ json: turn({ reply: 'Here are the best options for what you’ve told me.', picks: [pick('best_overall', 'a', 'Bootcut Jean II', 44)] }) })
    return r.fulfill({ json: turn({ reply: 'What colour?', question: { slot: 'color', question: 'What colour?', chips: ['Black', 'Ecru'] }, asked: 1, provisional: true }) })
  })
  await page.goto('/search?q=jeans')
  await page.getByRole('button', { name: 'Just show me' }).click()
  await expect(page.getByText('Here are the best options for what you’ve told me.')).toBeVisible()
  await expect(page.getByText(/Question \d of 4/)).toHaveCount(0)
})

test('⌘K palette opens and jumps to a page', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+k')
  await page.getByPlaceholder('Search pages and actions…').fill('pricing')
  await page.keyboard.press('Enter')
  await page.waitForURL('**/brands/pricing')
})

test('product page: evidence sections, price history and more reviews on demand', async ({ page }) => {
  await page.goto('/p/velo-thread-longline-tee')
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
  // Role query = visible headings only (Next 16 streams a hidden copy of the page before swapping it in).
  const own = (await page.getByRole('heading', { level: 1 }).innerText()).trim()
  await page.goto('/dashboard?brand=velo-thread')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(own, { timeout: 20_000 }) // never another brand
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
