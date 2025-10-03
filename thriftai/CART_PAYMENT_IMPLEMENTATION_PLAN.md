# 🛒 Cart + Payment System Implementation Plan
**ThriftAI - Hybrid Affiliate & Direct Sales Model**

## 📊 Executive Summary

**Goal:** Implement a complete shopping cart and payment system with:
- Universal cart for affiliate + internal products
- Swipe view integration in search page
- Stripe payment for internal products
- Affiliate tracking & redirect for external products

**Timeline:** 8-12 hours
**Risk Level:** 🟡 Medium (Stripe integration, cart state management)

---

## 🎯 Architecture Overview

### Flow Diagram
```
User Search → View Products (Grid/List/Leaderboard/Swipe)
              ↓
         Add to Cart → Cart Badge Updates
              ↓
         View Cart → Review Items
              ↓
         Checkout
              ↓
    ┌─────────┴──────────┐
    │                    │
Affiliate Product    Internal Product
    │                    │
Track Click         Stripe Payment
Redirect            Create Order
Commission          Email Receipt
```

### Database Schema (Already Exists ✅)

**CartItem:**
```prisma
- sessionId: String (guest users)
- buyerId: String? (logged-in users)
- productId: String
- quantity: Int
- priceAtTime: Float?
```

**Key Decision:**
- **Guest users**: Cart tied to `sessionId` (localStorage)
- **Logged-in users**: Cart migrated to `buyerId`

---

## 🔧 Phase 1: Cart Infrastructure (3 hours)

### 1.1 Cart API Routes

**Create `/src/app/api/cart/route.ts`**

```typescript
// GET /api/cart?sessionId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const session = await getServerSession(authOptions)

  const cart = await prisma.cartItem.findMany({
    where: session?.user?.id
      ? { buyerId: session.user.id }
      : { sessionId },
    include: { product: true }
  })

  return Response.json({ cart, count: cart.length, total: calculateTotal(cart) })
}

// POST /api/cart
export async function POST(req: Request) {
  const { productId, quantity, sessionId } = await req.json()
  const session = await getServerSession(authOptions)

  // Create or update cart item
  const cartItem = await prisma.cartItem.upsert({
    where: {
      sessionId_productId: { sessionId, productId }
    },
    update: { quantity },
    create: {
      sessionId,
      productId,
      quantity,
      buyerId: session?.user?.id,
      priceAtTime: product.price
    }
  })

  return Response.json({ success: true, cartItem })
}

// DELETE /api/cart/:id
export async function DELETE(req: Request) {
  const { id } = await req.json()
  await prisma.cartItem.delete({ where: { id } })
  return Response.json({ success: true })
}
```

**Create `/src/app/api/cart/migrate/route.ts`**
```typescript
// Migrate guest cart to user cart on login
export async function POST(req: Request) {
  const { sessionId, buyerId } = await req.json()

  await prisma.cartItem.updateMany({
    where: { sessionId, buyerId: null },
    data: { buyerId }
  })

  return Response.json({ success: true })
}
```

### 1.2 Cart Store (Zustand)

**Create `/src/lib/stores/cartStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  product: Product
  quantity: number
  priceAtTime: number
}

interface CartStore {
  sessionId: string
  items: CartItem[]
  count: number
  total: number
  isLoading: boolean

  // Actions
  addItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  fetchCart: () => Promise<void>
  migrateCart: (buyerId: string) => Promise<void>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      sessionId: typeof window !== 'undefined'
        ? localStorage.getItem('cartSessionId') || crypto.randomUUID()
        : '',
      items: [],
      count: 0,
      total: 0,
      isLoading: false,

      addItem: async (productId, quantity) => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              quantity,
              sessionId: get().sessionId
            })
          })
          await get().fetchCart()
        } finally {
          set({ isLoading: false })
        }
      },

      fetchCart: async () => {
        const res = await fetch(`/api/cart?sessionId=${get().sessionId}`)
        const { cart, count, total } = await res.json()
        set({ items: cart, count, total })
      },

      // ... other actions
    }),
    { name: 'thriftai-cart' }
  )
)
```

### 1.3 Cart Badge Component

**Create `/src/components/CartBadge.tsx`**

```typescript
'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cartStore'
import { useEffect } from 'react'

export function CartBadge() {
  const { count, fetchCart } = useCartStore()

  useEffect(() => {
    fetchCart()
  }, [])

  return (
    <button className="cart-button">
      <ShoppingCart />
      {count > 0 && (
        <span className="badge">{count}</span>
      )}
    </button>
  )
}
```

---

## 🎨 Phase 2: UI Integration (2 hours)

### 2.1 Add to Cart Button

**Update product cards** in search page:

```typescript
// src/app/buyers/search/page.tsx

import { useCartStore } from '@/lib/stores/cartStore'

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore()

  return (
    <div className="product-card">
      {/* ... product details ... */}
      <button
        onClick={() => addItem(product.id, 1)}
        className="btn-add-cart"
      >
        Add to Cart
      </button>
    </div>
  )
}
```

### 2.2 Cart Drawer Component

**Create `/src/components/CartDrawer.tsx`**

```typescript
'use client'

import { useCartStore } from '@/lib/stores/cartStore'
import { X, Trash2 } from 'lucide-react'

export function CartDrawer({ open, onClose }) {
  const { items, total, removeItem, updateQuantity } = useCartStore()

  return (
    <div className={`cart-drawer ${open ? 'open' : ''}`}>
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <button onClick={onClose}><X /></button>
      </div>

      <div className="cart-items">
        {items.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.product.imageUrl} />
            <div>
              <h3>{item.product.name}</h3>
              <p>${item.priceAtTime}</p>
            </div>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, +e.target.value)}
            />
            <button onClick={() => removeItem(item.id)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="total">Total: ${total.toFixed(2)}</div>
        <button className="btn-checkout">
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
```

### 2.3 Swipe View Integration

**Update `/src/app/buyers/search/page.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { Grid, List, Trophy, Sparkles } from 'lucide-react'
import { SwipeDeck } from '@/components/SwipeDeck'

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'leaderboard' | 'swipe'>('grid')

  return (
    <>
      {/* View Mode Selector */}
      <div className="view-modes">
        <button onClick={() => setViewMode('grid')}>
          <Grid /> Grid
        </button>
        <button onClick={() => setViewMode('list')}>
          <List /> List
        </button>
        <button onClick={() => setViewMode('leaderboard')}>
          <Trophy /> Leaderboard
        </button>
        <button onClick={() => setViewMode('swipe')}>
          <Sparkles /> Swipe
        </button>
      </div>

      {/* Render View */}
      {viewMode === 'swipe' ? (
        <SwipeDeck products={products} onAddToCart={addItem} />
      ) : (
        // ... existing grid/list/leaderboard rendering
      )}
    </>
  )
}
```

---

## 💳 Phase 3: Stripe Integration (4 hours)

### 3.1 Environment Setup

```bash
# Install Stripe SDK
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.2 Stripe Configuration

**Create `/src/lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})
```

### 3.3 Checkout API

**Create `/src/app/api/checkout/route.ts`**

```typescript
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { cartItems, sessionId } = await req.json()

  // Separate affiliate vs internal products
  const { affiliateItems, internalItems } = separateProducts(cartItems)

  // Create Stripe session ONLY for internal products
  if (internalItems.length > 0) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: internalItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            images: [item.product.imageUrl]
          },
          unit_amount: Math.round(item.priceAtTime * 100)
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: { cartSessionId: sessionId }
    })

    return NextResponse.json({
      stripeSessionId: session.id,
      affiliateItems
    })
  }

  // If only affiliate items, return them for redirect
  return NextResponse.json({ affiliateItems })
}
```

### 3.4 Checkout Page

**Create `/src/app/checkout/page.tsx`**

```typescript
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { useCartStore } from '@/lib/stores/cartStore'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const { items, sessionId } = useCartStore()
  const router = useRouter()

  const handleCheckout = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: items, sessionId })
    })

    const { stripeSessionId, affiliateItems } = await res.json()

    // Handle affiliate items first
    if (affiliateItems.length > 0) {
      for (const item of affiliateItems) {
        await trackAffiliateClick(item)
        window.open(item.product.affiliateUrl, '_blank')
      }
    }

    // Then redirect to Stripe for internal products
    if (stripeSessionId) {
      const stripe = await stripePromise
      await stripe?.redirectToCheckout({ sessionId: stripeSessionId })
    } else {
      // All affiliate, clear cart and go to success
      router.push('/checkout/success?type=affiliate')
    }
  }

  return (
    <div className="checkout-page">
      <h1>Review Your Order</h1>
      {/* ... cart summary ... */}
      <button onClick={handleCheckout}>Complete Purchase</button>
    </div>
  )
}
```

### 3.5 Webhook Handler

**Create `/src/app/api/webhooks/stripe/route.ts`**

```typescript
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Create order in database
    const cartSessionId = session.metadata?.cartSessionId
    const cartItems = await prisma.cartItem.findMany({
      where: { sessionId: cartSessionId },
      include: { product: true }
    })

    const order = await prisma.order.create({
      data: {
        buyerId: session.customer_details?.email,
        subtotal: session.amount_subtotal! / 100,
        total: session.amount_total! / 100,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentTransactionId: session.payment_intent as string,
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.priceAtTime!
          }))
        }
      }
    })

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { sessionId: cartSessionId }
    })
  }

  return new Response(JSON.stringify({ received: true }))
}
```

---

## 🔗 Phase 4: Affiliate Tracking (1 hour)

### 4.1 Affiliate Click Tracking

**Create `/src/lib/utils/affiliateTracker.ts`**

```typescript
import { prisma } from '@/lib/prisma'

export async function trackAffiliateClick(
  userId: string | null,
  sessionId: string,
  product: Product,
  affiliateUrl: string
) {
  // Create affiliate click record
  await prisma.affiliateClick.create({
    data: {
      userId,
      sessionId,
      source: product.source || 'INTERNAL', // AMAZON, EBAY, etc.
      externalProductId: product.id,
      productTitle: product.name,
      affiliateUrl,
      referralCode: generateReferralCode(),
      estimatedPrice: product.price,
      expectedCommission: calculateCommission(product.price),
      clicked: true,
      clickedAt: new Date()
    }
  })
}

function generateReferralCode(): string {
  return `THRIFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function calculateCommission(price: number): number {
  // Example: 5% commission
  return price * 0.05
}
```

### 4.2 Product Schema Extension

**Add to Product model** (if needed):

```prisma
model Product {
  // ... existing fields ...

  // Affiliate fields
  source           ExternalSource?  // AMAZON, EBAY, INTERNAL, etc.
  affiliateUrl     String?
  commissionRate   Float?           @default(0.05)
  isAffiliate      Boolean          @default(false)
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_affiliate_fields
```

---

## 🎨 Phase 5: UI Polish (2 hours)

### 5.1 Cart Badge in Navigation

```typescript
// src/components/Navigation.tsx
import { CartBadge } from '@/components/CartBadge'

export function Navigation() {
  return (
    <nav>
      {/* ... other nav items ... */}
      <CartBadge />
    </nav>
  )
}
```

### 5.2 Success Page

**Create `/src/app/checkout/success/page.tsx`**

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const type = searchParams.get('type')

  return (
    <div className="success-page">
      <CheckCircle className="success-icon" />
      <h1>Order Confirmed!</h1>
      {type === 'affiliate' ? (
        <p>We've opened your product pages. Complete checkout there.</p>
      ) : (
        <p>Your order has been placed successfully.</p>
      )}
      <button onClick={() => router.push('/orders')}>
        View Orders
      </button>
    </div>
  )
}
```

---

## 🚀 Deployment Checklist

### Prerequisites

1. **Stripe Account Setup:**
   - [ ] Create Stripe account
   - [ ] Get test API keys
   - [ ] Set up webhook endpoint
   - [ ] Test payment flow

2. **Environment Variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Database Migration:**
   ```bash
   # Add affiliate fields if needed
   npx prisma migrate dev

   # Seed test products
   npm run db:seed
   ```

### Testing Checklist

- [ ] Guest user can add to cart (sessionId-based)
- [ ] Logged-in user sees migrated cart (buyerId-based)
- [ ] Cart persists across page refreshes
- [ ] Cart badge updates in real-time
- [ ] Swipe view works in search page
- [ ] Add to cart from all view modes (grid/list/swipe/leaderboard)
- [ ] Affiliate products redirect correctly
- [ ] Internal products go to Stripe checkout
- [ ] Stripe webhook creates orders
- [ ] Cart clears after successful purchase
- [ ] Success page shows correct message

---

## 📊 Success Metrics

**Key Performance Indicators:**

1. **Cart Conversion Rate**: % of users who add to cart → checkout
2. **Affiliate Click-Through**: % of affiliate items clicked
3. **Stripe Payment Success**: % of successful payments
4. **Average Cart Value**: Total cart value / # of carts
5. **View Mode Usage**: Which view mode drives most sales

---

## 🐛 Troubleshooting

### Common Issues

**1. Cart not persisting:**
- Check localStorage for `thriftai-cart`
- Verify sessionId generation
- Check API route responses

**2. Stripe redirect fails:**
- Verify publishable key is correct
- Check success/cancel URLs
- Review Stripe dashboard logs

**3. Affiliate tracking not working:**
- Check AffiliateClick table
- Verify referralCode generation
- Check product.isAffiliate flag

**4. Cart badge not updating:**
- Check Zustand store subscriptions
- Verify fetchCart() is called
- Check React re-render

---

## 📚 Next Steps (Future Enhancements)

1. **Wishlist Feature** (save for later)
2. **Cart Abandonment Email** (remind users)
3. **Multi-currency Support** (Stripe supports this)
4. **Saved Payment Methods** (Stripe Customer Portal)
5. **Order Tracking** (USPS/FedEx integration)
6. **Affiliate Dashboard** (earnings tracking)
7. **Cart Recommendations** ("Frequently bought together")
8. **Express Checkout** (Apple Pay, Google Pay)

---

## 🎯 Estimated Timeline

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Cart API + Store | 3h | 🔴 High |
| 2 | UI Integration | 2h | 🔴 High |
| 3 | Stripe Setup | 4h | 🔴 High |
| 4 | Affiliate Tracking | 1h | 🟡 Medium |
| 5 | UI Polish | 2h | 🟢 Low |

**Total: 12 hours**

---

## ✅ Implementation Ready

You have all the infrastructure in place:
- ✅ Database models exist
- ✅ Swipe UI components ready
- ✅ Session management working
- ✅ Affiliate tracking schema ready

**Next Action:** Start with Phase 1 (Cart API) and work sequentially through phases.

Would you like me to begin implementing Phase 1 now?
