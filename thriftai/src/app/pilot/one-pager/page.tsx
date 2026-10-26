import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PrintButton } from '@/components/ui/print-button'
import { siteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: 'Pilot one-pager',
  description: 'The Veritas pilot: a free, one-time scorecard of your catalog from your own reviews, returns and prices.',
  robots: { index: false },
}

const base = siteUrl()

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print:break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-fg">{children}</div>
    </section>
  )
}

/** Printable sales sheet for pilot outreach. Every statement describes what the product does; no outcome claims. */
export default function OnePager() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl bg-bg px-6 py-8 text-fg print:max-w-none print:px-0 print:py-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/pilot" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" aria-hidden /> Pilot
        </Link>
        <PrintButton />
      </div>

      <header className="mt-6 border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Veritas pilot</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">A free scorecard of your catalog</h1>
        <p className="mt-2 text-fg-muted">Sales data shows what sells. Veritas shows what’s worth buying: what gets kept, what gets sent back, and why.</p>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
        <Block title="What you get, free, one time">
          <ul className="list-disc space-y-1 pl-5">
            <li>A 0–100 Veritas Score for every product, built from 27 factors and explained as three drivers: product quality (from reviews), price, brand reputation</li>
            <li>Your top fixes, ranked by the score points each one costs</li>
            <li>Size-chart corrections from your customers’ fit answers</li>
            <li>Return reasons ranked by estimated cost</li>
            <li>A price-honesty check (fake “was” prices, frequent cheaper periods)</li>
            <li>Which products are ready to advertise, and why the rest aren’t</li>
          </ul>
        </Block>
        <Block title="What we need from you">
          <p>Three files, CSV or JSON, or a push to our API:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li><span className="font-medium">Catalog</span> with prices (id, title, brand, category, price, link)</li>
            <li><span className="font-medium">Reviews</span> (product id, rating, text, date)</li>
            <li><span className="font-medium">Returns</span>, optional (product id, reason, date)</li>
          </ul>
          <p className="mt-2">A dry run checks your files first and lists any row that needs fixing. Re-sending a file never creates duplicates.</p>
        </Block>
        <Block title="How it works">
          <p>
            AI reads every review and return reason, the way a careful analyst would. Code then computes every score from that evidence, so each number is explainable and
            links back to the reviews, returns and prices behind it.
          </p>
        </Block>
        <Block title="Your data">
          <p>Used only for your scorecard, private to your account, and deleted on request. We never sell it or show it publicly.</p>
          <p className="mt-2">Nobody can pay for a better score: not you, not a competitor.</p>
        </Block>
      </div>

      <section className="mt-6 rounded-xl border border-border p-4 print:break-inside-avoid">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">After the pilot</h2>
        <table className="mt-2 w-full text-sm">
          <tbody className="divide-y divide-border">
            {[
              ['Starter', 'Up to 500 products, monthly refresh', '$299/month'],
              ['Growth', 'Up to 2,500 products, weekly refresh, Score API, launch watch', '$799/month'],
              ['Pro', 'Unlimited products, daily refresh, search integration, trend insights', '$2,000/month'],
              ['Platform', 'Marketplaces and large retailers: score feed and API at scale', 'Annual contract, by catalog size'],
            ].map(([plan, what, price]) => (
              <tr key={plan}>
                <td className="py-2 pr-3 font-medium">{plan}</td>
                <td className="py-2 pr-3 text-fg-muted">{what}</td>
                <td className="py-2 text-right tabular">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-6 border-t border-border pt-4 text-sm">
        <p className="font-medium">Start the pilot: {base}/pilot</p>
        <p className="mt-1 text-fg-muted">Three steps: send your files, we score your catalog, then we walk you through the scorecard together.</p>
      </footer>
    </main>
  )
}
