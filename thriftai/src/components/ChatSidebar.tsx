'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Send, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronLeft, ChevronRight, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'
import ChatMessage, { ChatMessageData } from './ChatMessage'
import { getChatConfig } from '@/config/search.config'
import { ttsService } from '@/lib/services/ttsService'
import { useVoiceChat } from '@/hooks/useVoiceChat'

const CONVERSATION_STARTERS = [
  "I need a laptop under $700",
  "Looking for running shoes with good support",
  "Show me some vintage designer items",
  "What tech can I get for under $100?",
  "I want a camera for a beginner"
]

interface PageContext {
  searchQuery?: string
  products?: any[]
  filters?: any
  totalResults?: number
  isLoading?: boolean
}

interface ChatSidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void
  pageContext?: PageContext
  onProductsFromAI?: (products: any[], query: any) => void
}

export default function ChatSidebar({ onCollapseChange, pageContext, onProductsFromAI }: ChatSidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false)

  // Voice chat with VAD
  const voiceChat = useVoiceChat({
    onTranscript: async (text) => {
      console.log('🎤 Voice input:', text)
      await sendMessage(text)
    },
    onError: (error) => {
      console.error('Voice chat error:', error)
    },
    silenceThreshold: 1500  // 1.5 seconds of silence
  })

  // Text-to-speech function using new TTS service
  const speakMessage = async (text: string) => {
    if (!audioEnabled || typeof window === 'undefined') return

    try {
      await ttsService.speak(text, {
        provider: 'google', // Try Google Cloud TTS first (more natural)
        rate: 1.0, // Normal conversational speed - natural and human
        pitch: 1.0, // Natural American pitch - warm and friendly
        volume: 0.85
      })
    } catch (error) {
      console.error('TTS error:', error)
    }
  }

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      ttsService.cancel()
    }
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
  const [userInput, setUserInput] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Auto-analysis configuration (using centralized search config)
  const chatConfig = getChatConfig()
  const AUTO_ANALYSIS_CONFIG = {
    DELAY_MS: chatConfig.autoAnalysisDelayMs,
    SESSION_STORAGE_KEY: 'lastAnalyzedQuery',
    API_ENDPOINT: '/api/chat',
    PROMPT_TEMPLATE: (count: number, query: string) => {
      if (count === 0) {
        return `The search for "${query}" returned no results. Engage in a helpful conversation: explain we don't have this item, suggest related products we DO have, and ask what they're really looking for.`
      }
      return `Analyze and compare these ${count} products for "${query}". Highlight key differences, best value, and top recommendations.`
    }
  }

  // Auto-analyze products when they load - Fixed state timing issue
  useEffect(() => {
    try {
      const products = pageContext?.products || []
      const searchQuery = pageContext?.searchQuery || ''
      const lastAnalyzedQuery = sessionStorage.getItem(AUTO_ANALYSIS_CONFIG.SESSION_STORAGE_KEY)

      // Check if this is a NEW query that hasn't been analyzed yet
      // ALWAYS analyze - even with 0 results (AI should have a conversation)
      // But DON'T analyze while results are still loading
      const isLoadingResults = pageContext?.isLoading === true
      const shouldAnalyze = searchQuery &&
                           searchQuery !== lastAnalyzedQuery &&
                           !isLoadingResults

      console.log('🔍 AUTO-ANALYSIS CHECK:', {
        productsCount: products.length,
        searchQuery,
        lastAnalyzedQuery,
        isLoadingResults,
        shouldAnalyze,
        isDifferent: searchQuery !== lastAnalyzedQuery,
        pageContext: !!pageContext,
        timestamp: new Date().toISOString()
      })

      // Auto-analyze when it's a new query (even with 0 results)
      if (shouldAnalyze) {
        console.log('🤖 AUTO-ANALYZING', products.length, 'products for:', searchQuery, products.length === 0 ? '(ZERO RESULTS - AI CONVERSATION)' : '')

        // Mark as analyzed IMMEDIATELY to prevent duplicates
        sessionStorage.setItem(AUTO_ANALYSIS_CONFIG.SESSION_STORAGE_KEY, searchQuery)
        setIsAutoAnalyzing(true)

        // Trigger auto-analysis after configured delay
        setTimeout(async () => {
          const analysisContent = AUTO_ANALYSIS_CONFIG.PROMPT_TEMPLATE(products.length, searchQuery)
          console.log('📡 Triggering auto-analysis...', analysisContent)

          try {
            console.log('📤 Calling API endpoint:', AUTO_ANALYSIS_CONFIG.API_ENDPOINT)

            // Make a direct API call to chat endpoint
            const response = await fetch(AUTO_ANALYSIS_CONFIG.API_ENDPOINT, {
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

              // Speak the response
              speakMessage(aiResponseText)
            }
          } catch (error) {
            console.error('❌ Auto-analysis submission error:', error)
          } finally {
            // Reset analyzing state
            setIsAutoAnalyzing(false)
          }
        }, AUTO_ANALYSIS_CONFIG.DELAY_MS)
      } else if (searchQuery && searchQuery === lastAnalyzedQuery) {
        console.log('✅ Already analyzed this query - skipping')
      } else if (!searchQuery && lastAnalyzedQuery) {
        // Clear session when search is cleared (user started fresh)
        console.log('🧹 Clearing analyzed query session')
        sessionStorage.removeItem(AUTO_ANALYSIS_CONFIG.SESSION_STORAGE_KEY)
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
      setShowSuggestions(true)
      // Speak Gus's welcome message with a slight delay to ensure audio context is ready
      setTimeout(() => {
        speakMessage("Hey! I'm Gus. Been running this shop for 40 years - seen everything from vintage Gucci to questionable fashion choices. Tell me what you need and I'll help you find the good stuff.")
      }, 1000)
    } else {
      setShowSuggestions(true)
    }
  }, [])

  // Send message using direct API call (same approach as auto-analysis)
  const sendMessage = async (content?: string) => {
    if (!content) {
      setShowSuggestions(false)
      return
    }

    console.log('🗣️ USER SENT MESSAGE:', content)

    try {
      setShowSuggestions(false)
      setUserInput('') // Clear input field
      setIsSendingMessage(true) // Show loading indicator

      // Add user message to display
      const userMessage = { role: 'user', content }
      console.log('📝 Adding user message to chat, current messages:', autoAnalysisMessages.length)
      setAutoAnalysisMessages(prev => [...prev, userMessage])

      // Parallel: Update search results + Get AI response
      const [chatResponse] = await Promise.all([
        // 1. Get AI chat response
        fetch(AUTO_ANALYSIS_CONFIG.API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...autoAnalysisMessages, userMessage],
            pageContext: pageContext || {}
          })
        }),

        // 2. Update search results based on chat message
        (async () => {
          try {
            const searchResponse = await fetch('/api/buyers/enhanced-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: content })
            })

            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              if (searchData.products && onProductsFromAI) {
                console.log('📦 Updating search results with', searchData.products.length, 'products')
                onProductsFromAI(searchData.products, { query: content, source: 'chat' })
              }
            }
          } catch (error) {
            console.error('❌ Search update error:', error)
          }
        })()
      ])

      if (!chatResponse.ok) {
        throw new Error(`API returned ${chatResponse.status}`)
      }

      console.log('✅ Chat API call successful, streaming response...')

      // Stream the AI response
      const reader = chatResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let aiResponseText = ''
        setStreamingContent('')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          aiResponseText += chunk
          setStreamingContent(aiResponseText)
        }

        console.log('💬 AI response complete, length:', aiResponseText.length)

        // Add complete AI response to messages
        setAutoAnalysisMessages(prev => [
          ...prev,
          { role: 'assistant', content: aiResponseText }
        ])
        setStreamingContent('')

        // Speak the response
        speakMessage(aiResponseText)
      } else {
        console.error('❌ No reader available from response')
      }
    } catch (error) {
      console.error('❌ Send message error:', error)
    } finally {
      setIsSendingMessage(false) // Hide loading indicator
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Gus Avatar */}
            <div
              style={{
                fontSize: '3rem',
                lineHeight: 1,
                animation: 'float-emoji 3s ease-in-out infinite'
              }}
            >
              👴
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
                Gus - The Old Shopkeeper
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-family-primary)',
                  margin: '0.125rem 0 0 0'
                }}
              >
                {isTyping ? 'Thinking...' : '40 years experience + AI magic ✨'}
              </p>
            </div>
          </div>

          {/* Voice Chat Button with VAD */}
          <button
            onClick={() => {
              if (voiceChat.isListening) {
                voiceChat.stopListening()
              } else {
                voiceChat.startListening()
              }
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: voiceChat.isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${voiceChat.isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              animation: voiceChat.isListening ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = voiceChat.isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = voiceChat.isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
            }}
            aria-label={voiceChat.isListening ? 'Stop voice chat' : 'Start voice chat'}
            title={voiceChat.isListening ? '🎤 Listening... (Click to stop)' : '🎤 Click to talk to Gus'}
          >
            {voiceChat.isListening ? (
              <Mic className="w-4 h-4" style={{ color: '#ef4444' }} />
            ) : (
              <MicOff className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            )}
          </button>

          {/* Audio Toggle Button */}
          <button
            onClick={async () => {
              if (audioEnabled) {
                // Test audio when disabling
                await speakMessage("Audio is now off")
                setTimeout(() => {
                  setAudioEnabled(false)
                  ttsService.cancel()
                }, 100)
              } else {
                // Test audio when enabling
                setAudioEnabled(true)
                setTimeout(async () => {
                  await speakMessage("Audio is now on. Hey, I'm Gus!")
                }, 100)
              }
            }}
            style={{
              width: '36px',
              height: '36px',
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
            title={audioEnabled ? 'Voice responses ON' : 'Voice responses OFF'}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <VolumeX className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>
        </div>
      </div>

      {/* Voice Chat Indicator */}
      {voiceChat.isListening && (
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse 1s ease-in-out infinite'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#ef4444',
              marginBottom: '4px'
            }}>
              🎤 Listening...
            </div>
            {voiceChat.transcript && (
              <div style={{
                fontSize: '12px',
                color: theme === 'light' ? '#666' : 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                "{voiceChat.transcript}"
              </div>
            )}
            {!voiceChat.transcript && (
              <div style={{
                fontSize: '11px',
                color: theme === 'light' ? '#999' : 'var(--text-tertiary)'
              }}>
                Speak now... (stops automatically after 1.5s of silence)
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* Loading indicator while sending message */}
        {isSendingMessage && !streamingContent && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--chat-bg)',
            borderRadius: '12px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              animation: 'pulse 1.5s ease-in-out infinite 0.2s'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              animation: 'pulse 1.5s ease-in-out infinite 0.4s'
            }} />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginLeft: '0.5rem'
            }}>
              Analyzing and updating results...
            </span>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>
          </div>
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

        {/* Gus Welcome Message */}
        {showSuggestions && chatMessages.length === 0 && autoAnalysisMessages.length === 0 && !isLoading && (
          <div
            style={{
              background: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
              border: theme === 'light' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: theme === 'light' ? '#111827' : 'var(--text-primary)',
              fontFamily: 'var(--font-family-primary)',
              lineHeight: '1.6'
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Hey! I'm Gus 👋</strong>
            </p>
            <p style={{ margin: '0.75rem 0 0 0' }}>
              Been running this shop for 40 years - seen everything from vintage Gucci to questionable fashion choices.
              Tell me what you need and I'll help you find the good stuff.
            </p>
            <p style={{ margin: '0.75rem 0 0 0', color: 'var(--text-secondary)' }}>
              What're you hunting for today?
            </p>
          </div>
        )}

        {/* Conversation Starters */}
        {showSuggestions && chatMessages.length === 0 && !isLoading && (
          <div style={{ marginTop: '0.5rem' }}>
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
          onSubmit={async (e) => {
            e.preventDefault()
            if (userInput.trim()) {
              await sendMessage(userInput.trim())
            }
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
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (userInput.trim()) {
                  sendMessage(userInput.trim())
                }
              }
            }}
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