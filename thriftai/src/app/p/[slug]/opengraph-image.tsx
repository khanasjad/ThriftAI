import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const alt = 'Veritas Score'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

const BAND = (s: number) => (s >= 85 ? ['Excellent', '#104281'] : s >= 70 ? ['Good', '#1c5cab'] : s >= 55 ? ['Fair', '#2a78d6'] : s >= 40 ? ['Weak', '#5598e7'] : ['Poor', '#86b6ef'])

/** Share card for a product: score (or "Not rated yet") and the clearest fact we have. Never invents a number. */
export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await prisma.clothingProduct.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { name: true, brand: { select: { name: true } }, productScore: { select: { overall: true, confidenceLabel: true } }, reviews: { select: { fitsAs: true } } },
  })
  const name = p?.name ?? 'Product not found'
  const score = p?.productScore?.overall ?? null
  const [word, color] = score === null ? ['Not rated yet', '#c3c2b7'] : BAND(score)
  const fit = { small: 0, tts: 0, large: 0 }
  for (const r of p?.reviews ?? []) {
    if (r.fitsAs === 'runs_small') fit.small++
    else if (r.fitsAs === 'true_to_size') fit.tts++
    else if (r.fitsAs === 'runs_large') fit.large++
  }
  const answered = fit.small + fit.tts + fit.large
  const top = fit.small >= fit.tts && fit.small >= fit.large ? ['runs small', fit.small] : fit.large >= fit.tts ? ['runs large', fit.large] : ['fits true to size', fit.tts]
  const fact = answered >= 5 ? `${top[1]} of ${answered} reviewers say it ${top[0]}.` : `${p?.reviews.length ?? 0} reviews`
  const circumference = 2 * Math.PI * 110
  const dash = score === null ? 0 : (score / 100) * circumference

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', padding: 72, gap: 64, background: '#fafaf9', color: '#0b0b0f', fontFamily: 'sans-serif', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="130" cy="130" r="110" fill="none" stroke="#ecebe7" strokeWidth="20" />
            {score !== null && <circle cx="130" cy="130" r="110" fill="none" stroke={color} strokeWidth="20" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />}
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: score === null ? 64 : 96, fontWeight: 700 }}>{score === null ? '—' : score}</div>
            <div style={{ fontSize: 26, color: '#52514e' }}>{word}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <div style={{ fontSize: 28, color: '#6d28d9', fontWeight: 600 }}>Veritas Score</div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: 30, color: '#52514e' }}>{fact}</div>
          <div style={{ fontSize: 24, color: '#6f6d68' }}>{p?.brand.name ?? ''}</div>
        </div>
      </div>
    ),
    size,
  )
}
