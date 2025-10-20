/**
 * Text-to-Speech Service
 * Provides natural-sounding voice synthesis using multiple providers
 *
 * Priority:
 * 1. ElevenLabs (via API endpoint) - 10K chars/month FREE - Ultra-realistic American voice
 * 2. Google Cloud TTS (via API endpoint) - 1M chars/month FREE - Natural but robotic
 * 3. Web Speech API (fallback) - Unlimited but mechanical
 */

export type TTSProvider = 'google' | 'elevenlabs' | 'webspeech'

export interface TTSOptions {
  provider?: TTSProvider
  rate?: number // 0.1 to 10.0 (default: 1.0)
  pitch?: number // 0.0 to 2.0 (default: 1.0)
  volume?: number // 0.0 to 1.0 (default: 1.0)
  voice?: string // Voice ID or name
}

export class TTSService {
  private audioCache: Map<string, HTMLAudioElement> = new Map()
  private isSpeaking: boolean = false
  private currentAudio: HTMLAudioElement | null = null

  /**
   * Speak text using the best available provider
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    // Cancel any ongoing speech
    this.cancel()

    const {
      provider = 'webspeech', // Default to free Web Speech API (no API key needed)
      rate = 1.0, // Natural conversational speed
      pitch = 1.0, // Natural American pitch
      volume = 0.85
    } = options

    try {
      // Try primary provider (Google Cloud TTS or ElevenLabs)
      if (provider === 'google' || provider === 'elevenlabs') {
        const success = await this.speakWithAPI(text, provider, { rate, pitch, volume })
        if (success) return
      }

      // Fallback to Web Speech API
      console.log('🔊 Falling back to Web Speech API')
      await this.speakWithWebSpeech(text, { rate, pitch, volume })
    } catch (error) {
      console.error('❌ TTS error:', error)
      // Final fallback to Web Speech API
      await this.speakWithWebSpeech(text, { rate, pitch, volume })
    }
  }

  /**
   * Speak using server-side TTS API (Google Cloud or ElevenLabs)
   */
  private async speakWithAPI(
    text: string,
    provider: 'google' | 'elevenlabs',
    options: { rate: number; pitch: number; volume: number }
  ): Promise<boolean> {
    try {
      console.log(`🎤 Using ${provider.toUpperCase()} TTS API`)

      // Call our Next.js API endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          provider,
          rate: options.rate,
          pitch: options.pitch,
        }),
      })

      if (!response.ok) {
        // Service unavailable (503) means API keys not configured - this is expected
        if (response.status === 503) {
          console.log(`ℹ️  ${provider.toUpperCase()} TTS not configured, using browser voice`)
          return false
        }
        // Other errors
        console.warn(`⚠️  TTS API returned ${response.status}, falling back to browser voice`)
        return false
      }

      // Get audio blob
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Play audio
      const audio = new Audio(audioUrl)
      audio.volume = options.volume
      this.currentAudio = audio
      this.isSpeaking = true

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          this.isSpeaking = false
          this.currentAudio = null
          resolve(true)
        }

        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error)
          URL.revokeObjectURL(audioUrl)
          this.isSpeaking = false
          this.currentAudio = null
          resolve(false)
        }

        audio.play().catch((error) => {
          console.error('❌ Audio play error:', error)
          URL.revokeObjectURL(audioUrl)
          this.isSpeaking = false
          this.currentAudio = null
          resolve(false)
        })
      })
    } catch (error) {
      console.error(`❌ ${provider.toUpperCase()} TTS error:`, error)
      return false
    }
  }

  /**
   * Speak using browser's Web Speech API (fallback)
   * ENHANCED: Automatically selects best American male voice
   */
  private async speakWithWebSpeech(
    text: string,
    options: { rate: number; pitch: number; volume: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Web Speech API not available'))
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate
      utterance.pitch = options.pitch
      utterance.volume = options.volume

      // Get all available voices
      const voices = window.speechSynthesis.getVoices()

      console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`))

      // PRIORITY 1: Best American English MALE voices (in order of preference)
      const bestAmericanMaleVoices = [
        // Explicitly MALE voices only
        'Google US English Male',

        // Microsoft MALE voices
        'Microsoft David - English (United States)',
        'Microsoft Mark - English (United States)',
        'Microsoft Guy - English (United States)',

        // Apple MALE voices (macOS/iOS)
        'Alex',  // Male, sounds like older American man
        'Fred',  // Male, deep voice
        'Daniel (Enhanced)',  // Male British but can work
        'Daniel',  // Male

        // Edge MALE voices
        'Microsoft Guy Online (Natural) - English (United States)',
        'Microsoft Eric Online (Natural) - English (United States)',

        // Generic but filter for male later
        'Chrome OS US English 5'
      ]

      // Try to find best MALE voice by exact name match
      let selectedVoice = null
      for (const voiceName of bestAmericanMaleVoices) {
        selectedVoice = voices.find(v => v.name === voiceName)
        if (selectedVoice) {
          console.log('✅ Found preferred MALE voice:', selectedVoice.name)
          break
        }
      }

      // PRIORITY 2: If no exact match, find any American voice with MALE keywords
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          (voice.lang === 'en-US' || voice.lang === 'en_US') &&
          (voice.name.toLowerCase().includes('male') ||
           voice.name.toLowerCase().includes('man') ||
           voice.name.toLowerCase().includes('david') ||
           voice.name.toLowerCase().includes('mark') ||
           voice.name.toLowerCase().includes('alex') ||
           voice.name.toLowerCase().includes('fred') ||
           voice.name.toLowerCase().includes('daniel') ||
           voice.name.toLowerCase().includes('guy') ||
           voice.name.toLowerCase().includes('eric') ||
           voice.name.toLowerCase().includes('james') ||
           voice.name.toLowerCase().includes('john') ||
           voice.name.toLowerCase().includes('robert'))
        )
      }

      // PRIORITY 3: Explicitly EXCLUDE female voices, get any US male voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          (voice.lang === 'en-US' || voice.lang === 'en_US') &&
          !voice.name.toLowerCase().includes('female') &&
          !voice.name.toLowerCase().includes('woman') &&
          !voice.name.toLowerCase().includes('samantha') &&
          !voice.name.toLowerCase().includes('victoria') &&
          !voice.name.toLowerCase().includes('karen') &&
          !voice.name.toLowerCase().includes('susan') &&
          !voice.name.toLowerCase().includes('zira') &&
          !voice.name.toLowerCase().includes('hazel') &&
          !voice.name.toLowerCase().includes('tessa')
        )
      }

      // PRIORITY 4: Any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
        )
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('🎤 Using voice:', selectedVoice.name, `(${selectedVoice.lang})`)
      } else {
        console.warn('⚠️ No English voice found, using system default')
      }

      utterance.onend = () => {
        this.isSpeaking = false
        resolve()
      }

      utterance.onerror = (error: any) => {
        this.isSpeaking = false

        // Only log if there's meaningful error information
        if (error?.error && error.error !== 'interrupted') {
          console.warn('⚠️ Web Speech error:', error.error)
        }

        // Resolve instead of reject for graceful degradation
        // This prevents the error from breaking the chat experience
        resolve()
      }

      this.isSpeaking = true
      window.speechSynthesis.speak(utterance)
    })
  }

  /**
   * Cancel any ongoing speech
   */
  cancel(): void {
    // Stop audio element if playing
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }

    // Stop Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    this.isSpeaking = false
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking
  }

  /**
   * Get available voices (for Web Speech API)
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.getVoices()
    }
    return []
  }
}

// Singleton instance
export const ttsService = new TTSService()
