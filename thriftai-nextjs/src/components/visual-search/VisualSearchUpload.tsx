// ThriftAI - Visual Search Upload Component
// AI-powered image upload and analysis for product search

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  Eye,
  FileImage,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

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

interface VisualSearchUploadProps {
  onImageAnalyzed?: (analysis: ImageAnalysisResult, imageUrl: string) => void
  onSearchInitiated?: (searchQuery: string, imageAnalysis: ImageAnalysisResult) => void
  disabled?: boolean
  maxFileSizeMB?: number
}

export default function VisualSearchUpload({
  onImageAnalyzed,
  onSearchInitiated,
  disabled = false,
  maxFileSizeMB = 10
}: VisualSearchUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [additionalText, setAdditionalText] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxFileSize = maxFileSizeMB * 1024 * 1024

  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  const handleFileSelect = useCallback((file: File) => {
    setError(null)

    // Validate file type
    if (!supportedFormats.includes(file.type)) {
      setError(`Unsupported file format. Please use: ${supportedFormats.map(f => f.split('/')[1]).join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${maxFileSizeMB}MB`)
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Clear previous analysis
    setAnalysisResult(null)
  }, [maxFileSize, maxFileSizeMB])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const analyzeImage = async () => {
    if (!selectedImage || !imagePreview) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Convert image to base64
      const base64Data = imagePreview.split(',')[1]
      const imageFormat = selectedImage.type.split('/')[1] as 'jpeg' | 'png' | 'webp' | 'gif'

      const response = await fetch('/api/visual-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Data,
          imageFormat,
          additionalText: additionalText.trim(),
          maxResults: 12
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Visual search failed')
      }

      const result = await response.json()
      const analysis: ImageAnalysisResult = result.imageAnalysis

      setAnalysisResult(analysis)
      onImageAnalyzed?.(analysis, imagePreview)

      console.log('Image analysis complete:', analysis)

    } catch (err) {
      console.error('Error analyzing image:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSearchWithAnalysis = () => {
    if (analysisResult) {
      onSearchInitiated?.(analysisResult.searchQuery, analysisResult)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAnalysisResult(null)
    setError(null)
    setAdditionalText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Visual Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!imagePreview ? (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={supportedFormats.join(',')}
                onChange={handleFileInputChange}
                disabled={disabled}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Upload an image to find similar products</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Drag & drop an image here, or click to select
                  </p>
                  <div className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, WebP, GIF (max {maxFileSizeMB}MB)
                  </div>
                </div>

                <Button disabled={disabled} className="mt-4">
                  <FileImage className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                  disabled={isAnalyzing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Additional Context Input */}
              <div className="space-y-2">
                <Label htmlFor="additional-text">
                  Additional Context (Optional)
                </Label>
                <Input
                  id="additional-text"
                  placeholder="e.g., 'looking for vintage style', 'need larger size', 'prefer sustainable brands'"
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              {/* Analyze Button */}
              {!analysisResult && (
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing || disabled}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Image with AI
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              AI Analysis Results
              <Badge variant="outline" className="ml-auto">
                {analysisResult.confidence}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated Search Query */}
            <div>
              <Label className="text-sm font-medium">Generated Search Query</Label>
              <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <code className="text-blue-800">{analysisResult.searchQuery}</code>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detected Items */}
              <div>
                <Label className="text-sm font-medium">Detected Items</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {analysisResult.detectedItems.map((item, index) => (
                    <Badge key={index} variant="secondary">{item}</Badge>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <Label className="text-sm font-medium">Style</Label>
                <div className="mt-1">
                  <Badge>{analysisResult.style}</Badge>
                </div>
              </div>

              {/* Colors */}
              <div>
                <Label className="text-sm font-medium">Colors</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {analysisResult.colors.map((color, index) => (
                    <Badge key={index} variant="outline">{color}</Badge>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <div className="mt-1">
                  <Badge variant="default">{analysisResult.category}</Badge>
                </div>
              </div>

              {/* Brand (if detected) */}
              {analysisResult.brand && (
                <div>
                  <Label className="text-sm font-medium">Detected Brand</Label>
                  <div className="mt-1">
                    <Badge variant="default">{analysisResult.brand}</Badge>
                  </div>
                </div>
              )}

              {/* Materials (if detected) */}
              {analysisResult.materials && analysisResult.materials.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Materials</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {analysisResult.materials.map((material, index) => (
                      <Badge key={index} variant="outline">{material}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Reasoning */}
            <div>
              <Label className="text-sm font-medium">AI Analysis Reasoning</Label>
              <div className="mt-1 space-y-1">
                {analysisResult.reasoning.map((reason, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearchWithAnalysis}
              className="w-full"
              size="lg"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Search for Similar Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}