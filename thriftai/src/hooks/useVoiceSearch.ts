import { useState, useEffect, useCallback, useRef } from 'react'

interface UseVoiceSearchProps {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  lang?: string
  continuous?: boolean
}

interface UseVoiceSearchReturn {
  isListening: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  error: string | null
}

export function useVoiceSearch({
  onResult,
  onError,
  lang = 'en-US',
  continuous = false
}: UseVoiceSearchProps): UseVoiceSearchReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setIsSupported(true)

        const recognition = new SpeechRecognition()
        recognition.lang = lang
        recognition.continuous = continuous
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
          setTranscript('')
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
          setTranscript(currentTranscript)

          // Call onResult with final transcript
          if (finalTranscript) {
            onResult(finalTranscript.trim())
          }
        }

        recognition.onerror = (event: any) => {
          const errorMessage = event.error === 'no-speech'
            ? 'No speech detected. Please try again.'
            : event.error === 'audio-capture'
            ? 'Microphone not available. Please check permissions.'
            : event.error === 'not-allowed'
            ? 'Microphone access denied. Please enable microphone permissions.'
            : `Speech recognition error: ${event.error}`

          setError(errorMessage)
          setIsListening(false)
          onError?.(errorMessage)
        }

        recognition.onend = () => {
          setIsListening(false)
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
    }
  }, [lang, continuous, onResult, onError])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (err: any) {
        const errorMessage = 'Failed to start voice recognition. Please try again.'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    }
  }, [isListening, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error
  }
}
