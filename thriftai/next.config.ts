import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Lets build checks (`NEXT_DIST_DIR=.next-check npm run build`) run without
  // overwriting the `.next/` folder a running `npm run dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Resolve metadata before streaming the body for every client, not only known bots.
  // Puts <title>/<meta description> in the initial <head> and lets notFound()/redirect() set real status codes.
  htmlLimitedBots: /.*/,
  async headers() {
    // Baseline security headers on every response. (A full Content-Security-Policy needs nonce support for
    // Next's inline scripts; tracked in the production runbook.)
    const security = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ]
    return [{ source: '/:path*', headers: security }]
  },
  async redirects() {
    return [
      // Old product URLs used ids; /p/ accepts an id or a slug.
      { source: '/products/:id', destination: '/p/:id', permanent: true },
      { source: '/api-docs', destination: '/developers', permanent: true },
    ]
  },
}

export default nextConfig
