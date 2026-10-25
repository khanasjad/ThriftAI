'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { PILOT_STATUSES } from '@/lib/veritas/pilots'

export type PilotRowData = {
  id: string
  companyName: string
  name: string
  email: string
  website: string | null
  productCount: string | null
  reviewCount: string | null
  status: string
  notes: string | null
  createdAt: string
}

const selectClass =
  'h-9 rounded-md border border-border bg-surface px-2 text-sm text-fg shadow-sm hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** One application: status select saves at once; notes save on demand. */
export function PilotRow({ row }: { row: PilotRowData }) {
  const toast = useToast()
  const [status, setStatus] = React.useState(row.status)
  const [notes, setNotes] = React.useState(row.notes ?? '')
  const [saved, setSaved] = React.useState(row.notes ?? '')
  const [busy, setBusy] = React.useState(false)

  async function patch(data: { status?: string; notes?: string | null }) {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/admin/pilot-applications/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Save failed')
      toast({ title: 'Saved', tone: 'good' })
      return true
    } catch (err) {
      toast({ title: 'Not saved', description: err instanceof Error ? err.message : undefined, tone: 'critical' })
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="grid gap-4 py-5 md:grid-cols-[1.2fr_1fr_1.4fr]">
      <div className="min-w-0">
        <p className="font-medium text-fg">{row.companyName}</p>
        <p className="truncate text-sm text-fg-muted">
          {row.name} ·{' '}
          <a href={`mailto:${row.email}`} className="underline underline-offset-4 hover:text-fg">
            {row.email}
          </a>
        </p>
        {row.website && (
          <p className="truncate text-sm text-fg-subtle">
            <a href={row.website} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4 hover:text-fg">
              {row.website}
            </a>
          </p>
        )}
        <p className="mt-1 text-xs text-fg-subtle">Applied {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:block md:space-y-1">
        <div>
          <dt className="inline text-fg-subtle">Products: </dt>
          <dd className="inline text-fg">{row.productCount ?? '—'}</dd>
        </div>
        <div>
          <dt className="inline text-fg-subtle">Reviews: </dt>
          <dd className="inline text-fg">{row.reviewCount ?? '—'}</dd>
        </div>
      </dl>
        <div>
          <label htmlFor={`st-${row.id}`} className="sr-only">
            Status for {row.companyName}
          </label>
          <select
            id={`st-${row.id}`}
            className={selectClass}
            value={status}
            disabled={busy}
            onChange={async (e) => {
              const prev = status
              setStatus(e.target.value)
              if (!(await patch({ status: e.target.value }))) setStatus(prev)
            }}
          >
            {PILOT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={`nt-${row.id}`} className="text-xs text-fg-subtle">
          Notes
        </label>
        <Textarea id={`nt-${row.id}`} rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
        {notes !== saved && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={busy}
            onClick={async () => {
              if (await patch({ notes: notes.trim() || null })) setSaved(notes)
            }}
          >
            Save notes
          </Button>
        )}
      </div>
    </li>
  )
}
