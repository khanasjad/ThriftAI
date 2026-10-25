'use client'

import * as React from 'react'
import { KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { CopyButton } from '@/app/developers/copy-button'

type Key = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'never')

/** Create and revoke Score API keys. A new key is shown once and never again. */
export function ApiKeys({ brand }: { brand: string }) {
  const toast = useToast()
  const [keys, setKeys] = React.useState<Key[] | null>(null)
  const [fresh, setFresh] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const q = `?brand=${encodeURIComponent(brand)}`

  const load = React.useCallback(() => {
    fetch(`/api/v1/keys${q}`)
      .then((r) => r.json())
      .then((j) => setKeys(j.success ? j.data : []))
  }, [q])
  React.useEffect(load, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/v1/keys${q}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const j = await res.json()
    if (!res.ok) return toast({ title: 'Key not created', description: j.error, tone: 'critical' })
    setFresh(j.data.key)
    setName('')
    load()
  }

  async function revoke(id: string) {
    if (!window.confirm('Revoke this key? Requests using it will start failing immediately.')) return
    const res = await fetch(`/api/v1/keys/${id}${q}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Key revoked', tone: 'good' })
      load()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {fresh && (
        <div role="status" className="rounded-xl border border-warning/50 bg-warning-soft p-4">
          <p className="text-sm font-medium text-warning-fg">Copy your new key now. It won’t be shown again.</p>
          <div className="mt-2 flex items-center gap-2 rounded-md bg-surface px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{fresh}</code>
            <CopyButton text={fresh} label="Copy API key" />
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setFresh(null)}>
            I’ve saved it
          </Button>
        </div>
      )}
      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <Label htmlFor="key-name">Key name</Label>
          <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Site search" maxLength={60} required />
        </div>
        <Button type="submit">
          <KeyRound /> Create key
        </Button>
      </form>
      {keys === null ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-fg-muted">No keys yet. Keys raise the Score API limit from 60 to 600 requests per minute.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-fg">
                  {k.name} {k.revokedAt && <span className="ml-1 text-xs font-normal text-fg-subtle">(revoked {fmt(k.revokedAt)})</span>}
                </p>
                <p className="font-mono text-xs text-fg-subtle">
                  {k.prefix}… · created {fmt(k.createdAt)} · last used {fmt(k.lastUsedAt)}
                </p>
              </div>
              {!k.revokedAt && (
                <Button size="sm" variant="ghost" className="text-critical-fg" onClick={() => revoke(k.id)} aria-label={`Revoke ${k.name}`}>
                  <Trash2 /> Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
