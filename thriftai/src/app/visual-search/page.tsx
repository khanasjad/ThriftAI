// ThriftAI - Visual Search Page
// AI-powered image search for thrift shopping

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  Leaf,
  Brain,
  Eye,
  Search,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import VisualSearchUpload from '@/components/visual-search/VisualSearchUpload'
import SearchResults from '@/components/enhanced/SearchResults'
import type { SearchResponse } from '@/lib/types/scoring'

interface ImageAnalysisResult {
  detectedItems: string[]
  style: string
  colors: string[]
  category: string
  brand?: string
  condition?: string
  materials?: string[]
  searchQuery: string
  confidence: number
  reasoning: string[]
}

const DEMO_FEATURES = [
  {
    icon: Brain,
    title: 'Claude Vision AI',
    description: 'Advanced computer vision analyzes clothing, accessories, and style elements',
    color: 'text-blue-600'
  },
  {
    icon: Eye,
    title: 'Visual Product Matching',
    description: 'Finds similar items by color, style, brand, and visual characteristics',
    color: 'text-purple-600'
  },
  {
    icon: TrendingUp,
    title: 'Smart Ranking',
    description: 'Results ranked by visual similarity, quality, and sustainability scores',
    color: 'text-green-600'
  },
  {
    icon: Leaf,
    title: 'Sustainable Shopping',
    description: 'Discover eco-friendly alternatives and reduce fashion waste',
    color: 'text-emerald-600'
  }
]

const EXAMPLE_SEARCHES = [
  {
    title: 'Vintage Denim Jacket',
    description: 'Upload a photo of a denim jacket to find similar vintage styles',
    imageUrl: '/api/placeholder/300/200',
    tags: ['Vintage', 'Denim', 'Outerwear']
  },
  {
    title: 'Designer Handbag',
    description: 'Find authenticated designer bags at sustainable prices',
    imageUrl: '/api/placeholder/300/200',
    tags: ['Designer', 'Handbag', 'Luxury']
  },
  {
    title: 'Athletic Sneakers',
    description: 'Search for specific colorways and limited edition releases',
    imageUrl: '/api/placeholder/300/200',
    tags: ['Sneakers', 'Athletic', 'Limited Edition']
  }
]

export default function VisualSearchPage() {
  const [currentAnalysis, setCurrentAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleImageAnalyzed = (analysis: ImageAnalysisResult, imageUrl: string) => {
    setCurrentAnalysis(analysis)
    setCurrentImageUrl(imageUrl)
    setSearchResults(null)
  }

  const handleSearchInitiated = async (searchQuery: string, imageAnalysis: ImageAnalysisResult) => {
    setIsSearching(true)

    try {
      // Convert current image to base64 for search
      const base64Data = currentImageUrl?.split(',')[1]
      if (!base64Data) throw new Error('No image data available')

      const response = await fetch('/api/visual-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Data,
          imageFormat: 'jpeg', // Default format
          maxResults: 12
        })
      })

      if (!response.ok) {
        throw new Error('Visual search failed')
      }

      const results: SearchResponse = await response.json()
      setSearchResults(results)

    } catch (error) {
      console.error('Search error:', error)
      // Handle error (could show a toast or error message)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Visual Search
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Upload any fashion image and let AI find similar products instantly.
            Our advanced computer vision technology analyzes style, color, and brand to deliver perfect matches.
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">10M+</div>
              <div className="text-sm text-gray-600">Images Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">95%</div>
              <div className="text-sm text-gray-600">Match Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">&lt;3s</div>
              <div className="text-sm text-gray-600">Search Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">50k+</div>
              <div className="text-sm text-gray-600">Sustainable Items</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="search">Visual Search</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="features">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            {/* Upload Component */}
            <VisualSearchUpload
              onImageAnalyzed={handleImageAnalyzed}
              onSearchInitiated={handleSearchInitiated}
              disabled={isSearching}
            />

            {/* Example Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Example Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {EXAMPLE_SEARCHES.map((example, index) => (
                    <div key={index} className="text-center space-y-3">
                      <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{example.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {example.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            {isSearching ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xl font-medium">Searching for similar products...</span>
                </div>
                <div className="text-gray-600 mb-8">
                  AI is analyzing your image and finding the best matches
                </div>
                <div className="max-w-md mx-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Image Analysis</span>
                      <span className="text-green-600">✓ Complete</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Visual Feature Extraction</span>
                      <span className="text-green-600">✓ Complete</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Product Matching</span>
                      <span className="text-purple-600">Processing...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Similarity Ranking</span>
                      <span className="text-gray-400">Waiting...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : searchResults ? (
              <div className="space-y-6">
                {/* Search Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      {currentImageUrl && (
                        <img
                          src={currentImageUrl}
                          alt="Search query"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-bold mb-2">Visual Search Results</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Search className="w-4 h-4" />
                            Query: {searchResults.query.optimized}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {searchResults.metadata.processingTime}ms
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {searchResults.metadata.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    {currentAnalysis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Category</div>
                          <Badge>{currentAnalysis.category}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Style</div>
                          <Badge variant="outline">{currentAnalysis.style}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Colors</div>
                          <div className="flex gap-1">
                            {currentAnalysis.colors.slice(0, 2).map((color, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {color}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">AI Confidence</div>
                          <div className="text-sm font-medium">{currentAnalysis.confidence}%</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Search Results */}
                <SearchResults
                  searchResponse={searchResults}
                  onAddToCart={(product) => {
                    console.log('Add to cart:', product.title)
                    alert(`Added "${product.title}" to cart!`)
                  }}
                  onAddToWishlist={(product) => {
                    console.log('Add to wishlist:', product.title)
                    alert(`Added "${product.title}" to wishlist!`)
                  }}
                  onViewDetails={(product) => {
                    console.log('View details:', product.title)
                    alert(`Viewing details for "${product.title}"`)
                  }}
                  loading={false}
                />
              </div>
            ) : (
              <div className="text-center py-16">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  No search results yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Upload an image in the Visual Search tab to see results here
                </p>
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to Visual Search
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    How Visual Search Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      {
                        step: 1,
                        title: 'Upload Image',
                        description: 'Take or upload a photo of any fashion item',
                        icon: Camera
                      },
                      {
                        step: 2,
                        title: 'AI Analysis',
                        description: 'Claude Vision identifies style, color, brand, and materials',
                        icon: Brain
                      },
                      {
                        step: 3,
                        title: 'Smart Matching',
                        description: 'Find visually similar products across our database',
                        icon: Eye
                      },
                      {
                        step: 4,
                        title: 'Ranked Results',
                        description: 'Get results sorted by similarity and sustainability',
                        icon: TrendingUp
                      }
                    ].map((step) => (
                      <div key={step.step} className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <step.icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-lg font-medium mb-2">{step.title}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEMO_FEATURES.map((feature, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Why Use Visual Search?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Find Exact Matches</div>
                          <div className="text-sm text-gray-600">
                            Locate the exact item or closest alternatives
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Save Time</div>
                          <div className="text-sm text-gray-600">
                            No need to describe items with words - just show us
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Discover Similar Styles</div>
                          <div className="text-sm text-gray-600">
                            Find new items with similar aesthetic appeal
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Better for Environment</div>
                          <div className="text-sm text-gray-600">
                            Extend item lifecycles through second-hand shopping
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Affordable Fashion</div>
                          <div className="text-sm text-gray-600">
                            Get designer looks at sustainable prices
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">AI-Powered Accuracy</div>
                          <div className="text-sm text-gray-600">
                            Advanced algorithms ensure relevant results
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}