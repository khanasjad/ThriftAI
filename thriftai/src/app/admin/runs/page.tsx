import Link from 'next/link'
import { Activity } from 'lucide-react'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import { listRuns } from '@/lib/veritas/read/runs'
import { StatusBadge, fmtMs, fmtUsd } from '../status-badge'

export const metadata = { title: 'Agent runs' }
export const dynamic = 'force-dynamic'

export default async function RunsPage() {
  const runs = await listRuns()
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
        <Activity className="size-8 text-fg-subtle" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-fg">No agent runs yet</h2>
        <p className="mt-2 max-w-md text-sm text-fg-muted">
          Runs appear here as soon as an agent starts. Try <code className="rounded bg-surface-2 px-1 font-mono text-xs">npm run smoke -- --yes</code>.
        </p>
      </div>
    )
  }
  return (
    <section aria-labelledby="runs-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="runs-h" className="text-base font-semibold text-fg">
          Recent runs
        </h2>
        <span className="text-sm text-fg-subtle">{runs.length} shown · newest first</span>
      </div>
      <div className="mt-4 rounded-xl border border-border bg-surface shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Run</TH>
              <TH>Status</TH>
              <TH>Product</TH>
              <TH className="text-right">Calls</TH>
              <TH className="text-right">Tokens in / out</TH>
              <TH className="text-right">Cached</TH>
              <TH className="text-right">Cost</TH>
              <TH className="text-right">Time</TH>
            </TR>
          </THead>
          <TBody>
            {runs.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link href={`/admin/runs/${r.id}`} className="font-medium text-fg hover:text-accent hover:underline">
                    {r.agent}
                  </Link>
                  <div className="text-xs text-fg-subtle">
                    {r.graph ?? '—'} · {r.model} ·{' '}
                    {new Date(r.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TD>
                <TD>
                  <StatusBadge status={r.status} />
                  {r.error && (
                    <div className="mt-1 max-w-[16rem] truncate text-xs text-fg-subtle" title={r.error}>
                      {r.error}
                    </div>
                  )}
                </TD>
                <TD>
                  {r.product ? (
                    <Link href={`/p/${r.product.slug}`} className="text-fg-muted hover:text-fg hover:underline">
                      {r.product.name}
                    </Link>
                  ) : (
                    <span className="text-fg-subtle">—</span>
                  )}
                </TD>
                <TD className="text-right tabular">{r.iterations}</TD>
                <TD className="text-right tabular">
                  {r.inputTokens.toLocaleString()} / {r.outputTokens.toLocaleString()}
                </TD>
                <TD className="text-right tabular">{r.cacheReadTokens.toLocaleString()}</TD>
                <TD className="text-right tabular">{fmtUsd(r.costUsd)}</TD>
                <TD className="text-right tabular">{fmtMs(r.durationMs)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </section>
  )
}
