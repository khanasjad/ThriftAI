/**
 * Evidence Extraction Agent
 *
 * Uses Claude to extract structured evidence from clothing reviews
 * based on the 27-factor taxonomy.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  FACTOR_TAXONOMY,
  Factor,
  FactorPillar
} from './factor-taxonomy'
import {
  EvidenceExtractionInput,
  EvidenceExtractionOutput,
  ExtractedEvidence,
  ConfidenceLevel
} from './evidence-types'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

/**
 * Build the system prompt with taxonomy
 */
function buildSystemPrompt(): string {
  // Build taxonomy reference
  const taxonomyReference = FACTOR_TAXONOMY.map(factor => {
    const signals = factor.signals
      .map(s => `    - ${s.signal} (sentiment: ${s.sentiment}): ${s.description}`)
      .join('\n')

    const examples = factor.examplePhrases
      .map(p => `    - "${p}"`)
      .join('\n')

    return `
### ${factor.key} (${factor.weight} points)
**Pillar**: ${factor.pillar}
**Description**: ${factor.description}

**Signals**:
${signals}

**Example Phrases**:
${examples}
`
  }).join('\n')

  return `You are an expert evidence extraction agent for clothing product reviews.

Your task is to analyze clothing reviews and extract structured evidence based on a 27-factor taxonomy.

## Instructions:

1. **Read the review carefully** and identify ALL relevant evidence for clothing quality, fit, comfort, style, and sustainability.

2. **Extract evidence** by matching review text to the factor taxonomy below.

3. **For each piece of evidence**, output:
   - factor: The factor key (e.g., "fit.true_to_size")
   - pillar: The pillar name (FIT, QUALITY, STYLE_VALUE, COMFORT, SUSTAINABILITY)
   - signal: The specific signal detected (e.g., "runs_small")
   - sentiment: A number from -1.0 to +1.0 indicating sentiment
   - confidence: A number from 0.0 to 1.0 indicating extraction confidence
   - quote: The exact text from the review that supports this evidence
   - explanation: A brief reason why you extracted this evidence

4. **Confidence guidelines**:
   - 0.9-1.0: Explicit, clear evidence with exact phrasing
   - 0.7-0.89: Strong implicit evidence, clearly inferred
   - 0.5-0.69: Moderate evidence, somewhat ambiguous
   - 0.3-0.49: Weak evidence, low confidence
   - Below 0.3: Don't extract

5. **Only extract evidence that is clearly present** in the review. Don't infer evidence that isn't there.

6. **Return valid JSON** matching this exact structure:
\`\`\`json
{
  "evidence": [
    {
      "factor": "fit.true_to_size",
      "pillar": "FIT",
      "signal": "runs_small",
      "sentiment": -0.7,
      "confidence": 0.9,
      "quote": "runs small, order one size up",
      "explanation": "Reviewer explicitly states it runs small"
    }
  ]
}
\`\`\`

---

## 27-Factor Taxonomy Reference

${taxonomyReference}

---

**Important**:
- Return ONLY valid JSON, no other text
- Extract ALL relevant evidence you can find
- Be conservative with confidence scores
- Quote exact text from the review
`
}

/**
 * Build the user prompt for a specific review
 */
function buildUserPrompt(input: EvidenceExtractionInput): string {
  let prompt = `Please extract evidence from this clothing review:\n\n---\n${input.reviewText}\n---\n`

  if (input.metadata) {
    prompt += `\n\n**Reviewer Metadata**:\n`
    if (input.metadata.sizePurchased) prompt += `- Size purchased: ${input.metadata.sizePurchased}\n`
    if (input.metadata.height) prompt += `- Height: ${input.metadata.height}\n`
    if (input.metadata.weight) prompt += `- Weight: ${input.metadata.weight}\n`
    if (input.metadata.bodyType) prompt += `- Body type: ${input.metadata.bodyType}\n`
  }

  prompt += `\n\nExtract all relevant evidence and return as JSON.`

  return prompt
}

/**
 * Parse Claude's response into structured evidence
 */
function parseEvidenceResponse(response: string): ExtractedEvidence[] {
  try {
    // Claude should return JSON, but sometimes wraps in markdown code blocks
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch ? jsonMatch[1] : response

    const parsed = JSON.parse(jsonText)

    if (!parsed.evidence || !Array.isArray(parsed.evidence)) {
      throw new Error('Invalid response format: missing evidence array')
    }

    return parsed.evidence as ExtractedEvidence[]
  } catch (error) {
    console.error('Failed to parse evidence response:', error)
    console.error('Raw response:', response)
    return []
  }
}

/**
 * Extract evidence from a single review using Claude
 */
export async function extractEvidence(
  input: EvidenceExtractionInput
): Promise<EvidenceExtractionOutput> {
  const startTime = Date.now()

  try {
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(input)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.0, // Deterministic for evidence extraction
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    // Extract text from response
    const responseText = response.content
      .filter(block => block.type === 'text')
      .map(block => 'text' in block ? block.text : '')
      .join('\n')

    const evidence = parseEvidenceResponse(responseText)

    // Calculate summary stats
    const factorsCovered = Array.from(new Set(evidence.map(e => e.factor)))
    const pillarsCovered = Array.from(new Set(evidence.map(e => e.pillar)))
    const averageConfidence = evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
      : 0

    const processingTime = Date.now() - startTime

    return {
      evidence,
      summary: {
        totalEvidence: evidence.length,
        factorsCovered,
        pillarsCovered,
        averageConfidence
      },
      processingTime
    }
  } catch (error) {
    console.error('Evidence extraction failed:', error)
    throw error
  }
}

/**
 * Batch extract evidence from multiple reviews
 */
export async function extractEvidenceBatch(
  inputs: EvidenceExtractionInput[],
  options?: {
    concurrency?: number
    onProgress?: (completed: number, total: number) => void
  }
): Promise<EvidenceExtractionOutput[]> {
  const concurrency = options?.concurrency || 5
  const results: EvidenceExtractionOutput[] = []

  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(input => extractEvidence(input))
    )
    results.push(...batchResults)

    if (options?.onProgress) {
      options.onProgress(Math.min(i + concurrency, inputs.length), inputs.length)
    }
  }

  return results
}

/**
 * Validate extracted evidence against taxonomy
 */
export function validateEvidence(evidence: ExtractedEvidence): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if factor exists
  const factor = FACTOR_TAXONOMY.find(f => f.key === evidence.factor)
  if (!factor) {
    errors.push(`Invalid factor: ${evidence.factor}`)
  } else {
    // Check if signal is valid for this factor
    const validSignals = factor.signals.map(s => s.signal)
    if (!validSignals.includes(evidence.signal)) {
      errors.push(`Invalid signal '${evidence.signal}' for factor '${evidence.factor}'`)
    }

    // Check if pillar matches
    if (evidence.pillar !== factor.pillar) {
      errors.push(`Pillar mismatch: expected ${factor.pillar}, got ${evidence.pillar}`)
    }
  }

  // Check sentiment range
  if (evidence.sentiment < -1.0 || evidence.sentiment > 1.0) {
    errors.push(`Sentiment out of range: ${evidence.sentiment} (must be -1.0 to 1.0)`)
  }

  // Check confidence range
  if (evidence.confidence < 0.0 || evidence.confidence > 1.0) {
    errors.push(`Confidence out of range: ${evidence.confidence} (must be 0.0 to 1.0)`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
