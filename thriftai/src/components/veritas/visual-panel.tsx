import { Camera } from 'lucide-react'

export type Visual = {
  colors: { name: string; family: string }[]
  pattern: string
  pattern_detail: string
  neckline: string
  sleeve: string
  shape: string
  style_tags: string[]
  description: string
}

const FAMILY_SWATCH: Record<string, string> = {
  black: '#16161a', white: '#ffffff', grey: '#a9a9ab', blue: '#2f4a8a', red: '#b0524a', pink: '#e6a1b4', green: '#6f8f5e', yellow: '#e8c547',
  orange: '#e08a3c', purple: '#7d5ba6', brown: '#7a5538', beige: '#d8ccb3', multi: 'conic-gradient(#b0524a, #e8c547, #6f8f5e, #2f4a8a, #b0524a)',
}
const words = (s: string) => s.replace(/_/g, ' ').replace(/-/g, ' ')

/** What the product photo shows, as read by the vision agent. Describes the look; never part of the score. */
export function VisualPanel({ visual }: { visual: Visual }) {
  const rows: [string, string][] = [
    ['Pattern', visual.pattern === 'solid' ? 'Solid' : `${words(visual.pattern)}${visual.pattern_detail && visual.pattern_detail !== 'none' ? ` (${visual.pattern_detail})` : ''}`],
    ['Shape', words(visual.shape)],
    ...(visual.neckline !== 'not_applicable' ? [['Neckline', words(visual.neckline)] as [string, string]] : []),
    ...(visual.sleeve !== 'not_applicable' ? [['Sleeves', words(visual.sleeve)] as [string, string]] : []),
  ]
  return (
    <section aria-labelledby="visual-h" className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 id="visual-h" className="flex items-center gap-2 text-base font-semibold text-fg">
        <Camera className="size-4 text-accent" aria-hidden /> What the photo shows
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{visual.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {visual.colors.map((c) => (
          <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-fg">
            <span className="size-3.5 rounded-full border border-border-strong" style={{ background: FAMILY_SWATCH[c.family] ?? 'var(--surface-3)' }} aria-hidden />
            {c.name}
          </span>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-fg-subtle">{k}</dt>
            <dd className="capitalize text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      {visual.style_tags.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-1.5">
          {visual.style_tags.map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-fg-muted">
              {t}
            </span>
          ))}
        </p>
      )}
      <p className="mt-4 text-xs text-fg-subtle">Read from the product photo by AI. It helps you search by look; it never changes the score.</p>
    </section>
  )
}
