import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/services/aiService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, preferences = {} } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await AIService.chatGPTSearch(query, preferences)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Chat search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}