import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'About', description: 'Why Veritas exists and the principles behind the score.' }

const PRINCIPLES = [
  ['Score and evidence first', 'Price second, brand last. Every claim is clickable to its source.'],
  ['Honest about uncertainty', 'Every score carries a confidence label. When evidence is thin we say so instead of guessing.'],
  ['Independent', 'No pay-for-score and no sponsored items in the top 3.'],
  ['Privacy by default', 'The shopper profile is optional, editable, and deletable in one click.'],
]

export default function AboutPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
        <p className="text-sm font-medium text-accent">About</p>
        <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-fg">
          A clothing purchase is a dozen quiet questions at once.
        </h1>
        <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-fg-muted">
          <p>
            Will it fit? Will it last? Is the sale real? Is the brand any good? Today shoppers answer these by opening ten tabs and guessing, and a lot of
            clothing goes back as a result.
          </p>
          <p>
            Veritas gives every clothing item one trustworthy score that answers the real question, “is this worth buying, for me?”, with the evidence behind
            every number. Shoppers get three good picks instead of 300 results. Brands learn why products get returned. Search and AI platforms can rank by it.
          </p>
        </div>

        <h2 className="mt-14 text-xl font-semibold text-fg">Principles</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {PRINCIPLES.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-medium text-fg">{k}</dt>
              <dd className="text-fg-muted">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 text-xl font-semibold text-fg">Where we are</h2>
        <p className="mt-3 leading-relaxed text-fg-muted">
          Veritas is in development. The site runs on a fictional test catalog of t-shirts, shirts and jeans while the rating agents are built and tested. Real brand data
          comes only from brands directly, or from sources whose terms allow it.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/how-it-works">How the score works</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/pilot">Brands: free pilot</Link>
          </Button>
        </div>
      </article>
    </SiteShell>
  )
}
