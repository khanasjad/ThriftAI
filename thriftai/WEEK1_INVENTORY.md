# Week 1 Inventory - Before Cleanup

**Date**: October 23, 2026
**Purpose**: Document what exists before Week 1 cleanup

## API Endpoints Count

Total API route files: **73**

### Search APIs (TO DELETE - Keep only /api/v1/search)

1. `/api/buyers/search`
2. `/api/buyers/enhanced-search`
3. `/api/buyers/chat-search`
4. `/api/buyers/claude-search`
5. `/api/claude-intelligent-search`
6. `/api/claude-search`
7. `/api/enhanced-search`
8. `/api/intelligent-search-lite`
9. `/api/semantic-search`
10. `/api/smart-search`
11. `/api/visual-search`
12. `/api/v2/search`

**KEEP**: `/api/v1/search` (B2B production API)

### Features to Delete

1. **Swipe Feature**:
   - `src/app/swipe/` (UI pages)
   - `src/app/api/swipe/` (API endpoints)
   
2. **Leaderboard**:
   - `src/app/leaderboard/` (UI pages)
   - `src/app/api/leaderboard/` (API endpoints)
   
3. **Marketplace**:
   - `src/app/marketplace/` (UI pages)
   - `src/app/api/marketplace/` (API endpoints)

### API Endpoints to KEEP

#### Core B2B
- `/api/v1/search` - Primary search endpoint
- `/api/v1/products` - Product management (future: adapt for clothing)

#### Authentication & Tenant
- `/api/auth/[...nextauth]` - NextAuth

#### Product CRUD
- `/api/products/*` - Product operations
- `/api/categories` - Categories

#### Veritas Scoring (TO REFACTOR in Week 4)
- `/api/veritas/*` - Scoring endpoints (will adapt to 27 factors)

#### Integrations (EVALUATE later)
- `/api/integrations/*` - External data sources

#### Admin
- `/api/admin/*` - Admin operations

#### Cart/Checkout (KEEP for now, may deprecate)
- `/api/cart`
- `/api/checkout`
- `/api/orders`

#### Affiliate
- `/api/affiliate/*` - Affiliate tracking

### Files Confirmed Present

✅ Swipe feature exists
✅ Leaderboard exists  
✅ Marketplace exists
✅ 12+ redundant search APIs exist

### Next Steps (Week 1)

1. ✅ Create this inventory
2. [ ] Create Git tag `legacy-thriftai`
3. [ ] Delete swipe feature
4. [ ] Delete leaderboard
5. [ ] Delete marketplace
6. [ ] Delete 11 redundant search APIs
7. [ ] Verify app still builds
8. [ ] Run kept tests

**Target**: Reduce from 73 API routes to ~20-25 focused routes
