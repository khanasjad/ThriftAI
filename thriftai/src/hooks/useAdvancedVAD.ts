import { useState, useEffect, useCallback, useRef } from 'react'
import { MicVAD } from '@ricky0123/vad-web'

/**
 * Advanced Voice Activity Detection with @ricky0123/vad-web
 *
 * Features:
 * - ML-based voice detection (more accurate than Web Speech API)
 * - Real-time audio level monitoring for waveform
 * - Automatic silence detection
 * - Interrupt capability support
 * - Works in all browsers (no Web Speech API dependency)
 */

interface UseAdvancedVADProps {
  onSpeechStart?: () => void
  onTranscript: (text: string) => Promise<void> // Called with transcribed text
  onAudioLevel?: (level: number) => void // For waveform animation (0-100)
  onError?: (error: string) => void

  // VAD Configuration
  positiveSpeechThreshold?: number // 0-1, confidence threshold for speech detection
  negativeSpeechThreshold?: number // 0-1, confidence threshold for silence
  minSpeechFrames?: number // Minimum frames before considering speech started
  preSpeechPadFrames?: number // Frames to include before speech starts
  redemptionFrames?: number // Frames of silence before considering speech ended
  submitUserSpeechOnPause?: boolean // Submit on pause (true) or only on silence (false)
}

interface UseAdvancedVADReturn {
  isListening: boolean
  isProcessing: boolean
  isSupported: boolean
  isSpeaking: boolean // Whether VAD detected voice activity
  audioLevel: number // Current audio level 0-100 for waveform
  transcript: string // Current speech being processed
  error: string | null

  startListening: () => Promise<void>
  stopListening: () => void
  toggleListening: () => void
  interrupt: () => void // Stop current playback and listening
}

export function useAdvancedVAD({
  onSpeechStart,
  onTranscript,
  onAudioLevel,
  onError,

  // Optimized defaults for conversational AI
  positiveSpeechThreshold = 0.5, // Lower = more sensitive to speech
  negativeSpeechThreshold = 0.35, // Higher = requires clearer silence
  minSpeechFrames = 3, // Fast detection
  preSpeechPadFrames = 1, // Include slight pre-speech audio
  redemptionFrames = 8, // ~1.5 seconds at 16kHz
  submitUserSpeechOnPause = true // Submit on natural pauses
}: UseAdvancedVADProps): UseAdvancedVADReturn {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSupported] = useState(true) // VAD works in all modern browsers
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const vadRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  /**
   * Initialize audio level monitoring for waveform animation
   */
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      // Create audio context and analyser
      audioContextRef.current = new AudioContext()
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser

      // Monitor audio levels in real-time
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return

        analyser.getByteFrequencyData(dataArray)

        // Calculate average level (0-255) and convert to 0-100
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        const level = Math.min(100, (average / 255) * 100)

        setAudioLevel(Math.round(level))
        onAudioLevel?.(Math.round(level))

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      console.error('Failed to initialize audio level monitoring:', err)
    }
  }, [onAudioLevel])

  /**
   * Stop audio level monitoring
   */
  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
  }, [])

  /**
   * Start listening with advanced VAD
   */
  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return

    try {
      console.log('🎤 Starting advanced VAD...')
      setError(null)
      setTranscript('')

      // Initialize VAD
      const vad = await MicVAD.new({
        // VAD Configuration
        positiveSpeechThreshold,
        negativeSpeechThreshold,
        minSpeechFrames,
        preSpeechPadFrames,
        redemptionFrames,
        submitUserSpeechOnPause,

        // Asset Configuration - CORRECT API for MicVAD
        // All files (models + WASM) served from public directory
        baseAssetPath: '/vad-models/',
        onnxWASMBasePath: '/vad-models/',

        // Use legacy model (more compatible)
        model: 'legacy' as const,

        // Callbacks
        onSpeechStart: () => {
          console.log('🗣️ Speech detected')
          setIsSpeaking(true)
          onSpeechStart?.()
        },

        onSpeechEnd: async (audio: Float32Array) => {
          console.log('🔇 Speech ended, processing...')
          setIsSpeaking(false)
          setIsProcessing(true)
          setTranscript('Transcribing speech...')

          try {
            // Convert Float32Array to WAV Blob for transcription
            const audioBlob = await convertFloat32ToBlob(audio)
            console.log('📤 Sending audio for transcription...', {
              size: audioBlob.size,
              type: audioBlob.type,
              duration: (audio.length / 16000).toFixed(2) + 's'
            })

            // Send audio to STT API (Whisper)
            const formData = new FormData()
            formData.append('audio', audioBlob, 'speech.wav')
            formData.append('provider', 'whisper')

            const response = await fetch('/api/stt', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              throw new Error(`STT API failed: ${response.status}`)
            }

            const result = await response.json()
            const transcriptText = result.transcript || ''

            console.log('✅ Transcription:', transcriptText)

            if (transcriptText.trim()) {
              setTranscript(transcriptText)
              // Call onTranscript with the transcribed text
              await onTranscript(transcriptText)
              setTranscript('')
            } else {
              console.warn('⚠️ Empty transcription, ignoring')
              setTranscript('')
            }
          } catch (err: any) {
            console.error('❌ Speech processing error:', err)
            const errorMsg = err.message || 'Failed to process speech'
            setError(errorMsg)
            onError?.(errorMsg)
          } finally {
            setIsProcessing(false)
          }
        },

        onVADMisfire: () => {
          console.log('⚠️ VAD misfire (false positive)')
          setIsSpeaking(false)
        },

        // Audio settings
        stream: undefined // Will use default microphone
      })

      vadRef.current = vad

      // Start audio level monitoring
      if (vad && (vad as any).stream) {
        startAudioLevelMonitoring((vad as any).stream)
      }

      // Start VAD
      await vad.start()
      setIsListening(true)
      console.log('✅ Advanced VAD started successfully')

    } catch (err: any) {
      console.error('❌ Failed to start VAD:', err)

      let errorMsg = 'Voice recognition is temporarily unavailable.'

      // More specific error messages
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        errorMsg = 'Microphone access denied. Please enable microphone permissions.'
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a microphone.'
      } else if (err.message?.includes('model') || err.message?.includes('.onnx') || err.message?.includes('wasm')) {
        // Model loading errors - fail gracefully, voice chat will be disabled
        console.warn('⚠️ VAD model loading failed, voice features disabled')
        errorMsg = 'Voice chat is currently unavailable. Please use text chat.'
      } else if (err.message) {
        errorMsg = err.message
      }

      setError(errorMsg)
      onError?.(errorMsg)
      setIsListening(false)
    }
  }, [
    isListening,
    isProcessing,
    positiveSpeechThreshold,
    negativeSpeechThreshold,
    minSpeechFrames,
    preSpeechPadFrames,
    redemptionFrames,
    submitUserSpeechOnPause,
    onSpeechStart,
    onTranscript,
    onError,
    startAudioLevelMonitoring
  ])

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (!isListening) return

    console.log('🛑 Stopping advanced VAD...')

    if (vadRef.current) {
      vadRef.current.destroy()
      vadRef.current = null
    }

    stopAudioLevelMonitoring()
    setIsListening(false)
    setIsSpeaking(false)
    setTranscript('')
    setAudioLevel(0)

    console.log('✅ Advanced VAD stopped')
  }, [isListening, stopAudioLevelMonitoring])

  /**
   * Toggle listening on/off
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  /**
   * Interrupt - Stop everything immediately (for barge-in)
   */
  const interrupt = useCallback(() => {
    console.log('⛔ Interrupt triggered - stopping all activity')

    // Stop VAD
    stopListening()

    // Stop any ongoing processing
    setIsProcessing(false)
    setTranscript('')

    // TODO: Will also stop TTS playback when integrated with ttsService
  }, [stopListening])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        vadRef.current.destroy()
      }
      stopAudioLevelMonitoring()
    }
  }, [stopAudioLevelMonitoring])

  return {
    isListening,
    isProcessing,
    isSupported,
    isSpeaking,
    audioLevel,
    transcript,
    error,

    startListening,
    stopListening,
    toggleListening,
    interrupt
  }
}

/**
 * Convert Float32Array audio to WAV Blob for transcription
 */
async function convertFloat32ToBlob(float32Audio: Float32Array): Promise<Blob> {
  const sampleRate = 16000 // VAD outputs 16kHz audio
  const wavBuffer = float32ToWav(float32Audio, sampleRate)
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

/**
 * Convert Float32Array to WAV format
 */
function float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // Mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // Byte rate
  view.setUint16(32, 2, true) // Block align
  view.setUint16(34, 16, true) // Bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // Convert float32 samples to int16
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }

  return buffer
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
