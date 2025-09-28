import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, budget, preferences = {} } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Check if Claude AI is available
    if (!AIService.isClaudeAvailable()) {
      return NextResponse.json({
        error: 'Claude AI is not configured',
        message: 'Please add your ANTHROPIC_API_KEY to the environment variables',
        helpUrl: 'https://console.anthropic.com/',
        fallbackAvailable: true
      }, { status: 503 })
    }

    const result = await AIService.claudeSearch(query, budget, preferences)

    // Add API status to response
    const enhancedResult = {
      ...result,
      apiStatus: {
        claudeAvailable: AIService.isClaudeAvailable(),
        openaiAvailable: AIService.isOpenAIAvailable()
      }
    }

    return NextResponse.json(enhancedResult)

  } catch (error: any) {
    console.error('Claude search error:', error)

    // Provide specific error messages
    if (error?.status === 401) {
      return NextResponse.json({
        error: 'Invalid Claude API key',
        message: 'Please check your ANTHROPIC_API_KEY in the environment variables'
      }, { status: 401 })
    }

    if (error?.status === 429) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: 'Claude API rate limit reached. Please try again later.'
      }, { status: 429 })
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// Add a GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    claudeAvailable: AIService.isClaudeAvailable(),
    openaiAvailable: AIService.isOpenAIAvailable(),
    timestamp: new Date().toISOString()
  })
}