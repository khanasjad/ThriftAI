/**
 * Claude Vision Image Analyzer
 * FREE - Uses existing ANTHROPIC_API_KEY
 *
 * Analyzes product images to extract:
 * - Visual defects count (scratches, dents, discoloration)
 * - Screen condition (0-100)
 * - Body/case condition (0-100)
 * - Camera quality assessment (0-100)
 * - Audio port condition (0-100)
 * - Overall wear level (1-10)
 * - Missing components detection
 * - Material quality assessment
 *
 * Coverage: +8 parameters for Product Quality category
 */

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

export interface ImageAnalysisResult {
  visualDefects: {
    count: number
    description: string
    severity: 'Minor' | 'Moderate' | 'Severe'
  }
  screenCondition: number // 0-100
  bodyCaseCondition: number // 0-100
  cameraQuality: number // 0-100
  audioQuality: number // 0-100
  wearLevel: number // 1-10
  missingComponents: string[]
  materialQuality: number // 0-100
  overallConditionScore: number // 0-100
  confidence: number // 0-100
}

export interface ClaudeVisionOptions {
  imageUrls: string[]
  productName: string
  category: string
}

/**
 * Analyze product images using Claude Vision API
 */
export async function analyzeProductImages(
  options: ClaudeVisionOptions
): Promise<{ success: boolean; data?: ImageAnalysisResult; cached: boolean; error?: string }> {
  const cacheKey = `claude-vision:${options.imageUrls[0]}`

  try {
    logger.info('🔍 Analyzing product images with Claude Vision', {
      component: 'ClaudeVision',
      metadata: {
        product: options.productName,
        imageCount: options.imageUrls.length
      }
    })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }

    const anthropic = new Anthropic({ apiKey })

    // Analyze first image (can be extended to analyze multiple)
    const imageUrl = options.imageUrls[0]

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl
            }
          },
          {
            type: "text",
            text: `You are a professional product inspector analyzing a ${options.category} product: "${options.productName}".

Analyze this product image comprehensively and provide a detailed assessment in JSON format with these exact fields:

{
  "visualDefects": {
    "count": <number of visible defects like scratches, dents, cracks, discoloration>,
    "description": "<detailed description of all visible defects>",
    "severity": "<Minor|Moderate|Severe>"
  },
  "screenCondition": <0-100, only for electronics with screens, 100 = perfect>,
  "bodyCaseCondition": <0-100, overall body/case condition, 100 = flawless>,
  "cameraQuality": <0-100, only for phones/cameras, based on lens visibility>,
  "audioQuality": <0-100, based on visible speaker/port condition>,
  "wearLevel": <1-10, overall wear and tear, 1 = brand new, 10 = heavily used>,
  "missingComponents": [<array of missing parts/accessories visible in image>],
  "materialQuality": <0-100, quality of materials visible>,
  "overallConditionScore": <0-100, overall product condition>,
  "confidence": <0-100, your confidence in this assessment>
}

Be thorough, objective, and conservative in your assessment. Return ONLY valid JSON.`
          }
        ]
      }]
    })

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response (Claude might add markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude Vision response')
    }

    const analysis: ImageAnalysisResult = JSON.parse(jsonMatch[0])

    logger.info('✅ Claude Vision analysis completed', {
      component: 'ClaudeVision',
      metadata: {
        overallScore: analysis.overallConditionScore,
        defectsCount: analysis.visualDefects.count,
        confidence: analysis.confidence
      }
    })

    return {
      success: true,
      data: analysis,
      cached: false
    }

  } catch (error) {
    logger.error('❌ Claude Vision analysis failed', {
      component: 'ClaudeVision',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        product: options.productName
      }
    })

    return {
      success: false,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get fallback analysis if Claude Vision is unavailable
 */
export function getFallbackAnalysis(condition: string): ImageAnalysisResult {
  const conditionMap: Record<string, number> = {
    'New': 100,
    'Like New': 95,
    'Excellent': 85,
    'Good': 75,
    'Fair': 60,
    'Poor': 40
  }

  const score = conditionMap[condition] || 70

  return {
    visualDefects: {
      count: condition === 'New' ? 0 : condition === 'Poor' ? 10 : 3,
      description: `Condition: ${condition}`,
      severity: score >= 80 ? 'Minor' : score >= 60 ? 'Moderate' : 'Severe'
    },
    screenCondition: score,
    bodyCaseCondition: score,
    cameraQuality: score,
    audioQuality: score,
    wearLevel: Math.round((100 - score) / 10),
    missingComponents: [],
    materialQuality: score,
    overallConditionScore: score,
    confidence: 50 // Low confidence for fallback
  }
}
