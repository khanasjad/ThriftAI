// Veritas.ai - Enhanced Product Card Component
// Displays AI-analyzed products with comprehensive insights

'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Star,
  Heart,
  ShoppingCart,
  Eye,
  Leaf,
  TrendingUp,
  Award,
  Clock,
  MapPin,
  DollarSign
} from 'lucide-react'
import type { EnhancedSearchResult } from '@/lib/types/scoring'

interface ProductCardProps {
  result: EnhancedSearchResult
  onAddToCart?: (product: EnhancedSearchResult['product']) => void
  onAddToWishlist?: (product: EnhancedSearchResult['product']) => void
  onViewDetails?: (product: EnhancedSearchResult['product']) => void
  compact?: boolean
}

export default function ProductCard({
  result,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  compact = false
}: ProductCardProps) {
  const { product, scores, ranking } = result

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getConditionColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSustainabilityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600' }
    if (score >= 60) return { level: 'Good', color: 'text-green-500' }
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600' }
    return { level: 'Basic', color: 'text-gray-600' }
  }

  const sustainability = getSustainabilityLevel(scores.breakdown.sustainability?.score || 0)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300">
      <CardHeader className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {/* Ranking Badge */}
            <Badge className="bg-blue-600 text-white">
              #{ranking.position}
            </Badge>

            {/* AI Score */}
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.round(ranking.finalScore)}
            </Badge>
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {/* Sustainability Badge */}
            {scores.breakdown.sustainability?.score > 60 && (
              <Badge className="bg-green-600 text-white">
                <Leaf className="w-3 h-3 mr-1" />
                Eco
              </Badge>
            )}

            {/* Discount Badge */}
            {product.price.discountPercentage && product.price.discountPercentage > 10 && (
              <Badge className="bg-red-600 text-white">
                -{product.price.discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onAddToWishlist?.(product)
            }}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Brand and Title */}
        <div>
          <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
            {product.title}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price.current)}
          </span>
          {product.price.original && product.price.original > product.price.current && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.price.original)}
            </span>
          )}
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.reviews.rating}</span>
          </div>
          <span className="text-sm text-gray-500">({product.reviews.count})</span>
        </div>

        {/* Key Scores */}
        {!compact && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-600" />
              <span>Quality: {Math.round(scores.breakdown.quality?.score || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span>Value: {Math.round(scores.breakdown.value?.score || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Leaf className={`w-3 h-3 ${sustainability.color}`} />
              <span>Sustainability: {sustainability.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span>Relevance: {Math.round(scores.breakdown.relevance?.score || 0)}</span>
            </div>
          </div>
        )}

        {/* Availability */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>Ships in {product.availability.shippingDays} days</span>
          {product.availability.shippingCost === 0 && (
            <Badge variant="outline" className="ml-auto text-xs">
              Free Shipping
            </Badge>
          )}
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin className="w-3 h-3" />
          <span>Sold by {product.seller.name}</span>
          {product.seller.verified && (
            <Badge variant="outline" className="ml-auto text-xs">
              ✓ Verified
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart?.(product)
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(product)
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Insights Preview */}
        {scores.reasoning && scores.reasoning.length > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <strong>AI Insight:</strong> {scores.reasoning[0]}
          </div>
        )}
      </CardContent>
    </Card>
  )
}