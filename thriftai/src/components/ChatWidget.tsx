'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Volume2, VolumeX } from 'lucide-react'
import ChatMessage, { ChatMessageData } from './ChatMessage'
import { ttsService } from '@/lib/services/ttsService'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      ttsService.cancel()
    }
  }, [])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Text-to-speech function using new TTS service
  const speakMessage = async (text: string) => {
    if (!audioEnabled || typeof window === 'undefined') return

    try {
      await ttsService.speak(text, {
        provider: 'google', // Try Google Cloud TTS first (more natural)
        rate: 0.88, // Slower for old man effect
        pitch: 0.85, // Lower pitch for masculine old man voice
        volume: 0.85
      })
    } catch (error) {
      console.error('TTS error:', error)
    }
  }

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = `Hey! I'm Gus 👋

Been running this shop for 40 years - seen everything from vintage Gucci to questionable fashion choices. Tell me what you need and I'll help you find the good stuff.

What're you hunting for today?`

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }])

      // Speak welcome message
      setTimeout(() => speakMessage(welcomeMessage), 500)
    }
  }, [])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/buyers/ai-shopping-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: ChatMessageData = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        products: data.products || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Speak the response
      speakMessage(data.message)
    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage: ChatMessageData = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          aria-label="Open AI Shopping Advisor"
        >
          <MessageCircle className="w-6 h-6" style={{ color: 'white' }} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '420px',
            maxWidth: 'calc(100vw - 3rem)',
            height: '600px',
            maxHeight: 'calc(100vh - 3rem)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Shopkeeper Avatar */}
              <div
                style={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  animation: 'float-emoji 3s ease-in-out infinite'
                }}
              >
                👴
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-family-primary)',
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}
                >
                  Gus - The Old Shopkeeper
                </h3>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-family-primary)',
                    margin: '0.125rem 0 0 0'
                  }}
                >
                  40 years experience + AI magic ✨
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Audio Toggle */}
              <button
                onClick={() => {
                  setAudioEnabled(!audioEnabled)
                  if (audioEnabled) {
                    ttsService.cancel()
                  }
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: audioEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${audioEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = audioEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = audioEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                }}
                aria-label={audioEnabled ? 'Disable audio' : 'Enable audio'}
                title={audioEnabled ? 'Voice ON' : 'Voice OFF'}
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                ) : (
                  <VolumeX className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
                aria-label="Close chat"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family-primary)'
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                placeholder="Ask me anything about products..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-family-primary)',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: inputValue.trim() && !isLoading
                    ? 'rgba(16, 185, 129, 0.9)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid ' + (inputValue.trim() && !isLoading
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)'),
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: inputValue.trim() && !isLoading ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 1)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputValue.trim() && !isLoading) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" style={{ color: 'white' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}