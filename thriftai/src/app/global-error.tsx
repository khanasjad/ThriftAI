'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary: replaces the root layout, so it can't rely on globals.css or providers.
 * Minimal inline styles that follow the system light/dark setting.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('global error', error.digest ?? '', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <style>{`
          :root { color-scheme: light dark; --bg:#fafaf9; --fg:#0b0b0f; --muted:#52514e; --accent:#6d28d9; --accent-fg:#fff }
          @media (prefers-color-scheme: dark) { :root { --bg:#0b0b0f; --fg:#f0efec; --muted:#c3c2b7; --accent:#a78bfa; --accent-fg:#0b0b0f } }
          body { margin:0; min-height:100dvh; display:grid; place-items:center; background:var(--bg); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif }
          main { max-width: 32rem; padding: 2rem 1rem; text-align:center }
          h1 { font-size: 1.75rem; letter-spacing: -0.02em; margin: 0 0 .75rem }
          p { color: var(--muted); line-height: 1.6; margin: 0 0 2rem }
          button { font: inherit; font-weight: 500; border: 0; border-radius: 10px; padding: .75rem 1.25rem; background: var(--accent); color: var(--accent-fg); cursor: pointer }
          button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }
        `}</style>
        <main role="alert">
          <h1>Veritas didn’t load</h1>
          <p>Something went wrong on our side. Reloading usually fixes it.</p>
          <button type="button" onClick={reset}>
            Reload
          </button>
        </main>
      </body>
    </html>
  )
}
