import 'server-only'
/**
 * answer-search graph (backend plan §4.3), online:
 *   message → intent (parser, + intent agent when enabled) → off-topic? reply
 *     → candidates (stored scores only) → maybe one clarifying question (only if it changes the top pick)
 *     → Personal Match + ranking (code) → 3 picks → persist session + turns
 * Card text is the product's stored verified text plus reasons built from facts, so nothing unverified is shown.
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { env } from '../env'
import { makeIntentAgent, mergeIntent } from '../agents/intent'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { applyAnswers, parseIntent, type Answers, type SearchIntent, type ShopperContext } from '../match/intent'
import { loadCandidates } from '../match/candidates'
import { MAX_QUESTIONS_PER_SEARCH, chooseQuestion, pickThree, rank, type PickResult, type Question } from '../match/rank'

export type SearchPick = {
  role: PickResult['role']
  slug: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  score: number
  label: NonNullable<PickResult['label']>
  match: number | null
  pillars: PickResult['pillars']
  reasons: string[]
  summary: string | null
  sizeAdvice: string | null
  downside: string | null
  priceMin: number
  priceMax: number
  sellerCount: number
  wildcardReason?: string
  overBudget: boolean
}

export type SearchResponse = {
  sessionId: string
  intent: SearchIntent
  offTopic: boolean
  question: (Question & { remaining: number }) | null
  picks: SearchPick[]
  provisional: boolean
  rated: number
  unrated: number
  usedAgent: boolean
}

type TurnPayload = { intent?: SearchIntent; answers?: Answers; askedSlot?: string; picks?: string[] }

function toPick(p: PickResult): SearchPick {
  return {
    role: p.role,
    slug: p.slug,
    name: p.name,
    brand: p.brandName,
    category: p.category,
    subcategory: p.subcategory,
    score: p.productScore,
    label: p.label!,
    match: p.match,
    pillars: p.pillars,
    reasons: p.reasons.slice(0, 2),
    summary: p.text_verified?.summary ?? null,
    sizeAdvice: p.text_verified?.sizeAdvice ?? null,
    downside: p.text_verified?.downside ?? null,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    sellerCount: p.sellerCount,
    wildcardReason: p.wildcardReason,
    overBudget: !!p.overBudget,
  }
}

export async function profileFor(shopperSid: string): Promise<{ id: string | null; who: ShopperContext }> {
  const p = await prisma.shopperProfile.findUnique({ where: { sessionId: shopperSid } })
  if (!p) return { id: null, who: {} }
  return {
    id: p.id,
    who: {
      heightCm: p.heightCm,
      bodyType: p.bodyType,
      preferredFit: (p.preferredFit as ShopperContext['preferredFit']) ?? null,
      climate: p.climate === 'varies' ? null : ((p.climate as ShopperContext['climate']) ?? null),
      budgetMax: p.budgetMax,
      priorities: (p.priorities as ShopperContext['priorities']) ?? null,
      brandAllow: p.brandAllow,
      brandDeny: p.brandDeny,
      sustainabilityOn: p.sustainabilityOn,
    },
  }
}

export async function runSearch(input: {
  message?: string
  sessionId?: string
  answer?: { slot: 'fit' | 'maxPrice' | 'climate'; value: string }
  shopperSid: string
  /** Use the intent agent (live model call). Off unless explicitly enabled. */
  useAgent?: boolean
  llm?: LlmClient
}): Promise<SearchResponse> {
  const { id: profileId, who } = await profileFor(input.shopperSid)

  // Continue a session when answering a question; otherwise start a new search.
  let session = input.sessionId && input.answer ? await prisma.searchSession.findUnique({ where: { id: input.sessionId }, include: { turns: { orderBy: { idx: 'asc' } } } }) : null
  if (!session) {
    if (!input.message?.trim()) throw new Error('A message is required to start a search')
    session = { ...(await prisma.searchSession.create({ data: { profileId } })), turns: [] }
  }
  const payloads = session.turns.map((t) => (t.payload ?? {}) as TurnPayload)
  const askedSlots = payloads.map((p) => p.askedSlot).filter((s): s is string => !!s)
  const prevAnswers = payloads.reduce<Answers>((acc, p) => ({ ...acc, ...(p.answers ?? {}) }), {})

  let intent: SearchIntent
  let usedAgent = false
  let agentRunId: string | undefined
  const answers: Answers = { ...prevAnswers }
  if (input.answer) {
    const v = input.answer.value
    if (input.answer.slot === 'maxPrice') answers.maxPrice = v === 'any' ? 'any' : Number(v)
    else if (input.answer.slot === 'fit') answers.fit = v as Answers['fit']
    else answers.climate = v as Answers['climate']
    intent = payloads.find((p) => p.intent)?.intent ?? { priorities: {}, terms: [] }
  } else {
    intent = parseIntent(input.message!)
    if (input.useAgent && env().LLM_MODE !== 'mock') {
      const r = await runAgent(makeIntentAgent(), input.message!, { llm: input.llm, graph: 'answer-search' })
      agentRunId = r.runId
      if (r.status === 'OK' && r.finish) {
        intent = mergeIntent(intent, r.finish)
        usedAgent = true
      }
    }
  }
  const effective = applyAnswers(intent, answers)

  const userTurn = { role: 'USER' as const, content: input.answer ? `${input.answer.slot}: ${input.answer.value}` : input.message!, payload: { intent, answers } as Prisma.InputJsonValue }

  if (effective.offTopic) {
    await persist(session.id, session.turns.length, userTurn, { content: 'off_topic', payload: {}, runId: agentRunId })
    return { sessionId: session.id, intent: effective, offTopic: true, question: null, picks: [], provisional: false, rated: 0, unrated: 0, usedAgent }
  }

  const candidates = await loadCandidates()
  const { ranked, unrated, stretch } = rank(candidates, effective, who)
  const picks = pickThree(ranked, stretch)

  let question: SearchResponse['question'] = null
  if (askedSlots.length < MAX_QUESTIONS_PER_SEARCH && picks.length > 0) {
    const q = chooseQuestion(candidates, effective, who, askedSlots)
    if (q) question = { ...q, remaining: MAX_QUESTIONS_PER_SEARCH - askedSlots.length - 1 }
  }

  await persist(session.id, session.turns.length, userTurn, {
    content: question ? question.question : `${picks.length} picks`,
    payload: { askedSlot: question?.slot, picks: picks.map((p) => p.slug), rated: ranked.length, unrated } as Prisma.InputJsonValue,
    runId: agentRunId,
  })

  return {
    sessionId: session.id,
    intent: effective,
    offTopic: false,
    question,
    picks: picks.map(toPick),
    provisional: question !== null,
    rated: ranked.length,
    unrated,
    usedAgent,
  }
}

async function persist(
  sessionId: string,
  start: number,
  user: { role: 'USER'; content: string; payload: Prisma.InputJsonValue },
  assistant: { content: string; payload: Prisma.InputJsonValue; runId?: string },
) {
  await prisma.$transaction([
    prisma.searchTurn.create({ data: { sessionId, idx: start, ...user } }),
    prisma.searchTurn.create({ data: { sessionId, idx: start + 1, role: 'ASSISTANT', ...assistant } }),
    prisma.searchSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } }),
  ])
}
