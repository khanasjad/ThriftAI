import 'server-only'
/**
 * answer-search graph (product plan "Shopper experience", shopkeeper change 2026-10-25), one call per turn:
 *
 *   message ─▶ shopkeeper agent (Haiku): update filters + next question (≤ 4, chips from catalog facets) + reply
 *          │     (falls back to the code parser + code question when the agent is off or fails)
 *          ▼
 *   code: validate filters against facets → filter + Personal Match + rank with the Veritas Score → 3 picks
 *          ▼
 *   persist SearchSession / SearchTurn; picks are provisional while a question is open.
 *
 * The agent never ranks or describes products. Cards show stored, verified text and fact-based reasons only;
 * the agent's reply is checked by code (no product names, hype or claims) before it is shown.
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { env } from '../env'
import { MAX_SHOPKEEPER_QUESTIONS, makeShopkeeperAgent, type ShopkeeperFilters, type ShopkeeperTurn } from '../agents/shopkeeper'
import type { LlmClient } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { parseIntent, type SearchIntent, type ShopperContext } from '../match/intent'
import { loadCandidates } from '../match/candidates'
import { buildFacets, facetsText, type Facets } from '../match/facets'
import { chooseQuestion, filterCandidates, pickThree, rank, type Candidate, type PickResult } from '../match/rank'
import { swatchFor } from '@/components/veritas/colors'
import { checkReply } from '../text/check'

export type SearchPick = {
  role: PickResult['role']
  slug: string
  name: string
  brand: string
  category: string
  subcategory: string | null
  silhouette: string | null
  color: string | null
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

export type QuestionOption = { label: string; /** Products left if chosen (null when it can't be counted). */ count: number | null; swatch?: string }
export type Question = { slot: string; question: string; chips: string[]; options?: QuestionOption[] }

export type SearchResponse = {
  sessionId: string
  reply: string
  intent: SearchIntent
  offTopic: boolean
  question: Question | null
  asked: number
  maxQuestions: number
  picks: SearchPick[]
  provisional: boolean
  rated: number
  unrated: number
  usedAgent: boolean
}

type TurnPayload = { intent?: SearchIntent; asked?: number; question?: Question | null; ready?: boolean; picks?: string[] }

function toPick(p: PickResult): SearchPick {
  return {
    role: p.role,
    slug: p.slug,
    name: p.name,
    brand: p.brandName,
    category: p.category,
    subcategory: p.subcategory,
    silhouette: p.silhouette ?? null,
    color: p.colors[0] ?? null,
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

const canon = (want: string[], options: { value: string }[]) =>
  want.map((w) => options.find((o) => o.value.toLowerCase() === w.toLowerCase().trim())?.value ?? options.find((o) => o.value.toLowerCase().includes(w.toLowerCase().trim()))?.value).filter((x): x is string => !!x)

/** Agent filters → intent, keeping only values the catalog actually has. */
export function filtersToIntent(f: ShopkeeperFilters, facets: Facets): SearchIntent {
  return {
    category: f.category ?? undefined,
    gender: f.gender ?? undefined,
    minPrice: f.min_price ?? undefined,
    maxPrice: f.max_price ?? undefined,
    colors: [...new Set(canon(f.colors, facets.colors))],
    excludeColors: f.exclude_colors.map((c) => c.trim()).filter(Boolean),
    fit: f.fit ?? undefined,
    cuts: [...new Set(canon(f.cuts, facets.cuts))],
    length: f.length ?? undefined,
    climate: f.climate ?? undefined,
    occasion: f.occasion ?? undefined,
    priorities: Object.fromEntries(f.priorities.map((p) => [p, 1.5])),
    sustainability: f.sustainability || undefined,
    terms: [],
  }
}

function intentToFilters(i: SearchIntent): ShopkeeperFilters {
  return {
    category: i.category ?? null,
    gender: i.gender ?? null,
    min_price: i.minPrice ?? null,
    max_price: i.maxPrice ?? null,
    colors: i.colors ?? [],
    exclude_colors: i.excludeColors ?? [],
    fit: i.fit ?? null,
    cuts: i.cuts ?? [],
    length: i.length ?? null,
    climate: i.climate ?? null,
    occasion: i.occasion ?? null,
    priorities: Object.keys(i.priorities) as ShopkeeperFilters['priorities'],
    sustainability: !!i.sustainability,
  }
}

const FREE_SLOTS = new Set(['need', 'priority', 'climate'])
const CLEAR = /^(any|no preference|no limit|not sure|skip)/i

/** What the intent would be if the shopper picked this chip (for counts). Null when it can't be computed. */
function applyChip(slot: string, chip: string, intent: SearchIntent, f: Facets): SearchIntent | null {
  const c = chip.trim()
  const clear = CLEAR.test(c)
  switch (slot) {
    case 'gender': {
      const g = f.genders.find((x) => x.label.toLowerCase() === c.toLowerCase())
      return g ? { ...intent, gender: g.value } : clear ? { ...intent, gender: undefined } : null
    }
    case 'category': {
      const k = f.categories.find((x) => x.label.toLowerCase() === c.toLowerCase())
      return k ? { ...intent, category: k.value } : clear ? { ...intent, category: undefined } : null
    }
    case 'budget': {
      const b = f.priceBands.find((x) => x.label.toLowerCase() === c.toLowerCase())
      return b ? { ...intent, minPrice: b.min ?? undefined, maxPrice: b.max ?? undefined } : null
    }
    case 'color':
      return clear ? { ...intent, colors: [] } : { ...intent, colors: [c] }
    case 'fit':
      return clear ? { ...intent, fit: undefined } : ['slim', 'regular', 'relaxed', 'oversized'].includes(c.toLowerCase()) ? { ...intent, fit: c.toLowerCase() as SearchIntent['fit'] } : null
    case 'cut':
      return clear ? { ...intent, cuts: [] } : { ...intent, cuts: [c] }
    case 'length':
      return clear ? { ...intent, length: undefined } : ['cropped', 'regular', 'longline'].includes(c.toLowerCase()) ? { ...intent, length: c.toLowerCase() as SearchIntent['length'] } : null
    case 'widen': {
      const map: Record<string, Partial<SearchIntent>> = {
        'any colour': { colors: [] },
        'no budget limit': { minPrice: undefined, maxPrice: undefined },
        'any fit': { fit: undefined },
        'any cut': { cuts: [] },
        'any length': { length: undefined },
        'show all genders': { gender: undefined },
        'show jeans too': { category: undefined },
        'show tees too': { category: undefined },
      }
      const m = map[c.toLowerCase()]
      return m ? { ...intent, ...m } : null
    }
    default:
      return null
  }
}

/** Options for the question card: each chip with how many products would be left, plus colour swatches. */
function withOptions(q: Question, candidates: Candidate[], intent: SearchIntent, who: ShopperContext): Question {
  const f = buildFacets(candidates, intent)
  return {
    ...q,
    options: q.chips.map((label) => {
      const next = applyChip(q.slot, label, intent, f)
      return {
        label,
        count: next ? filterCandidates(candidates, next, who).length : null,
        ...(q.slot === 'color' && swatchFor(label) ? { swatch: swatchFor(label) } : {}),
      }
    }),
  }
}

/** When the agent's chips don't match the catalog, code builds them from the facets for that slot. */
function chipsFromFacets(slot: string, f: Facets): string[] {
  switch (slot) {
    case 'category':
      return f.categories.map((c) => c.label)
    case 'gender':
      return f.genders.map((g) => g.label)
    case 'budget':
      return f.priceBands.map((b) => b.label)
    case 'color':
      return [...f.colors.slice(0, 5).map((c) => c.value), 'Any colour']
    case 'fit':
      return [...f.fits.map((x) => x.value), 'No preference']
    case 'cut':
      return [...f.cuts.slice(0, 5).map((x) => x.value), 'No preference']
    case 'length':
      return [...f.lengths.map((x) => x.value), 'No preference']
    default:
      return []
  }
}

/** Chips must come from the facets (except free-form slots like "what is it for"). */
function validChips(q: NonNullable<ShopkeeperTurn['next_question']>, f: Facets) {
  if (FREE_SLOTS.has(q.slot)) return q.chips.slice(0, 5)
  const pool = new Set(
    [...f.colors, ...f.fits, ...f.cuts, ...f.lengths].map((x) => x.value.toLowerCase()).concat(f.priceBands.map((b) => b.label.toLowerCase()), f.categories.map((c) => c.label.toLowerCase()), f.genders.map((g) => g.label.toLowerCase())),
  )
  return q.chips.filter((c) => pool.has(c.toLowerCase().trim()) || /^(any|no preference|no limit|not sure)/i.test(c)).slice(0, 5)
}

function agentMessage(transcript: { role: string; content: string }[], intent: SearchIntent, asked: number, facets: Facets, current: Candidate[], latest: string) {
  return `Conversation so far:
${transcript.map((t) => `${t.role === 'USER' ? 'Shopper' : 'You'}: ${t.content}`).join('\n') || '(new conversation)'}

Current filters: ${JSON.stringify(intentToFilters(intent))}
Questions asked so far: ${asked} of ${MAX_SHOPKEEPER_QUESTIONS}

Catalog facets for products still matching:
${facetsText(facets)}

Current top picks (for refinements like "cheaper"): ${current.map((c) => `${c.name}, $${Math.round(c.priceMin)}, colours ${c.colors.join('/')}`).join('; ') || 'none yet'}

Shopper's latest message: ${latest}`
}

export async function runSearch(input: {
  message?: string
  sessionId?: string
  /** "Just show me": stop asking and show the best picks for what we know. */
  action?: 'show'
  shopperSid: string
  useAgent?: boolean
  llm?: LlmClient
}): Promise<SearchResponse> {
  const { id: profileId, who } = await profileFor(input.shopperSid)
  let session = input.sessionId ? await prisma.searchSession.findUnique({ where: { id: input.sessionId }, include: { turns: { orderBy: { idx: 'asc' } } } }) : null
  if (!session) {
    if (!input.message?.trim()) throw new Error('A message is required to start a search')
    session = { ...(await prisma.searchSession.create({ data: { profileId } })), turns: [] }
  }
  const last = [...session.turns].reverse().find((t) => t.role === 'ASSISTANT')
  const prev = (last?.payload ?? {}) as TurnPayload
  let intent: SearchIntent = prev.intent ?? { priorities: {}, terms: [] }
  let asked = prev.asked ?? 0
  const message = input.action === 'show' ? 'Just show me the best options.' : input.message!.trim()

  const candidates = await loadCandidates()
  const productNames = candidates.map((c) => c.name)
  let reply: string | null = null
  let question: Question | null = null
  let offTopic = false
  let usedAgent = false
  let agentRunId: string | undefined

  if (input.action === 'show') {
    reply = 'Here are the best options for what you’ve told me.'
  } else if (input.useAgent && env().LLM_MODE !== 'mock') {
    const facets = buildFacets(candidates, intent)
    const current = pickThree(rank(candidates, intent, who).ranked).map((p) => candidates.find((c) => c.id === p.id)!)
    const r = await runAgent(makeShopkeeperAgent(), agentMessage(session.turns, intent, asked, facets, current, message), { llm: input.llm, graph: 'answer-search' })
    agentRunId = r.runId
    if (r.status === 'OK' && r.finish) {
      usedAgent = true
      const t = r.finish
      offTopic = t.off_topic
      if (!offTopic) {
        intent = filtersToIntent(t.filters, buildFacets(candidates, { priorities: {}, terms: [] }))
        const remaining = buildFacets(candidates, intent).matching
        // Worth asking while at least 2 products match (with 1 left there's nothing to choose between).
        if (t.next_question && !t.ready && asked < MAX_SHOPKEEPER_QUESTIONS && remaining >= 2) {
          const facetsNow = buildFacets(candidates, intent)
          let chips = validChips(t.next_question, facetsNow)
          if (chips.length < 2) chips = chipsFromFacets(t.next_question.slot, facetsNow)
          if (chips.length >= 2) question = { slot: t.next_question.slot, question: t.next_question.question, chips }
        }
      }
      reply = checkReply(t.reply, productNames)
      // The reply must not ask a question that code dropped (no valid chips, question cap, too few products).
      if (reply && !question && t.next_question && reply.includes('?')) reply = null
    }
  }

  // Code-only path: no agent, agent off, or agent failed.
  if (!usedAgent && input.action !== 'show') {
    const parsed = parseIntent(message)
    intent = {
      ...intent,
      ...Object.fromEntries(Object.entries(parsed).filter(([k, v]) => v !== undefined && k !== 'priorities' && k !== 'terms' && !(Array.isArray(v) && !v.length))),
      priorities: { ...intent.priorities, ...parsed.priorities },
      terms: session.turns.length ? intent.terms : parsed.terms,
    }
    const askedSlots = session.turns.map((t) => (t.payload as TurnPayload | null)?.question?.slot).filter(Boolean) as string[]
    const q = asked < MAX_SHOPKEEPER_QUESTIONS ? chooseQuestion(candidates, intent, who, askedSlots) : null
    if (q) question = { slot: q.slot, question: q.question, chips: q.chips.map((c) => c.label) }
  }

  if (question) asked++ // (widen offers, added below, don't count)
  if (!reply)
    reply = offTopic
      ? 'I can help you find clothing. Tell me what you’re looking for, like “a soft tee for hot weather”.'
      : question
        ? `Got it. ${question.question}`
        : 'Here are the best options for what you’ve told me.'

  const { ranked, unrated, stretch } = rank(candidates, intent, who)
  const picks = offTopic ? [] : pickThree(ranked, stretch)

  // Too few matches: like a shopkeeper, say so and offer to widen, using the filters actually set.
  if (!offTopic && !question && picks.length < 3) {
    const widen = [
      intent.colors?.length && 'Any colour',
      (intent.maxPrice || intent.minPrice) && 'No budget limit',
      intent.fit && 'Any fit',
      intent.cuts?.length && 'Any cut',
      intent.length && 'Any length',
      intent.gender && intent.gender !== 'UNISEX' && 'Show all genders',
      intent.category && (intent.category === 'TOPS' ? 'Show jeans too' : 'Show tees too'),
    ].filter(Boolean) as string[]
    if (widen.length) {
      const n = picks.length
      question = { slot: 'widen', question: 'Want me to widen the search?', chips: widen.slice(0, 4) }
      reply = n === 0 ? 'Nothing matches all of that yet. Want me to widen the search?' : `Only ${n} ${n === 1 ? 'item matches' : 'items match'} everything so far, shown below. Want me to widen the search?`
    }
  }

  await prisma.$transaction([
    prisma.searchTurn.create({ data: { sessionId: session.id, idx: session.turns.length, role: 'USER', content: message } }),
    prisma.searchTurn.create({
      data: {
        sessionId: session.id,
        idx: session.turns.length + 1,
        role: 'ASSISTANT',
        content: reply,
        runId: agentRunId,
        payload: { intent, asked, question, ready: !question, picks: picks.map((p) => p.slug) } as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.searchSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } }),
  ])

  if (question) question = withOptions(question, candidates, intent, who)

  return {
    sessionId: session.id,
    reply,
    intent,
    offTopic,
    question,
    asked,
    maxQuestions: MAX_SHOPKEEPER_QUESTIONS,
    picks: picks.map(toPick),
    provisional: question !== null,
    rated: ranked.length,
    unrated,
    usedAgent,
  }
}
