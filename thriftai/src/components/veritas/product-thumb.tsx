import { useId } from 'react'
import { cn } from '@/lib/utils'
import { swatchFor } from './colors'

/**
 * Generated product illustration for dev products (frontend plan §3: no stock photos, no fake photos).
 * Drawn from the product's own data: its cut (silhouette) and its colour, so a "Sage boxy tee" looks like one.
 * It is labelled "Illustration" so nobody mistakes it for a real photo.
 */
type Shape = { body: string; details: string[]; dashed?: string[]; /** y of the floor shadow, just under the hem */ floor?: number }

const TEE_BODY = (neck: string, hemY: number, hem = '') =>
  `M48 18 ${neck} L90 24 L108 42 L96 54 L88 48 L88 ${hemY} ${hem || `L32 ${hemY}`} L32 48 L24 54 L12 42 L30 24 Z`

const SHAPES: Record<string, Shape> = {
  'crew-tee': {
    floor: 127,
    body: TEE_BODY('Q60 30 72 18', 120),
    details: ['M48 18 Q60 30 72 18', 'M45 20 Q60 35 75 20'],
    dashed: ['M14 44 L25 52', 'M106 44 L95 52', 'M33 116 L87 116'],
  },
  'v-neck-tee': {
    floor: 127,
    body: TEE_BODY('L60 36 L72 18', 120),
    details: ['M48 18 L60 36 L72 18', 'M45 20 L60 40 L75 20'],
    dashed: ['M14 44 L25 52', 'M106 44 L95 52', 'M33 116 L87 116'],
  },
  'boxy-tee': {
    floor: 115,
    body: 'M50 16 Q60 26 70 16 L96 20 L114 48 L99 56 L95 50 L95 108 L25 108 L25 50 L21 56 L6 48 L24 20 Z',
    details: ['M50 16 Q60 26 70 16', 'M47 18 Q60 31 73 18', 'M25 50 L32 22', 'M95 50 L88 22'],
    dashed: ['M26 104 L94 104'],
  },
  'longline-tee': {
    floor: 140,
    body: TEE_BODY('Q60 30 72 18', 128, 'Q60 142 32 128'),
    details: ['M48 18 Q60 30 72 18', 'M45 20 Q60 35 75 20'],
    dashed: ['M14 44 L25 52', 'M106 44 L95 52', 'M34 124 Q60 137 86 124'],
  },
  straight: {
    body: 'M36 12 L84 12 L86 26 L88 132 L66 132 L61 52 L59 52 L54 132 L32 132 L34 26 Z',
    details: ['M35 20 L85 20', 'M60 20 L60 50', 'M36 26 Q44 36 50 24', 'M84 26 Q76 36 70 24'],
    dashed: ['M62 22 Q66 40 60 46', 'M33 128 L53 128', 'M67 128 L87 128'],
  },
  'wide-leg': {
    body: 'M38 12 L82 12 L85 26 L100 132 L67 132 L61 54 L59 54 L53 132 L20 132 L35 26 Z',
    details: ['M37 20 L83 20', 'M60 20 L60 52', 'M37 26 Q45 36 51 24', 'M83 26 Q75 36 69 24'],
    dashed: ['M62 22 Q66 40 60 48', 'M22 128 L53 128', 'M67 128 L98 128'],
  },
  skinny: {
    body: 'M38 12 L82 12 L84 26 L79 132 L66 132 L61 52 L59 52 L54 132 L41 132 L36 26 Z',
    details: ['M37 20 L83 20', 'M60 20 L60 50', 'M37 26 Q44 35 50 24', 'M83 26 Q76 35 70 24'],
    dashed: ['M62 22 Q66 40 60 46', 'M42 128 L54 128', 'M66 128 L78 128'],
  },
  'slim-taper': {
    body: 'M36 12 L84 12 L87 26 L82 132 L66 132 L61 52 L59 52 L54 132 L38 132 L33 26 Z',
    details: ['M35 20 L85 20', 'M60 20 L60 50', 'M35 26 Q43 36 50 24', 'M85 26 Q77 36 70 24'],
    dashed: ['M62 22 Q66 40 60 46', 'M39 128 L54 128', 'M66 128 L81 128'],
  },
  bootcut: {
    body: 'M37 12 L83 12 L86 26 L84 96 L91 132 L66 132 L63 96 L61 52 L59 52 L57 96 L54 132 L29 132 L36 96 L34 26 Z',
    details: ['M36 20 L84 20', 'M60 20 L60 50', 'M36 26 Q44 36 50 24', 'M84 26 Q76 36 70 24'],
    dashed: ['M62 22 Q66 40 60 46', 'M30 128 L54 128', 'M66 128 L90 128'],
  },
}

function shapeFor(category: string, subcategory?: string | null, silhouette?: string | null): Shape {
  if (silhouette && SHAPES[silhouette]) return SHAPES[silhouette]
  const s = (subcategory ?? '').toLowerCase()
  if (s.includes('jean') || s.includes('denim') || category === 'BOTTOMS') return SHAPES.straight
  return SHAPES['crew-tee']
}

/** Colour names that are light enough to need a darker outline and darker detail lines. */
const LIGHT = new Set(['white', 'ecru', 'oatmeal', 'light vintage', 'heather grey', 'sage'])

/** Repeating pattern tiles drawn over the garment colour; ink contrasts with the base colour. */
function PatternDefs({ id, pattern, light }: { id: string; pattern?: string | null; light: boolean }) {
  const ink = light ? 'rgb(31 42 68 / 0.75)' : 'rgb(255 255 255 / 0.8)'
  if (pattern === 'striped')
    return (
      <pattern id={`pat-${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="3" fill={ink} />
      </pattern>
    )
  if (pattern === 'polka-dot')
    return (
      <pattern id={`pat-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.8" fill={ink} />
        <circle cx="8" cy="8" r="1.8" fill={ink} />
      </pattern>
    )
  if (pattern === 'plaid')
    return (
      <pattern id={`pat-${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="4" fill={ink} opacity="0.45" />
        <rect width="4" height="16" fill={ink} opacity="0.45" />
        <rect y="9" width="16" height="1" fill={ink} opacity="0.6" />
        <rect x="9" width="1" height="16" fill={ink} opacity="0.6" />
      </pattern>
    )
  if (pattern === 'floral')
    return (
      <pattern id={`pat-${id}`} width="18" height="18" patternUnits="userSpaceOnUse">
        {[
          [5, 5],
          [14, 13],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={x} cy={y - 2.4} rx="1.5" ry="2.4" fill={light ? '#c4566a' : '#f4c6d0'} transform={`rotate(${a} ${x} ${y})`} />
            ))}
            <circle cx={x} cy={y} r="1.2" fill="#f2c94c" />
          </g>
        ))}
        <path d="M9 14 q2 -3 4 -2" stroke={light ? '#6d8b5a' : '#cfe3c0'} strokeWidth="0.8" fill="none" />
      </pattern>
    )
  return null
}

export function ProductThumb({
  category,
  subcategory,
  silhouette,
  color,
  pattern,
  label,
  showTag = true,
  className,
}: {
  category: string
  subcategory?: string | null
  /** e.g. crew-tee, boxy-tee, straight, wide-leg… picks the drawn cut. */
  silhouette?: string | null
  /** Catalog colour name, e.g. "Sage". */
  color?: string | null
  /** solid | striped | floral | polka-dot | plaid | graphic (from the vision agent, or the dev truth for dev images) */
  pattern?: string | null
  /** Accessible name, e.g. the product name. Omit when the image is decorative. */
  label?: string
  showTag?: boolean
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const shape = shapeFor(category, subcategory, silhouette)
  const fill = (color && swatchFor(color)) || 'var(--surface-3)'
  const light = !color || LIGHT.has(color.toLowerCase())
  const line = light ? 'rgb(0 0 0 / 0.28)' : 'rgb(255 255 255 / 0.22)'
  const outline = light ? 'rgb(0 0 0 / 0.35)' : 'rgb(0 0 0 / 0.55)'

  return (
    <div
      className={cn('relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-surface-2 to-surface-3', className)}
      role={label ? 'img' : undefined}
      aria-label={label ? `${label}${color ? `, ${color}` : ''}${pattern && pattern !== 'solid' ? `, ${pattern}` : ''} (illustration)` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 120 146" className="h-[78%] w-[78%] drop-shadow-[0_6px_8px_rgb(0_0_0/0.12)]">
        <defs>
          <linearGradient id={`shade-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.18" />
          </linearGradient>
          <clipPath id={`body-${id}`}>
            <path d={shape.body} />
          </clipPath>
          <PatternDefs id={id} pattern={pattern} light={light} />
        </defs>
        <ellipse cx="60" cy={shape.floor ?? 139} rx="34" ry="3" fill="rgb(0 0 0 / 0.10)" />
        <path d={shape.body} style={{ fill }} />
        {pattern && pattern !== 'solid' && pattern !== 'graphic' && <path d={shape.body} fill={`url(#pat-${id})`} />}
        {pattern === 'graphic' && (
          <g clipPath={`url(#body-${id})`} opacity="0.85">
            <circle cx="60" cy="62" r="14" fill={light ? '#2f3a6b' : '#f2e6c9'} />
            <path d="M40 86 L52 70 L60 78 L70 64 L82 86 Z" fill={light ? '#b0524a' : '#9cad8a'} />
          </g>
        )}
        <path d={shape.body} fill={`url(#shade-${id})`} />
        {shape.details.map((d) => (
          <path key={d} d={d} fill="none" stroke={line} strokeWidth="1.2" strokeLinecap="round" />
        ))}
        {shape.dashed?.map((d) => (
          <path key={d} d={d} fill="none" stroke={line} strokeWidth="0.9" strokeDasharray="2 2" strokeLinecap="round" />
        ))}
        <path d={shape.body} fill="none" stroke={outline} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      {showTag && (
        <span className="absolute bottom-2 left-2 rounded bg-surface/85 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">Illustration</span>
      )}
    </div>
  )
}
