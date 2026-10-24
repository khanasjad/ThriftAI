import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

/** Public page chrome: sticky header, main landmark, footer. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
