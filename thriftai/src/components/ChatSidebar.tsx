'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Send, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import ChatMessage, { ChatMessageData } from './ChatMessage'

const CONVERSATION_STARTERS = [
  "Find me the best laptop under $700 for coding",
  "I need running shoes with good cushioning",
  "Show me vintage designer bags in excellent condition",
  "Budget-friendly gaming headphones under $100",
  "Professional camera for beginners"
]

interface PageContext {
  searchQuery?: string
  products?: any[]
  filters?: any
  totalResults?: number
}

interface ChatSidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void
  pageContext?: PageContext
  onProductsFromAI?: (products: any[], query: any) => void
}

export default function ChatSidebar({ onCollapseChange, pageContext, onProductsFromAI }: ChatSidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Detect theme changes
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null
      setTheme(currentTheme || 'dark')
    }

    updateTheme()

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed)
    }
  }, [isCollapsed, onCollapseChange])

  // Use Vercel AI SDK's useChat hook for streaming with product data
  const { messages: chatMessages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    api: '/api/chat',
    body: {
      pageContext: pageContext || {}
    },
    onFinish: (message, options) => {
      console.log('✅ Chat finished. Message:', message)
      console.log('📊 Data stream:', data)

      // Extract products from data stream when AI response completes
      if (data && data.length > 0) {
        const latestData = data[data.length - 1]
        if (latestData?.products && latestData.products.length > 0) {
          console.log('🎯 Received products from AI:', latestData.products)
          // Send products to parent component to update search grid
          if (onProductsFromAI) {
            onProductsFromAI(latestData.products, latestData.query)
          }
        }
      }
    }
  })

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('💬 Chat messages updated:', chatMessages)
  }, [chatMessages])

  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false)
  const [autoAnalysisMessages, setAutoAnalysisMessages] = useState<Array<{role: string, content: string}>>([])
  const [streamingContent, setStreamingContent] = useState('')

  // Auto-analyze products when they load - Fixed state timing issue
  useEffect(() => {
    try {
      const products = pageContext?.products || []
      const searchQuery = pageContext?.searchQuery || ''
      const lastAnalyzedQuery = sessionStorage.getItem('lastAnalyzedQuery')

      // Check if this is a NEW query that hasn't been analyzed yet
      const shouldAnalyze = products.length > 0 &&
                           searchQuery &&
                           searchQuery !== lastAnalyzedQuery

      console.log('🔍 AUTO-ANALYSIS CHECK:', {
        productsCount: products.length,
        searchQuery,
        lastAnalyzedQuery,
        shouldAnalyze
      })

      // Auto-analyze when it's a new query
      if (shouldAnalyze) {
        console.log('🤖 AUTO-ANALYZING', products.length, 'products for:', searchQuery)

        // Mark as analyzed IMMEDIATELY to prevent duplicates
        sessionStorage.setItem('lastAnalyzedQuery', searchQuery)
        setIsAutoAnalyzing(true)

        // Trigger auto-analysis after a short delay
        setTimeout(async () => {
          const analysisContent = `Analyze and compare these ${products.length} products for "${searchQuery}". Highlight key differences, best value, and top recommendations.`
          console.log('📡 Triggering auto-analysis...', analysisContent)

          try {
            console.log('📤 Calling /api/chat directly...')

            // Make a direct API call to /api/chat
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'user',
                    content: analysisContent
                  }
                ],
                pageContext: pageContext || {}
              })
            })

            if (!response.ok) {
              throw new Error(`API returned ${response.status}`)
            }

            console.log('✅ Auto-analysis API call successful, streaming response...')

            // Add user message for the auto-analysis
            setAutoAnalysisMessages([{
              role: 'user',
              content: analysisContent
            }])

            // Stream the AI response and update UI in real-time
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
              let aiResponseText = ''
              setStreamingContent('') // Reset streaming content

              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                aiResponseText += chunk

                // Update streaming content in real-time for typing effect
                setStreamingContent(aiResponseText)
              }

              console.log('✅ Auto-analysis completed, received', aiResponseText.length, 'characters')

              // Add complete AI response to messages
              setAutoAnalysisMessages([
                {
                  role: 'user',
                  content: analysisContent
                },
                {
                  role: 'assistant',
                  content: aiResponseText
                }
              ])
              setStreamingContent('') // Clear streaming state
            }
          } catch (error) {
            console.error('❌ Auto-analysis submission error:', error)
          } finally {
            // Reset analyzing state
            setIsAutoAnalyzing(false)
          }
        }, 1500)
      } else if (searchQuery && searchQuery === lastAnalyzedQuery) {
        console.log('✅ Already analyzed this query - skipping')
      }
    } catch (error) {
      console.error('❌ Auto-analysis error:', error)
      setIsAutoAnalyzing(false)
    }
  }, [pageContext?.products, pageContext?.searchQuery])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, typingText, autoAnalysisMessages, streamingContent])

  // Initialize with welcome message (only on first mount, independent of chatMessages)
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('chatInitialized')
    if (!hasInitialized) {
      sessionStorage.setItem('chatInitialized', 'true')
      setTimeout(() => {
        setShowSuggestions(true)
      }, 500)
    }
  }, [])

  // Simplified send message using useChat hook
  const sendMessage = async (content?: string) => {
    if (content) {
      // For conversation starters, set input and submit
      const event = new Event('submit', { bubbles: true, cancelable: true }) as any
      event.preventDefault = () => {}
      handleSubmit(event, { data: { message: content } })
    }
    setShowSuggestions(false)
  }

  const refineResponse = () => {
    sendMessage("Can you explain more details about these options?")
  }

  const tryDifferentSearch = () => {
    sendMessage("Show me different options")
  }

  return (
    <>
      {/* Collapse/Expand Button - Outside sidebar to prevent pointer-events issues */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'fixed',
          right: isCollapsed ? '0px' : '420px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '-2px 0 10px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s ease',
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
          e.currentTarget.style.boxShadow = '-2px 0 15px rgba(16, 185, 129, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          e.currentTarget.style.boxShadow = '-2px 0 10px rgba(16, 185, 129, 0.3)'
        }}
        aria-label={isCollapsed ? 'Expand AI Shopping Advisor' : 'Collapse AI Shopping Advisor'}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-5 h-5" style={{ color: 'white' }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: 'white' }} />
        )}
      </button>

      {/* Sidebar Content */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: isCollapsed ? '0' : '420px',
          background: theme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.98)',
          borderLeft: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease, background 0.3s ease',
          zIndex: 9998,
          overflow: 'hidden',
          boxShadow: isCollapsed ? 'none' : (theme === 'light' ? '-4px 0 20px rgba(0, 0, 0, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.5)'),
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >

      {/* Header */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          background: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.1)',
          borderBottom: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(16, 185, 129, 0.2)',
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
                color: theme === 'light' ? '#111827' : 'var(--text-primary)',
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
        {chatMessages.map((message) => (
          <ChatMessage key={message.id} message={{
            id: message.id,
            role: message.role as 'user' | 'assistant',
            content: message.content,
            timestamp: new Date()
          }} />
        ))}

        {/* Auto-Analysis Messages */}
        {autoAnalysisMessages.map((message, index) => (
          <ChatMessage key={`auto-${index}`} message={{
            id: `auto-${index}`,
            role: message.role as 'user' | 'assistant',
            content: message.content,
            timestamp: new Date()
          }} />
        ))}

        {/* Streaming Content (real-time typing effect) */}
        {streamingContent && (
          <ChatMessage message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            timestamp: new Date()
          }} />
        )}

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
                background: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                border: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: theme === 'light' ? '#111827' : 'var(--text-primary)',
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

        {/* Auto-Analysis Indicator */}
        {isAutoAnalyzing && (
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
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'white' }} />
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: '500'
              }}
            >
              ✨ Analyzing products for you...
            </div>
          </div>
        )}

        {/* Loading Dots */}
        {isLoading && !isTyping && !isAutoAnalyzing && (
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
                background: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                border: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                color: theme === 'light' ? '#6b7280' : 'var(--text-secondary)',
                fontFamily: 'var(--font-family-primary)'
              }}
            >
              Searching across marketplaces...
            </div>
          </div>
        )}

        {/* Conversation Starters */}
        {showSuggestions && chatMessages.length === 0 && !isLoading && (
          <div style={{ marginTop: '1rem' }}>
            <p
              style={{
                fontSize: '0.75rem',
                color: theme === 'light' ? '#6b7280' : 'var(--text-tertiary)',
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
                    background: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                    border: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    color: theme === 'light' ? '#111827' : 'var(--text-secondary)',
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
                    e.currentTarget.style.background = theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'
                    e.currentTarget.style.color = theme === 'light' ? '#111827' : 'var(--text-secondary)'
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
        {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && !isLoading && !isTyping && (
          <div style={{ marginTop: '0.5rem' }} className="flex gap-2">
            <button
              onClick={refineResponse}
              style={{
                padding: '0.5rem 0.75rem',
                background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: theme === 'light' ? '#6b7280' : 'var(--text-secondary)',
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
                e.currentTarget.style.background = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = theme === 'light' ? '#6b7280' : 'var(--text-secondary)'
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Refine
            </button>

            <button
              onClick={tryDifferentSearch}
              style={{
                padding: '0.5rem 0.75rem',
                background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: theme === 'light' ? '#6b7280' : 'var(--text-secondary)',
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
                e.currentTarget.style.background = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = theme === 'light' ? '#6b7280' : 'var(--text-secondary)'
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
          background: theme === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
          borderTop: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0
        }}
      >
        <form
          data-chat-form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e)
            setShowSuggestions(false)
          }}
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: theme === 'light' ? '#111827' : 'var(--text-primary)',
              fontFamily: 'var(--font-family-primary)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <button
            type="submit"
            disabled={!input?.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: input?.trim() && !isLoading
                ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid ' + (input?.trim() && !isLoading
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(255, 255, 255, 0.1)'),
              cursor: input?.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: input?.trim() && !isLoading ? 1 : 0.5,
              boxShadow: input?.trim() && !isLoading ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (input?.trim() && !isLoading) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (input?.trim() && !isLoading) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            <Send className="w-4 h-4" style={{ color: 'white' }} />
          </button>
        </form>
      </div>
    </div>
    </>
  )
}