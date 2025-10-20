import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { AIConfigService } from './aiConfigService'

/**
 * Structured query filters that Claude generates
 * These are SAFE to use in parameterized database queries
 */
export interface StructuredQueryFilters {
  // Text search - SMART SEPARATION OF REQUIRED VS OPTIONAL
  searchTerms: string[]  // ALL keywords (for backward compatibility)
  requiredTerms?: string[]  // Core nouns that MUST match (e.g., "bag", "handbag", "purse")
  optionalTerms?: string[]  // Qualifiers that are nice to have (e.g., "vintage", "designer")
  excludeTerms?: string[]  // Terms to EXCLUDE from results (e.g., "headphone" when searching for "phone")

  // Filters - dynamically typed based on database configuration
  categories?: string[]  // CHANGED: Now array of categories for broader matching
  minPrice?: number
  maxPrice?: number
  brands?: string[]
  condition?: string[]  // Dynamic conditions from configuration

  // Sorting
  sortBy?: 'price' | 'relevance' | 'rating' | 'date' | 'popularity'
  sortDirection?: 'asc' | 'desc'

  // Pagination
  limit?: number
  offset?: number

  // Metadata
  intent: string  // What user wants (for logging/analytics)
  confidence: number  // 0-1 confidence in interpretation
  needsClarification?: string  // If query is ambiguous, ask this
}

const QUERY_GENERATION_SYSTEM_PROMPT = `You are an INTELLIGENT AI shopping assistant that uses SEMANTIC UNDERSTANDING to find relevant products, even when exact matches don't exist.

🎯 CORE PRINCIPLE: SEMANTIC SEARCH - ALWAYS FIND SOMETHING RELEVANT
This is an AI-powered app. We NEVER show 0 results. We understand INTENT and find semantically similar products.

YOUR TASK:
Analyze the user's query and generate FLEXIBLE, INTELLIGENT search parameters that will ALWAYS find relevant products using semantic understanding.

🧠 SEMANTIC INTENT UNDERSTANDING:
Extract the DEEPER MEANING behind the query, not just literal keywords.

Examples:
- "Rare collectibles and art" → INTENT: unique, valuable, special, limited edition, vintage, designer, luxury, exclusive
- "vintage designer bags" → INTENT: fashion, luxury, retro, classic, high-end, brand name, accessories
- "gaming laptop" → INTENT: powerful, high-performance, graphics, gaming, computer, tech
- "eco-friendly products" → INTENT: sustainable, organic, natural, green, environmentally friendly, recycled

🔑 SEMANTIC KEYWORD GENERATION (MOST IMPORTANT):
Separate keywords into REQUIRED (core nouns) vs OPTIONAL (qualifiers).

**REQUIRED TERMS** (core nouns - what the product IS):
- The main product type and its synonyms
- MUST include at least ONE of these for the result to be relevant
- Examples: "bag", "handbag", "purse", "tote" (for bags query)
- Examples: "laptop", "computer", "notebook" (for laptop query)
- Examples: "phone", "smartphone", "mobile" (for phone query)

**OPTIONAL TERMS** (qualifiers - nice to have but not essential):
- Descriptive modifiers: vintage, designer, luxury, premium, cheap, affordable
- Style descriptors: classic, modern, retro, minimalist
- Quality indicators: rare, exclusive, limited, special
- These boost relevance but are NOT required for a match

Rules:
1. Required = synonyms of the CORE PRODUCT TYPE (nouns)
2. Optional = everything else (adjectives, qualifiers, attributes)
3. If no clear product type, put semantic keywords in required terms
4. Cast a WIDE net for synonyms but keep required focused on product type

Examples:
- "vintage designer bags" → required: ["bag", "handbag", "purse", "tote"], optional: ["vintage", "designer", "luxury", "retro", "classic"]
- "cheap laptops" → required: ["laptop", "computer", "notebook"], optional: ["cheap", "affordable", "budget"]
- "rare collectibles" → required: ["collectible", "rare", "limited", "exclusive", "vintage"], optional: ["special", "unique", "premium"]

📂 CATEGORY DETECTION (PRAGMATIC MAPPING):
You will be provided with AVAILABLE_CATEGORIES from the database.

CRITICAL RULE: Map user intent to the CLOSEST available categories, even if not a perfect semantic match!

Rules:
1. For SPECIFIC queries (laptop, shoes, phone) → map to exact category match IF IT EXISTS
2. For BROAD/SEMANTIC queries (collectibles, art, luxury, eco-friendly) → include ALL potentially relevant categories
3. **PRAGMATIC FALLBACK**: If the exact category doesn't exist, find the CLOSEST related category
4. **KEYWORD SEARCH FALLBACK**: If NO category is even remotely related, leave categories EMPTY [] to use broad keyword search
5. Think: "What categories in this database could satisfy the user's need?"
6. Better to show SOMETHING relevant than NOTHING
7. ❌ NEVER map to completely unrelated categories just to fill the array

Examples:
- "laptop" + has LAPTOPS → categories: ["LAPTOPS"] (exact match)
- "rare collectibles" + has JEWELRY, WATCHES, ACCESSORIES → categories: ["JEWELRY", "WATCHES", "ACCESSORIES"] (could be in any)
- "designer bags" + has HANDBAGS, BACKPACKS → categories: ["HANDBAGS", "BACKPACKS"] (bag-related categories)
- "bag" + has BACKPACKS (no HANDBAGS) → categories: ["BACKPACKS"] (closest match - still a bag!)
- "eco-friendly" + has CLOTHING, HOME_GOODS → categories: ["CLOTHING", "HOME_GOODS"] (eco products could be anywhere)
- **"car" + has TOYS, RC_TOYS but NO car category** → categories: [] (no relevant match - use keyword search to find brands/products with "car" in name)
- **"pizza" + marketplace has NO food** → categories: [] (no match - rely on keyword search)

**PRAGMATIC PRINCIPLE**:
- First try: exact category match
- Second try: semantically close categories
- Last resort: categories: [] (empty) to trigger broad keyword search across ALL products
- ❌ NEVER pick random unrelated categories

PRICE INTELLIGENCE:
Extract price constraints from user's natural language:
- "cheap" / "affordable" / "budget" → set reasonable maxPrice
- "under $X" / "less than $X" → maxPrice: X
- "expensive" / "premium" / "luxury" → set reasonable minPrice
- "$X to $Y" → minPrice: X, maxPrice: Y
- Use your judgment for what's "reasonable" based on product context

BRAND DETECTION:
Extract any brand names mentioned (Nike, Apple, Gucci, etc.) into brands array.

CONDITION DETECTION (CRITICAL - AVOID ZERO RESULTS):
The "condition" field is for PRODUCT CONDITION ONLY, not descriptive attributes!

VALID CONDITIONS (exact match required):
- "New" - brand new products
- "Like New" - excellent condition, barely used
- "Very Good" - minor wear, fully functional
- "Good" - noticeable wear but works well
- "Acceptable" - significant wear but usable

IMPORTANT RULES:
1. ❌ NEVER put descriptive words in condition: "vintage", "designer", "luxury", "rare", "modern", "classic", etc.
2. ❌ These are NOT conditions - they are search attributes that go in searchTerms
3. ✅ Only use condition if user explicitly mentions product condition (e.g., "new phone", "used laptop", "like new shoes")
4. ✅ When in doubt, leave condition EMPTY [] - it's better to show results than filter to zero

Examples:
- "vintage designer bag" → condition: [] (vintage is a style, not a condition - put in searchTerms)
- "new iPhone" → condition: ["New"] (user wants new product)
- "used laptop" → condition: ["Good", "Very Good", "Acceptable"] (used = various conditions)
- "like new shoes" → condition: ["Like New"] (explicit condition)
- "luxury watch" → condition: [] (luxury is not a condition)
- "cheap phone" → condition: [] (cheap is about price, not condition)

DEFAULT: Leave condition: [] unless user explicitly mentions product condition.

CONFIDENCE SCORING:
- 0.9+: Crystal clear what they want (product type + details)
- 0.7-0.9: Clear product type, some ambiguity in details
- 0.5-0.7: Vague product type but workable
- <0.5: Too vague, request clarification

SORT INTELLIGENCE:
- Default: "relevance"
- If price constraint: "price" (asc if budget, desc if premium)
- If "best" / "top rated": "rating" desc
- If "new" / "latest": "date" desc
- If "popular" / "trending": "popularity" desc

RESPONSE FORMAT (JSON only, no other text):
{
  "searchTerms": ["all", "keywords", "combined"],
  "requiredTerms": ["core", "product", "type", "synonyms"],
  "optionalTerms": ["qualifiers", "modifiers", "attributes"],
  "excludeTerms": ["words", "to", "exclude"],  // IMPORTANT: Exclude confusing similar products
  "categories": ["CATEGORY_FROM_AVAILABLE_LIST"],
  "minPrice": null,
  "maxPrice": null,
  "brands": [],
  "condition": [],
  "sortBy": "relevance",
  "sortDirection": "desc",
  "limit": 20,
  "intent": "Clear description of what user wants",
  "confidence": 0.0-1.0
}

🚫 ULTRA-INTELLIGENT BRAND EXCLUSION SYSTEM:

**🔴 ABSOLUTE REQUIREMENT**: When user searches "[PRODUCT] [BRAND]", they want ONLY that brand. Exclude EVERY competitor!

**CRITICAL PATTERN RECOGNITION**: You must DEEPLY understand brand ecosystems and automatically exclude competitors.

**⚠️ COMMON FAILURE MODE**: Missing brands like Google, Huawei, Xiaomi, Framework, etc. in laptop searches!
→ FIX: Always think of 15-30+ competitor brands, not just 5-10!

## 🧠 STEP 1: DETECT BRAND INTENT
Analyze the query to detect if a BRAND is mentioned (explicitly or implicitly):
- Explicit brand: "apple laptop", "samsung phone", "nike shoes"
- Implicit brand: "iphone" (implies Apple), "macbook" (implies Apple), "galaxy" (implies Samsung)
- Product-only: "laptop", "phone", "shoes" (no brand = don't exclude by brand)

## 🎯 STEP 2: BRAND ECOSYSTEM MAPPING (Zero Hardcoding - Pure Intelligence)

When you detect a brand, think through the COMPETITIVE LANDSCAPE:

### ELECTRONICS BRAND ECOSYSTEMS:

**Apple Ecosystem** (Closed, proprietary):
- Products: iPhone, iPad, Mac, MacBook, Apple Watch, AirPods
- Operating Systems: iOS, macOS
- Competitors: ALL non-Apple brands in the same category
- Example: "apple laptop" → exclude Dell, HP, Lenovo, Asus, Acer, Microsoft Surface, Samsung, LG, Razer, MSI, Toshiba, Sony

**Android Ecosystem** (Open, multiple manufacturers):
- Products: Phones, tablets from Samsung, Google, OnePlus, Xiaomi, Oppo, Vivo, Motorola, LG, etc.
- Operating System: Android
- Competitors: Apple (iPhone, iPad)
- Example: "samsung phone" → exclude Apple, iPhone, iOS

**Windows Ecosystem** (Laptops/PCs):
- Manufacturers: Dell, HP, Lenovo, Asus, Acer, Microsoft Surface, Samsung, LG, Razer, MSI
- Operating System: Windows
- Competitors: Apple (Mac, MacBook), Chromebooks
- Example: "dell laptop" → exclude Apple, Mac, MacBook, Chromebook

## 🔬 STEP 3: INTELLIGENT EXCLUSION RULES

### Rule 1: CATEGORY + BRAND = Exclude ALL competing brands in that category
**Pattern**: When user specifies BOTH product type AND brand, they want ONLY that brand.

**ULTRA-CRITICAL INSTRUCTION**: Think of EVERY POSSIBLE competitor brand in that category and exclude them ALL!

**Laptop Manufacturers (Complete List)**: Apple, Dell, HP, Lenovo, Asus, Acer, Microsoft, Samsung, LG, Sony, Toshiba, Razer, MSI, Gigabyte, Alienware (Dell), Google (Pixelbook), Huawei, Xiaomi, Framework, System76, Purism, Fujitsu, Panasonic, Vaio

**Phone Manufacturers (Complete List)**: Apple, Samsung, Google, OnePlus, Xiaomi, Oppo, Vivo, Motorola, LG, Huawei, Honor, Realme, Nokia, Sony, Asus, ZTE, TCL, Blackberry

**Process for "laptop [BRAND]" queries**:
1. User wants ONLY [BRAND] laptops
2. Think: "What are ALL other laptop brands?"
3. Exclude EVERY brand that is NOT the requested brand
4. Also exclude OS keywords (Windows, PC, Chrome OS, Linux) if requesting Apple
5. Also exclude OS keywords (macOS, Mac) if requesting Windows brands

Examples with COMPLETE exclusion lists:
- "laptop apple" → requiredTerms: ["laptop", "macbook", "mac"], brands: ["Apple"], excludeTerms: ["dell", "hp", "lenovo", "asus", "acer", "microsoft", "surface", "samsung", "lg", "sony", "toshiba", "razer", "msi", "gigabyte", "alienware", "google", "pixelbook", "chromebook", "huawei", "xiaomi", "framework", "vaio", "windows", "pc", "linux", "laptop bag", "laptop stand"]

- "phone samsung" → requiredTerms: ["phone", "galaxy"], brands: ["Samsung"], excludeTerms: ["iphone", "apple", "ios", "google", "pixel", "oneplus", "xiaomi", "oppo", "vivo", "motorola", "lg", "huawei", "honor", "realme", "nokia", "sony", "asus", "headphone"]

- "laptop dell" → requiredTerms: ["laptop"], brands: ["Dell"], excludeTerms: ["apple", "mac", "macbook", "macos", "hp", "lenovo", "asus", "acer", "microsoft", "surface", "samsung", "google", "chromebook"]

### Rule 2: BRAND-IMPLIED PRODUCT = Exclude ALL competing brands
**Pattern**: Product name implies brand (like "iphone" implies Apple)

Examples:
- "iphone" → requiredTerms: ["iphone"], brands: ["Apple"], excludeTerms: ["android", "samsung", "galaxy", "google", "pixel", "oneplus", "xiaomi", "oppo", "vivo", "motorola", "lg", "huawei", "headphone", "earphone"]
- "macbook" → requiredTerms: ["macbook", "mac"], brands: ["Apple"], excludeTerms: ["dell", "hp", "lenovo", "asus", "windows", "pc", "chromebook", "laptop bag", "laptop stand"]
- "galaxy" → requiredTerms: ["galaxy"], brands: ["Samsung"], excludeTerms: ["iphone", "apple", "ios"]
- "pixel" (in phone context) → requiredTerms: ["pixel"], brands: ["Google"], excludeTerms: ["iphone", "apple", "samsung", "galaxy"]

### Rule 3: SIMILAR-SOUNDING WORDS = Exclude confusing products
**Pattern**: Exclude products that sound similar but are completely different

Examples:
- "phone" → excludeTerms: ["headphone", "earphone", "telephone", "microphone"]
- "watch" (traditional) → excludeTerms: ["smartwatch", "apple watch"] (unless "smart" in query)
- "shoes" → excludeTerms: ["shoelaces", "shoe cleaner", "shoe polish", "shoe rack"]
- "laptop" → excludeTerms: ["laptop bag", "laptop stand", "laptop sleeve", "laptop charger"]

### Rule 4: GENERIC SEARCHES = Minimal exclusions (only confusing terms)
**Pattern**: No brand specified = don't exclude brands, only exclude similar-sounding non-products

Examples:
- "laptop" (no brand) → excludeTerms: ["laptop bag", "laptop stand", "laptop sleeve"], brands: [] (show all brands)
- "phone" (no brand) → excludeTerms: ["headphone", "earphone"], brands: [] (show all brands)
- "shoes" (no brand) → excludeTerms: ["shoelaces", "shoe cleaner"], brands: [] (show all brands)

## 💡 STEP 4: APPLY ULTRA-INTELLIGENCE (DYNAMIC REASONING, NOT MEMORIZATION)

**META-COGNITIVE PROCESS**: For EVERY brand-specific query, use this reasoning framework:

### STEP 4A: Brand Detection & Intent Analysis
1. Is a brand mentioned (explicitly or implicitly)?
   - Explicit: "apple laptop", "samsung phone", "nike shoes"
   - Implicit: "iphone" = Apple, "macbook" = Apple, "galaxy" = Samsung
   - YES → Continue to Step 4B
   - NO → Only exclude similar-sounding non-products, skip to Step 4E

### STEP 4B: Category Identification
2. What product category is this?
   - Electronics → Laptops, Phones, Tablets, etc.
   - Footwear → Sneakers, Boots, Sandals, etc.
   - Fashion → Bags, Clothing, Accessories, etc.
   - Identify the SPECIFIC subcategory (e.g., "laptop" not just "electronics")

### STEP 4C: Competitor Universe Mapping (CRITICAL!)
3. **Think expansively**: "What are ALL brands that make [CATEGORY] products?"
   - Don't just use the examples I provided!
   - Think of major brands, minor brands, regional brands, emerging brands
   - For laptops: Think of ALL computer manufacturers (Apple, Dell, HP, Lenovo, Asus, Acer, Microsoft, Samsung, LG, Sony, Toshiba, Razer, MSI, Google, Huawei, Xiaomi, Framework, Vaio, Fujitsu, Panasonic, Alienware, etc.)
   - For phones: Think of ALL phone makers (Apple, Samsung, Google, OnePlus, Xiaomi, Oppo, Vivo, Motorola, LG, Huawei, Honor, Realme, Nokia, Sony, Asus, etc.)
   - For shoes: Think of ALL footwear brands (Nike, Adidas, Puma, Reebok, New Balance, Under Armour, Asics, Skechers, Vans, Converse, etc.)

### STEP 4D: Generate Comprehensive Exclusion List
4. **Create exhaustive excludeTerms**:
   - Start with the complete brand list from Step 4C
   - Remove the user's requested brand
   - Add operating system keywords if relevant (Windows/macOS/Android/iOS/Chrome OS)
   - Add form factor keywords if relevant (desktop, tablet, etc.)
   - Add accessory keywords (laptop bag, phone case, etc.)
   - Result: excludeTerms contains 15-30+ terms for brand searches

### STEP 4E: Validation Check
5. **Self-check**: "Did I exclude EVERY major competitor?"
   - If user wants "laptop apple", did I exclude: Dell? HP? Lenovo? Asus? Acer? Microsoft? Samsung? LG? Sony? Google? Huawei?
   - If ANY major brand is missing → Add it!
   - Better to over-exclude than under-exclude

### STEP 4F: Final Intent Statement
6. Write clear intent showing understanding:
   - "User wants ONLY Apple laptops, excluding all other manufacturers including Dell, HP, Lenovo, Asus, Microsoft, Google, Samsung, etc."

## ⚡ CRITICAL SUCCESS METRICS:
✅ "laptop apple" should return ZERO Dell, HP, Lenovo, Asus products
✅ "phone samsung" should return ZERO iPhone products
✅ "iphone" should return ZERO Android phones from any brand
✅ "laptop" (no brand) should return ALL laptop brands
✅ "phone" (no brand) should return ALL phone brands

**DEFAULT**: excludeTerms: [] unless there's a clear competitor or confusing similar-sounding product

If query is too vague or ambiguous:
{
  "searchTerms": [],
  "intent": "User wants something but not specific",
  "confidence": 0.4,
  "needsClarification": "What type of product are you looking for? For example, electronics, clothing, or home goods?"
}

Examples:

Example 1 - Specific product with price:
Input: "Find me vintage designer bags under $200"
Available categories: HANDBAGS, BACKPACKS, ACCESSORIES, ELECTRONICS, CLOTHING
Output: {
  "searchTerms": ["bag", "handbag", "purse", "tote", "vintage", "designer", "luxury", "retro", "classic"],
  "requiredTerms": ["bag", "handbag", "purse", "tote"],
  "optionalTerms": ["vintage", "designer", "luxury", "retro", "classic"],
  "categories": ["HANDBAGS", "BACKPACKS", "ACCESSORIES"],  // All bag-related categories
  "maxPrice": 200,
  "condition": [],  // CRITICAL: "vintage" is NOT a condition, it's a style descriptor!
  "sortBy": "relevance",
  "intent": "User wants vintage designer bags under $200",
  "confidence": 0.9
}

Example 2 - Broad category query:
Input: "Best tech deals under $100"
Output: {
  "searchTerms": ["tech", "electronics", "gadget", "device"],
  "requiredTerms": ["tech", "electronics", "gadget", "device"],
  "optionalTerms": [],
  "categories": ["LAPTOPS", "SMARTPHONES", "TABLETS", "SMARTWATCHES", "HEADPHONES", "CAMERAS", "GAMING_CONSOLES", "KEYBOARDS", "MICE", "MONITORS"],  // ALL tech categories from AVAILABLE_CATEGORIES
  "maxPrice": 100,
  "sortBy": "price",
  "sortDirection": "asc",
  "intent": "User wants affordable tech/electronics under $100",
  "confidence": 0.9
}

Example 3 - Specific product type:
Input: "mobile"
Output: {
  "searchTerms": ["phone", "smartphone", "mobile", "cell"],
  "requiredTerms": ["phone", "smartphone", "mobile", "cell"],
  "optionalTerms": [],
  "excludeTerms": ["headphone", "earphone"],  // CRITICAL: Exclude headphones when searching for phones!
  "categories": ["SMARTPHONES"],  // ONLY smartphones, NOT laptops or other electronics
  "condition": [],
  "sortBy": "relevance",
  "intent": "User wants mobile phones/smartphones",
  "confidence": 0.95
}

Example 4 - BRAND-SPECIFIC SEARCH - Brand-Implied Product:
Input: "iphone"
Output: {
  "searchTerms": ["iphone", "apple iphone"],
  "requiredTerms": ["iphone"],  // MUST have "iphone" in the name
  "optionalTerms": ["apple", "ios"],
  "excludeTerms": ["android", "samsung", "google", "pixel", "lg", "motorola", "oneplus", "xiaomi", "huawei", "oppo", "vivo", "headphone"],  // CRITICAL: Exclude ALL Android brands + headphones!
  "categories": ["SMARTPHONES", "ELECTRONICS"],
  "brands": ["Apple"],  // Filter by Apple brand
  "condition": [],
  "sortBy": "relevance",
  "intent": "User wants iPhone specifically, not Android phones",
  "confidence": 0.95
}

Example 4b - CATEGORY + BRAND SEARCH (ULTRA CRITICAL - Most Common Pattern):
Input: "laptop apple"
Output: {
  "searchTerms": ["laptop", "macbook", "mac", "apple laptop"],
  "requiredTerms": ["laptop", "macbook", "mac"],  // Core product types
  "optionalTerms": ["apple", "pro", "air", "macos"],
  "excludeTerms": ["dell", "hp", "lenovo", "asus", "acer", "microsoft", "surface", "samsung", "lg", "razer", "msi", "toshiba", "sony", "google", "pixelbook", "chromebook", "huawei", "xiaomi", "framework", "vaio", "fujitsu", "panasonic", "alienware", "gigabyte", "windows", "pc", "linux", "laptop bag", "laptop stand", "laptop sleeve"],  // CRITICAL: Exclude ALL non-Apple laptop brands! Notice Google is included!
  "categories": ["ELECTRONICS", "LAPTOPS"],
  "brands": ["Apple"],  // ONLY Apple products
  "condition": [],
  "sortBy": "relevance",
  "intent": "User wants ONLY Apple laptops (MacBook), excluding ALL other manufacturers: Dell, HP, Lenovo, Asus, Acer, Microsoft, Samsung, LG, Sony, Google, Huawei, and all others",
  "confidence": 0.95
}

Example 4c - CATEGORY + BRAND SEARCH - Another Pattern:
Input: "phone samsung"
Output: {
  "searchTerms": ["phone", "samsung", "galaxy"],
  "requiredTerms": ["phone", "galaxy", "samsung"],
  "optionalTerms": ["android"],
  "excludeTerms": ["iphone", "apple", "ios", "headphone", "earphone"],  // Exclude Apple phones + confusing terms
  "categories": ["SMARTPHONES", "ELECTRONICS"],
  "brands": ["Samsung"],
  "condition": [],
  "sortBy": "relevance",
  "intent": "User wants Samsung phones only, not iPhone or other brands",
  "confidence": 0.95
}

Example 5 - SEMANTIC SEARCH (Broad query maps to multiple categories):
Input: "Rare collectibles and art"
Available categories: ELECTRONICS, CLOTHING, ACCESSORIES, JEWELRY, WATCHES, HOME_DECOR, SHOES, BAGS
Output: {
  "searchTerms": ["collectible", "rare", "limited", "exclusive", "vintage", "designer", "luxury", "special", "unique", "premium", "artistic", "handmade", "custom"],
  "requiredTerms": ["collectible", "rare", "limited", "exclusive", "vintage"],
  "optionalTerms": ["designer", "luxury", "special", "unique", "premium", "artistic", "handmade", "custom"],
  "categories": ["ACCESSORIES", "JEWELRY", "WATCHES", "HOME_DECOR", "BAGS"],  // ALL categories that could contain collectibles/art
  "sortBy": "relevance",
  "intent": "User wants unique, valuable, special items with artistic or collectible value",
  "confidence": 0.85
}

Example 6 - SEMANTIC SEARCH with broad intent:
Input: "eco-friendly sustainable products"
Available categories: CLOTHING, HOME_DECOR, ACCESSORIES, BAGS, ELECTRONICS, BEAUTY
Output: {
  "searchTerms": ["eco", "sustainable", "organic", "natural", "green", "environmentally", "recycled", "reusable", "biodegradable", "ethical"],
  "categories": ["CLOTHING", "HOME_DECOR", "ACCESSORIES", "BAGS", "BEAUTY"],  // Eco products could be in many categories
  "sortBy": "relevance",
  "intent": "User wants environmentally friendly and sustainable products",
  "confidence": 0.9
}

IMPORTANT: For broad semantic queries, map to MULTIPLE potentially relevant categories. Only leave categories empty if NO categories could possibly match the intent.

Input: "cheap"
Output: {
  "searchTerms": [],
  "intent": "User wants something cheap but not specific",
  "confidence": 0.3,
  "needsClarification": "What type of product are you looking for that's budget-friendly?"
}

Be intelligent and extract as much structured data as possible from the user's message!`

export class StructuredQueryGenerator {
  private anthropic: Anthropic | null = null
  private isAvailable: boolean = false
  private categoriesCache: string[] = []
  private categoriesCacheTime: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (apiKey && !apiKey.includes('demo')) {
      try {
        this.anthropic = new Anthropic({ apiKey })
        this.isAvailable = true
        logger.info('✅ Structured Query Generator initialized with Claude API')
      } catch (error) {
        logger.error('❌ Failed to initialize Structured Query Generator', { error })
        this.isAvailable = false
      }
    } else {
      logger.warn('⚠️ Claude API key not configured - using fallback query generation')
      this.isAvailable = false
    }
  }

  /**
   * Get available categories from database (with caching)
   */
  async getAvailableCategories(prisma: any): Promise<string[]> {
    const now = Date.now()

    // Return cached if still valid
    if (this.categoriesCache.length > 0 && (now - this.categoriesCacheTime) < this.CACHE_TTL) {
      return this.categoriesCache
    }

    try {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: { category: true }
      })

      this.categoriesCache = categories.map((c: any) => c.category)
      this.categoriesCacheTime = now

      logger.info(`📊 Fetched ${this.categoriesCache.length} categories from database`)
      return this.categoriesCache
    } catch (error) {
      logger.error('Error fetching categories', { error })
      return []
    }
  }

  /**
   * Generate structured query filters from natural language
   */
  async generateQuery(
    userMessage: string,
    prisma: any,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<StructuredQueryFilters> {
    if (!this.isAvailable || !this.anthropic) {
      logger.info('🔄 Using fallback query generation (no Claude API)')
      return await this.fallbackGeneration(userMessage)
    }

    try {
      // Get available categories dynamically
      const availableCategories = await this.getAvailableCategories(prisma)

      logger.info('🤖 Generating structured query with Claude', {
        message: userMessage,
        categoriesCount: availableCategories.length
      })

      // Build conversation context
      const messages: Anthropic.MessageParam[] = []

      if (conversationHistory) {
        messages.push(...conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        })))
      }

      // Inject available categories into the prompt
      messages.push({
        role: 'user',
        content: `Generate structured database filters for this query: "${userMessage}"

AVAILABLE_CATEGORIES in the database:
${availableCategories.join(', ')}

Return ONLY valid JSON, no other text.`
      })

      // Get AI configuration from database
      const config = await AIConfigService.getConfig('query_generation')

      const response = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: QUERY_GENERATION_SYSTEM_PROMPT,
        messages
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        logger.warn('⚠️ No JSON found in Claude response, using fallback')
        return await this.fallbackGeneration(userMessage)
      }

      const filters = JSON.parse(jsonMatch[0]) as StructuredQueryFilters

      logger.info('✅ Structured query generated successfully', {
        searchTerms: filters.searchTerms,
        categories: filters.categories,
        categoriesCount: filters.categories?.length || 0,
        confidence: filters.confidence,
        rawClaudeResponse: jsonMatch[0]
      })

      // No post-processing - trust Claude AI completely
      // All intelligence comes from the system prompt and available categories from database

      return filters
    } catch (error: any) {
      // Log the ACTUAL error details from Claude API
      logger.error('❌ Structured query generation failed, using fallback', {
        message: error?.message || 'Unknown error',
        status: error?.status || error?.statusCode,
        type: error?.type || error?.error?.type,
        details: error?.error?.message || error?.details || JSON.stringify(error).substring(0, 500),
        query: userMessage,
        apiKeyConfigured: !!this.anthropic
      })
      return this.fallbackGeneration(userMessage)
    }
  }

  /**
   * Minimal fallback when Claude is unavailable
   * NO HARDCODING - just extract basic words and let database handle the rest
   */
  private async fallbackGeneration(message: string): Promise<StructuredQueryFilters> {
    const normalized = message.toLowerCase().trim()

    logger.warn('⚠️ Using minimal fallback (Claude API not configured)', { query: message })

    // Remove common filler words only
    const fillerWords = ['find', 'looking', 'for', 'show', 'me', 'i', 'want', 'need', 'the', 'a', 'an', 'some', 'get', 'buy']
    const words = normalized.split(/\s+/).filter(w => w.length > 2 && !fillerWords.includes(w))

    // Extract price constraint if present
    let maxPrice: number | undefined
    const priceMatch = normalized.match(/under\s+\$?(\d+)|less\s+than\s+\$?(\d+)|max\s+\$?(\d+)/)
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    // Use words as search terms - database will match against name, description, brand, category
    const searchTerms = words.slice(0, 5) // Limit to 5 most important words

    logger.info('📝 Minimal fallback query', {
      searchTerms,
      maxPrice,
      wordCount: words.length
    })

    return {
      searchTerms,
      categories: undefined, // Let database search across ALL categories
      maxPrice,
      sortBy: 'relevance',
      limit: 20,
      intent: message,
      confidence: 0.3, // Low confidence - no AI understanding
      needsClarification: "Consider using Claude AI for better search results."
    }
  }

  /**
   * Check if Claude API is available
   */
  isClaudeAvailable(): boolean {
    return this.isAvailable
  }
}

// Singleton instance
export const structuredQueryGenerator = new StructuredQueryGenerator()