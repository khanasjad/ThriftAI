'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart, Share2, ChevronDown, ChevronUp, TrendingUp, Award, Shield, Zap } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [enrichedData, setEnrichedData] = useState<any>(null)

  const { addToCart } = useCartStore()

  useEffect(() => {
    console.log('[ProductPage] useEffect triggered, params.id:', params.id)
    if (params.id) {
      fetchProductDetails()
    }
  }, [params.id])

  const fetchProductDetails = async () => {
    try {
      console.log('[ProductPage] Fetching product details for ID:', params.id)
      const response = await fetch(`/api/products/${params.id}`)
      console.log('[ProductPage] Response status:', response.status)
      const data = await response.json()
      console.log('[ProductPage] Data received:', data)

      if (data.error) {
        console.error('[ProductPage] API returned error:', data.error)
        setProduct(null)
      } else {
        setProduct(data)
        // Also fetch enriched data with Veritas scores
        fetchEnrichedData(data.name || data.title)
      }
    } catch (error) {
      console.error('[ProductPage] Failed to fetch product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
      console.log('[ProductPage] Loading set to false')
    }
  }

  const fetchEnrichedData = async (productName: string) => {
    try {
      const response = await fetch('/api/buyers/enhanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: productName,
          pagination: { page: 1, limit: 1 },
          filters: {},
          sorting: { field: 'relevance', direction: 'desc' },
          includeMetadata: false
        })
      })
      const data = await response.json()
      if (data.products && data.products.length > 0) {
        setEnrichedData(data.products[0])
        console.log('[ProductPage] Enriched data:', data.products[0])
      }
    } catch (error) {
      console.error('[ProductPage] Failed to fetch enriched data:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--border-primary)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Product Not Found</h2>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Handle both image formats (array or single URL)
  const images = Array.isArray(product.images)
    ? product.images
    : product.images
      ? [product.images]
      : product.imageUrl
        ? [product.imageUrl]
        : ['/placeholder-image.jpg']

  const handlePrevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const handleNextImage = () => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  // Extract product data with fallbacks
  const productName = product.name || product.title || 'Unnamed Product'
  const productBrand = product.brand || 'Unknown'
  const productCategory = product.category || 'General'
  const productPrice = product.price?.current || product.price || 0
  const productOriginalPrice = product.originalPrice || product.price?.original || productPrice
  const productRating = product.rating || product.reviews?.rating || 0
  const productReviewCount = product.reviewCount || product.reviews?.count || 0
  const productCondition = product.condition || product.specifications?.condition || 'N/A'
  const isAvailable = product.isAvailable !== undefined ? product.isAvailable : product.availability?.inStock !== false

  // Key features extraction with more details
  const keyFeatures = [
    { icon: '✓', label: 'Condition', value: productCondition },
    { icon: '📦', label: 'Brand', value: productBrand },
    { icon: '🏷️', label: 'Category', value: productCategory },
    { icon: '⭐', label: 'Rating', value: productRating > 0 ? `${productRating.toFixed(1)}/5` : 'No ratings yet' },
    { icon: '🚚', label: 'Availability', value: isAvailable ? 'In Stock' : 'Out of Stock' },
    { icon: '📍', label: 'Shipping', value: product.hasFreeShipping ? 'Free Shipping' : `$${(product.shippingCost || 0).toFixed(2)}` },
    { icon: '🎁', label: 'Delivery', value: `${product.estimatedDeliveryDays || 5} days` },
    { icon: '🔄', label: 'Returns', value: product.hasFreeReturns ? 'Free Returns' : `${product.returnPeriodDays || 30} days` }
  ]

  // Extract dynamic specs
  const dynamicSpecs = product.dynamicSpecs || {}
  const specifications = {
    ...product.specifications,
    ...dynamicSpecs,
    verified: dynamicSpecs.verified ? 'Yes' : undefined,
    genuine: dynamicSpecs.genuine ? 'Yes' : undefined,
    authentic: product.isAuthentic ? 'Yes' : undefined
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '24px',
      paddingTop: '80px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)'
          }}
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="product-detail-grid">
          {/* LEFT COLUMN - Images */}
          <div>
            {/* Main Image with Carousel */}
            <div style={{
              position: 'relative',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{
                paddingTop: '100%',
                position: 'relative'
              }}>
                <img
                  src={images[currentImageIndex]}
                  alt={productName}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '24px'
                  }}
                />
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(8px)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '20px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, 1fr)`,
                gap: '12px'
              }}>
                {images.slice(0, 5).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    style={{
                      padding: '8px',
                      background: 'var(--bg-secondary)',
                      border: currentImageIndex === idx ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      aspectRatio: '1'
                    }}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Product Info */}
          <div>
            {/* Product Title */}
            <h1 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              lineHeight: '1.2'
            }}>
              {productName}
            </h1>

            {/* Brand & Category */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                {productBrand}
              </span>
              <span style={{
                padding: '6px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                {productCategory}
              </span>
            </div>

            {/* Rating */}
            {productRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={i < Math.floor(productRating) ? '#fbbf24' : 'none'}
                      stroke={i < Math.floor(productRating) ? '#fbbf24' : '#9ca3af'}
                    />
                  ))}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {productRating.toFixed(1)} ({productReviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: '700',
                  color: 'var(--accent-primary)'
                }}>
                  ${productPrice.toFixed(2)}
                </span>
                {productOriginalPrice && productOriginalPrice > productPrice && (
                  <>
                    <span style={{
                      fontSize: '1.5rem',
                      color: 'var(--text-tertiary)',
                      textDecoration: 'line-through'
                    }}>
                      ${productOriginalPrice.toFixed(2)}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {Math.round((1 - productPrice / productOriginalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Key Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '32px'
            }}>
              {keyFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                      {feature.label}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {feature.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            {(product.certifications || product.isAuthentic || product.hasFreeShipping) && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '24px'
              }}>
                {product.isAuthentic && (
                  <div style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Shield size={14} />
                    Authentic
                  </div>
                )}
                {product.hasFreeShipping && (
                  <div style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <TrendingUp size={14} />
                    Free Shipping
                  </div>
                )}
                {product.hasFreeReturns && (
                  <div style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap size={14} />
                    Free Returns
                  </div>
                )}
                {product.certifications && product.certifications.map((cert: string, idx: number) => (
                  <div key={idx} style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {cert}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={async () => {
                  if (!isAvailable) return
                  try {
                    setAddingToCart(true)
                    await addToCart(product.id, 1)
                    toast.success(`${productName} added to cart!`)
                  } catch (error) {
                    console.error('Failed to add to cart:', error)
                    toast.error('Failed to add to cart. Please try again.')
                  } finally {
                    setAddingToCart(false)
                  }
                }}
                disabled={!isAvailable || addingToCart}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: !isAvailable || addingToCart
                    ? 'var(--bg-tertiary)'
                    : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: !isAvailable || addingToCart ? 'var(--text-tertiary)' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: !isAvailable || addingToCart ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s',
                  opacity: !isAvailable || addingToCart ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (isAvailable && !addingToCart) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <ShoppingCart size={20} />
                {!isAvailable ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                }}
              >
                <Heart size={24} color="var(--text-secondary)" />
              </button>
              <button
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Share2 size={24} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Veritas Score Breakdown */}
            {enrichedData?.veritasScore && (
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '16px',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Award size={24} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Veritas Score™
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: '700'
                  }}>
                    {Math.round(enrichedData.veritasScore)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Overall Quality Score
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      Confidence: {enrichedData.veritasConfidence ? Math.round(enrichedData.veritasConfidence * 100) : 'N/A'}%
                    </div>
                  </div>
                </div>

                {/* Veritas Pillars */}
                {enrichedData.veritasPillars && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      Veritas Score™ Pillars
                    </h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Product Quality</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${enrichedData.veritasPillars.quality}%`,
                              height: '100%',
                              background: enrichedData.veritasPillars.quality >= 80 ? '#10b981' : enrichedData.veritasPillars.quality >= 60 ? '#fbbf24' : '#ef4444',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>
                            {Math.round(enrichedData.veritasPillars.quality)}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Value Proposition</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${enrichedData.veritasPillars.value}%`,
                              height: '100%',
                              background: enrichedData.veritasPillars.value >= 80 ? '#10b981' : enrichedData.veritasPillars.value >= 60 ? '#fbbf24' : '#ef4444',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>
                            {Math.round(enrichedData.veritasPillars.value)}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trust & Safety</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${enrichedData.veritasPillars.trust}%`,
                              height: '100%',
                              background: enrichedData.veritasPillars.trust >= 80 ? '#10b981' : enrichedData.veritasPillars.trust >= 60 ? '#fbbf24' : '#ef4444',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>
                            {Math.round(enrichedData.veritasPillars.trust)}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>User Experience</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${enrichedData.veritasPillars.ux}%`,
                              height: '100%',
                              background: enrichedData.veritasPillars.ux >= 80 ? '#10b981' : enrichedData.veritasPillars.ux >= 60 ? '#fbbf24' : '#ef4444',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>
                            {Math.round(enrichedData.veritasPillars.ux)}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sustainability</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100px',
                            height: '6px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${enrichedData.veritasPillars.sustainability}%`,
                              height: '100%',
                              background: enrichedData.veritasPillars.sustainability >= 80 ? '#10b981' : enrichedData.veritasPillars.sustainability >= 60 ? '#fbbf24' : '#ef4444',
                              borderRadius: '3px'
                            }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'right' }}>
                            {Math.round(enrichedData.veritasPillars.sustainability)}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Details */}
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Product Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Price:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>${productPrice.toFixed(2)}</span>
                </div>
                {productOriginalPrice && productOriginalPrice > productPrice && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Original Price:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>${productOriginalPrice.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Discount:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>{Math.round((1 - productPrice / productOriginalPrice) * 100)}%</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Stock:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{product.stockQuantity || 0} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Shipping:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {product.hasFreeShipping ? 'Free' : `$${(product.shippingCost || 0).toFixed(2)}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Returns:</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {product.hasFreeReturns ? 'Free' : 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            {/* ESG Metrics */}
            {enrichedData?.companyMetrics && (
              <div style={{
                padding: '24px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                marginBottom: '32px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  ESG Metrics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {enrichedData.companyMetrics.esgScore !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>ESG Score:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{enrichedData.companyMetrics.esgScore.toFixed(1)}/100</span>
                    </div>
                  )}
                  {enrichedData.companyMetrics.sustainabilityRating !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Sustainability:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{enrichedData.companyMetrics.sustainabilityRating.toFixed(1)}/5</span>
                    </div>
                  )}
                  {enrichedData.companyMetrics.laborPractices !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Labor Practices:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{enrichedData.companyMetrics.laborPractices.toFixed(1)}/100</span>
                    </div>
                  )}
                  {enrichedData.companyMetrics.supplyChainTransparency !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Supply Chain:</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{enrichedData.companyMetrics.supplyChainTransparency.toFixed(1)}/100</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Specifications */}
            {Object.keys(specifications).filter(key => specifications[key] && key !== 'category' && key !== 'condition').length > 0 && (
              <div style={{
                padding: '24px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                marginBottom: '32px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Product Specifications
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(specifications)
                    .filter(([key, value]) => value && key !== 'category' && key !== 'condition')
                    .map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-primary)'
                      }}>
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--text-tertiary)',
                          textTransform: 'capitalize',
                          fontWeight: '500'
                        }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>
                          {String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Savings Highlight */}
            {productOriginalPrice && productOriginalPrice > productPrice && (
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '2px solid #10b981',
                borderRadius: '16px',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      You Save
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                      ${(productOriginalPrice - productPrice).toFixed(2)}
                    </div>
                  </div>
                  <div style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '700'
                  }}>
                    {Math.round((1 - productPrice / productOriginalPrice) * 100)}% OFF
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Product Description
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.8',
                fontSize: '15px',
                maxHeight: showFullDescription ? 'none' : '120px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {product.description || 'No description available.'}
              </p>
              {product.description && product.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showFullDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showFullDescription ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>

            {/* Reviews Section */}
            <div style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Customer Reviews
              </h3>

              {product.reviews && product.reviews.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {(showAllReviews ? product.reviews : product.reviews.slice(0, 3)).map((review: any, idx: number) => (
                      <div key={idx} style={{
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < review.rating ? '#fbbf24' : 'none'}
                                stroke={i < review.rating ? '#fbbf24' : '#9ca3af'}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {review.userName || 'Anonymous'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {review.date || 'Recent'}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {review.comment || review.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  {product.reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {showAllReviews ? 'Show Less' : `Show All ${product.reviews.length} Reviews`}
                    </button>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  No reviews yet. Be the first to review this product!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-detail-grid {
          display: grid;
          grid-template-columns: minmax(400px, 600px) 1fr;
          gap: 48px;
        }

        @media (max-width: 968px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
