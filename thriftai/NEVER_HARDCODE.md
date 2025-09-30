# ⚠️ NEVER HARDCODE - System Architecture Principle

## Core Philosophy

**The ThriftAI system MUST NOT contain hardcoded mappings, rules, or business logic.**

Instead, we rely on:
- **Claude AI** for dynamic understanding
- **Configuration files** for product catalogs
- **Database** for all data
- **Natural language processing** instead of pattern matching

## Why No Hardcoding?

### The Problem with Hardcoding
```typescript
// ❌ BAD: Hardcoded mapping
const categoryMap = {
  'bags': 'ACCESSORIES',
  'shoes': 'SHOES',
  'jeans': 'CLOTHING'
}
```

**Issues:**
1. ❌ Can't handle new product types without code changes
2. ❌ Doesn't scale to millions of products
3. ❌ Fails with edge cases and typos
4. ❌ Requires developer intervention for every new scenario
5. ❌ Can't adapt to different languages or markets
6. ❌ Maintenance nightmare as rules grow

### The AI-Powered Solution
```typescript
// ✅ GOOD: Claude AI understands dynamically
const filters = await structuredQueryGenerator.generateQuery(userQuery)
// Claude returns: { searchTerms: ["bag", "handbag", "vintage"], category: "ACCESSORIES" }
```

**Benefits:**
1. ✅ Handles ANY product query dynamically
2. ✅ Understands context, synonyms, and intent
3. ✅ Adapts to typos, misspellings, variations
4. ✅ Works with new products without code changes
5. ✅ Scales to trillions of scenarios
6. ✅ Self-improving as Claude's capabilities improve

## What We Use Instead

### 1. Claude AI for Query Understanding
**Location:** `src/lib/services/structuredQueryGenerator.ts`

Claude dynamically:
- Extracts product types
- Identifies modifiers (vintage, designer, cheap, etc.)
- Detects categories
- Understands price constraints
- Generates synonyms and variations

**Example:**
```typescript
Input: "Find vintage designer bags under $200"
Claude Output: {
  searchTerms: ["bag", "handbag", "purse", "vintage", "designer"],
  category: "ACCESSORIES",
  maxPrice: 200,
  intent: "User wants vintage designer bags under $200",
  confidence: 0.95
}
```

### 2. Product Configuration (Dynamic)
**Location:** `src/lib/config/productConfig.ts`

Load categories and attributes from:
- Database
- Configuration API
- Environment variables

**Example:**
```typescript
const categories = await productConfig.getCategories()
const brands = await productConfig.getBrands()
```

### 3. Database as Source of Truth
All product data, categories, attributes in PostgreSQL.

## Examples of What NOT to Hardcode

### ❌ Product Type Mappings
```typescript
// DON'T DO THIS
if (query.includes('bag')) return 'ACCESSORIES'
if (query.includes('shoe')) return 'SHOES'
```

**Why:** Can't handle "handbag", "purse", "tote", "backpack", etc.

### ❌ Synonym Lists
```typescript
// DON'T DO THIS
const shoeSynonyms = ['shoe', 'sneaker', 'boot', 'sandal']
```

**Why:** Claude knows ALL synonyms dynamically + handles typos.

### ❌ Business Rules
```typescript
// DON'T DO THIS
if (query.includes('cheap')) maxPrice = 100
if (query.includes('luxury')) minPrice = 500
```

**Why:** Claude understands price intent contextually.

### ❌ Brand Names
```typescript
// DON'T DO THIS
const brands = ['Nike', 'Adidas', 'Gucci', ...]
```

**Why:** New brands emerge constantly. Use database + Claude detection.

### ❌ Category Hierarchies
```typescript
// DON'T DO THIS
const hierarchy = {
  'CLOTHING': ['shirts', 'pants', 'jackets']
}
```

**Why:** Load from database or configuration.

## Acceptable "Smart Defaults"

Some lightweight, general-purpose utilities are okay:

### ✅ Common Typo Fixes (Minimal)
```typescript
// OK: General-purpose typo normalization
const typoMap = {
  'jaans': 'jeans',    // Common misspelling
  'tshirt': 'shirt',   // Common variation
  'shose': 'shoes'     // Typo
}
```

**Why OK:** These are common patterns across ANY e-commerce site, not business logic.

**Rule:** Keep it under 10-20 entries, general patterns only.

### ✅ Filler Word Removal
```typescript
// OK: Universal filler words
const fillerWords = ['find', 'looking', 'for', 'the', 'a', 'an']
```

**Why OK:** Universal across all languages/queries.

## Migration Guide

### Step 1: Identify Hardcoding
Look for:
- Large `if/else` or `switch` statements
- Object/array literals with product data
- Hardcoded strings that could change

### Step 2: Move to AI
```typescript
// BEFORE
if (query === 'car') {
  category = 'AUTOMOTIVE'
  synonyms = ['car', 'vehicle', 'automobile']
}

// AFTER
const { category, searchTerms } = await claudeAI.parseQuery(query)
// Claude figures it out dynamically
```

### Step 3: Move to Configuration/Database
```typescript
// BEFORE
const brands = ['Nike', 'Adidas', 'Puma']

// AFTER
const brands = await prisma.brand.findMany()
```

## Testing Without Hardcoding

### Test AI Understanding
```typescript
test('Claude understands vintage designer bags', async () => {
  const result = await structuredQueryGenerator.generateQuery('vintage designer bags')
  expect(result.category).toBe('ACCESSORIES')
  expect(result.searchTerms).toContain('bag')
  expect(result.searchTerms).toContain('vintage')
})
```

### Test Flexibility
```typescript
test('Handles new product types without code changes', async () => {
  // Add new category to database
  await prisma.category.create({ name: 'SMART_HOME' })

  // Should work without any code changes
  const result = await structuredQueryGenerator.generateQuery('smart thermostat')
  expect(result).toBeDefined()
})
```

## Monitoring & Improvement

### Log AI Decisions
```typescript
logger.info('🤖 Claude AI decision', {
  query,
  searchTerms: result.searchTerms,
  category: result.category,
  confidence: result.confidence
})
```

### Track Failures
When Claude confidence < 0.5, log for analysis:
```typescript
if (result.confidence < 0.5) {
  await prisma.searchAnalytics.create({
    query,
    confidence: result.confidence,
    needsReview: true
  })
}
```

## Red Flags in Code Review

🚩 **Large switch/case statements** with product types
🚩 **Hardcoded arrays** of categories, brands, or products
🚩 **String matching** against fixed values
🚩 **Business logic** embedded in code vs. configuration
🚩 **Comments like** "TODO: Add more categories here"

## The Right Way

### Before (Hardcoded)
```typescript
// 500+ lines of hardcoded mappings
const productTypeMap = {
  'bag': { category: 'ACCESSORIES', synonyms: [...] },
  'watch': { category: 'ACCESSORIES', synonyms: [...] },
  // ... 50 more entries
}

const categoryMap = {
  'ELECTRONICS': ['phone', 'laptop', 'tablet', ...],
  // ... 10 more categories
}

function detectProductType(query) {
  for (const [type, config] of Object.entries(productTypeMap)) {
    if (query.includes(type)) return config
  }
}
```

**Problems:**
- 500+ lines to maintain
- Breaks with new products
- Can't handle typos
- Developer needed for every change

### After (AI-Powered)
```typescript
// 10 lines - Claude handles everything
async function parseQuery(query: string) {
  return await structuredQueryGenerator.generateQuery(query)
}
```

**Benefits:**
- Handles unlimited scenarios
- Self-improving
- No maintenance
- Scales infinitely

## Summary

✅ **DO:** Use Claude AI for dynamic understanding
✅ **DO:** Load data from database/configuration
✅ **DO:** Make system self-adapting
✅ **DO:** Use natural language processing

❌ **DON'T:** Hardcode product types
❌ **DON'T:** Hardcode business rules
❌ **DON'T:** Create large if/else chains
❌ **DON'T:** Maintain synonym lists in code

---

**Last Updated:** 2025-09-30
**Principle:** Zero hardcoding, infinite scalability through AI
