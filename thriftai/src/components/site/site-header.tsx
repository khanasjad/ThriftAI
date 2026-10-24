'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, BookOpen, Building2, Code2, CreditCard, Home, Menu, Moon, Search, Shirt, Sun, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/primitives'
import { CommandPalette, type CommandItem } from '@/components/ui/command'
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

const NAV = [
  { href: '/search', label: 'Search' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/brands', label: 'For brands' },
  { href: '/developers', label: 'Developers' },
]

const IS_DEV = process.env.NODE_ENV !== 'production'

type ProductHit = { slug: string; name: string; brand: { name: string } }

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [products, setProducts] = React.useState<ProductHit[]>([])
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Products for ⌘K load the first time the palette opens.
  React.useEffect(() => {
    if (!paletteOpen || products.length) return
    fetch('/api/v1/products?limit=100&sortBy=name')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data && setProducts(j.data))
      .catch(() => {})
  }, [paletteOpen, products.length])

  const go = React.useCallback((href: string) => router.push(href), [router])
  const setTheme = (t: 'light' | 'dark') => {
    try {
      localStorage.setItem('veritas-theme', t)
    } catch {}
    document.documentElement.dataset.theme = t
    window.dispatchEvent(new Event('veritas-theme'))
  }

  const items: CommandItem[] = [
    { id: 'home', group: 'Pages', label: 'Home', icon: <Home />, onSelect: () => go('/') },
    { id: 'search', group: 'Pages', label: 'Search clothing', icon: <Search />, onSelect: () => go('/search') },
    { id: 'how', group: 'Pages', label: 'How the score works', icon: <BookOpen />, onSelect: () => go('/how-it-works') },
    { id: 'brands', group: 'Pages', label: 'For brands', icon: <Building2 />, onSelect: () => go('/brands') },
    { id: 'pricing', group: 'Pages', label: 'Pricing', icon: <CreditCard />, onSelect: () => go('/brands/pricing') },
    { id: 'pilot', group: 'Pages', label: 'Free pilot scorecard', icon: <Building2 />, onSelect: () => go('/pilot') },
    { id: 'dev', group: 'Pages', label: 'Developers · Score API', icon: <Code2 />, onSelect: () => go('/developers') },
    ...(IS_DEV
      ? [
          { id: 'runs', group: 'Admin (dev)', label: 'Agent runs', icon: <Activity />, onSelect: () => go('/admin/runs') },
          { id: 'spend', group: 'Admin (dev)', label: 'Spend vs. cap', icon: <Wallet />, onSelect: () => go('/admin/spend') },
          { id: 'ui', group: 'Admin (dev)', label: 'UI kit', icon: <Code2 />, onSelect: () => go('/dev/ui') },
        ]
      : []),
    { id: 'light', group: 'Theme', label: 'Light theme', icon: <Sun />, onSelect: () => setTheme('light') },
    { id: 'dark', group: 'Theme', label: 'Dark theme', icon: <Moon />, onSelect: () => setTheme('dark') },
    ...products.map((p) => ({
      id: `p-${p.slug}`,
      group: 'Products',
      label: p.name,
      hint: p.brand.name,
      icon: <Shirt />,
      onSelect: () => go(`/p/${p.slug}`),
    })),
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-[background-color,border-color] duration-200',
        scrolled ? 'border-border bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70' : 'border-transparent bg-bg',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive(n.href) ? 'font-medium text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-fg-subtle shadow-sm transition-colors hover:text-fg lg:inline-flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="pr-6">Jump to…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setPaletteOpen(true)} aria-label="Open command menu">
            <Search />
          </Button>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/pilot">Free pilot</Link>
          </Button>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
        </div>
      </div>

      <CommandPalette items={items} open={paletteOpen} onOpenChange={setPaletteOpen} />

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <DialogTitle className="px-5 pt-5 text-base">Menu</DialogTitle>
          <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(n.href) ? 'page' : undefined}
                className={cn('flex h-12 items-center rounded-md px-3 text-base', isActive(n.href) ? 'bg-surface-2 font-medium text-fg' : 'text-fg-muted hover:bg-surface-2')}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-5">
            <ThemeToggle />
            <Button asChild size="md">
              <Link href="/pilot" onClick={() => setMenuOpen(false)}>
                Free pilot scorecard
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Dialog>
    </header>
  )
}
