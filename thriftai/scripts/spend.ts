/** npm run spend — LLM spend so far vs. SPEND_CAP_USD, from AgentRun. */
import { prisma } from '../src/lib/prisma'
import { env } from '../src/lib/veritas/env'

async function main() {
  const e = env()
  const rows = await prisma.agentRun.groupBy({
    by: ['agent', 'model'],
    where: { env: e.APP_ENV },
    _sum: { costUsd: true, inputTokens: true, outputTokens: true, cacheReadTokens: true },
    _count: true,
  })
  const total = rows.reduce((s, r) => s + Number(r._sum.costUsd ?? 0), 0)
  console.log(`Environment: ${e.APP_ENV}`)
  if (rows.length === 0) console.log('No agent runs yet.')
  for (const r of rows.sort((a, b) => Number(b._sum.costUsd ?? 0) - Number(a._sum.costUsd ?? 0))) {
    console.log(
      `  ${r.agent.padEnd(14)} ${r.model.padEnd(18)} runs=${String(r._count).padStart(4)}  in=${r._sum.inputTokens}  out=${r._sum.outputTokens}  cacheRead=${r._sum.cacheReadTokens}  $${Number(r._sum.costUsd ?? 0).toFixed(4)}`,
    )
  }
  console.log(`Total: $${total.toFixed(4)} of $${e.SPEND_CAP_USD.toFixed(2)} cap (${((total / e.SPEND_CAP_USD) * 100).toFixed(1)}%)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
