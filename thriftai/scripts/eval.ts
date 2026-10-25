/**
 * npm run eval                    # golden set + deterministic checks + agent health + feedback ($0)
 * npm run eval -- --judge --yes   # also the LLM judge on every golden product (live Opus calls; estimate printed first)
 * Report: .veritas/evals/report-<timestamp>.md; results also in EvalRun / EvalResult (shown at /admin/evals).
 */
import { prisma } from '../src/lib/prisma'
import { env, models } from '../src/lib/veritas/env'
import { GOLDEN_SIZE } from '../src/lib/veritas/evals/golden'
import { runEval } from '../src/lib/veritas/evals/run'
import { prismaSink } from '../src/lib/veritas/harness/telemetry'

const EST_JUDGE_PER_CASE_USD = 0.03 // backend plan §8

async function main() {
  const e = env()
  if (e.APP_ENV === 'production') throw new Error('Evals run on the dev golden set only.')
  const judge = process.argv.includes('--judge')
  if (judge) {
    const spent = await prismaSink.spentUsd(e.APP_ENV)
    console.log(`Judge: ${GOLDEN_SIZE} live calls to ${models.judge}, estimated ≤ $${(GOLDEN_SIZE * EST_JUDGE_PER_CASE_USD).toFixed(2)}. Spent so far $${spent.toFixed(4)} of $${e.SPEND_CAP_USD}.`)
    if (!process.argv.includes('--yes')) {
      console.log('Re-run with --yes to proceed.')
      return
    }
  }
  const r = await runEval({ judge })
  const s = r.summary
  const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`)
  console.log(`Eval run ${r.runId}: ${s.cases} golden products`)
  console.log(`Checks: agreement ${pct(s.checks.agreement)} on ${s.checks.pass + s.checks.fail} judged labels, coverage ${pct(s.checks.coverage)} (${s.checks.noEvidence} without evidence yet)`)
  for (const [k, v] of Object.entries(s.byKey)) console.log(`  ${k.padEnd(18)} pass ${v.pass}  fail ${v.fail}  no evidence ${v.noEvidence}`)
  if (s.judge) console.log(`Judge: agreement ${pct(s.judge.agreement)} over ${s.judge.comparisons} comparisons (gate ≥ 80%), cost $${s.judge.costUsd}`)
  console.log(`Quote acceptance ${pct(s.ops.quoteAcceptance)} · feedback ${s.feedback.up}↑ ${s.feedback.down}↓`)
  console.log(`Report: ${r.reportPath.replace(process.cwd() + '/', '')}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
