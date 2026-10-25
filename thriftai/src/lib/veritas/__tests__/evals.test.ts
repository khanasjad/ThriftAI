/** @jest-environment node */
import { judgeAgreement, judgeTask, makeJudgeAgent } from '../agents/judge'
import { checkLabel, summarise, type ProductState } from '../evals/checks'
import { GOLDEN_SIZE, labelsFrom, pickGolden, type Truth } from '../evals/golden'
import { MockClient, mockMessage, mockToolUse } from '../harness/llm'
import { runAgent } from '../harness/loop'
import { MemorySink } from '../harness/telemetry'

process.env.VERITAS_MODEL_JUDGE = 'claude-opus-5-5'

const truth = (over: Partial<Truth> = {}): Truth => ({
  fitOffset: 0,
  sizeInconsistent: false,
  lengthIssue: 'none',
  fabric: 0.6,
  construction: 0.7,
  washDurability: 0.6,
  pillingRisk: 0.3,
  softness: 0.5,
  photoAccuracy: 0.8,
  notes: [],
  ...over,
})

const state = (over: Partial<ProductState> = {}): ProductState => ({ factors: {}, fitAnswers: { small: 0, tts: 0, large: 0 }, injectionEvidence: null, hasInjectionReview: false, ...over })

describe('golden labels', () => {
  it('use the generator’s own thresholds', () => {
    const l = labelsFrom(truth({ fitOffset: -0.3, washDurability: 0.4, pillingRisk: 0.7, fabric: 0.3, softness: 0.7, photoAccuracy: 0.5, sizeInconsistent: true, notes: ['has_injection_review'] }))
    expect(l).toEqual([
      { key: 'fit', expect: 'runs_small' },
      { key: 'wash', expect: 'poor' },
      { key: 'pilling', expect: 'present' },
      { key: 'fabric', expect: 'thin' },
      { key: 'softness', expect: 'soft' },
      { key: 'photo', expect: 'inaccurate' },
      { key: 'size_consistency', expect: 'inconsistent' },
      { key: 'injection', expect: 'flagged' },
    ])
    expect(labelsFrom(truth())).toEqual([{ key: 'fit', expect: 'true_to_size' }]) // mid values make no claim
  })

  it('pick edge cases first, then the strongest signals, deterministically', () => {
    const products = Array.from({ length: 30 }, (_, i) => ({ slug: `p${String(i).padStart(2, '0')}`, truth: truth({ fitOffset: i / 40 }) }))
    products[29].truth.notes = ['has_injection_review']
    const g = pickGolden(products)
    expect(g).toHaveLength(GOLDEN_SIZE)
    expect(g[0].slug).toBe('p29')
    expect(g[1].slug).toBe('p28') // largest |fitOffset| among the rest
    expect(pickGolden(products).map((x) => x.slug)).toEqual(g.map((x) => x.slug))
  })
})

describe('deterministic checks', () => {
  it('reads fit from the majority of fit answers, needing at least 5', () => {
    expect(checkLabel({ key: 'fit', expect: 'runs_small' }, state({ fitAnswers: { small: 4, tts: 1, large: 0 } })).status).toBe('pass')
    expect(checkLabel({ key: 'fit', expect: 'runs_small' }, state({ fitAnswers: { small: 1, tts: 4, large: 0 } })).status).toBe('fail')
    expect(checkLabel({ key: 'fit', expect: 'runs_small' }, state({ fitAnswers: { small: 3, tts: 1, large: 0 } })).status).toBe('no_evidence')
  })
  it('treats a missing factor as no evidence, never as a failure', () => {
    expect(checkLabel({ key: 'pilling', expect: 'present' }, state()).status).toBe('no_evidence')
    expect(checkLabel({ key: 'pilling', expect: 'present' }, state({ factors: { 'quality.wear_resistance': 20 } })).status).toBe('pass')
    expect(checkLabel({ key: 'pilling', expect: 'present' }, state({ factors: { 'quality.wear_resistance': 80 } })).status).toBe('fail')
  })
  it('passes injection only when every piece of evidence from the injection review was flagged', () => {
    expect(checkLabel({ key: 'injection', expect: 'flagged' }, state({ hasInjectionReview: true, injectionEvidence: { total: 2, flagged: 2 } })).status).toBe('pass')
    expect(checkLabel({ key: 'injection', expect: 'flagged' }, state({ hasInjectionReview: true, injectionEvidence: { total: 2, flagged: 1 } })).status).toBe('fail')
  })
  it('reports agreement and coverage separately', () => {
    const s = summarise([
      { key: 'fit', expect: 'a', got: 'a', status: 'pass' },
      { key: 'wash', expect: 'a', got: 'b', status: 'fail' },
      { key: 'photo', expect: 'a', got: '—', status: 'no_evidence' },
      { key: 'pilling', expect: 'a', got: '—', status: 'no_evidence' },
    ])
    expect(s).toMatchObject({ agreement: 0.5, coverage: 0.5, noEvidence: 2 })
  })
})

describe('judge', () => {
  it('compares predicted labels with golden labels; "unknown" fit is not counted', () => {
    const labels = [
      { key: 'fit', expect: 'runs_small' },
      { key: 'pilling', expect: 'present' },
      { key: 'photo', expect: 'inaccurate' },
      { key: 'wash', expect: 'good' }, // not a problem label → not compared
    ]
    const a = judgeAgreement({ fit: 'runs_small', problems: ['pilling'] }, labels)
    expect(a.map((x) => [x.key, x.agree])).toEqual([
      ['fit', true],
      ['pilling', true],
      ['photo', false],
    ])
    expect(judgeAgreement({ fit: 'unknown', problems: [] }, labels)[0].agree).toBeNull()
  })

  it('runs through the harness with a strict rubric schema', async () => {
    const llm = new MockClient(() =>
      mockMessage(
        [mockToolUse('finish', { rubric: { faithful: 5, size_advice: 4, downside: null, no_hype: 5 }, fit: 'runs_small', problems: ['pilling'], notes: 'ok' })],
        'tool_use',
      ),
    )
    const r = await runAgent(makeJudgeAgent(), judgeTask('Tee', [{ id: 'q1', kind: 'quote', factor: 'f', text: 'x', sentiment: 0 }], null), {
      llm,
      sink: new MemorySink(),
      envName: 'test',
      spendCapUsd: 15,
    })
    expect(r.status).toBe('OK')
    expect(llm.calls[0].model).toBe('claude-opus-5-5')
    expect(r.finish?.rubric.downside).toBeNull()
  })
})
