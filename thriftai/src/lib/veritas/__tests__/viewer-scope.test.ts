/** @jest-environment node */
import { OPEN_DATA_PRODUCTS, PUBLIC_PRODUCTS, scopeForViewer } from '../scope'

describe('scopeForViewer', () => {
  it('shoppers see public products only when open data is not public', () => expect(scopeForViewer(null, false)).toEqual(PUBLIC_PRODUCTS))
  it('an organisation user also sees its own tenant', () => expect(scopeForViewer({ role: 'BRAND', tenantId: 't1' }, false)).toEqual({ OR: [PUBLIC_PRODUCTS, { tenantId: 't1' }] }))
  it('admins see everything', () => expect(scopeForViewer({ role: 'ADMIN', tenantId: null }, true)).toEqual({}))
  it('the dev switch adds the open-data tenant and nothing else', () => {
    expect(scopeForViewer(null, true)).toEqual({ OR: [PUBLIC_PRODUCTS, OPEN_DATA_PRODUCTS] })
    expect(scopeForViewer({ role: 'BRAND', tenantId: 't1' }, true)).toEqual({ OR: [{ OR: [PUBLIC_PRODUCTS, { tenantId: 't1' }] }, OPEN_DATA_PRODUCTS] })
    expect(OPEN_DATA_PRODUCTS).toEqual({ tenant: { slug: 'open-data-cc0' } })
  })
})
