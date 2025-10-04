'use client'

import { useState } from 'react'

export default function VeritasTestPage() {
  const [productId, setProductId] = useState('cmgbavx8n0000rm3iapspwsth')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testScore = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/test/veritas-score?productId=${productId}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>🔍 Veritas Score™ - FREE Data Test</h1>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px' }}>Product ID:</label>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          style={{
            width: '500px',
            padding: '10px',
            backgroundColor: '#3a3a3a',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        <button
          onClick={testScore}
          disabled={loading}
          style={{
            marginLeft: '10px',
            padding: '10px 20px',
            backgroundColor: loading ? '#555' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? 'Calculating...' : 'Calculate Score'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '20px', backgroundColor: '#ff4444', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          {/* Summary */}
          <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '8px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>📊 Overall Score</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4ade80' }}>
                  {result.overallScore.toFixed(1)}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Overall Score</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#fbbf24' }}>
                  {(result.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Confidence</div>
              </div>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#60a5fa' }}>
                  {result.dataQualityScore.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Data Quality</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a78bfa', marginTop: '10px' }}>
                  {result.ssn}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>SSN</div>
              </div>
            </div>
          </div>

          {/* FREE API Usage */}
          <div style={{ padding: '30px', backgroundColor: '#2a2a2a', borderRadius: '8px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>🆓 FREE Data Sources Used</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
                  {result.freeDataSummary.parametersUsingFreeAPIs}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Parameters with FREE APIs</div>
              </div>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {result.freeDataSummary.totalParameters}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Total Parameters</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', marginTop: '10px' }}>
                  {result.freeDataSummary.freeAPIsUsed.map((api: string) => (
                    <span key={api} style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      margin: '2px',
                      backgroundColor: '#10b981',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      {api.toUpperCase()}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>APIs Called</div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>📁 Category Breakdown</h2>
          {result.categories.map((category: any) => (
            <div key={category.category} style={{
              padding: '20px',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '18px' }}>{category.category}</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ color: '#4ade80' }}>
                    Score: <strong>{category.score.toFixed(1)}</strong>
                  </span>
                  <span style={{ color: '#fbbf24' }}>
                    Weight: <strong>{(category.weight * 100).toFixed(0)}%</strong>
                  </span>
                  <span style={{ color: '#60a5fa' }}>
                    Weighted: <strong>{category.weightedScore.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Parameter</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Raw Value</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Score</th>
                    <th style={{ textAlign: 'center', padding: '8px' }}>Source</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {category.parameters.map((param: any, i: number) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid #333',
                      backgroundColor: param.isRealData ? '#0a4a2a' : 'transparent'
                    }}>
                      <td style={{ padding: '8px' }}>
                        {param.isRealData && '✅ '}
                        {param.name}
                      </td>
                      <td style={{ padding: '8px', color: '#999', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {param.rawValue || <span style={{ color: '#666' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#4ade80' }}>
                        {param.normalizedScore.toFixed(1)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: param.isRealData ? '#10b981' : '#555',
                          fontSize: '10px'
                        }}>
                          {param.dataSource}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#fbbf24' }}>
                        {(param.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
