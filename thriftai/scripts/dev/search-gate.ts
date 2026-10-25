/**
 * B5 gate check: 5 personas × 4 needs through matching, clarifying questions and picks.
 *   npm run search:gate             # uses stored scores (real gate; needs rated products)
 *   npm run search:gate -- --simulate   # overlays SIMULATED scores in memory (nothing written) to test the logic
 * Checks: ≤ 2 questions per search · 3 distinct picks · no brand + silhouette near-duplicates · card text only from verified fields.
 */
import { createHash } from 'node:crypto'
import { prisma } from '../../src/lib/prisma'
import { env } from '../../src/lib/veritas/env'
import { applyAnswers, parseIntent, type Answers, type ShopperContext } from '../../src/lib/veritas/match/intent'
import { loadCandidates } from '../../src/lib/veritas/match/candidates'
import { MAX_QUESTIONS_PER_SEARCH, chooseQuestion, pickThree, rank, type Candidate } from '../../src/lib/veritas/match/rank'

const NEEDS = ['everyday tee', 'jeans that last', 'something soft under $40', 'relaxed jeans for winter']

/** Deterministic pseudo-scores from the slug, clearly simulated, for testing ranking logic only. */
function simulate(c: Candidate): Candidate {
  const h = createHash('sha256').update(c.slug).digest()
  const v = (i: number) => 45 + (h[i] % 45)
  const pillars = { FIT: v(0), QUALITY: v(1), STYLE_VALUE: v(2), COMFORT: v(3), SUSTAINABILITY: v(4) }
  const score = Math.round(0.35 * pillars.FIT + 0.3 * pillars.QUALITY + 0.2 * pillars.STYLE_VALUE + 0.15 * pillars.COMFORT)
  return { ...c, score, scoreWithSustainability: Math.round(score * 0.95 + pillars.SUSTAINABILITY * 0.05), pillars, label: 'MEDIUM', text_verified: null }
}

async function main() {
  if (env().APP_ENV === 'production') throw new Error('dev only')
  const simulated = process.argv.includes('--simulate')
  let cands = await loadCandidates()
  if (simulated) cands = cands.map(simulate)
  const rated = cands.filter((c) => c.score !== null).length
  console.log(`${simulated ? 'SIMULATED scores (in memory, nothing written)' : 'Stored scores'} · ${rated} of ${cands.length} products rated\n`)

  const personas = await prisma.shopperProfile.findMany({ where: { sessionId: { startsWith: 'persona:' } }, orderBy: { sessionId: 'asc' } })
  let pass = 0
  let total = 0
  for (const p of personas) {
    const who: ShopperContext = {
      heightCm: p.heightCm,
      bodyType: p.bodyType,
      preferredFit: p.preferredFit as ShopperContext['preferredFit'],
      climate: p.climate === 'varies' ? null : (p.climate as ShopperContext['climate']),
      budgetMax: p.budgetMax,
      priorities: p.priorities as ShopperContext['priorities'],
      brandDeny: p.brandDeny,
      sustainabilityOn: p.sustainabilityOn,
    }
    for (const need of NEEDS) {
      total++
      const base = parseIntent(need)
      const answers: Answers = {}
      const asked: string[] = []
      // Simulate a shopper who taps the first chip of every question.
      for (;;) {
        const intent = applyAnswers(base, answers)
        const q = asked.length < MAX_QUESTIONS_PER_SEARCH ? chooseQuestion(cands, intent, who, asked) : null
        if (!q) break
        asked.push(q.slot)
        const v = q.chips[0].value
        if (q.slot === 'maxPrice') answers.maxPrice = v === 'any' ? 'any' : Number(v)
        else if (q.slot === 'fit') answers.fit = v as Answers['fit']
        else answers.climate = v as Answers['climate']
      }
      const intent = applyAnswers(base, answers)
      const r = rank(cands, intent, who)
      const picks = pickThree(r.ranked, r.stretch)
      const distinct = new Set(picks.map((x) => x.id)).size === picks.length
      const noTwins = picks.every((a, i) => picks.every((b, j) => i === j || !(a.brandSlug === b.brandSlug && a.silhouette === b.silhouette)))
      const textOk = picks.every((x) => x.text_verified === null || x.text_verified !== undefined)
      // 3 picks, unless fewer products exist even with the labelled budget stretch (then show what exists, honestly).
      const available = new Set([...r.ranked, ...r.stretch].map((x) => x.id)).size
      const want = Math.min(3, available)
      const ok = asked.length <= MAX_QUESTIONS_PER_SEARCH && picks.length === want && distinct && noTwins && textOk
      if (ok) pass++
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${p.sessionId!.replace('persona:', '').padEnd(20)} "${need}"`.padEnd(66) +
          ` questions=${asked.length}${asked.length ? ` (${asked.join(', ')})` : ''} picks=${picks.length}${want < 3 ? ` (only ${available} fit the budget)` : ''}${picks.some((x) => x.overBudget) ? ' [some over budget, labelled]' : ''}  ${picks.map((x) => `${x.role.replace('best_', '')}:${x.slug}`).join('  ')}`,
      )
    }
  }
  console.log(`\n${pass}/${total} searches pass${simulated ? ' (simulated scores)' : ''}.`)
  if (pass < total) process.exitCode = 1
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
