import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Table, TBody, TH, THead, TR } from '@/components/ui/primitives'
import { OUTREACH_STATUSES, TARGET_CRITERIA } from '@/lib/veritas/outreach'
import { AddTarget, TargetRow } from './tracker'

export const metadata: Metadata = { title: 'Outreach' }
export const dynamic = 'force-dynamic'

/** Outreach tracker (B13): who we approach for pilots and where each one stands. Company-level data only. */
export default async function OutreachPage() {
  const targets = await prisma.outreachTarget.findMany({ orderBy: [{ updatedAt: 'desc' }] })
  const count = (s: string) => targets.filter((t) => t.status === s).length
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-fg">Outreach</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Goal from the product plan: 100 brands contacted, a sample scorecard shown to 3. Send the{' '}
          <Link href="/pilot/one-pager" className="text-accent underline underline-offset-4">
            one-pager
          </Link>{' '}
          and a scorecard. Company details only: don’t store personal contact data here.
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {OUTREACH_STATUSES.map((s) => (
            <div key={s} className="rounded-lg bg-surface-2 px-3 py-2">
              <dt className="text-xs capitalize text-fg-subtle">{s}</dt>
              <dd className="text-lg font-semibold tabular text-fg">{count(s)}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-5 text-sm font-semibold text-fg">Who to approach first</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-fg-muted">
          {TARGET_CRITERIA.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <AddTarget />
        {targets.length === 0 ? (
          <p className="mt-6 text-sm text-fg-muted">No targets yet. Add the first company above.</p>
        ) : (
          <div className="-mx-6 mt-6 overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-6">Company</TH>
                  <TH>Status</TH>
                  <TH>Scorecard sent</TH>
                  <TH>Next step</TH>
                  <TH className="pr-6">
                    <span className="sr-only">Remove</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {targets.map((t) => (
                  <TargetRow key={t.id} t={{ ...t, scorecardSentAt: t.scorecardSentAt?.toISOString() ?? null }} />
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
