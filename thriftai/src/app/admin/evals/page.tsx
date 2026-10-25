import Link from 'next/link'
import { ChevronRight, FlaskConical } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge, Table, TBody, TD, TH, THead, TR } from '@/components/ui/primitives'
import type { CheckResult } from '@/lib/veritas/evals/checks'
import type { runEval } from '@/lib/veritas/evals/run'
import { fmtMs, fmtUsd } from '../status-badge'

export const metadata = { title: 'Evals' }
export const dynamic = 'force-dynamic'

type Summary = Awaited<ReturnType<typeof runEval>>['summary']
const pct = (x: number | null | undefined) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`)

const LABEL: Record<string, string> = {
  fit: 'Fit direction',
  wash: 'Wash durability',
  pilling: 'Pilling',
  fabric: 'Fabric',
  construction: 'Construction',
  softness: 'Softness',
  photo: 'Looks as pictured',
  size_consistency: 'Size consistency',
  injection: 'Manipulation reviews down-weighted',
}

export default async function EvalsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const runs = await prisma.evalRun.findMany({ orderBy: { startedAt: 'desc' }, take: 10, select: { id: true, startedAt: true, judgeModel: true, summary: true, costUsd: true } })
  if (!runs.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
        <FlaskConical className="size-8 text-fg-subtle" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-fg">No eval runs yet</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Run <code className="rounded bg-surface-2 px-1 font-mono text-xs">npm run eval</code> ($0) or add <code className="rounded bg-surface-2 px-1 font-mono text-xs">-- --judge --yes</code> for the LLM judge.
        </p>
      </div>
    )
  }
  const current = runs.find((r) => r.id === id) ?? runs[0]
  const s = current.summary as unknown as Summary
  const results = await prisma.evalResult.findMany({ where: { evalRunId: current.id }, include: { evalCase: { select: { name: true, expected: true } } }, orderBy: { createdAt: 'asc' } })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">Eval run · {current.startedAt.toLocaleString('en-US')}</h2>
        <span className="text-xs text-fg-subtle">
          {s.cases} golden products · labels from the dataset generator’s ground truth · judge: {current.judgeModel}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Check agreement', pct(s.checks.agreement), `${s.checks.pass} of ${s.checks.pass + s.checks.fail} judged labels`],
          ['Evidence coverage', pct(s.checks.coverage), `${s.checks.noEvidence} labels without evidence yet`],
          ['Judge agreement', s.judge ? pct(s.judge.agreement) : 'Not run', s.judge ? `gate ≥ 80% · ${s.judge.comparisons} comparisons` : 'npm run eval -- --judge --yes'],
          ['Quote acceptance', pct(s.ops.quoteAcceptance), `${s.ops.quotes.accepted} accepted · ${s.ops.quotes.rejected} rejected`],
        ].map(([k, v, sub]) => (
          <div key={k} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <dt className="text-xs text-fg-subtle">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular text-fg">{v}</dd>
            <dd className="text-xs text-fg-subtle">{sub}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="labels-h" className="rounded-2xl border border-border bg-surface shadow-sm">
        <h3 id="labels-h" className="px-6 pt-5 text-base font-semibold text-fg">
          Checks by label
        </h3>
        <p className="px-6 pt-1 text-sm text-fg-muted">Does the stored evidence point the same way as the ground truth? “No evidence” is not a failure: those labels need text read by the evidence agent.</p>
        <div className="mt-3">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">Label</TH>
                <TH className="text-right">Pass</TH>
                <TH className="text-right">Fail</TH>
                <TH className="text-right">No evidence</TH>
                <TH className="pr-6 text-right">Agreement</TH>
              </TR>
            </THead>
            <TBody>
              {Object.entries(s.byKey).map(([k, v]) => (
                <TR key={k}>
                  <TD className="pl-6">{LABEL[k] ?? k}</TD>
                  <TD className="text-right tabular">{v.pass}</TD>
                  <TD className="text-right tabular">{v.fail}</TD>
                  <TD className="text-right tabular text-fg-subtle">{v.noEvidence}</TD>
                  <TD className="pr-6 text-right tabular">{pct(v.agreement)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      {s.judge && (
        <section aria-labelledby="judge-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h3 id="judge-h" className="text-base font-semibold text-fg">
            LLM judge ({current.judgeModel})
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
            {(['faithful', 'size_advice', 'downside', 'no_hype'] as const).map((k) => (
              <div key={k} className="rounded-lg bg-surface-2 p-3">
                <dt className="text-xs text-fg-subtle">{k.replace('_', ' ')}</dt>
                <dd className="text-lg font-semibold tabular text-fg">{s.judge!.rubric[k] ?? '—'}</dd>
              </div>
            ))}
            <div className="rounded-lg bg-surface-2 p-3">
              <dt className="text-xs text-fg-subtle">cost</dt>
              <dd className="text-lg font-semibold tabular text-fg">{fmtUsd(s.judge.costUsd)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section aria-labelledby="ops-h" className="rounded-2xl border border-border bg-surface shadow-sm">
        <h3 id="ops-h" className="px-6 pt-5 text-base font-semibold text-fg">
          Agent health
        </h3>
        <div className="mt-3">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">Agent</TH>
                <TH className="text-right">Runs</TH>
                <TH className="text-right">Finish rate</TH>
                <TH>How runs ended</TH>
                <TH className="text-right">Cost</TH>
                <TH className="text-right">Median time</TH>
                <TH className="pr-6 text-right">From cache</TH>
              </TR>
            </THead>
            <TBody>
              {s.ops.agents.map((a) => (
                <TR key={a.agent}>
                  <TD className="pl-6 font-medium">{a.agent}</TD>
                  <TD className="text-right tabular">{a.runs}</TD>
                  <TD className="text-right tabular">{pct(a.finishRate)}</TD>
                  <TD className="text-xs text-fg-muted">
                    {Object.entries(a.statuses)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(' · ')}
                  </TD>
                  <TD className="text-right tabular">{fmtUsd(a.costUsd)}</TD>
                  <TD className="text-right tabular">{fmtMs(a.medianMs)}</TD>
                  <TD className="pr-6 text-right tabular">{pct(a.cacheShare)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      <section aria-labelledby="fb-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 id="fb-h" className="text-base font-semibold text-fg">
          Shopper feedback
        </h3>
        <p className="mt-2 text-sm text-fg-muted">
          {s.feedback.total} votes · {s.feedback.up} 👍 · {s.feedback.down} 👎
        </p>
        {s.feedback.recentReasons.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-fg-muted">
            {s.feedback.recentReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cases-h">
        <h3 id="cases-h" className="text-base font-semibold text-fg">
          Golden products
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((r) => {
            const sc = r.scores as unknown as { checks: CheckResult[]; judge?: { notes?: string; error?: string } | null }
            const slug = r.evalCase.name.replace('evidence:', '')
            const why = (r.evalCase.expected as { why?: string }).why
            return (
              <li key={r.id}>
                <details className="group rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-90" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium text-fg">{slug}</span>
                    <span className="hidden text-xs text-fg-subtle sm:inline">{why}</span>
                    <Badge tone={sc.checks.some((c) => c.status === 'fail') ? 'critical' : sc.checks.some((c) => c.status === 'pass') ? 'good' : 'neutral'}>
                      {sc.checks.filter((c) => c.status === 'pass').length}✓ {sc.checks.filter((c) => c.status === 'fail').length}✗{' '}
                      {sc.checks.filter((c) => c.status === 'no_evidence').length}·
                    </Badge>
                  </summary>
                  <ul className="mt-3 flex flex-col gap-1 pl-7 text-sm">
                    {sc.checks.map((c) => (
                      <li key={c.key} className="text-fg-muted">
                        <span className={c.status === 'pass' ? 'text-good-fg' : c.status === 'fail' ? 'text-critical-fg' : 'text-fg-subtle'}>
                          {c.status === 'pass' ? 'Pass' : c.status === 'fail' ? 'Fail' : 'No evidence'}
                        </span>{' '}
                        · {LABEL[c.key] ?? c.key}: expected {c.expect}, got {c.got}
                      </li>
                    ))}
                    {sc.judge && <li className="text-fg-muted">Judge: {sc.judge.notes ?? sc.judge.error}</li>}
                    <li>
                      <Link href={`/p/${slug}`} className="text-accent hover:underline">
                        Product page
                      </Link>
                    </li>
                  </ul>
                </details>
              </li>
            )
          })}
        </ul>
      </section>

      {runs.length > 1 && (
        <section aria-labelledby="history-h">
          <h3 id="history-h" className="text-base font-semibold text-fg">
            Earlier runs
          </h3>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface text-sm">
            {runs.map((r) => {
              const rs = r.summary as unknown as Summary | null
              return (
                <li key={r.id}>
                  <Link href={`/admin/evals?id=${r.id}`} aria-current={r.id === current.id ? 'page' : undefined} className="flex justify-between gap-3 px-4 py-2.5 hover:bg-surface-2">
                    <span className="text-fg">{r.startedAt.toLocaleString('en-US')}</span>
                    <span className="tabular text-fg-muted">
                      checks {pct(rs?.checks.agreement)} · coverage {pct(rs?.checks.coverage)} · judge {rs?.judge ? pct(rs.judge.agreement) : '—'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
