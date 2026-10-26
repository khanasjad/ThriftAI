import { printFromMotifs } from '@/lib/veritas/dev/patterns'

type Look = { pattern?: string; motifs?: { label: string }[] } | null | undefined

/** What the illustration should draw, from the photo reading: "floral", or "graphic:car" for a car print. Display only. */
export function thumbPattern(v: Look): string | null {
  if (!v?.pattern) return null
  if (v.pattern !== 'graphic') return v.pattern
  const print = printFromMotifs((v.motifs ?? []).map((m) => m.label))
  return print ? `graphic:${print}` : 'graphic'
}
