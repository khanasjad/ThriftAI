'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CartBadge() {
  const router = useRouter()
  const { data: session } = useSession()
  const { count, isLoading, fetchCart } = useCartStore()

  useEffect(() => {
    // Fetch cart on mount
    const buyerId = session?.user?.id
    fetchCart(buyerId)
  }, [session?.user?.id, fetchCart])

  return (
    <button
      onClick={() => router.push('/cart')}
      className="btn-modern-secondary nav-btn"
      style={{
        width: '44px',
        height: '44px',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        position: 'relative'
      }}
      aria-label={`Shopping cart with ${count} items`}
      title="Shopping Cart"
    >
      <ShoppingCart className="w-5 h-5" />

      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{
          boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)'
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-25"></span>
        </span>
      )}
    </button>
  )
}
