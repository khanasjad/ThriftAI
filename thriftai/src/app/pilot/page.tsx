'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, FileBarChart, Ruler, Tag, TrendingDown } from 'lucide-react'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const PRODUCT_RANGES = [
  { value: '1-50', label: '1–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '500+', label: '500+' },
]
const REVIEW_RANGES = [
  { value: '<200', label: 'Fewer than 200' },
  { value: '200-500', label: '200–500' },
  { value: '500-2000', label: '500–2,000' },
  { value: '2000+', label: '2,000+' },
]

const GETS = [
  { icon: <FileBarChart />, t: 'A Veritas Score for every product', d: 'With pillar breakdown, confidence, and how you compare with category peers.' },
  { icon: <TrendingDown />, t: 'Top problems ranked by cost', d: '“Runs small”, “fades after washing”, “colour not as pictured”, with the evidence.' },
  { icon: <Ruler />, t: 'Size-chart fixes', d: 'Where fit evidence says your size chart is off, and by how much.' },
  { icon: <Tag />, t: 'Price position', d: 'Where each product sits on value against similar items.' },
]

const selectClass =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-sm hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export default function PilotPage() {
  const [state, setState] = React.useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setState('sending')
    const body = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/v1/pilot-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Something went wrong. Please try again.')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setState('idle')
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="text-sm font-medium text-accent">Free pilot scorecard</p>
          <h1 className="mt-3 text-balance text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-fg">
            See your catalog the way your customers do.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-fg-muted">
            A one-time scorecard of your catalog, built from your own reviews and return reasons. Free, and you keep the report.
          </p>
          <ul className="mt-8 flex flex-col gap-5">
            {GETS.map((g) => (
              <li key={g.t} className="flex gap-4 [&_svg]:size-5 [&_svg]:text-accent">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">{g.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-fg">{g.t}</p>
                  <p className="mt-1 text-sm text-fg-muted">{g.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-fg-subtle">
            Your score is never for sale. Paid plans buy insight and refresh frequency, not points.{' '}
            <Link href="/brands/pricing" className="text-accent underline underline-offset-4">
              See pricing
            </Link>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8">
          {state === 'done' ? (
            <div className="flex flex-col items-center py-12 text-center" role="status">
              <CheckCircle2 className="size-10 text-good-fg" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-fg">Application received</h2>
              <p className="mt-2 max-w-sm text-sm text-fg-muted">We’ll email you about next steps, including how to share your reviews and return data.</p>
              <Button asChild variant="secondary" className="mt-8">
                <Link href="/how-it-works">How the score works</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate={false}>
              <h2 className="text-lg font-semibold text-fg">Apply for a pilot</h2>
              <Field label="Company" htmlFor="companyName">
                <Input id="companyName" name="companyName" required maxLength={200} autoComplete="organization" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName">
                  <Input id="firstName" name="firstName" required maxLength={100} autoComplete="given-name" />
                </Field>
                <Field label="Last name" htmlFor="lastName">
                  <Input id="lastName" name="lastName" required maxLength={100} autoComplete="family-name" />
                </Field>
              </div>
              <Field label="Work email" htmlFor="email">
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </Field>
              <Field label="Website" htmlFor="website" optional>
                <Input id="website" name="website" type="url" placeholder="https://" autoComplete="url" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Products in catalog" htmlFor="productCount" optional>
                  <select id="productCount" name="productCount" className={selectClass} defaultValue="">
                    <option value="">Select a range</option>
                    {PRODUCT_RANGES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Reviews collected" htmlFor="reviewCount" optional>
                  <select id="reviewCount" name="reviewCount" className={selectClass} defaultValue="">
                    <option value="">Select a range</option>
                    {REVIEW_RANGES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical-fg">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={state === 'sending'} className={cn(state === 'sending' && 'cursor-wait')}>
                {state === 'sending' ? 'Sending…' : 'Apply for the free scorecard'}
              </Button>
              <p className="text-xs text-fg-subtle">
                We use your details only to run the pilot. See our{' '}
                <Link href="/privacy-policy" className="underline hover:text-fg">
                  privacy policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  )
}

function Field({ label, htmlFor, optional, children }: { label: string; htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label} {optional && <span className="font-normal text-fg-subtle">(optional)</span>}
      </Label>
      {children}
    </div>
  )
}
