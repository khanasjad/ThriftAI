import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SwipeProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  brand?: string
  condition?: string
  description?: string
  category?: string
  rating?: number
  reviewCount?: number
}

export interface SwipeFilters {
  categories: string[]
  priceRange: { min: number; max: number }
  styles: string[]
}

interface SwipeAction {
  product: SwipeProduct
  action: 'LIKE' | 'SKIP'
  timestamp: number
}

interface SwipeStoreState {
  // Session state
  sessionId: string | null
  filters: SwipeFilters | null
  products: SwipeProduct[]
  currentIndex: number

  // Liked products
  likedProducts: SwipeProduct[]

  // Swipe history for undo functionality
  swipeHistory: SwipeAction[]

  // UI state
  isLoading: boolean
  showFilters: boolean
  showCart: boolean
  showProductDetail: boolean
  selectedProduct: SwipeProduct | null

  // Session actions
  setSessionId: (id: string) => void
  setFilters: (filters: SwipeFilters) => void
  setProducts: (products: SwipeProduct[]) => void
  resetSession: () => void

  // Swipe actions
  swipeLeft: () => void
  swipeRight: (product: SwipeProduct) => void
  undoSwipe: () => void

  // Liked product actions
  addToLiked: (product: SwipeProduct) => void
  removeFromLiked: (productId: string) => void
  clearLiked: () => void
  isLiked: (productId: string) => boolean

  // UI actions
  toggleFilters: () => void
  toggleCart: () => void
  openProductDetail: (product: SwipeProduct) => void
  closeProductDetail: () => void
}

export const useSwipeStore = create<SwipeStoreState>()(
  persist(
    (set, get) => ({
      // Session state
      sessionId: null,
      filters: null,
      products: [],
      currentIndex: 0,

      // Liked products
      likedProducts: [],

      // Swipe history
      swipeHistory: [],

      // UI state
      isLoading: false,
      showFilters: false,
      showCart: false,
      showProductDetail: false,
      selectedProduct: null,

      // Session actions
      setSessionId: (id) => set({ sessionId: id }),

      setFilters: (filters) => set({ filters }),

      setProducts: (products) => set({ products, currentIndex: 0 }),

      resetSession: () => set({
        sessionId: null,
        filters: null,
        products: [],
        currentIndex: 0,
        swipeHistory: []
      }),

      // Swipe actions
      swipeLeft: () => {
        const { currentIndex, products, swipeHistory } = get()
        if (currentIndex < products.length) {
          const product = products[currentIndex]
          set({
            currentIndex: currentIndex + 1,
            swipeHistory: [...swipeHistory, { product, action: 'SKIP', timestamp: Date.now() }]
          })
        }
      },

      swipeRight: (product) => {
        const { currentIndex, likedProducts, swipeHistory } = get()
        // Add to liked if not already liked
        if (!likedProducts.some(p => p.id === product.id)) {
          set({
            currentIndex: currentIndex + 1,
            likedProducts: [...likedProducts, product],
            swipeHistory: [...swipeHistory, { product, action: 'LIKE', timestamp: Date.now() }]
          })
        } else {
          set({
            currentIndex: currentIndex + 1,
            swipeHistory: [...swipeHistory, { product, action: 'LIKE', timestamp: Date.now() }]
          })
        }
      },

      undoSwipe: () => {
        const { currentIndex, swipeHistory, likedProducts } = get()
        if (swipeHistory.length === 0 || currentIndex === 0) return

        const lastAction = swipeHistory[swipeHistory.length - 1]
        const newHistory = swipeHistory.slice(0, -1)

        // If it was a LIKE, remove from liked products
        let newLikedProducts = likedProducts
        if (lastAction.action === 'LIKE') {
          newLikedProducts = likedProducts.filter(p => p.id !== lastAction.product.id)
        }

        set({
          currentIndex: currentIndex - 1,
          swipeHistory: newHistory,
          likedProducts: newLikedProducts
        })
      },

      // Liked product actions
      addToLiked: (product) => {
        set((state) => {
          // Avoid duplicates
          if (state.likedProducts.some(p => p.id === product.id)) {
            return state
          }
          return {
            likedProducts: [...state.likedProducts, product]
          }
        })
      },

      removeFromLiked: (productId) => {
        set((state) => ({
          likedProducts: state.likedProducts.filter(p => p.id !== productId)
        }))
      },

      clearLiked: () => {
        set({ likedProducts: [] })
      },

      isLiked: (productId) => {
        return get().likedProducts.some(p => p.id === productId)
      },

      // UI actions
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      toggleCart: () => set((state) => ({ showCart: !state.showCart })),

      openProductDetail: (product) => set({
        showProductDetail: true,
        selectedProduct: product
      }),

      closeProductDetail: () => set({
        showProductDetail: false,
        selectedProduct: null
      })
    }),
    {
      name: 'swipe-storage',
      storage: createJSONStorage(() => localStorage),
      partialPersist: true,
      partialize: (state) => ({
        likedProducts: state.likedProducts,
        sessionId: state.sessionId,
        filters: state.filters,
        products: state.products,
        currentIndex: state.currentIndex,
        swipeHistory: state.swipeHistory
      })
    }
  )
)
