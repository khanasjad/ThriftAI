import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
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
    images: ['/logo.svg'],
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
const themeScript = `(function(){var d=false;try{var t=localStorage.getItem('veritas-theme')||'system';d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)}catch(e){}document.documentElement.dataset.theme=d?'dark':'light'})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
