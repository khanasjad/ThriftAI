/**
 * Image Quality Analyzer
 * FREE - Using Sharp library (open source)
 *
 * Analyzes product image quality metrics:
 * - Sharpness/blur detection
 * - Brightness levels
 * - Contrast ratio
 * - Color richness
 * - Resolution adequacy
 * - Image quality score (0-100)
 *
 * Coverage: +3 parameters for User Experience category
 */

import sharp from 'sharp'
import { logger } from '@/lib/logger'

export interface ImageQualityData {
  imageUrl: string
  sharpness: number // 0-100 (higher is sharper)
  brightness: number // 0-100 (50 is optimal)
  contrast: number // 0-100 (higher is better)
  colorRichness: number // 0-100 (color diversity)
  resolution: {
    width: number
    height: number
    megapixels: number
    isAdequate: boolean // At least 800x800 for products
  }
  overallQuality: number // 0-100
  qualityLabel: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  issues: string[]
}

export interface ImageQualityOptions {
  imageUrl: string
  minResolution?: number // Default 800x800
}

/**
 * Analyze image quality
 */
export async function analyzeImageQuality(
  options: ImageQualityOptions
): Promise<{ success: boolean; data?: ImageQualityData; error?: string }> {

  try {
    logger.info('🖼️  Analyzing image quality', {
      component: 'ImageQualityAnalyzer',
      metadata: {
        imageUrl: options.imageUrl
      }
    })

    // Fetch image
    const response = await fetch(options.imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Load image with Sharp
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const stats = await image.stats()

    // Calculate quality metrics
    const width = metadata.width || 0
    const height = metadata.height || 0
    const megapixels = (width * height) / 1_000_000

    // Resolution check
    const minRes = options.minResolution || 800
    const isAdequate = width >= minRes && height >= minRes

    // Sharpness (using Laplacian variance)
    const sharpness = await calculateSharpness(image)

    // Brightness (0-100, where 50 is optimal)
    const brightness = calculateBrightness(stats)

    // Contrast (standard deviation of luminance)
    const contrast = calculateContrast(stats)

    // Color richness (diversity of colors)
    const colorRichness = calculateColorRichness(stats)

    // Identify issues
    const issues: string[] = []
    if (!isAdequate) issues.push('Low resolution')
    if (sharpness < 30) issues.push('Blurry image')
    if (brightness < 20 || brightness > 80) issues.push('Poor lighting')
    if (contrast < 40) issues.push('Low contrast')
    if (colorRichness < 30) issues.push('Limited color range')

    // Calculate overall quality score
    const overallQuality = calculateOverallQuality({
      sharpness,
      brightness,
      contrast,
      colorRichness,
      isAdequate
    })

    // Determine quality label
    let qualityLabel: ImageQualityData['qualityLabel']
    if (overallQuality >= 80) qualityLabel = 'Excellent'
    else if (overallQuality >= 60) qualityLabel = 'Good'
    else if (overallQuality >= 40) qualityLabel = 'Fair'
    else qualityLabel = 'Poor'

    const data: ImageQualityData = {
      imageUrl: options.imageUrl,
      sharpness: Math.round(sharpness),
      brightness: Math.round(brightness),
      contrast: Math.round(contrast),
      colorRichness: Math.round(colorRichness),
      resolution: {
        width,
        height,
        megapixels: Math.round(megapixels * 100) / 100,
        isAdequate
      },
      overallQuality: Math.round(overallQuality),
      qualityLabel,
      issues
    }

    logger.info('✅ Image quality analyzed', {
      component: 'ImageQualityAnalyzer',
      metadata: {
        quality: data.overallQuality,
        label: data.qualityLabel
      }
    })

    return {
      success: true,
      data
    }

  } catch (error) {
    logger.error('❌ Image quality analysis failed', {
      component: 'ImageQualityAnalyzer',
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Calculate image sharpness using Laplacian variance
 * Higher variance = sharper image
 */
async function calculateSharpness(image: sharp.Sharp): Promise<number> {
  try {
    // Convert to grayscale and get raw pixel data
    const { data, info } = await image
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Calculate Laplacian variance (edge detection)
    const width = info.width
    const height = info.height
    let variance = 0
    let count = 0

    // Simplified Laplacian kernel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x

        // Laplacian: center * 4 - (top + bottom + left + right)
        const center = data[idx]
        const top = data[idx - width]
        const bottom = data[idx + width]
        const left = data[idx - 1]
        const right = data[idx + 1]

        const laplacian = center * 4 - (top + bottom + left + right)
        variance += laplacian * laplacian
        count++
      }
    }

    // Normalize variance to 0-100 scale
    const meanVariance = variance / count
    const sharpness = Math.min(100, (meanVariance / 1000) * 100)

    return sharpness

  } catch (error) {
    logger.warn('⚠️  Sharpness calculation failed, using default')
    return 50 // Default moderate sharpness
  }
}

/**
 * Calculate brightness (0-100)
 */
function calculateBrightness(stats: sharp.Stats): number {
  // Use mean luminance across channels
  const channels = stats.channels

  if (!channels || channels.length === 0) {
    return 50 // Default
  }

  // Average the mean values of all channels
  const meanBrightness = channels.reduce((sum, ch) => sum + ch.mean, 0) / channels.length

  // Normalize to 0-100 (assuming 8-bit images, max 255)
  return (meanBrightness / 255) * 100
}

/**
 * Calculate contrast using standard deviation
 */
function calculateContrast(stats: sharp.Stats): number {
  const channels = stats.channels

  if (!channels || channels.length === 0) {
    return 50 // Default
  }

  // Average standard deviation across channels
  const meanStdDev = channels.reduce((sum, ch) => sum + ch.stdev, 0) / channels.length

  // Normalize to 0-100 (typical stddev ranges 0-60 for 8-bit images)
  const contrast = Math.min(100, (meanStdDev / 60) * 100)

  return contrast
}

/**
 * Calculate color richness (diversity)
 */
function calculateColorRichness(stats: sharp.Stats): number {
  const channels = stats.channels

  if (!channels || channels.length < 3) {
    return 30 // Low for grayscale
  }

  // Color richness based on standard deviation across RGB channels
  // Higher variation = more colorful image
  const stdDevs = channels.slice(0, 3).map(ch => ch.stdev)
  const avgStdDev = stdDevs.reduce((sum, s) => sum + s, 0) / 3

  // Also check if channels have different means (not grayscale)
  const means = channels.slice(0, 3).map(ch => ch.mean)
  const meanVariation = Math.max(...means) - Math.min(...means)

  // Combine standard deviation and mean variation
  const richness = Math.min(100, (avgStdDev / 40) * 50 + (meanVariation / 100) * 50)

  return richness
}

/**
 * Calculate overall quality score
 */
function calculateOverallQuality(metrics: {
  sharpness: number
  brightness: number
  contrast: number
  colorRichness: number
  isAdequate: boolean
}): number {
  let score = 0

  // Sharpness: 0-30 points
  score += (metrics.sharpness / 100) * 30

  // Brightness: 0-20 points (penalize too dark or too bright)
  // Optimal is around 50
  const brightnessPenalty = Math.abs(metrics.brightness - 50) / 50
  score += (1 - brightnessPenalty) * 20

  // Contrast: 0-25 points
  score += (metrics.contrast / 100) * 25

  // Color richness: 0-15 points
  score += (metrics.colorRichness / 100) * 15

  // Resolution: 0-10 points
  score += metrics.isAdequate ? 10 : 0

  return Math.max(0, Math.min(100, score))
}

/**
 * Analyze multiple images and get average quality
 */
export async function analyzeMultipleImages(
  imageUrls: string[]
): Promise<{ success: boolean; data?: ImageQualityData[]; averageQuality?: number; error?: string }> {

  const results: ImageQualityData[] = []
  let successCount = 0

  for (const url of imageUrls) {
    const result = await analyzeImageQuality({ imageUrl: url })
    if (result.success && result.data) {
      results.push(result.data)
      successCount++
    }
  }

  if (successCount === 0) {
    return {
      success: false,
      error: 'Failed to analyze any images'
    }
  }

  const averageQuality = results.reduce((sum, r) => sum + r.overallQuality, 0) / results.length

  return {
    success: true,
    data: results,
    averageQuality: Math.round(averageQuality)
  }
}

/**
 * Get default quality data (fallback)
 */
export function getDefaultImageQuality(imageUrl: string): ImageQualityData {
  return {
    imageUrl,
    sharpness: 60,
    brightness: 50,
    contrast: 60,
    colorRichness: 50,
    resolution: {
      width: 800,
      height: 800,
      megapixels: 0.64,
      isAdequate: true
    },
    overallQuality: 65,
    qualityLabel: 'Good',
    issues: []
  }
}

/**
 * Calculate user experience score based on image quality
 */
export function calculateImageUXScore(quality: ImageQualityData): number {
  let score = quality.overallQuality

  // Penalize for issues
  score -= quality.issues.length * 5

  // Bonus for excellent quality
  if (quality.qualityLabel === 'Excellent') {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}
