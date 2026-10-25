import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PILOT_STATUSES } from '@/lib/veritas/pilots'
import { cn } from '@/lib/utils'
import { PilotRow } from './pilot-row'

export const metadata = { title: 'Pilot applications' }
export const dynamic = 'force-dynamic'

export default async function PilotsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const filter = (PILOT_STATUSES as readonly string[]).includes(status ?? '') ? status : undefined
  const [rows, counts] = await Promise.all([
    prisma.pilotApplication.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.pilotApplication.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const countOf = (s?: string) => (s ? (counts.find((c) => c.status === s)?._count._all ?? 0) : counts.reduce((n, c) => n + c._count._all, 0))

  return (
    <section aria-labelledby="pilots-h">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="pilots-h" className="text-base font-semibold text-fg">
          Pilot applications
        </h2>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {[undefined, ...PILOT_STATUSES].map((s) => (
            <Link
              key={s ?? 'all'}
              href={s ? `/admin/pilots?status=${s}` : '/admin/pilots'}
              aria-current={filter === s ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                filter === s ? 'border-fg bg-fg text-bg' : 'border-border bg-surface text-fg-muted hover:text-fg',
              )}
            >
              {s ? s[0].toUpperCase() + s.slice(1) : 'All'}
              <span className="tabular opacity-70">{countOf(s)}</span>
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
          <Inbox className="size-8 text-fg-subtle" aria-hidden />
          <p className="mt-4 text-lg font-semibold text-fg">No applications{filter ? ` marked ${filter}` : ' yet'}</p>
          <p className="mt-2 text-sm text-fg-muted">
            They arrive from the{' '}
            <Link href="/pilot" className="text-accent underline underline-offset-4">
              pilot form
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface px-6 shadow-sm">
          {rows.map((r) => (
            <PilotRow
              key={r.id}
              row={{
                id: r.id,
                companyName: r.companyName,
                name: `${r.firstName} ${r.lastName}`,
                email: r.email,
                website: r.website,
                productCount: r.productCount,
                reviewCount: r.reviewCount,
                status: r.status,
                notes: r.notes,
                createdAt: r.createdAt.toISOString(),
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
