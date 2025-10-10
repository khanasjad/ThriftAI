/**
 * SSL Labs API Integration
 * FREE - 100 requests per hour
 *
 * Checks website security and SSL/TLS configuration:
 * - SSL grade (A+, A, B, C, D, F)
 * - Certificate validity
 * - Protocol security
 * - Platform trust score
 *
 * Coverage: +2 parameters for Security & Safety category
 */

import { logger } from '@/lib/logger'

export interface SSLLabsData {
  host: string
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | 'T' | 'M'
  hasWarnings: boolean
  certificateValid: boolean
  protocolsSupported: string[]
  vulnerabilities: string[]
  trustScore: number // 0-100
  lastChecked: Date
}

export interface SSLLabsOptions {
  host: string
  publish?: boolean // Whether to publish results (default: false)
  startNew?: boolean // Start new scan (default: false, use cached)
  fromCache?: boolean // Return cached results only (default: true)
}

/**
 * Check SSL/TLS configuration with SSL Labs API
 */
export async function checkSSLSecurity(
  options: SSLLabsOptions
): Promise<{ success: boolean; data?: SSLLabsData; cached: boolean; error?: string }> {

  const cacheKey = `ssl-labs:${options.host}`

  try {
    logger.info('🔒 Checking SSL security with SSL Labs', {
      component: 'SSLLabs',
      metadata: {
        host: options.host
      }
    })

    const params = new URLSearchParams({
      host: options.host,
      publish: options.publish ? 'on' : 'off',
      startNew: options.startNew ? 'on' : 'off',
      fromCache: options.fromCache !== false ? 'on' : 'off',
      all: 'done'
    })

    const url = `https://api.ssllabs.com/api/v3/analyze?${params}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ThriftAI-VeritasScore/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`SSL Labs API returned ${response.status}`)
    }

    const result = await response.json()

    // Check if scan is still in progress
    if (result.status === 'IN_PROGRESS' || result.status === 'DNS') {
      logger.info('⏳ SSL scan in progress, using fallback', {
        component: 'SSLLabs',
        metadata: {
          host: options.host,
          status: result.status
        }
      })

      return {
        success: false,
        cached: false,
        error: 'Scan in progress'
      }
    }

    if (result.status !== 'READY' && result.status !== 'ERROR') {
      throw new Error(`Unexpected status: ${result.status}`)
    }

    // Parse endpoints and get best grade
    const endpoints = result.endpoints || []
    let bestGrade: SSLLabsData['grade'] = 'F'
    let hasWarnings = false
    let certificateValid = false
    const protocolsSupported: string[] = []
    const vulnerabilities: string[] = []

    for (const endpoint of endpoints) {
      if (endpoint.grade) {
        // Keep best grade
        const gradeOrder = ['F', 'T', 'M', 'D', 'C', 'B', 'A', 'A+']
        const currentIndex = gradeOrder.indexOf(endpoint.grade)
        const bestIndex = gradeOrder.indexOf(bestGrade)
        if (currentIndex > bestIndex) {
          bestGrade = endpoint.grade as SSLLabsData['grade']
        }
      }

      if (endpoint.hasWarnings) {
        hasWarnings = true
      }

      if (endpoint.details) {
        // Check certificate validity
        const cert = endpoint.details.cert
        if (cert && cert.notAfter) {
          const expiryDate = new Date(cert.notAfter)
          certificateValid = expiryDate > new Date()
        }

        // Collect supported protocols
        const protocols = endpoint.details.protocols || []
        for (const proto of protocols) {
          const protoName = `${proto.name} ${proto.version}`
          if (!protocolsSupported.includes(protoName)) {
            protocolsSupported.push(protoName)
          }
        }

        // Check for vulnerabilities
        const details = endpoint.details
        if (details.heartbleed) vulnerabilities.push('Heartbleed')
        if (details.poodle) vulnerabilities.push('POODLE')
        if (details.freak) vulnerabilities.push('FREAK')
        if (details.logjam) vulnerabilities.push('Logjam')
        if (details.drownVulnerable) vulnerabilities.push('DROWN')
      }
    }

    // Calculate trust score based on grade
    const gradeScores: Record<string, number> = {
      'A+': 100,
      'A': 95,
      'B': 85,
      'C': 75,
      'D': 60,
      'F': 40,
      'T': 30, // Trust issues
      'M': 20  // Certificate mismatch
    }

    let trustScore = gradeScores[bestGrade] || 50

    // Penalize for warnings and vulnerabilities
    if (hasWarnings) trustScore -= 5
    trustScore -= vulnerabilities.length * 5

    // Penalize for invalid certificate
    if (!certificateValid) trustScore -= 20

    trustScore = Math.max(0, Math.min(100, trustScore))

    const data: SSLLabsData = {
      host: options.host,
      grade: bestGrade,
      hasWarnings,
      certificateValid,
      protocolsSupported,
      vulnerabilities,
      trustScore,
      lastChecked: new Date()
    }

    logger.info('✅ SSL security check completed', {
      component: 'SSLLabs',
      metadata: {
        host: options.host,
        grade: data.grade,
        trustScore: data.trustScore
      }
    })

    return {
      success: true,
      data,
      cached: result.status === 'READY'
    }

  } catch (error) {
    logger.error('❌ SSL Labs check failed', {
      component: 'SSLLabs',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        host: options.host
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
 * Get fallback SSL data (assume good security for known platforms)
 */
export function getFallbackSSLData(host: string): SSLLabsData {
  // Assume good security for reputable platforms
  const trustedPlatforms = ['thriftai.com', 'localhost']
  const isTrusted = trustedPlatforms.some(platform => host.includes(platform))

  return {
    host,
    grade: isTrusted ? 'A' : 'B',
    hasWarnings: false,
    certificateValid: isTrusted,
    protocolsSupported: ['TLS 1.2', 'TLS 1.3'],
    vulnerabilities: [],
    trustScore: isTrusted ? 95 : 80,
    lastChecked: new Date()
  }
}

/**
 * Convert SSL grade to numeric score
 */
export function sslGradeToScore(grade: SSLLabsData['grade']): number {
  const gradeScores: Record<string, number> = {
    'A+': 100,
    'A': 95,
    'B': 85,
    'C': 75,
    'D': 60,
    'F': 40,
    'T': 30,
    'M': 20
  }

  return gradeScores[grade] || 50
}
