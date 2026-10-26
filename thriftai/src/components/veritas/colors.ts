/** Swatches for colour names in the catalog (dev fixture). Unknown names fall back to a neutral swatch with the name shown. */
export const SWATCH: Record<string, string> = {
  black: '#16161a',
  white: '#ffffff',
  ecru: '#ece4d2',
  oatmeal: '#d8ccb3',
  'heather grey': '#a9a9ab',
  navy: '#1f2a44',
  sage: '#9cad8a',
  'washed red': '#b0524a',
  'light vintage': '#a9c0d9',
  'mid wash': '#5e7fa6',
  'indigo rinse': '#2f3a6b',
  'light blue': '#a9c4e0',
}

export function swatchFor(name: string): string | undefined {
  return SWATCH[name.toLowerCase().trim()]
}
