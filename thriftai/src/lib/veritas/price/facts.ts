/**
 * Price facts computed from price history across sellers. Pure code, shared by the product page
 * and the rating pipeline (price fairness evidence).
 */
export type PricePoint = { date: string; price: number; listPrice: number | null; isPromo: boolean }
export type SellerSeries = { seller: string; points: PricePoint[] }

export type PriceFacts = {
  lowest: { price: number; seller: string; date: string } | null
  current: { price: number; seller: string }[]
  /** A "was" price that no seller actually charged in the window. */
  fakeDiscount: { listPrice: number; highestCharged: number } | null
  /** Today's lowest price is well above the 90-day low. */
  oftenCheaper: { lowest: number; nowLowest: number } | null
  days: number
}

const OFTEN_CHEAPER_GAP = 0.12

export function computePriceFacts(series: SellerSeries[]): PriceFacts {
  const all = series.flatMap((s) => s.points.map((pt) => ({ ...pt, seller: s.seller })))
  if (all.length === 0) return { lowest: null, current: [], fakeDiscount: null, oftenCheaper: null, days: 0 }

  const dates = all.map((x) => x.date).sort()
  const days = Math.round((new Date(dates.at(-1)!).getTime() - new Date(dates[0]).getTime()) / 864e5)
  const lowest = all.reduce((a, b) => (b.price < a.price ? b : a))
  const current = series
    .map((s) => ({ seller: s.seller, price: s.points.at(-1)!.price }))
    .sort((a, b) => a.price - b.price)

  const highestCharged = Math.max(...all.map((x) => x.price))
  const listPrices = all.filter((x) => x.isPromo && x.listPrice != null).map((x) => x.listPrice!)
  const maxList = listPrices.length ? Math.max(...listPrices) : null
  const fakeDiscount = maxList !== null && maxList > highestCharged * 1.05 ? { listPrice: maxList, highestCharged } : null

  const nowLowest = current[0]?.price ?? lowest.price
  const oftenCheaper = nowLowest > lowest.price * (1 + OFTEN_CHEAPER_GAP) ? { lowest: lowest.price, nowLowest } : null

  return { lowest: { price: lowest.price, seller: lowest.seller, date: lowest.date }, current, fakeDiscount, oftenCheaper, days }
}

