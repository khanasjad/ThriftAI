import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SwipeFilters {
  categories: string[]
  priceRange: { min: number; max: number }
  colors?: string[]
  styles?: string[]
  brands?: string[]
  sizes?: string[]
  condition?: string[]
}

export interface SwipeProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  brand?: string
  category: string
  condition?: string
  rating?: number
  description?: string
}

interface SwipeStore {
  // Session
  sessionId: string | null
  filters: SwipeFilters | null

  // Products
  products: SwipeProduct[]
  currentIndex: number
  likedProducts: SwipeProduct[]

  // UI State
  isLoading: boolean
  showFilters: boolean
  showCart: boolean

  // Actions
  setSessionId: (id: string) => void
  setFilters: (filters: SwipeFilters) => void
  setProducts: (products: SwipeProduct[]) => void
  swipeLeft: () => void
  swipeRight: (product: SwipeProduct) => void
  resetSession: () => void
  toggleFilters: () => void
  toggleCart: () => void
  removeFromLiked: (productId: string) => void
  clearLiked: () => void
}

export const useSwipeStore = create<SwipeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sessionId: null,
      filters: null,
      products: [],
      currentIndex: 0,
      likedProducts: [],
      isLoading: false,
      showFilters: false,
      showCart: false,

      // Actions
      setSessionId: (id) => set({ sessionId: id }),

      setFilters: (filters) => set({ filters }),

      setProducts: (products) => set({ products, currentIndex: 0 }),

      swipeLeft: () => {
        const { currentIndex, products } = get()
        if (currentIndex < products.length - 1) {
          set({ currentIndex: currentIndex + 1 })
        }
      },

      swipeRight: (product) => {
        const { currentIndex, products, likedProducts } = get()

        // Add to liked products (avoid duplicates)
        const isAlreadyLiked = likedProducts.some(p => p.id === product.id)
        const newLiked = isAlreadyLiked
          ? likedProducts
          : [...likedProducts, product]

        // Move to next product
        if (currentIndex < products.length - 1) {
          set({
            currentIndex: currentIndex + 1,
            likedProducts: newLiked
          })
        } else {
          set({ likedProducts: newLiked })
        }
      },

      resetSession: () => set({
        sessionId: null,
        filters: null,
        products: [],
        currentIndex: 0,
        likedProducts: [],
        showFilters: false,
        showCart: false
      }),

      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      toggleCart: () => set((state) => ({ showCart: !state.showCart })),

      removeFromLiked: (productId) => set((state) => ({
        likedProducts: state.likedProducts.filter(p => p.id !== productId)
      })),

      clearLiked: () => set({ likedProducts: [] })
    }),
    {
      name: 'swipe-storage', // Storage key
      partialize: (state) => ({
        // Only persist these fields
        sessionId: state.sessionId,
        filters: state.filters,
        likedProducts: state.likedProducts,
        currentIndex: state.currentIndex
      })
    }
  )
)
