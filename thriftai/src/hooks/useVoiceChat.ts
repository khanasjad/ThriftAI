import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Real-time Voice Chat with Voice Activity Detection (VAD)
 * Detects when user stops speaking and automatically processes speech
 */

interface UseVoiceChatProps {
  onTranscript: (text: string) => Promise<void>
  onError?: (error: string) => void
  lang?: string
  silenceThreshold?: number  // ms of silence before considering speech complete
  autoStart?: boolean
}

interface UseVoiceChatReturn {
  isListening: boolean
  isProcessing: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  error: string | null
}

export function useVoiceChat({
  onTranscript,
  onError,
  lang = 'en-US',
  silenceThreshold = 2000,  // 2 seconds of silence
  autoStart = false
}: UseVoiceChatProps): UseVoiceChatReturn {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>('')
  const isSpeakingRef = useRef<boolean>(false)

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setIsSupported(true)

        const recognition = new SpeechRecognition()
        recognition.lang = lang
        recognition.continuous = true  // Continuous mode for VAD
        recognition.interimResults = true  // Get interim results for better UX
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          console.log('🎤 Voice chat started')
          setIsListening(true)
          setError(null)
          setTranscript('')
          lastTranscriptRef.current = ''
          isSpeakingRef.current = false
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTranscript += result[0].transcript
            }
          }

          const currentTranscript = finalTranscript || interimTranscript

          if (currentTranscript.trim()) {
            isSpeakingRef.current = true
            setTranscript(currentTranscript.trim())
            lastTranscriptRef.current = finalTranscript || lastTranscriptRef.current

            // Reset silence timer when user speaks
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }

            // Start silence detection timer
            silenceTimerRef.current = setTimeout(() => {
              if (lastTranscriptRef.current.trim() && isSpeakingRef.current) {
                console.log('🔇 Silence detected, processing speech:', lastTranscriptRef.current)
                processTranscript(lastTranscriptRef.current.trim())
              }
            }, silenceThreshold)
          }
        }

        recognition.onerror = (event: any) => {
          // "no-speech" is normal - just means silence, not an error
          if (event.error === 'no-speech') {
            console.log('🎤 No speech detected (silence)')
            return // Don't treat as error
          }

          // "aborted" is normal when user stops manually
          if (event.error === 'aborted') {
            console.log('🎤 Voice recognition stopped')
            return
          }

          // Real errors
          console.error('❌ Voice recognition error:', event.error)

          const errorMessage = event.error === 'audio-capture'
            ? 'Microphone not available. Please check permissions.'
            : event.error === 'not-allowed'
            ? 'Microphone access denied. Please enable microphone permissions.'
            : event.error === 'network'
            ? 'Network error. Check your internet connection.'
            : `Speech recognition error: ${event.error}`

          setError(errorMessage)
          onError?.(errorMessage)
        }

        recognition.onend = () => {
          console.log('🎤 Voice chat ended')
          setIsListening(false)

          // Clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        }

        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
        setError('Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.')
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [lang, silenceThreshold, onError])

  const processTranscript = async (text: string) => {
    if (!text.trim() || isProcessing) return

    console.log('💬 Processing transcript:', text)
    setIsProcessing(true)
    isSpeakingRef.current = false
    lastTranscriptRef.current = ''
    setTranscript('')

    try {
      await onTranscript(text)
    } catch (err) {
      console.error('Error processing transcript:', err)
      setError('Failed to process speech. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isProcessing) {
      try {
        recognitionRef.current.start()
      } catch (err: any) {
        // Handle "already started" error
        if (err.message && !err.message.includes('already started')) {
          const errorMessage = 'Failed to start voice recognition. Please try again.'
          setError(errorMessage)
          onError?.(errorMessage)
        }
      }
    }
  }, [isListening, isProcessing, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()

      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      startListening()
    }
  }, [autoStart, isSupported])

  return {
    isListening,
    isProcessing,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    error
  }
}
