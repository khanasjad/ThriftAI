'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/select'

const SORTS = [
  { value: 'score', label: 'Best score first' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest launches' },
]

/** Sort control: updates the URL so results stay shareable and server-rendered. */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  return (
    <Select
      label="Sort results"
      value={value}
      options={SORTS}
      className="w-full sm:w-52"
      onValueChange={(v) => {
        const next = new URLSearchParams(params.toString())
        if (v === 'score') next.delete('sort')
        else next.set('sort', v)
        router.replace(`${pathname}?${next.toString()}`, { scroll: false })
      }}
    />
  )
}
