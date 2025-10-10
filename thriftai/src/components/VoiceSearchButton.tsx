'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void
  className?: string
}

export function VoiceSearchButton({ onTranscript, className = '' }: VoiceSearchButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error
  } = useVoiceSearch({
    onResult: (text) => {
      onTranscript(text)
      // Auto-stop after getting result
      stopListening()
    },
    onError: (err) => {
      console.error('Voice search error:', err)
    }
  })

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        className={`voice-search-button ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: isListening
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: isListening
            ? '0 4px 12px rgba(239, 68, 68, 0.3)'
            : '0 4px 12px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.2s',
          overflow: 'visible'
        }}
        title={isListening ? 'Stop listening' : 'Start voice search'}
        aria-label={isListening ? 'Stop listening' : 'Start voice search'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <Mic className="w-5 h-5 text-white" strokeWidth={2.5} />
        )}

        {/* Listening pulse animation */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.4)',
                  pointerEvents: 'none'
                }}
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.3)',
                  pointerEvents: 'none'
                }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Transcript preview */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              fontSize: '0.875rem',
              color: '#374151',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              zIndex: 1000
            }}
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#fee2e2',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              maxWidth: '200px',
              zIndex: 1000
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
