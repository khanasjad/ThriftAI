import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface CartItem {
  id: string
  productId: string
  quantity: number
  priceAtTime: number
  createdAt: string
  product: {
    id: string
    name: string
    price: number
    imageUrl?: string
    brand?: string
    condition?: string
    seller?: {
      businessName: string
      rating: number
    }
  }
}

interface CartStore {
  // State
  items: CartItem[]
  count: number
  subtotal: number
  isOpen: boolean
  isLoading: boolean
  sessionId: string | null

  // Actions
  setSessionId: (sessionId: string) => void
  fetchCart: (buyerId?: string) => Promise<void>
  addToCart: (productId: string, quantity?: number, buyerId?: string) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  migrateCart: (buyerId: string) => Promise<void>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      count: 0,
      subtotal: 0,
      isOpen: false,
      isLoading: false,
      sessionId: null,

      // Initialize session ID if not exists
      setSessionId: (sessionId: string) => {
        set({ sessionId })
      },

      // Fetch cart from backend
      fetchCart: async (buyerId?: string) => {
        try {
          set({ isLoading: true })

          const state = get()
          let sessionId = state.sessionId

          // Generate session ID if not exists
          if (!sessionId && !buyerId) {
            sessionId = uuidv4()
            set({ sessionId })
          }

          const params = new URLSearchParams()
          if (buyerId) {
            params.append('buyerId', buyerId)
          } else if (sessionId) {
            params.append('sessionId', sessionId)
          }

          const response = await fetch(`/api/cart?${params}`)

          if (!response.ok) {
            throw new Error('Failed to fetch cart')
          }

          const data = await response.json()

          set({
            items: data.cart || data.items || [],
            count: data.count || 0,
            subtotal: data.subtotal || 0,
            isLoading: false
          })
        } catch (error) {
          console.error('Failed to fetch cart:', error)
          set({ isLoading: false })
        }
      },

      // Add item to cart
      addToCart: async (productId: string, quantity = 1, buyerId?: string) => {
        try {
          set({ isLoading: true })

          const state = get()
          let sessionId = state.sessionId

          // Generate session ID if not exists
          if (!sessionId && !buyerId) {
            sessionId = uuidv4()
            set({ sessionId })
          }

          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              productId,
              quantity,
              sessionId,
              buyerId
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to add to cart')
          }

          const data = await response.json()

          // Refresh cart from backend to get latest state
          await get().fetchCart(buyerId)

          set({ isLoading: false }) // Don't open drawer - user navigates to cart page

          return data
        } catch (error) {
          console.error('Failed to add to cart:', error)
          set({ isLoading: false })
          throw error
        }
      },

      // Remove item from cart
      removeFromCart: async (cartItemId: string) => {
        try {
          set({ isLoading: true })

          const response = await fetch(`/api/cart?id=${cartItemId}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error('Failed to remove item')
          }

          // Update local state by filtering out the removed item
          const state = get()
          const newItems = state.items.filter(item => item.id !== cartItemId)
          const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
          const newSubtotal = newItems.reduce(
            (sum, item) => sum + (item.priceAtTime || item.product.price) * item.quantity,
            0
          )

          set({
            items: newItems,
            count: newCount,
            subtotal: newSubtotal,
            isLoading: false
          })
        } catch (error) {
          console.error('Failed to remove item:', error)
          set({ isLoading: false })
          throw error
        }
      },

      // Update item quantity
      updateQuantity: async (cartItemId: string, quantity: number) => {
        try {
          set({ isLoading: true })

          const response = await fetch('/api/cart', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: cartItemId,
              quantity
            })
          })

          if (!response.ok) {
            throw new Error('Failed to update quantity')
          }

          const data = await response.json()

          // Update local state
          const state = get()
          const newItems = state.items.map(item =>
            item.id === cartItemId ? { ...item, quantity } : item
          )
          const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
          const newSubtotal = newItems.reduce(
            (sum, item) => sum + (item.priceAtTime || item.product.price) * item.quantity,
            0
          )

          set({
            items: newItems,
            count: newCount,
            subtotal: newSubtotal,
            isLoading: false
          })
        } catch (error) {
          console.error('Failed to update quantity:', error)
          set({ isLoading: false })
          throw error
        }
      },

      // Clear cart (local only)
      clearCart: () => {
        set({
          items: [],
          count: 0,
          subtotal: 0
        })
      },

      // Cart drawer controls
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Migrate guest cart to user cart after login
      migrateCart: async (buyerId: string) => {
        try {
          const state = get()
          const sessionId = state.sessionId

          if (!sessionId) {
            console.log('No session ID to migrate')
            return
          }

          console.log('🔄 Migrating cart from session to user', { sessionId, buyerId })

          const response = await fetch('/api/cart/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId,
              buyerId
            })
          })

          if (!response.ok) {
            throw new Error('Failed to migrate cart')
          }

          const data = await response.json()
          console.log('✅ Cart migration successful', data)

          // Fetch updated cart for the user
          await get().fetchCart(buyerId)

          // Clear session ID after migration
          set({ sessionId: null })
        } catch (error) {
          console.error('Failed to migrate cart:', error)
          throw error
        }
      }
    }),
    {
      name: 'veritas-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        items: state.items,
        count: state.count,
        subtotal: state.subtotal,
        sessionId: state.sessionId
      })
    }
  )
)
