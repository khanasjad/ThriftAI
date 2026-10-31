/** @jest-environment node */
import { displayPhoto } from '@/components/veritas/photo'
import { extractStructuredEvidence } from '../evidence/structured'
import { makeBundle } from '../__fixtures__/bundle'
import { parseMaterialText as parseMaterial } from '../ingest/contract'

describe('real photos and expert inspection (B21)', () => {
  it('shows real photos only, never the generated dev renders', () => {
    expect(displayPhoto('/dev-images/x.png')).toBeNull()
    expect(displayPhoto(null)).toBeNull()
    expect(displayPhoto('http://insecure.example/x.jpg')).toBeNull()
    expect(displayPhoto('https://cdn.example/x.jpg')).toEqual({ url: 'https://cdn.example/x.jpg', credit: null })
    expect(displayPhoto('/open-images/secondhand/a.jpg', 'Wargön Innovation / RISE · CC BY 4.0')).toEqual({ url: '/open-images/secondhand/a.jpg', credit: 'Wargön Innovation / RISE · CC BY 4.0' })
  })
  it('parses material labels', () => {
    expect(parseMaterial('100%viscose ')).toEqual({ viscose: 100 })
    expect(parseMaterial('95% cotton 5% elastane')).toEqual({ cotton: 95, elastane: 5 })
    expect(parseMaterial('')).toEqual({})
  })
  it('expert-graded pilling becomes wear-resistance evidence; nothing else is scored', () => {
    const ev = (pilling: number | null) => extractStructuredEvidence(makeBundle({ product: { inspection: { pilling, condition: 2, stains: true, damage: 'hole' } } })).filter((e) => e.sourceType === 'MANUAL')
    expect(ev(5)).toEqual([expect.objectContaining({ factor: 'quality.wear_resistance', signal: 'no_pilling', confidence: 0.8, quote: 'Pilling graded 5/5 by trained sorters (5 = none, 1 = severe)' })])
    expect(ev(2)[0].signal).toBe('pills_moderate')
    expect(ev(1)[0].signal).toBe('pills_immediately')
    expect(ev(null)).toEqual([])
  })
})
