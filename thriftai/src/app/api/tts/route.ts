import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

/**
 * Text-to-Speech API Endpoint
 *
 * Supports multiple providers:
 * 1. Google Cloud TTS (1M chars/month FREE with WaveNet)
 * 2. ElevenLabs (10K chars/month FREE)
 *
 * Environment Variables:
 * - GOOGLE_CLOUD_TTS_API_KEY: Google Cloud TTS API key
 * - ELEVENLABS_API_KEY: ElevenLabs API key
 */

export async function POST(request: NextRequest) {
  try {
    const { text, provider = 'google', rate = 1.0, pitch = 1.0 } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Route to appropriate provider
    if (provider === 'google') {
      return await handleGoogleCloudTTS(text, rate, pitch)
    } else if (provider === 'elevenlabs') {
      return await handleElevenLabsTTS(text, rate, pitch)
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ TTS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Google Cloud Text-to-Speech
 * FREE TIER: 1 million WaveNet characters per month
 * Setup: https://cloud.google.com/text-to-speech/docs/before-you-begin
 */
async function handleGoogleCloudTTS(
  text: string,
  rate: number,
  pitch: number
): Promise<NextResponse> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY

  if (!apiKey) {
    console.warn('⚠️  GOOGLE_CLOUD_TTS_API_KEY not configured, TTS will fallback to Web Speech API')
    return NextResponse.json(
      { error: 'Google Cloud TTS not configured' },
      { status: 503 }
    )
  }

  try {
    // Use REST API instead of SDK to avoid authentication complexity
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-D', // American male voice (deep, mature, authoritative)
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: rate,
            pitch: pitch - 1.0, // Google uses -20.0 to 20.0 (convert from 0.0-2.0)
            volumeGainDb: 0.0,
            effectsProfileId: ['small-bluetooth-speaker-class-device']
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Google Cloud TTS error:', error)
      return NextResponse.json(
        { error: 'Google Cloud TTS failed', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Convert base64 audio to binary
    const audioBuffer = Buffer.from(data.audioContent, 'base64')

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ Google Cloud TTS error:', error)
    return NextResponse.json(
      { error: 'Google Cloud TTS failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * ElevenLabs Text-to-Speech
 * FREE TIER: 10,000 characters per month
 * Setup: https://elevenlabs.io/docs/api-reference/text-to-speech
 */
async function handleElevenLabsTTS(
  text: string,
  rate: number,
  pitch: number
): Promise<NextResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    console.warn('⚠️  ELEVENLABS_API_KEY not configured, TTS will fallback to Web Speech API')
    return NextResponse.json(
      { error: 'ElevenLabs not configured' },
      { status: 503 }
    )
  }

  try {
    // Use voice "Adam" - sounds like a wise older man
    const voiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ ElevenLabs error:', error)
      return NextResponse.json(
        { error: 'ElevenLabs TTS failed', details: error },
        { status: response.status }
      )
    }

    // Get audio buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ ElevenLabs error:', error)
    return NextResponse.json(
      { error: 'ElevenLabs TTS failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
