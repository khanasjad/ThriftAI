'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'
const KEY = 'veritas-theme'

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Light / system / dark segmented toggle. The pre-paint script in layout.tsx applies the saved value on load. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>('system')

  React.useEffect(() => {
    let saved: Theme = 'system'
    try {
      saved = (localStorage.getItem(KEY) as Theme) || 'system'
    } catch {}
    setTheme(saved)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      let current: Theme = 'system'
      try {
        current = (localStorage.getItem(KEY) as Theme) || 'system'
      } catch {}
      if (current === 'system') apply('system')
    }
    // Theme changed elsewhere (e.g. the ⌘K menu).
    const onExternal = () => {
      try {
        setTheme((localStorage.getItem(KEY) as Theme) || 'system')
      } catch {}
    }
    mq.addEventListener('change', onChange)
    window.addEventListener('veritas-theme', onExternal)
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('veritas-theme', onExternal)
    }
  }, [])

  const choose = (t: Theme) => {
    setTheme(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {}
    apply(t)
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light theme', icon: <Sun /> },
    { value: 'system', label: 'System theme', icon: <Monitor /> },
    { value: 'dark', label: 'Dark theme', icon: <Moon /> },
  ]

  return (
    <div role="radiogroup" aria-label="Theme" className={cn('inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          onClick={() => choose(o.value)}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:text-fg [&_svg]:size-3.5',
            theme === o.value && 'bg-surface-3 text-fg',
          )}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}
