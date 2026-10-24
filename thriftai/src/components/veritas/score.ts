/**
 * Shared score vocabulary for the UI. Score colours are an ordinal one-hue ramp
 * (validated in globals.css); every coloured score also shows its number and band word.
 */
export type Pillar = 'FIT' | 'QUALITY' | 'STYLE_VALUE' | 'COMFORT' | 'SUSTAINABILITY'
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW_LAUNCH'

export const PILLARS: { key: Pillar; label: string; short: string; weight: number }[] = [
  { key: 'FIT', label: 'Fit & sizing', short: 'Fit', weight: 35 },
  { key: 'QUALITY', label: 'Quality & durability', short: 'Quality', weight: 30 },
  { key: 'STYLE_VALUE', label: 'Style & value', short: 'Style & value', weight: 20 },
  { key: 'COMFORT', label: 'Comfort', short: 'Comfort', weight: 15 },
  { key: 'SUSTAINABILITY', label: 'Sustainability', short: 'Sustainability', weight: 5 },
]

export type Band = { step: 1 | 2 | 3 | 4 | 5; label: string; color: string }

const BANDS: { min: number; band: Band }[] = [
  { min: 85, band: { step: 5, label: 'Excellent', color: 'var(--score-5)' } },
  { min: 70, band: { step: 4, label: 'Good', color: 'var(--score-4)' } },
  { min: 55, band: { step: 3, label: 'Fair', color: 'var(--score-3)' } },
  { min: 40, band: { step: 2, label: 'Weak', color: 'var(--score-2)' } },
  { min: 0, band: { step: 1, label: 'Poor', color: 'var(--score-1)' } },
]

export function scoreBand(score: number): Band {
  return BANDS.find((b) => score >= b.min)!.band
}

export const CONFIDENCE: Record<ConfidenceLabel, { label: string; explain: string }> = {
  HIGH: { label: 'High confidence', explain: 'Plenty of consistent evidence across most factors.' },
  MEDIUM: { label: 'Medium confidence', explain: 'Enough evidence for a fair read; some factors are thin.' },
  LOW: { label: 'Low confidence', explain: 'Little or mixed evidence. Scores are pulled toward the category average.' },
  NEW_LAUNCH: { label: 'New launch', explain: 'Early score from the brand’s track record, the spec and price. It updates as reviews arrive.' },
}

export function formatPrice(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)
}
