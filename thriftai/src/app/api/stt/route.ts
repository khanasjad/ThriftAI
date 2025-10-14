import { NextRequest, NextResponse } from 'next/server'

/**
 * Speech-to-Text API Endpoint
 *
 * Supports multiple providers:
 * 1. OpenAI Whisper API (primary) - Excellent accuracy, 25MB file limit
 * 2. Web Speech API fallback (client-side)
 *
 * Environment Variables:
 * - OPENAI_API_KEY: OpenAI API key for Whisper
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const provider = formData.get('provider') as string || 'whisper'

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    console.log('🎤 STT Request:', {
      provider,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type
    })

    // Limit file size to 25MB (Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large (max 25MB)' },
        { status: 400 }
      )
    }

    // Route to appropriate provider
    if (provider === 'whisper') {
      return await handleWhisperSTT(audioFile)
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ STT API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * OpenAI Whisper Speech-to-Text
 * Pricing: $0.006 per minute (extremely affordable)
 * Accuracy: Industry-leading (better than Google Speech API)
 */
async function handleWhisperSTT(audioFile: File): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY not configured for Whisper STT')
    return NextResponse.json(
      { error: 'Whisper STT not configured', fallback: 'Use Web Speech API on client' },
      { status: 503 }
    )
  }

  try {
    console.log('🎤 Using OpenAI Whisper STT...')

    // Prepare form data for Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'en') // English
    whisperFormData.append('response_format', 'json')

    // Call Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Whisper API error:', error)
      return NextResponse.json(
        { error: 'Whisper STT failed', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    const transcript = result.text || ''

    console.log('✅ Whisper transcription:', transcript)

    return NextResponse.json({
      transcript,
      provider: 'whisper',
      confidence: 1.0 // Whisper doesn't provide confidence, assume high
    })

  } catch (error) {
    console.error('❌ Whisper STT error:', error)
    return NextResponse.json(
      { error: 'Whisper STT failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
