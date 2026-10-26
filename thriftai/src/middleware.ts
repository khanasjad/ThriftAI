import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * 1. Content-Security-Policy (B13): every page gets a fresh nonce; only scripts carrying it may run
 *    (Next adds it to its own scripts; the root layout adds it to the theme script).
 * 2. First line of defense (B7): anonymous or wrong-role requests to admin and brand areas never reach the page.
 *    Route handlers and layouts check again next to the data (src/lib/veritas/authz.ts).
 */
export function cspFor(nonce: string, dev: boolean) {
  return [
    `default-src 'self'`,
    // Same-origin scripts (Next loads its code in chunks as you navigate) plus inline scripts carrying the nonce.
    // Injected inline scripts and third-party scripts are blocked.
    `script-src 'self' 'nonce-${nonce}'${dev ? " 'unsafe-eval'" : ''}`,
    // Inline style attributes (score bars, swatches) and next/font need inline styles.
    `style-src 'self' 'unsafe-inline'`,
    // Vendor product photos are https images from many hosts.
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join('; ')
}

function withCsp(req: NextRequest, res?: (h: Headers) => NextResponse) {
  const nonce = btoa(crypto.randomUUID())
  const csp = cspFor(nonce, process.env.NODE_ENV !== 'production')
  const h = new Headers(req.headers)
  h.set('x-nonce', nonce)
  h.set('content-security-policy', csp)
  const out = res ? res(h) : NextResponse.next({ request: { headers: h } })
  out.headers.set('Content-Security-Policy', csp)
  return out
}

const RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/api/v1/admin', roles: ['ADMIN'] },
  { prefix: '/dashboard', roles: ['BRAND', 'ADMIN'] },
  { prefix: '/api/v1/brands', roles: ['BRAND', 'ADMIN'] },
  { prefix: '/api/v1/keys', roles: ['BRAND', 'ADMIN'] },
]

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isApi = path.startsWith('/api/')
  const rule = RULES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`))
  if (!rule) return isApi ? NextResponse.next() : withCsp(req)

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const role = (token?.role as string | undefined) ?? null

  if (!token) {
    if (isApi) return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    const url = new URL('/sign-in', req.url)
    url.searchParams.set('next', path + req.nextUrl.search)
    return NextResponse.redirect(url)
  }
  if (!role || !rule.roles.includes(role)) {
    if (isApi) return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 })
    const url = new URL('/sign-in', req.url)
    url.searchParams.set('next', path)
    url.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(url)
  }
  return isApi ? NextResponse.next() : withCsp(req)
}

export const config = {
  // Everything except static files (pages get the CSP; protected areas also get the auth check).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|dev-images/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml|js)$).*)'],
}
