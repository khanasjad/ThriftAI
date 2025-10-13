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
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: isListening
            ? '1px solid #10b981'
            : '1px solid var(--border-secondary)',
          cursor: 'pointer',
          background: isListening
            ? 'rgba(16, 185, 129, 0.1)'
            : 'transparent',
          color: isListening ? '#10b981' : 'var(--text-secondary)',
          transition: 'all 0.2s',
          overflow: 'visible'
        }}
        onMouseEnter={(e) => {
          if (!isListening) {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.color = '#10b981';
          }
        }}
        onMouseLeave={(e) => {
          if (!isListening) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-secondary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
        title={isListening ? 'Stop listening' : 'Start voice search'}
        aria-label={isListening ? 'Stop listening' : 'Start voice search'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" strokeWidth={2.5} />
        ) : (
          <Mic className="w-4 h-4" strokeWidth={2.5} />
        )}

        {/* Listening pulse animation - adjusted for square */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.3)',
                  pointerEvents: 'none'
                }}
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
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
