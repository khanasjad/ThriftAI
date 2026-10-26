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

function readTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || 'system'
  } catch {
    return 'system'
  }
}
// Saved theme as an external store: other tabs ('storage') and the ⌘K menu ('veritas-theme') notify changes.
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener('veritas-theme', onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener('veritas-theme', onChange)
  }
}

/** Light / system / dark segmented toggle. public/theme.js applies the saved value before first paint. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = React.useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme)

  // Follow the OS setting while on "system".
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => readTheme() === 'system' && apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const choose = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t)
    } catch {}
    apply(t)
    window.dispatchEvent(new Event('veritas-theme'))
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
