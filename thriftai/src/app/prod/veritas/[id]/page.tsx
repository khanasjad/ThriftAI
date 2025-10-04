'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface CategoryScore {
  category: string
  score: number
  weight: number
  weightedScore: number
  confidence: number
  parameters: Array<{
    name: string
    code: string
    rawValue: string | null
    normalizedScore: number
    weightedScore: number
    dataSource: string
    confidence: number
    isMissing: boolean
    isRealData?: boolean
  }>
}

interface VeritasScoreDetail {
  ssn: string
  overallScore: number
  confidence: number
  dataQualityScore: number
  calculatedAt: string
  categories: CategoryScore[]
  missingDataFields: string[]
  freeDataSummary?: {
    totalParameters: number
    parametersUsingFreeAPIs: number
    freeAPIsUsed: string[]
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VeritasScoreDetail | null>(null)

  useEffect(() => {
    if (productId) {
      fetchScore()
    }
  }, [productId])

  const fetchScore = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/test/veritas-score?productId=${productId}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to fetch score')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 80) return '#22c55e'
    if (score >= 70) return '#fbbf24'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      padding: '40px 20px'
    }}>
      {/* Back Button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 20px' }}>
        <Link
          href="/prod/veritas"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Back to Products
        </Link>
      </div>

      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 40px'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Veritas Score™ Detail
        </h1>
        <p style={{ fontSize: '16px', color: '#888' }}>
          Complete quality assessment breakdown
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          padding: '20px',
          backgroundColor: '#ff4444',
          borderRadius: '12px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '60px 20px',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading Veritas Score...
        </div>
      )}

      {/* Score Detail */}
      {!loading && result && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Summary */}
          <div style={{
            padding: '30px',
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            marginBottom: '30px',
            border: '1px solid #2a2a2a'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>📊 Overall Score</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: getScoreColor(result.overallScore)
                }}>
                  {result.overallScore.toFixed(1)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Overall Score
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#fbbf24'
                }}>
                  {(result.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Confidence
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#60a5fa'
                }}>
                  {result.dataQualityScore.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  Data Quality
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#a78bfa',
                  marginTop: '10px'
                }}>
                  {result.ssn}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                  SSN
                </div>
              </div>
            </div>
          </div>

          {/* FREE API Usage */}
          {result.freeDataSummary && (
            <div style={{
              padding: '30px',
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              marginBottom: '30px',
              border: '1px solid #2a2a2a'
            }}>
              <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>🆓 FREE Data Sources Used</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#10b981'
                  }}>
                    {result.freeDataSummary.parametersUsingFreeAPIs}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Parameters with FREE APIs
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#8b5cf6'
                  }}>
                    {result.freeDataSummary.totalParameters}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Total Parameters
                  </div>
                </div>
                <div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '10px'
                  }}>
                    {result.freeDataSummary.freeAPIsUsed.map((api) => (
                      <span
                        key={api}
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#000'
                        }}
                      >
                        {api.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    APIs Called
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <h2 style={{
            fontSize: '24px',
            marginBottom: '20px',
            color: '#fff'
          }}>
            📁 Category Breakdown
          </h2>

          {result.categories.map((category) => (
            <div
              key={category.category}
              style={{
                padding: '20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #2a2a2a'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <h3 style={{ fontSize: '18px', color: '#fff' }}>
                  {category.category}
                </h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span style={{ color: getScoreColor(category.score), fontSize: '14px' }}>
                    Score: <strong>{category.score.toFixed(1)}</strong>
                  </span>
                  <span style={{ color: '#fbbf24', fontSize: '14px' }}>
                    Weight: <strong>{(category.weight * 100).toFixed(0)}%</strong>
                  </span>
                  <span style={{ color: '#60a5fa', fontSize: '14px' }}>
                    Weighted: <strong>{category.weightedScore.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  fontSize: '12px',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 8px',
                        color: '#aaa',
                        fontWeight: '600'
                      }}>
                        Parameter
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px 8px',
                        color: '#aaa',
                        fontWeight: '600'
                      }}>
                        Raw Value
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: '12px 8px',
                        color: '#aaa',
                        fontWeight: '600'
                      }}>
                        Score
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                        color: '#aaa',
                        fontWeight: '600'
                      }}>
                        Source
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: '12px 8px',
                        color: '#aaa',
                        fontWeight: '600'
                      }}>
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.parameters.map((param, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid #222',
                          backgroundColor: param.isRealData ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                        }}
                      >
                        <td style={{
                          padding: '12px 8px',
                          color: '#fff'
                        }}>
                          {param.isRealData && '✅ '}
                          {param.name}
                        </td>
                        <td style={{
                          padding: '12px 8px',
                          color: '#999',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {param.rawValue || <span style={{ color: '#555' }}>—</span>}
                        </td>
                        <td style={{
                          padding: '12px 8px',
                          textAlign: 'right',
                          color: getScoreColor(param.normalizedScore),
                          fontWeight: '600'
                        }}>
                          {param.normalizedScore.toFixed(1)}
                        </td>
                        <td style={{
                          padding: '12px 8px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: param.isRealData ? '#10b981' : '#444',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: param.isRealData ? '#000' : '#aaa'
                          }}>
                            {param.dataSource}
                          </span>
                        </td>
                        <td style={{
                          padding: '12px 8px',
                          textAlign: 'right',
                          color: '#fbbf24',
                          fontWeight: '600'
                        }}>
                          {(param.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
