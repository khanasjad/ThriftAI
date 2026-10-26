'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OUTREACH_KINDS, OUTREACH_STATUSES } from '@/lib/veritas/outreach'

export type Target = { id: string; name: string; kind: string; segment: string | null; website: string | null; status: string; scorecardSentAt: string | null; nextStep: string | null; notes: string | null; owner: string | null }

const field = 'h-9 rounded-lg border border-border-strong bg-bg px-2.5 text-sm text-fg focus-visible:outline-2 focus-visible:outline-ring'

async function api(path: string, method: string, body?: unknown) {
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j.success) throw new Error(j.error ?? 'Request failed')
  return j.data
}

export function AddTarget() {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await api('/api/v1/admin/outreach', 'POST', Object.fromEntries(f.entries()))
      e.currentTarget?.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2" aria-label="Add a target">
      <label className="text-xs text-fg-muted">
        Company
        <input name="name" required minLength={2} className={`${field} mt-1 block w-48`} />
      </label>
      <label className="text-xs text-fg-muted">
        Type
        <select name="kind" className={`${field} mt-1 block`}>
          {OUTREACH_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-fg-muted">
        Segment
        <input name="segment" placeholder="e.g. DTC denim" className={`${field} mt-1 block w-36`} />
      </label>
      <label className="text-xs text-fg-muted">
        Website
        <input name="website" placeholder="https://…" className={`${field} mt-1 block w-48`} />
      </label>
      <label className="text-xs text-fg-muted">
        Next step
        <input name="nextStep" className={`${field} mt-1 block w-48`} />
      </label>
      <Button type="submit" disabled={busy}>
        <Plus /> Add
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-critical-fg">
          {error}
        </p>
      )}
    </form>
  )
}

export function TargetRow({ t }: { t: Target }) {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const save = async (body: unknown) => {
    setError(null)
    try {
      await api(`/api/v1/admin/outreach/${t.id}`, 'PATCH', body)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }
  return (
    <tr className="align-top">
      <td className="py-2.5 pl-6 pr-3">
        <span className="font-medium text-fg">{t.name}</span>
        <span className="block text-xs text-fg-subtle">
          {t.kind}
          {t.segment && ` · ${t.segment}`}
          {t.website && (
            <>
              {' · '}
              <a href={t.website} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                site
              </a>
            </>
          )}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`st-${t.id}`}>
          Status for {t.name}
        </label>
        <select id={`st-${t.id}`} defaultValue={t.status} onChange={(e) => save({ status: e.target.value })} className={field}>
          {OUTREACH_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="py-2.5 pr-3">
        <label className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
          <input type="checkbox" defaultChecked={!!t.scorecardSentAt} onChange={(e) => save({ scorecardSent: e.target.checked })} className="size-4" />
          {t.scorecardSentAt ? new Date(t.scorecardSentAt).toLocaleDateString() : 'not yet'}
        </label>
      </td>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`ns-${t.id}`}>
          Next step for {t.name}
        </label>
        <input id={`ns-${t.id}`} defaultValue={t.nextStep ?? ''} onBlur={(e) => e.target.value !== (t.nextStep ?? '') && save({ nextStep: e.target.value || null })} className={`${field} w-56`} />
        {error && <span className="block text-xs text-critical-fg">{error}</span>}
      </td>
      <td className="py-2.5 pr-6 text-right">
        <button
          type="button"
          aria-label={`Remove ${t.name}`}
          onClick={async () => {
            if (!confirm(`Remove ${t.name}?`)) return
            await api(`/api/v1/admin/outreach/${t.id}`, 'DELETE').catch(() => {})
            router.refresh()
          }}
          className="rounded p-1 text-fg-subtle hover:text-critical-fg"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </td>
    </tr>
  )
}
