import Link from 'next/link'
import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Shoppers',
    links: [
      { href: '/search', label: 'Search' },
      { href: '/how-it-works', label: 'How the score works' },
    ],
  },
  {
    title: 'Brands',
    links: [
      { href: '/brands', label: 'Overview' },
      { href: '/brands/pricing', label: 'Pricing' },
      { href: '/pilot', label: 'Free pilot scorecard' },
      { href: '/sign-in', label: 'Brand sign in' },
    ],
  },
  {
    title: 'Platforms',
    links: [
      { href: '/developers', label: 'Score API' },
      { href: '/how-it-works#methodology', label: 'Methodology' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/privacy-policy', label: 'Privacy' },
      { href: '/terms-of-service', label: 'Terms' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            One trustworthy score for clothing, with the evidence behind every number. Brands can&rsquo;t pay for a higher score.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-medium text-fg">{c.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Veritas</span>
          <span>Development preview: brands, products and reviews shown are fictional test data.</span>
        </div>
      </div>
    </footer>
  )
}
