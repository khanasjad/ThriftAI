import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { TraceTimeline, type TraceStep } from '@/components/veritas/trace-timeline'
import { getRun } from '@/lib/veritas/read/runs'
import { StatusBadge, fmtMs, fmtUsd } from '../../status-badge'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Run ${id.slice(-8)}` }
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const run = await getRun(id)
  if (!run) notFound()

  const promptTokens = run.inputTokens + run.cacheReadTokens + run.cacheWriteTokens
  const cacheShare = promptTokens ? Math.round((run.cacheReadTokens / promptTokens) * 100) : 0
  const steps: TraceStep[] = run.steps.map((s) => ({ ...s, kind: s.kind }))

  const tiles: [string, string, string?][] = [
    ['Model calls', String(run.iterations)],
    ['Tokens in / out', `${run.inputTokens.toLocaleString()} / ${run.outputTokens.toLocaleString()}`],
    ['Prompt from cache', `${cacheShare}%`, `${run.cacheReadTokens.toLocaleString()} read · ${run.cacheWriteTokens.toLocaleString()} written`],
    ['Cost', fmtUsd(run.costUsd)],
    ['Duration', fmtMs(run.durationMs)],
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/runs" className="inline-flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronLeft className="size-4" aria-hidden /> All runs
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-fg">{run.agent}</h2>
            <StatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {run.graph ?? 'no graph'} · {run.model} · {run.env} · started {new Date(run.startedAt).toLocaleString('en-US')}
          </p>
          <p className="mt-1 font-mono text-xs text-fg-subtle">{run.id}</p>
        </div>
        {run.product && (
          <Link href={`/p/${run.product.slug}`} className="text-sm text-accent hover:underline">
            {run.product.name}
          </Link>
        )}
      </header>

      {run.error && (
        <div role="note" className="rounded-xl border border-critical/40 bg-critical-soft px-4 py-3 text-sm text-critical-fg">
          <p className="font-medium">Run stopped: {run.status}</p>
          <p className="mt-1 break-words font-mono text-xs">{run.error}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map(([k, v, sub]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <dt className="text-xs text-fg-subtle">{k}</dt>
            <dd className="mt-1 text-lg font-semibold tabular text-fg">{v}</dd>
            {sub && <dd className="text-xs text-fg-subtle tabular">{sub}</dd>}
          </div>
        ))}
      </dl>

      <section aria-labelledby="steps-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="steps-h" className="text-base font-semibold text-fg">
            Loop steps
          </h3>
          <span className="text-xs text-fg-subtle">Click a step to see its input and output</span>
        </div>
        <div className="mt-5">
          {steps.length ? <TraceTimeline steps={steps} status={run.status} /> : <p className="text-sm text-fg-muted">No steps recorded.</p>}
        </div>
      </section>

      <section aria-labelledby="finish-h" className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 id="finish-h" className="text-base font-semibold text-fg">
            Finish payload
          </h3>
          <pre tabIndex={0} className="mt-3 max-h-80 overflow-auto rounded-lg bg-surface-2 p-4 font-mono text-xs leading-relaxed text-fg">
            {run.finishPayload ? JSON.stringify(run.finishPayload, null, 2) : 'None: the run ended before calling finish.'}
          </pre>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-base font-semibold text-fg">Outputs</h3>
          <dl className="mt-3 divide-y divide-border text-sm">
            {[
              ['Evidence recorded', run.evidenceCount],
              ['Findings recorded', run.findingCount],
              ['Inputs hash', run.inputsHash ?? '—'],
              ['Parent run', run.parent ? `${run.parent.agent} (${run.parent.id.slice(-8)})` : '—'],
              ['Child runs', run.children.length],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-3 py-2">
                <dt className="text-fg-subtle">{k}</dt>
                <dd className="truncate font-medium tabular text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}
