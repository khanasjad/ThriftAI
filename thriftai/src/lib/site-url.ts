/**
 * The site's public address: NEXT_PUBLIC_APP_URL (set in production), else NEXTAUTH_URL, else the Vercel deployment
 * address (hosted dev previews get a new URL per deploy), else localhost.
 */
export function siteUrl() {
  const u = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return u.replace(/\/$/, '')
}
