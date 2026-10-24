import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import { env } from '@/lib/veritas/env'
import { spendSummary } from '@/lib/veritas/read/runs'
import { StatusBadge, fmtUsd } from '../status-badge'

export const metadata = { title: 'Spend' }
export const dynamic = 'force-dynamic'

export default async function SpendPage() {
  const e = env()
  const s = await spendSummary(e.APP_ENV)
  const cap = e.SPEND_CAP_USD
  const pct = Math.min(100, (s.total / cap) * 100)
  const tone = pct >= 90 ? 'var(--critical)' : pct >= 70 ? 'var(--warning)' : 'var(--score-4)'

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="cap-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 id="cap-h" className="text-sm text-fg-muted">
          Spend in <span className="font-medium text-fg">{e.APP_ENV}</span> vs. SPEND_CAP_USD
        </h2>
        <p className="mt-2 text-fg">
          <span className="text-4xl font-semibold tracking-tight tabular">{fmtUsd(s.total)}</span>
          <span className="text-lg text-fg-muted tabular"> of ${cap.toFixed(2)}</span>
        </p>
        <div
          className="mt-4 h-2.5 rounded-full bg-score-track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={s.total}
          aria-label={`Spend ${pct.toFixed(1)}% of cap`}
        >
          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, s.total > 0 ? 1 : 0)}%`, background: tone }} />
        </div>
        <p className="mt-2 text-xs text-fg-subtle tabular">
          {pct.toFixed(1)}% used · {s.runs} runs · the harness refuses new model calls at the cap
        </p>
      </section>

      <section aria-labelledby="agent-h" className="rounded-2xl border border-border bg-surface shadow-sm">
        <h2 id="agent-h" className="px-6 pt-5 text-base font-semibold text-fg">
          By agent
        </h2>
        {s.byAgent.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm text-fg-muted">No runs yet.</p>
        ) : (
          <div className="mt-3">
            <Table>
              <THead>
                <TR>
                  <TH>Agent</TH>
                  <TH>Model</TH>
                  <TH className="text-right">Runs</TH>
                  <TH className="text-right">Tokens in / out</TH>
                  <TH className="text-right">Cached</TH>
                  <TH className="text-right">Cost</TH>
                </TR>
              </THead>
              <TBody>
                {s.byAgent.map((a) => (
                  <TR key={`${a.agent}${a.model}`}>
                    <TD className="font-medium">{a.agent}</TD>
                    <TD className="text-fg-muted">{a.model}</TD>
                    <TD className="text-right tabular">{a.runs}</TD>
                    <TD className="text-right tabular">
                      {a.inputTokens.toLocaleString()} / {a.outputTokens.toLocaleString()}
                    </TD>
                    <TD className="text-right tabular">{a.cacheReadTokens.toLocaleString()}</TD>
                    <TD className="text-right tabular">{fmtUsd(a.costUsd)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="day-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="day-h" className="text-base font-semibold text-fg">
            By day
          </h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {s.byDay.map((d) => (
              <li key={d.day} className="flex justify-between py-2">
                <span className="text-fg-muted">{new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="font-medium tabular text-fg">{fmtUsd(d.costUsd)}</span>
              </li>
            ))}
            {s.byDay.length === 0 && <li className="py-2 text-fg-muted">No spend yet.</li>}
          </ul>
        </section>
        <section aria-labelledby="status-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 id="status-h" className="text-base font-semibold text-fg">
            How runs ended
          </h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {s.byStatus.map((x) => (
              <li key={x.status} className="flex items-center justify-between py-2">
                <StatusBadge status={x.status} />
                <span className="font-medium tabular text-fg">{x.count}</span>
              </li>
            ))}
            {s.byStatus.length === 0 && <li className="py-2 text-fg-muted">No runs yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
