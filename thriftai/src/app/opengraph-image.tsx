import { ImageResponse } from 'next/og'

export const alt = 'Veritas: is it worth buying?'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#fafaf9', color: '#0b0b0f', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, border: '7px solid #ecebe7', borderTopColor: '#6d28d9', borderRightColor: '#6d28d9', display: 'flex' }} />
          Veritas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>Is it worth buying?</div>
          <div style={{ fontSize: 34, color: '#52514e', maxWidth: 900, lineHeight: 1.3 }}>
            One score for clothing from 27 factors, with the evidence behind every number.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 24, color: '#6f6d68' }}>
          <span>Fit 35%</span>
          <span>Quality 30%</span>
          <span>Style & value 20%</span>
          <span>Comfort 15%</span>
        </div>
      </div>
    ),
    size,
  )
}
