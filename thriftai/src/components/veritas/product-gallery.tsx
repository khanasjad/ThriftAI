'use client'

import * as React from 'react'
import { ProductThumb } from '@/components/veritas/product-thumb'
import { swatchFor } from '@/components/veritas/colors'
import { cn } from '@/lib/utils'

/** Product illustration with one swatch per colourway. Switching colour only changes the picture. */
export function ProductGallery({ name, category, subcategory, silhouette, colors }: { name: string; category: string; subcategory: string | null; silhouette: string | null; colors: string[] }) {
  const [color, setColor] = React.useState(colors[0] ?? null)
  return (
    <div>
      <ProductThumb category={category} subcategory={subcategory} silhouette={silhouette} color={color} label={name} className="rounded-2xl" />
      {colors.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-sm text-fg-muted">
            Colour: <span className="font-medium text-fg">{color}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={c === color}
                aria-label={c}
                className={cn(
                  'size-9 rounded-full border border-border-strong shadow-inner transition-[box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  c === color && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
                )}
                style={{ background: swatchFor(c) ?? 'var(--surface-3)' }}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
