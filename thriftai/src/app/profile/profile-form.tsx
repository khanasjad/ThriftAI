'use client'

import * as React from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/primitives'
import { Switch } from '@/components/ui/toggle'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type Profile = {
  heightCm: number | null
  bodyType: string | null
  preferredFit: string | null
  sizeTops: string | null
  sizeBottoms: string | null
  climate: string | null
  budgetMax: number | null
  priorities: string[]
  brandDeny: string[]
  sustainabilityOn: boolean
}

const EMPTY: Profile = { heightCm: null, bodyType: null, preferredFit: null, sizeTops: null, sizeBottoms: null, climate: null, budgetMax: null, priorities: [], brandDeny: [], sustainabilityOn: false }

const BODY = ['slim', 'average', 'athletic', 'curvy', 'plus']
const FITS = ['slim', 'regular', 'relaxed', 'oversized']
const CLIMATES = ['hot', 'mild', 'cold', 'varies']
const PRIORITIES = [
  { value: 'FIT', label: 'Fit' },
  { value: 'QUALITY', label: 'Lasts long' },
  { value: 'COMFORT', label: 'Comfort' },
  { value: 'STYLE_VALUE', label: 'Value' },
  { value: 'SUSTAINABILITY', label: 'Sustainability' },
]
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

function ChipGroup({ label, options, value, onChange, multi }: { label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  const id = React.useId()
  return (
    <fieldset>
      <legend id={id} className="text-sm font-medium text-fg">
        {label}
      </legend>
      <div role={multi ? 'group' : 'radiogroup'} aria-labelledby={id} className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={on}
              onClick={() => onChange(multi ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : on ? [] : [o.value])}
              className={cn(
                'min-h-9 rounded-full border px-4 text-sm transition-colors',
                on ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function ProfileForm({ brands }: { brands: { slug: string; name: string }[] }) {
  const toast = useToast()
  const [p, setP] = React.useState<Profile>(EMPTY)
  const [exists, setExists] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/v1/profile')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setP({ ...EMPTY, ...j.data })
          setExists(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/v1/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
      const j = await res.json()
      if (!res.ok || !j.success) throw new Error(j.error || 'Could not save')
      setExists(true)
      toast({ title: 'Profile saved', description: 'Your next searches use it for Personal Match.', tone: 'good' })
    } catch (err) {
      toast({ title: 'Not saved', description: err instanceof Error ? err.message : undefined, tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete your fit profile? This cannot be undone.')) return
    const res = await fetch('/api/v1/profile', { method: 'DELETE' })
    if (res.ok) {
      setP(EMPTY)
      setExists(false)
      toast({ title: 'Profile deleted', tone: 'good' })
    }
  }

  if (loading) return <p className="mt-8 text-sm text-fg-muted">Loading…</p>

  return (
    <form onSubmit={save} className="mt-8 flex flex-col gap-8">
      <section className="grid gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="height">Height (cm)</Label>
          <Input id="height" type="number" inputMode="numeric" min={120} max={220} value={p.heightCm ?? ''} onChange={(e) => set('heightCm', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tops">Usual top size</Label>
          <Input id="tops" maxLength={8} placeholder="e.g. M" value={p.sizeTops ?? ''} onChange={(e) => set('sizeTops', e.target.value || null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bottoms">Usual jeans size</Label>
          <Input id="bottoms" maxLength={8} placeholder="e.g. 30" value={p.sizeBottoms ?? ''} onChange={(e) => set('sizeBottoms', e.target.value || null)} />
        </div>
        <div className="sm:col-span-3">
          <ChipGroup label="Build" options={BODY.map((b) => ({ value: b, label: cap(b) }))} value={p.bodyType ? [p.bodyType] : []} onChange={(v) => set('bodyType', v[0] ?? null)} />
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <ChipGroup label="How you like clothes to fit" options={FITS.map((f) => ({ value: f, label: cap(f) }))} value={p.preferredFit ? [p.preferredFit] : []} onChange={(v) => set('preferredFit', v[0] ?? null)} />
        <ChipGroup label="Your climate" options={CLIMATES.map((c) => ({ value: c, label: cap(c) }))} value={p.climate ? [p.climate] : []} onChange={(v) => set('climate', v[0] ?? null)} />
        <div className="flex max-w-xs flex-col gap-1.5">
          <Label htmlFor="budget">Usual budget per item ($)</Label>
          <Input id="budget" type="number" inputMode="numeric" min={5} max={5000} value={p.budgetMax ?? ''} onChange={(e) => set('budgetMax', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <ChipGroup label="What matters most to you" options={PRIORITIES} value={p.priorities} onChange={(v) => set('priorities', v)} multi />
        <div className="flex items-center gap-3">
          <Switch id="sus" checked={p.sustainabilityOn} onCheckedChange={(v) => set('sustainabilityOn', v)} />
          <Label htmlFor="sus">Include sustainability in scores (+5%)</Label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <ChipGroup label="Brands to leave out" options={brands.map((b) => ({ value: b.slug, label: b.name }))} value={p.brandDeny} onChange={(v) => set('brandDeny', v)} multi />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : exists ? 'Save changes' : 'Save profile'}
          </Button>
          <Button asChild variant="secondary">
            <Link href="/search">Back to search</Link>
          </Button>
        </div>
        {exists && (
          <Button type="button" variant="ghost" onClick={remove} className="text-critical-fg">
            <Trash2 /> Delete my profile
          </Button>
        )}
      </div>
    </form>
  )
}
