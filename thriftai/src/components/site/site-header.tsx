'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, BookOpen, Building2, Code2, CreditCard, Home, Menu, Moon, Search, Shirt, Sun, UserRound, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/primitives'
import type { CommandItem } from '@/components/ui/command'
import dynamic from 'next/dynamic'
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

// Loaded on first use so they stay out of every page's initial JavaScript.
const CommandPalette = dynamic(() => import('@/components/ui/command').then((m) => m.CommandPalette), { ssr: false })
const MobileMenu = dynamic(() => import('./mobile-menu'), { ssr: false })

type ProductHit = { slug: string; name: string; brand: { name: string } }

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [products, setProducts] = React.useState<ProductHit[]>([])
  const [scrolled, setScrolled] = React.useState(false)
  // Mount the lazy parts only after first use; keep them mounted so closing animates.
  const [paletteUsed, setPaletteUsed] = React.useState(false)
  const [menuUsed, setMenuUsed] = React.useState(false)
  const openPalette = React.useCallback((o: boolean) => {
    if (o) setPaletteUsed(true)
    setPaletteOpen(o)
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteUsed(true)
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    { id: 'profile', group: 'Pages', label: 'Your fit profile', icon: <UserRound />, onSelect: () => go('/profile') },
    { id: 'brands', group: 'Pages', label: 'For brands', icon: <Building2 />, onSelect: () => go('/brands') },
    { id: 'pricing', group: 'Pages', label: 'Pricing', icon: <CreditCard />, onSelect: () => go('/brands/pricing') },
    { id: 'pilot', group: 'Pages', label: 'Free pilot scorecard', icon: <Building2 />, onSelect: () => go('/pilot') },
    { id: 'dev', group: 'Pages', label: 'Developers · Score API', icon: <Code2 />, onSelect: () => go('/developers') },
    ...(IS_DEV
      ? [
          { id: 'runs', group: 'Admin', label: 'Agent runs', icon: <Activity />, onSelect: () => go('/admin/runs') },
          { id: 'spend', group: 'Admin', label: 'Spend vs. cap', icon: <Wallet />, onSelect: () => go('/admin/spend') },
          { id: 'evals', group: 'Admin', label: 'Evals', icon: <Activity />, onSelect: () => go('/admin/evals') },
          { id: 'pilots', group: 'Admin', label: 'Pilot applications', icon: <Building2 />, onSelect: () => go('/admin/pilots') },
          { id: 'ui', group: 'Admin', label: 'UI kit', icon: <Code2 />, onSelect: () => go('/dev/ui') },
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
            onClick={() => openPalette(true)}
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-fg-subtle shadow-sm transition-colors hover:text-fg lg:inline-flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="pr-6">Jump to…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => openPalette(true)} aria-label="Open command menu">
            <Search />
          </Button>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/pilot">Free pilot</Link>
          </Button>
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => {
              setMenuUsed(true)
              setMenuOpen(true)
            }}
            aria-label="Open menu">
            <Menu />
          </Button>
        </div>
      </div>

      {paletteUsed && <CommandPalette items={items} open={paletteOpen} onOpenChange={openPalette} hotkey={false} />}
      {menuUsed && <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} nav={NAV} isActive={isActive} />}
    </header>
  )
}
