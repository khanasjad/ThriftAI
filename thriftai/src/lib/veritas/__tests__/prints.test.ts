/** @jest-environment node */
import { lookHas, lookTermsFor } from '../match/rank'
import { thumbPattern } from '@/components/veritas/thumb-pattern'
import { printFromMotifs } from '../dev/patterns'

describe('prints and logos from photos (B17)', () => {
  const look = 't-shirt · small black cars · real madrid crest · siemens · zidane 2001-2006'
  it('matches whole words with simple plurals, not substrings', () => {
    expect(lookHas(look, 'car')).toBe(true)
    expect(lookHas(look, 'cars')).toBe(true)
    expect(lookHas(look, 'madrid')).toBe(true)
    expect(lookHas('t-shirt · card print', 'car')).toBe(false)
    expect(lookHas('t-shirt · care label', 'car')).toBe(false)
    expect(lookHas(undefined, 'car')).toBe(false)
  })
  it('only words some product actually shows become filters', () => {
    expect(lookTermsFor([{ look }, { look: 'shirt · palm tree' }], ['car', 'vintage', 'palm'])).toEqual(['car', 'palm'])
    expect(lookTermsFor([{ look: undefined }], ['car'])).toEqual([])
  })
  it('picks the drawing for a print from the photo reading', () => {
    expect(printFromMotifs(['red race car'])).toBe('car')
    expect(printFromMotifs(['palm tree'])).toBe('palm-tree')
    expect(printFromMotifs(['round club crest'])).toBe('football-crest')
    expect(thumbPattern({ pattern: 'graphic', motifs: [{ label: 'vintage car' }] })).toBe('graphic:car')
    expect(thumbPattern({ pattern: 'graphic', motifs: [{ label: 'abstract swirl' }] })).toBe('graphic')
    expect(thumbPattern({ pattern: 'floral' })).toBe('floral')
    expect(thumbPattern(null)).toBeNull()
  })
})
