/**
 * Expert grades of a physical second-hand item (open data, graded 1–5 by trained sorters). Shown as facts next to
 * the score, never turned into one: an overall score needs owners' reviews.
 */
export type Grade = { condition: number | null; pilling: number | null }

export const CONDITION_WORDS = ['poor', 'worn', 'fair', 'good', 'like new'] as const
export const PILLING_WORDS = ['severe', 'heavy', 'some', 'slight', 'none'] as const

const ok = (g: unknown): g is number => typeof g === 'number' && Number.isInteger(g) && g >= 1 && g <= 5

/** Null unless at least one grade is a valid 1–5 value. */
export function gradeOf(inspection: unknown): Grade | null {
  const x = (inspection ?? null) as { condition?: unknown; pilling?: unknown } | null
  if (!x) return null
  const g = { condition: ok(x.condition) ? x.condition : null, pilling: ok(x.pilling) ? x.pilling : null }
  return g.condition === null && g.pilling === null ? null : g
}

/** "Condition 4/5 good · Pilling 5/5 none" */
export function gradeText(g: Grade): string {
  return [g.condition && `Condition ${g.condition}/5 ${CONDITION_WORDS[g.condition - 1]}`, g.pilling && `Pilling ${g.pilling}/5 ${PILLING_WORDS[g.pilling - 1]}`].filter(Boolean).join(' · ')
}
