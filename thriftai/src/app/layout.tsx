import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: { default: 'Veritas — Is it worth buying?', template: '%s · Veritas' },
  description:
    'One trustworthy score for every clothing item: fit, quality, comfort, style, value and ethics, with the evidence behind every number.',
  openGraph: {
    title: 'Veritas — Is it worth buying?',
    description: 'The explainable "worth buying" score for clothing.',
    type: 'website',
  },
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0f' },
  ],
}

// Runs before paint: applies the saved theme (default: follow the system setting) to avoid a flash.

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading the request headers keeps pages dynamic, so Next applies the middleware's per-request CSP nonce.
  await headers()
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Theme before first paint (no flash). A same-origin file instead of an inline script: the CSP allows it
            without a nonce, and React never sees a nonce attribute (browsers hide nonce values, which React would
            report as a hydration mismatch). Next adds the nonce to its own inline scripts. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme.js" />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-fg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
