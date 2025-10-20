# ThriftAI - Critical Action Items (Priority Order)

**Date:** October 20, 2025
**Based On:** Comprehensive Testing Report

---

## 🔴 CRITICAL - MUST FIX BEFORE LAUNCH (Estimated: 2-3 weeks)

### 1. Accessibility - WCAG 2.1 AA Compliance ⏱️ 1 week
**Risk:** Legal liability in EU/US, excludes disabled users

#### Quick Fixes (2 days):
```jsx
// Add to all pages - layout.tsx
<a href="#main-content" className="skip-link">Skip to main content</a>

// Add to globals.css
*:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
}

// Fix all product images
<img
  src={product.image}
  alt={`${product.brand} ${product.name} - ${product.condition}`}
/>

// Add ARIA labels to buttons
<button aria-label="Open Gus, your AI shopping assistant">
```

#### Medium Fixes (3 days):
- Add `aria-live` regions for dynamic content (search results, cart updates)
- Add `aria-invalid` and error messages to all form inputs
- Add `aria-current` to navigation links
- Test with VoiceOver and NVDA screen readers

#### File Changes Needed:
- `src/app/layout.tsx` - Add skip link
- `src/app/globals.css` - Add focus styles
- `src/components/ProductCard.tsx` - Fix image alt text
- `src/components/ChatSidebar.tsx` - Add ARIA labels
- `src/components/Navigation.tsx` - Add aria-current

---

### 2. Touch Target Violations ⏱️ 1 day
**Risk:** iOS App Store rejection, poor mobile UX

#### Files to Fix:
```jsx
// src/app/compare/page.tsx - Line 216
<button
  style={{
    minWidth: '44px',   // Was: 36px
    minHeight: '44px',  // Was: 36px
  }}
>
  <X className="w-5 h-5" />
</button>

// Audit: Check all icon-only buttons
```

---

### 3. Complete Checkout Flow ⏱️ 1 week
**Risk:** Users cannot make purchases = $0 revenue

#### Tasks:
1. **Shipping Address Form** (2 days)
   - Create address validation API
   - Add form with autocomplete
   - Integrate with shipping calculation

2. **Payment Integration** (2 days)
   - Test Stripe integration thoroughly
   - Add error handling
   - Add loading states

3. **Order Confirmation** (1 day)
   - Send confirmation email
   - Create order history page
   - Add receipt download

4. **Error Handling** (1 day)
   - Handle all payment failures
   - Handle inventory errors
   - Add retry mechanisms

#### Files to Create:
- `src/app/checkout/shipping/page.tsx`
- `src/app/checkout/payment/page.tsx`
- `src/app/orders/page.tsx`
- `src/app/api/checkout/create-order/route.ts`

---

### 4. GDPR Compliance ⏱️ 2 days
**Risk:** Legal fines up to €20M or 4% of revenue

#### Required:
```jsx
// 1. Cookie Consent Banner (1 day)
npm install react-cookie-consent

// Add to layout.tsx
<CookieConsent
  location="bottom"
  buttonText="Accept All"
  enableDeclineButton
  onAccept={() => {
    // Enable analytics
  }}
>
  We use cookies to improve your experience...
</CookieConsent>

// 2. Privacy Policy Page (1 day)
- Create /privacy-policy page
- Create /terms-of-service page
- Add links to footer
- Document data collection practices
```

#### Files to Create:
- `src/app/privacy-policy/page.tsx`
- `src/app/terms-of-service/page.tsx`
- `src/components/CookieConsent.tsx`

---

## 🟡 HIGH PRIORITY - FIX SOON (Estimated: 1 week)

### 5. Search Error Handling ⏱️ 2 days

```typescript
// src/app/buyers/search/page.tsx

// Add error state
const [searchError, setSearchError] = useState<string | null>(null)

// Add error handling
try {
  const response = await fetch('/api/buyers/enhanced-search', {...})
  if (!response.ok) {
    throw new Error('Search failed')
  }
} catch (error) {
  setSearchError('Unable to search. Please try again.')
  // Show error toast/banner
}

// Add "No Results" state
{products.length === 0 && !isLoading && (
  <div className="no-results">
    <h3>No results found for "{query}"</h3>
    <p>Try these instead:</p>
    <ul>
      <li><button onClick={() => search('laptops')}>Popular Laptops</button></li>
      <li><button onClick={() => search('designer handbags')}>Designer Handbags</button></li>
    </ul>
  </div>
)}
```

---

### 6. ChatSidebar Button Overlap ⏱️ 1 hour

```css
/* src/app/globals.css */

/* Fix button position on small laptops */
@media (min-width: 1024px) and (max-width: 1200px) {
  .chat-sidebar-toggle {
    right: calc(420px + 20px); /* Move with sidebar when open */
  }
}
```

---

### 7. Wishlist Account Sync ⏱️ 2 days

```typescript
// src/app/api/wishlist/route.ts

// Save wishlist to database
export async function POST(req: Request) {
  const { userId, productId, folderId } = await req.json()

  await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
      folderId,
    }
  })

  return NextResponse.json({ success: true })
}

// Sync on login
useEffect(() => {
  if (user) {
    syncWishlistFromLocalStorage(user.id)
  }
}, [user])
```

---

### 8. Add Rate Limiting ⏱️ 1 day

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '15 m'),
})

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }
}
```

---

## 🟢 NICE TO HAVE - Future Enhancements

### 9. Search Autocomplete ⏱️ 3 days
### 10. Product Reviews ⏱️ 1 week
### 11. Discount Codes ⏱️ 3 days
### 12. Order History ⏱️ 2 days
### 13. Bundle Size Optimization ⏱️ 2 days

---

## Quick Wins (Can Fix in <1 Hour Each)

### Fix 1: Add Loading Spinner to Search Button
```jsx
// src/components/HeroSection.tsx
<button disabled={isLoading}>
  {isLoading ? <Spinner /> : 'Search'}
</button>
```

### Fix 2: Add Veritas Score Tooltip
```jsx
// src/components/VeritasScoreBadge.tsx
<span title="AI-powered quality score based on 96 parameters">
  Veritas Score: {score}
</span>
```

### Fix 3: Add Image Loading State
```jsx
<img
  src={product.image}
  loading="lazy"
  onError={(e) => e.currentTarget.src = '/placeholder.jpg'}
/>
```

### Fix 4: Fix Console Warnings
- Remove unused imports
- Fix React key warnings
- Fix uncontrolled component warnings

---

## Testing Checklist (Before Each Fix)

Before marking any task complete, verify:

- [ ] Desktop Chrome - Works
- [ ] Mobile Safari - Works
- [ ] Screen reader (VoiceOver) - Announces correctly
- [ ] Keyboard only - Can navigate
- [ ] Dark mode - Looks good
- [ ] Slow 3G - Doesn't break
- [ ] Console - No errors
- [ ] Lighthouse - Score doesn't drop

---

## Estimated Timeline

### Sprint 1 (Week 1):
- ✅ ChatSidebar toggle fix (DONE)
- 🔴 Accessibility quick fixes (2 days)
- 🔴 Touch target violations (1 day)
- 🔴 GDPR compliance (2 days)

### Sprint 2 (Week 2):
- 🔴 Checkout flow completion (5 days)
- 🔴 Accessibility medium fixes (3 days)
- 🟡 Search error handling (2 days)

### Sprint 3 (Week 3):
- 🟡 Wishlist sync (2 days)
- 🟡 Rate limiting (1 day)
- 🟡 ChatSidebar button fix (1 hour)
- Testing and QA (2 days)

**Total Estimated Time:** 2-3 weeks before production-ready

---

## Success Metrics

**After fixes, target scores:**
- Lighthouse Accessibility: 95+ (currently 72)
- WCAG 2.1 AA: 100% compliant (currently ~40%)
- iOS touch compliance: 100% (currently 95%)
- Checkout completion rate: >60%
- Page load time: <2s (currently 1.8s ✅)

---

## Resources Needed

**Tools:**
- axe DevTools (accessibility testing)
- VoiceOver (macOS) or NVDA (Windows)
- BrowserStack (cross-browser testing)
- Sentry (error monitoring)

**APIs/Services:**
- Stripe (payment processing)
- SendGrid or AWS SES (email)
- Upstash Redis (rate limiting)

**Documentation:**
- WCAG 2.1 AA Guidelines
- iOS Human Interface Guidelines
- Material Design 3

---

## Contact for Questions

- **Accessibility:** Refer to WCAG 2.1 AA documentation
- **Payments:** Stripe documentation
- **Performance:** Next.js optimization guide
- **Testing:** Comprehensive Testing Report (COMPREHENSIVE_TESTING_REPORT.md)

---

**Last Updated:** October 20, 2025
**Next Review:** After Sprint 1 completion
