'use client'

import { useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'

export default function CartBadge() {
  const { count, subtotal, fetchCart } = useCartStore()

  useEffect(() => {
    // Fetch cart on mount
    fetchCart()
  }, [fetchCart])

  return (
    <Link
      href="/cart"
      className="cart-badge-link"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
      }}
    >
      <ShoppingCart
        className="cart-badge-icon"
        style={{
          width: '20px',
          height: '20px',
          color: 'var(--accent-primary)'
        }}
      />

      {count > 0 && (
        <>
          <span
            className="cart-badge-count"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            {count}
          </span>

          <span className="d-none d-sm-inline" style={{ color: 'var(--text-secondary)' }}>
            ${subtotal.toFixed(2)}
          </span>
        </>
      )}

      {count === 0 && (
        <span style={{ color: 'var(--text-tertiary)' }}>
          Cart
        </span>
      )}
    </Link>
  )
}
