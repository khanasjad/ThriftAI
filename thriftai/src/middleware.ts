import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * First line of defense (B7): anonymous or wrong-role requests to admin and brand areas never reach the page.
 * Route handlers and layouts check again next to the data (src/lib/veritas/authz.ts).
 */
const RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/api/v1/admin', roles: ['ADMIN'] },
  { prefix: '/dashboard', roles: ['BRAND', 'ADMIN'] },
  { prefix: '/api/v1/brands', roles: ['BRAND', 'ADMIN'] },
  { prefix: '/api/v1/keys', roles: ['BRAND', 'ADMIN'] },
]

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const rule = RULES.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`))
  if (!rule) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const role = (token?.role as string | undefined) ?? null
  const isApi = path.startsWith('/api/')

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
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/admin/:path*', '/dashboard/:path*', '/api/v1/brands/:path*', '/api/v1/keys/:path*'],
}
