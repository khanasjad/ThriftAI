'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, TrendingDown, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import AppLayout from '@/components/AppLayout'

interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: {
    name: string
    description: string
    sustainabilityRating: string
  }
  currentPrice: number
  originalPrice: number | null
  discount: number
  currency: string
  images: string[]
  primaryImageUrl: string
  overallScore: number
  grade: string
  fitScore: number
  qualityScore: number
  styleScore: number
  comfortScore: number
  sustainabilityScore: number
  confidence: string
  reviewCount: number
  returnCount: number
  returnRate: number
  returnReasons: Record<string, number>
  avgRatings: {
    fit: number
    quality: number
    comfort: number
    style: number
    value: number
  }
  reviews: Array<{
    id: string
    rating: number
    title: string
    text: string
    fitRating: number
    qualityRating: number
    createdAt: string
  }>
  factors: Array<{
    factor: string
    score: number
    pillar: string
  }>
  evidenceTags: Array<{
    tag: string
    count: number
    sentiment: string
  }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/v1/products/${params.id}`)

        if (!res.ok) {
          throw new Error('Failed to fetch product')
        }

        const data = await res.json()

        if (data.success) {
          setProduct(data.data)
        } else {
          throw new Error(data.error || 'Product not found')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getGradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 text-green-800'
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800'
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-[17px] text-black/40">Loading product...</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="bg-white min-h-screen">
          <div className="max-w-7xl mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl font-semibold mb-4">Product Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="bg-white min-h-screen">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Product Header */}
        <div className="max-w-[980px] mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div>
              <div className="aspect-square bg-[#f5f5f7] rounded-2xl overflow-hidden mb-4 relative">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[currentImageIndex] || product.primaryImageUrl || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/40">
                    No image available
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        currentImageIndex === idx ? 'border-black' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-2">
                <span className="text-[14px] text-black/60">{product.brand.name}</span>
              </div>
              <h1 className="text-[40px] font-semibold tracking-[-0.005em] leading-[1.1] mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <div className={`px-4 py-2 rounded-full ${getGradeColor(product.grade)}`}>
                  <span className="text-[21px] font-semibold">Grade {product.grade}</span>
                </div>
                <div className={`text-[40px] font-semibold ${getScoreColor(product.overallScore)}`}>
                  {product.overallScore}
                </div>
              </div>

              {product.description && (
                <p className="text-[17px] text-black/80 mb-6 leading-[1.47059]">
                  {product.description}
                </p>
              )}

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-[28px] font-semibold">
                    ${product.currentPrice.toFixed(2)}
                  </span>
                  {product.originalPrice && product.discount > 0 && (
                    <>
                      <span className="text-[17px] text-black/40 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-[14px] text-green-600 font-medium">
                        Save {product.discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Category & Details */}
              <div className="space-y-3 text-[14px] border-t border-black/10 pt-6">
                <div className="flex justify-between">
                  <span className="text-black/60">Category</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                {product.subcategory && (
                  <div className="flex justify-between">
                    <span className="text-black/60">Type</span>
                    <span className="font-medium">{product.subcategory}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-black/60">Reviews</span>
                  <span className="font-medium">{product.reviewCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Return Rate</span>
                  <span className={`font-medium ${product.returnRate > 15 ? 'text-red-600' : 'text-green-600'}`}>
                    {product.returnRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Scores */}
        <div className="bg-[#fbfbfd] py-16">
          <div className="max-w-[980px] mx-auto px-6">
            <h2 className="text-[32px] font-semibold mb-8">Quality Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { name: 'Fit', score: product.fitScore },
                { name: 'Quality', score: product.qualityScore },
                { name: 'Style', score: product.styleScore },
                { name: 'Comfort', score: product.comfortScore },
                { name: 'Sustainability', score: product.sustainabilityScore },
              ].map((pillar) => (
                <div key={pillar.name} className="bg-white rounded-2xl p-6 text-center">
                  <div className={`text-[48px] font-semibold mb-2 ${getScoreColor(pillar.score)}`}>
                    {pillar.score}
                  </div>
                  <div className="text-[14px] text-black/60">{pillar.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-[980px] mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[32px] font-semibold">Customer Reviews</h2>
            <div className="text-[17px] text-black/60">
              {product.reviewCount.toLocaleString()} reviews
            </div>
          </div>

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-6">
              {product.reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="bg-[#fbfbfd] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-amber-500' : 'text-black/10'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[12px] text-black/40">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h3 className="font-semibold mb-2">{review.title}</h3>
                  )}
                  <p className="text-[14px] text-black/80 leading-[1.5]">
                    {review.text}
                  </p>
                  <div className="flex gap-6 mt-4 text-[12px]">
                    {review.fitRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-black/60">Fit:</span>
                        <span className="font-medium">{review.fitRating}/5</span>
                      </div>
                    )}
                    {review.qualityRating && (
                      <div className="flex items-center gap-1">
                        <span className="text-black/60">Quality:</span>
                        <span className="font-medium">{review.qualityRating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[17px] text-black/40">
              No reviews yet
            </div>
          )}
        </div>

        {/* Return Analysis */}
        {product.returnRate > 0 && (
          <div className="bg-[#fbfbfd] py-16">
            <div className="max-w-[980px] mx-auto px-6">
              <h2 className="text-[32px] font-semibold mb-8">Return Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6">
                  <div className="text-[14px] text-black/60 mb-2">Return Rate</div>
                  <div className={`text-[40px] font-semibold ${product.returnRate > 15 ? 'text-red-600' : 'text-green-600'}`}>
                    {product.returnRate}%
                  </div>
                  <div className="text-[12px] text-black/40 mt-2">
                    {product.returnCount} of {product.reviewCount} customers
                  </div>
                </div>
                {Object.keys(product.returnReasons).length > 0 && (
                  <div className="bg-white rounded-2xl p-6">
                    <div className="text-[14px] text-black/60 mb-4">Top Return Reasons</div>
                    <div className="space-y-2">
                      {Object.entries(product.returnReasons)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([reason, count]) => (
                          <div key={reason} className="flex justify-between text-[14px]">
                            <span className="text-black/80">
                              {reason.replace(/_/g, ' ').toLowerCase()}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
