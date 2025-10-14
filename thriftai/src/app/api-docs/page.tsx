'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues and suppress React warnings
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null)

  // Suppress third-party library warnings in console
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('UNSAFE_componentWillReceiveProps') ||
         args[0].includes('ModelCollapse') ||
         args[0].includes('OperationContainer'))
      ) {
        // Suppress swagger-ui-react warnings
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('UNSAFE_componentWillReceiveProps')
      ) {
        // Suppress swagger-ui-react warnings
        return
      }
      originalWarn.apply(console, args)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#0a0a0a',
        borderBottom: '2px solid #2a2a2a',
        padding: '30px 40px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ThriftAI Platform API Documentation
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#888',
          marginBottom: '20px'
        }}>
          Complete API Reference - 40+ Endpoints | Veritas Score™ | AI Search | E-commerce
        </p>
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <a
            href="/prod/veritas"
            style={{
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📊 Live Demo
          </a>
          <a
            href="/test/veritas"
            style={{
              padding: '10px 20px',
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🧪 Test Interface
          </a>
          <a
            href="/api/docs/swagger"
            target="_blank"
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📄 OpenAPI Spec (JSON)
          </a>
        </div>
      </div>

      {/* Swagger UI */}
      <div ref={swaggerRef} style={{ backgroundColor: '#1a1a1a' }}>
        <SwaggerUI
          url="/api/docs/swagger"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          filter={true}
          tryItOutEnabled={true}
          persistAuthorization={true}
          displayRequestDuration={true}
          syntaxHighlight={{
            activate: true,
            theme: 'monokai'
          }}
        />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Dark theme for Swagger UI */
        .swagger-ui {
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 30px 0;
        }

        .swagger-ui .info .title {
          font-size: 36px;
          color: #60a5fa;
        }

        .swagger-ui .scheme-container {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .swagger-ui .opblock {
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          margin: 15px 0;
          background: #0a0a0a;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #0070f3;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #0070f3;
        }

        .swagger-ui .opblock-summary-path {
          color: #fff;
        }

        .swagger-ui .opblock-description-wrapper p {
          color: #aaa;
        }

        .swagger-ui .opblock-section-header {
          background: #0a0a0a;
          border-bottom: 1px solid #2a2a2a;
        }

        .swagger-ui .parameters {
          background: #0a0a0a;
        }

        .swagger-ui .parameter__name {
          color: #60a5fa;
        }

        .swagger-ui .parameter__type {
          color: #10b981;
        }

        .swagger-ui .response {
          background: #0a0a0a;
        }

        .swagger-ui .response-col_status {
          color: #10b981;
        }

        .swagger-ui .responses-inner {
          background: #0a0a0a;
        }

        .swagger-ui .model {
          background: #0a0a0a;
        }

        .swagger-ui .model-box {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
        }

        .swagger-ui table thead tr th {
          color: #aaa;
          border-bottom: 1px solid #2a2a2a;
        }

        .swagger-ui table tbody tr td {
          color: #ddd;
          border-bottom: 1px solid #2a2a2a;
        }

        .swagger-ui .btn {
          border-radius: 6px;
          font-weight: 600;
        }

        .swagger-ui .btn.execute {
          background: #10b981;
          border-color: #10b981;
        }

        .swagger-ui .btn.execute:hover {
          background: #059669;
          border-color: #059669;
        }

        .swagger-ui .markdown pre {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          color: #ddd;
        }

        .swagger-ui .highlight-code {
          background: #0a0a0a;
        }

        .swagger-ui .highlight-code .microlight {
          color: #ddd;
        }

        .swagger-ui .tab li {
          color: #aaa;
        }

        .swagger-ui .tab li.active {
          color: #60a5fa;
        }

        .swagger-ui input[type="text"],
        .swagger-ui textarea,
        .swagger-ui select {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          color: #fff;
          border-radius: 6px;
        }

        .swagger-ui input[type="text"]:focus,
        .swagger-ui textarea:focus,
        .swagger-ui select:focus {
          border-color: #60a5fa;
          outline: none;
        }

        /* Response body */
        .swagger-ui .responses-wrapper .response-col_description {
          background: #0a0a0a;
        }

        .swagger-ui .response-col_links {
          color: #60a5fa;
        }

        /* Try it out */
        .swagger-ui .try-out__btn {
          background: #0070f3;
          border-color: #0070f3;
          color: #fff;
        }

        .swagger-ui .try-out__btn:hover {
          background: #0051cc;
          border-color: #0051cc;
        }

        /* Models section */
        .swagger-ui section.models {
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          margin-top: 30px;
        }

        .swagger-ui section.models h4 {
          color: #60a5fa;
          border-bottom: 1px solid #2a2a2a;
        }

        .swagger-ui .model-title {
          color: #60a5fa;
        }

        .swagger-ui .prop-type {
          color: #10b981;
        }

        .swagger-ui .prop-format {
          color: #888;
        }
      `}</style>
    </div>
  )
}
