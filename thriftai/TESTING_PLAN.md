# ThriftAI Comprehensive Testing Plan

## Testing Scope
- UI/UX Testing (padding, fonts, colors, responsiveness)
- Data Integrity Testing (products, scores, APIs)
- Image Testing (loading, optimization, fallbacks)
- AI Chatbot Testing (functionality, responses, errors)

## 1. UI/UX Testing

### Pages to Test:
- [ ] Home page (/)
- [ ] Search page (/buyers/search)
- [ ] Product details page (/products/[id])
- [ ] Leaderboard page (/leaderboard)
- [ ] Visual Search page (/visual-search)
- [ ] Cart page (/cart)
- [ ] Sustainability page (/sustainability)

### UI Elements to Check:
- [ ] Padding/Margins consistency
- [ ] Font families and sizes
- [ ] Color scheme (primary, secondary, backgrounds)
- [ ] Button styles and hover states
- [ ] Card layouts
- [ ] Navigation bar
- [ ] Footer
- [ ] Forms and inputs
- [ ] Modals and dialogs

### Responsive Design:
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px+)

## 2. Data Integrity Testing

### Database:
- [ ] Product data completeness
- [ ] Veritas Score accuracy
- [ ] Score breakdown validation
- [ ] Category distribution
- [ ] Price ranges
- [ ] Stock quantities

### API Endpoints:
- [ ] GET /api/products
- [ ] GET /api/products/[id]
- [ ] GET /api/leaderboard
- [ ] GET /api/search
- [ ] POST /api/chat
- [ ] POST /api/tts

### Score Calculations:
- [ ] Veritas Score formula
- [ ] Component scores (9 pillars)
- [ ] Parameter counting
- [ ] Score breakdown display

## 3. Image Testing

### Product Images:
- [ ] Image loading performance
- [ ] Image optimization (Next.js Image)
- [ ] Fallback images
- [ ] Image aspect ratios
- [ ] Lazy loading
- [ ] Multiple images per product

### Image Sources:
- [ ] Picsum.photos integration
- [ ] Local images
- [ ] CDN performance

## 4. AI Chatbot Testing

### Functionality:
- [ ] Chat initialization
- [ ] Message sending
- [ ] Response generation
- [ ] Voice chat (VAD)
- [ ] TTS (Text-to-Speech)
- [ ] Error handling
- [ ] Rate limiting

### Scenarios:
- [ ] Product recommendations
- [ ] Price queries
- [ ] Sustainability questions
- [ ] General help
- [ ] Edge cases (long messages, special characters)

## 5. Common Issues to Check

### Performance:
- [ ] Page load times
- [ ] API response times
- [ ] Image loading speed
- [ ] Bundle size

### Accessibility:
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] ARIA labels
- [ ] Color contrast

### Browser Compatibility:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## 6. Known Issues to Fix

### From Previous Sessions:
- [ ] Navigation button padding on desktop
- [ ] Leaderboard score breakdown display
- [ ] Product card spacing
- [ ] Color consistency across components
- [ ] Font weight variations

## Test Execution Log

### Date: 2025-10-14
**Tester**: Claude Code
**Environment**: Development (localhost:3000)

---

## Issue Tracking

| ID | Component | Issue | Severity | Status |
|----|-----------|-------|----------|--------|
| | | | | |

---

## Test Results Summary

**Total Tests**: TBD
**Passed**: TBD
**Failed**: TBD
**Blocked**: TBD

---

## Sign-off

- [ ] All critical issues resolved
- [ ] All tests passing
- [ ] Ready for production
