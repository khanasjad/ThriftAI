import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export interface CategoryMapping {
  originalQuery: string
  mappedCategories: string[]
  searchTerms: string[]
  explanation: string
}

/**
 * Intelligent Category Mapper using Claude AI
 * Maps user queries to available database categories using semantic understanding
 */
export class IntelligentCategoryMapper {
  private anthropic: Anthropic | null = null
  private availableCategories: string[] = []

  constructor(availableCategories: string[]) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey })
    }
    this.availableCategories = availableCategories
  }

  /**
   * Map natural language query to database categories using AI
   */
  async mapQuery(query: string): Promise<CategoryMapping> {
    try {
      if (!this.anthropic) {
        logger.warn('No Claude API key - using basic mapping')
        return this.basicMapping(query)
      }

      logger.info('🤖 Using Claude AI to map query to categories', { query })

      const prompt = this.buildMappingPrompt(query)

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const mapping = this.parseAIResponse(responseText, query)

      logger.info('✅ AI category mapping complete', {
        query,
        mappedCategories: mapping.mappedCategories
      })

      return mapping

    } catch (error) {
      logger.error('Error in AI category mapping', { error })
      return this.basicMapping(query)
    }
  }

  /**
   * Build prompt for category mapping
   */
  private buildMappingPrompt(query: string): string {
    return `You are a product search expert. Map this user query to relevant product categories.

USER QUERY: "${query}"

AVAILABLE CATEGORIES:
${this.availableCategories.join(', ')}

YOUR TASK:
1. Understand what the user is looking for (consider synonyms, related items)
2. Map to the MOST RELEVANT categories from the available list
3. Extract key search terms that should match product names/descriptions
4. Provide a brief explanation of your mapping logic

EXAMPLES:
Query: "vintage designer bags"
- Categories: BACKPACKS, WOMENS_ACCESSORIES, MENS_ACCESSORIES
- Search terms: bag, handbag, purse, designer, vintage, leather
- Explanation: "Bags" maps to BACKPACKS and ACCESSORIES categories where bag-like items are stored

Query: "running shoes"
- Categories: MENS_SNEAKERS, WOMENS_BOOTS, SOCCER_CLEATS, HIKING_BOOTS
- Search terms: running, shoe, sneaker, athletic, sports
- Explanation: Running shoes are athletic footwear found in sneakers and sports shoe categories

Query: "laptop computer"
- Categories: LAPTOPS
- Search terms: laptop, computer, notebook, MacBook, ThinkPad
- Explanation: Direct match to LAPTOPS category

OUTPUT FORMAT (JSON):
{
  "categories": ["CATEGORY1", "CATEGORY2", ...],
  "searchTerms": ["term1", "term2", ...],
  "explanation": "Brief explanation of mapping logic"
}

Generate the mapping NOW:`
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string, originalQuery: string): CategoryMapping {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        originalQuery,
        mappedCategories: parsed.categories || [],
        searchTerms: parsed.searchTerms || [],
        explanation: parsed.explanation || ''
      }
    } catch (error) {
      logger.error('Error parsing AI mapping response', { error, response })
      return this.basicMapping(originalQuery)
    }
  }

  /**
   * Fallback: Basic keyword matching
   */
  private basicMapping(query: string): CategoryMapping {
    const lowerQuery = query.toLowerCase()
    const mappedCategories: string[] = []
    const searchTerms = query.split(' ').filter(t => t.length > 2)

    // Basic keyword to category mapping
    const keywordMap: Record<string, string[]> = {
      'bag': ['BACKPACKS', 'WOMENS_ACCESSORIES', 'MENS_ACCESSORIES'],
      'handbag': ['WOMENS_ACCESSORIES', 'BACKPACKS'],
      'purse': ['WOMENS_ACCESSORIES'],
      'backpack': ['BACKPACKS'],
      'laptop': ['LAPTOPS'],
      'computer': ['LAPTOPS', 'TABLETS'],
      'phone': ['SMARTPHONES'],
      'shirt': ['MENS_SHIRTS', 'MENS_TSHIRTS', 'WOMENS_TOPS'],
      'shoe': ['MENS_SNEAKERS', 'WOMENS_BOOTS', 'BASKETBALL_SHOES', 'HIKING_BOOTS', 'SOCCER_CLEATS'],
      'sneaker': ['MENS_SNEAKERS', 'BASKETBALL_SHOES'],
      'camera': ['CAMERAS'],
      'toy': ['CAT_TOYS', 'DOG_TOYS', 'EDUCATIONAL_TOYS', 'LEGO_SETS', 'STUFFED_ANIMALS'],
      'book': ['FICTION_BOOKS', 'NONFICTION_BOOKS', 'CHILDRENS_BOOKS'],
      'accessory': ['MENS_ACCESSORIES', 'WOMENS_ACCESSORIES'],
      'jewelry': ['WOMENS_ACCESSORIES'],
      'watch': ['SMARTWATCHES', 'MENS_ACCESSORIES', 'WOMENS_ACCESSORIES']
    }

    // Find matching categories
    for (const [keyword, categories] of Object.entries(keywordMap)) {
      if (lowerQuery.includes(keyword)) {
        mappedCategories.push(...categories)
      }
    }

    // Remove duplicates
    const uniqueCategories = [...new Set(mappedCategories)]

    return {
      originalQuery: query,
      mappedCategories: uniqueCategories,
      searchTerms,
      explanation: 'Basic keyword matching fallback'
    }
  }
}

// Helper function to get available categories from Prisma
export async function getAvailableCategories(prisma: any): Promise<string[]> {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true
    }
  })

  return categories.map((c: any) => c.category)
}
