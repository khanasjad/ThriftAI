/**
 * Smoke test for a deployed site (B8 gate). Read-only: GET requests only, no sign-in, no model calls.
 *   npm run smoke:prod -- --url https://your-site.example
 * Checks public pages, the Score API, auth walls, robots/sitemap, security headers, and that dev pages are off.
 */
const i = process.argv.indexOf('--url')
const base = (i > -1 ? process.argv[i + 1] : process.env.SMOKE_URL ?? '').replace(/\/$/, '')
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: npm run smoke:prod -- --url https://your-site.example')
  process.exit(1)
}

let failures = 0
async function check(name: string, path: string, test: (r: Response, body: string) => boolean | string) {
  try {
    const r = await fetch(`${base}${path}`, { redirect: 'manual', headers: { 'user-agent': 'veritas-smoke/1' } })
    const body = /json|text|xml/.test(r.headers.get('content-type') ?? '') ? await r.text() : ''
    const out = test(r, body)
    const ok = out === true
    console.log(`${ok ? '✓' : '✗'} ${name} (${r.status})${ok ? '' : ` — ${typeof out === 'string' ? out : 'unexpected response'}`}`)
    if (!ok) failures++
  } catch (e) {
    console.log(`✗ ${name} — ${e instanceof Error ? e.message : e}`)
    failures++
  }
}

async function main() {
  console.log(`Smoke test: ${base}\n`)
  await check('home page', '/', (r, b) => r.status === 200 && /Veritas/.test(b))
  await check('search page', '/search', (r) => r.status === 200)
  await check('collections', '/collections', (r) => r.status === 200)
  await check('how it works', '/how-it-works', (r) => r.status === 200)
  await check('developers', '/developers', (r) => r.status === 200)
  await check('Score API list', '/api/v1/products?limit=1', (r, b) => r.status === 200 && /"success":true/.test(b))
  await check('autosuggest', '/api/v1/suggest?q=te', (r, b) => r.status === 200 && /"success":true/.test(b))
  await check('dashboard needs sign-in', '/dashboard', (r) => [302, 303, 307, 308].includes(r.status) && /sign-in/.test(r.headers.get('location') ?? '') ? true : `location ${r.headers.get('location')}`)
  await check('admin API needs sign-in', '/api/v1/admin/runs', (r) => r.status === 401)
  await check('ingest needs an API key', '/api/v1/ingest/catalog', (r) => r.status === 405 || r.status === 401) // GET not allowed
  await check('cron needs its secret', '/api/cron/nightly', (r) => r.status === 401)
  await check('dev UI is off', '/dev/ui', (r) => r.status === 404)
  await check('demo store is off', '/demo/store', (r) => r.status === 404 || 'demo store is on (development, or DEMO_STORE=1)')
  await check('robots allows public, blocks admin', '/robots.txt', (r, b) => r.status === 200 && /Disallow: \/admin/.test(b) && !/Disallow: \/\s*$/m.test(b))
  await check('sitemap', '/sitemap.xml', (r, b) => r.status === 200 && /<urlset/.test(b))
  await check('security headers', '/', (r) => {
    const missing = ['strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy'].filter((h) => !r.headers.get(h))
    return missing.length ? `missing ${missing.join(', ')}` : true
  })
  console.log(failures ? `\n${failures} check(s) failed.` : '\nSmoke test passed.')
  process.exit(failures ? 1 : 0)
}

main()
