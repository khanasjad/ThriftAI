'use client'

import * as React from 'react'
import { Command as Cmdk } from 'cmdk'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from './dialog'
import { cn } from '@/lib/utils'

export type CommandItem = {
  id: string
  label: string
  group: string
  hint?: string
  icon?: React.ReactNode
  onSelect: () => void
}

/** ⌘K palette. Opens with ⌘K / Ctrl+K, or programmatically via `open`. */
export function CommandPalette({
  items,
  open,
  onOpenChange,
  hotkey = true,
}: {
  items: CommandItem[]
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Set false when the parent owns the ⌘K shortcut (e.g. to lazy-load this component). */
  hotkey?: boolean
}) {
  React.useEffect(() => {
    if (!hotkey) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange, hotkey])

  const groups = Array.from(new Set(items.map((i) => i.group)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[20%] max-w-xl translate-y-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Cmdk label="Command menu" className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 text-fg-subtle" aria-hidden />
            <Cmdk.Input
              placeholder="Search pages and actions…"
              className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
            />
          </div>
          <Cmdk.List className="max-h-80 overflow-y-auto p-2">
            <Cmdk.Empty className="px-3 py-6 text-center text-sm text-fg-muted">No results.</Cmdk.Empty>
            {groups.map((g) => (
              <Cmdk.Group
                key={g}
                heading={g}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-subtle"
              >
                {items
                  .filter((i) => i.group === g)
                  .map((i) => (
                    <Cmdk.Item
                      key={i.id}
                      value={`${i.label} ${i.hint ?? ''}`}
                      onSelect={() => {
                        i.onSelect()
                        onOpenChange(false)
                      }}
                      className={cn(
                        'flex h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-fg data-[selected=true]:bg-surface-2',
                        '[&_svg]:size-4 [&_svg]:text-fg-subtle',
                      )}
                    >
                      {i.icon}
                      <span className="flex-1">{i.label}</span>
                      {i.hint && <span className="text-xs text-fg-subtle">{i.hint}</span>}
                    </Cmdk.Item>
                  ))}
              </Cmdk.Group>
            ))}
          </Cmdk.List>
        </Cmdk>
      </DialogContent>
    </Dialog>
  )
}
