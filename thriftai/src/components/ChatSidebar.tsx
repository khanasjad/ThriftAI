'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import ChatMessage, { ChatMessageData } from './ChatMessage'

const CONVERSATION_STARTERS = [
  "Find me the best laptop under $700 for coding",
  "I need running shoes with good cushioning",
  "Show me vintage designer bags in excellent condition",
  "Budget-friendly gaming headphones under $100",
  "Professional camera for beginners"
]

export default function ChatSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingText])

  // Initialize with welcome message
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('chatInitialized')
    if (messages.length === 0 && !hasInitialized) {
      sessionStorage.setItem('chatInitialized', 'true')
      setTimeout(() => {
        typeMessage({
          id: 'welcome',
          role: 'assistant',
          content: `Hey there! 👋 I'm your AI Shopping Advisor powered by Claude.

I can help you find the perfect products through conversation. Tell me what you're looking for, and I'll search across ThriftAI, Amazon, and eBay to find you the best deals!

Try asking me something like:
• "I need a laptop for college under $600"
• "Find me quality running shoes"
• "What's the best value for wireless headphones?"

What are you shopping for today?`,
          timestamp: new Date()
        })
      }, 500)
    }
  }, [])

  // Typing animation effect
  const typeMessage = async (message: ChatMessageData) => {
    setIsTyping(true)
    setShowSuggestions(false)
    const words = message.content.split(' ')
    let current = ''

    for (let i = 0; i < words.length; i++) {
      current += (i > 0 ? ' ' : '') + words[i]
      setTypingText(current)
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20))
    }

    setIsTyping(false)
    setTypingText('')
    setMessages(prev => [...prev, message])
  }

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent || isLoading) return

    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch('/api/buyers/ai-shopping-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
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

      // Type the response with animation
      await typeMessage(assistantMessage)
    } catch (error) {
      console.error('Chat error:', error)

      await typeMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date()
      })
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

  const refineResponse = () => {
    sendMessage("Can you explain more details about these options?")
  }

  const tryDifferentSearch = () => {
    sendMessage("Show me different options")
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isCollapsed ? '0' : '420px',
        background: 'rgba(0, 0, 0, 0.98)',
        borderRight: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 999,
        overflow: 'hidden',
        boxShadow: isCollapsed ? 'none' : '4px 0 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          right: isCollapsed ? '-40px' : '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          border: 'none',
          borderRadius: isCollapsed ? '0 8px 8px 0' : '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '2px 0 10px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" style={{ color: 'white' }} />
        ) : (
          <ChevronLeft className="w-5 h-5" style={{ color: 'white' }} />
        )}
      </button>

      {/* Header */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          flexShrink: 0
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'white' }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-primary)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              AI Shopping Advisor
            </h2>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-family-primary)',
                margin: '0.125rem 0 0 0'
              }}
            >
              {isTyping ? 'Typing...' : 'Powered by Claude AI'}
            </p>
          </div>
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

        {/* Typing Animation */}
        {isTyping && typingText && (
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
              <Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'var(--accent-primary)' }} />
            </div>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-primary)',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flex: 1
              }}
            >
              {typingText}
              <span className="inline-block w-2 h-4 bg-accent-primary ml-1 animate-pulse">|</span>
            </div>
          </div>
        )}

        {/* Loading Dots */}
        {isLoading && !isTyping && (
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
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
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
              Searching across marketplaces...
            </div>
          </div>
        )}

        {/* Conversation Starters */}
        {showSuggestions && messages.length <= 1 && !isLoading && (
          <div style={{ marginTop: '1rem' }}>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-family-primary)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '500'
              }}
            >
              Quick Starts
            </p>
            <div className="space-y-2">
              {CONVERSATION_STARTERS.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(starter)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-family-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                    e.currentTarget.style.color = 'var(--accent-primary)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response Actions */}
        {messages.length > 1 && messages[messages.length - 1].role === 'assistant' && !isLoading && !isTyping && (
          <div style={{ marginTop: '0.5rem' }} className="flex gap-2">
            <button
              onClick={refineResponse}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.color = 'var(--accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Refine
            </button>

            <button
              onClick={tryDifferentSearch}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-family-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.color = 'var(--accent-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <Sparkles className="w-3 h-3" />
              Try Different
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder="Ask me anything..."
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
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: inputValue.trim() && !isLoading
                ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid ' + (inputValue.trim() && !isLoading
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(255, 255, 255, 0.1)'),
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
              boxShadow: inputValue.trim() && !isLoading ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            <Send className="w-4 h-4" style={{ color: 'white' }} />
          </button>
        </div>
      </div>
    </div>
  )
}