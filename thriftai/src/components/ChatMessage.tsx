'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'
import ChatProductCard from './ChatProductCard'
import { ScoredProduct } from '@/lib/services/productScoringService'

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  products?: ScoredProduct[]
}

interface ChatMessageProps {
  message: ChatMessageData
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className="flex gap-3 mb-4"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(16, 185, 129, 0.2)',
          border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 185, 129, 0.3)'}`
        }}
      >
        {isUser ? (
          <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <Bot className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Message Bubble */}
        <div
          className="markdown-content"
          style={{
            background: isUser
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(16, 185, 129, 0.05)',
            border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.2)'}`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family-primary)',
            lineHeight: '1.6'
          }}
        >
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Style headings
                h1: ({ node, ...props }) => (
                  <h1 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }} {...props} />
                ),
                // Style paragraphs
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: '0.75rem', lineHeight: '1.6' }} {...props} />
                ),
                // Style lists
                ul: ({ node, ...props }) => (
                  <ul style={{ marginLeft: '1.25rem', marginBottom: '0.75rem', listStyleType: 'disc' }} {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol style={{ marginLeft: '1.25rem', marginBottom: '0.75rem', listStyleType: 'decimal' }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: '0.25rem', lineHeight: '1.5' }} {...props} />
                ),
                // Style links
                a: ({ node, ...props }) => (
                  <a
                    style={{
                      color: 'var(--accent-primary)',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                // Style code
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        fontFamily: 'var(--font-family-mono)'
                      }}
                      {...props}
                    />
                  ) : (
                    <code
                      style={{
                        display: 'block',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontFamily: 'var(--font-family-mono)',
                        overflowX: 'auto',
                        marginBottom: '0.75rem'
                      }}
                      {...props}
                    />
                  ),
                // Style blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: '3px solid var(--accent-primary)',
                      paddingLeft: '1rem',
                      marginLeft: '0',
                      marginBottom: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic'
                    }}
                    {...props}
                  />
                ),
                // Style strong/bold
                strong: ({ node, ...props }) => (
                  <strong style={{ fontWeight: '600', color: 'var(--text-primary)' }} {...props} />
                ),
                // Style emphasis/italic
                em: ({ node, ...props }) => (
                  <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }} {...props} />
                ),
                // Style horizontal rules
                hr: ({ node, ...props }) => (
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} {...props} />
                ),
                // Style tables
                table: ({ node, ...props }) => (
                  <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th
                    style={{
                      padding: '0.5rem',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                      textAlign: 'left',
                      fontWeight: '600'
                    }}
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    style={{
                      padding: '0.5rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    {...props}
                  />
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Product Recommendations */}
        {!isUser && message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map((product, index) => (
              <ChatProductCard
                key={`${product.source}-${product.id}-${index}`}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-family-primary)',
              marginTop: '0.375rem',
              paddingLeft: '0.25rem'
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  )
}