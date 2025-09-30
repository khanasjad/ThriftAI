# Visual Search Implementation Guide

**Feature:** AI-Powered Visual Search
**Priority:** 🔥 CRITICAL
**Estimated Effort:** 2-3 weeks
**Business Impact:** Core product differentiator

---

## 📋 Overview

Enable users to upload images (photos, screenshots, Instagram posts) and find similar fashion products across the marketplace using AI-powered computer vision.

### User Stories
1. As a buyer, I want to upload a photo of clothing I like and find similar items
2. As a buyer, I want to screenshot an Instagram post and find where to buy it cheaper
3. As a buyer, I want to take a photo with my phone camera and instantly search
4. As a buyer, I want to see products ranked by visual similarity

### Success Metrics
- **Accuracy:** >80% relevance in top 10 results
- **Speed:** <3 seconds end-to-end
- **Usage:** 30%+ of all searches use visual search
- **Conversion:** 2x higher than text search

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Image Upload Component                                          │
│  ├─ Drag & Drop Zone                                            │
│  ├─ Camera Capture (Mobile)                                     │
│  ├─ URL Paste (Instagram/Web)                                   │
│  └─ Preview & Crop                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  /api/visual-search/upload                                       │
│  ├─ Validate image (size, format, content)                      │
│  ├─ Generate presigned S3 URL                                   │
│  └─ Return upload URL + search token                            │
│                                                                  │
│  /api/visual-search/search                                       │
│  ├─ Fetch image from S3                                         │
│  ├─ Call embedding service                                      │
│  ├─ Query vector database                                       │
│  └─ Return ranked products                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  AWS S3                                                          │
│  ├─ /uploads/{userId}/{timestamp}.jpg                           │
│  ├─ /products/{productId}/images/*.jpg                          │
│  └─ CloudFront CDN for fast delivery                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AI Embedding Service                        │
├─────────────────────────────────────────────────────────────────┤
│  Option A: OpenAI CLIP (via API)                                │
│  └─ POST image → get 512-d embedding vector                     │
│                                                                  │
│  Option B: Hugging Face CLIP (self-hosted)                      │
│  └─ Run inference → get embedding vector                        │
│                                                                  │
│  Option C: OpenAI Vision API                                    │
│  └─ Describe image + extract embedding                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Vector Database                             │
├─────────────────────────────────────────────────────────────────┤
│  Pinecone / Weaviate / Milvus                                   │
│  ├─ Store: product embeddings + metadata                        │
│  ├─ Index: cosine similarity                                    │
│  └─ Query: k-NN search (k=20-50)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Ranking & Filtering                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Get top 50 similar products                                 │
│  2. Apply filters (price, availability, location)               │
│  3. Re-rank by business logic (price, quality, seller rating)   │
│  4. Return top 20 results                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Database Schema Changes

### New Tables

```prisma
// Visual search queries tracking
model VisualSearch {
  id              String   @id @default(cuid())
  userId          String?
  sessionId       String

  // Image details
  imageUrl        String
  imageS3Key      String
  imageSize       Int      // bytes
  imageWidth      Int
  imageHeight     Int
  imageMimeType   String

  // Embedding
  embedding       String?  @db.Text // JSON array of floats
  embeddingModel  String?  // "clip-vit-base", "openai-clip", etc.

  // Search results
  resultsFound    Int      @default(0)
  topResultId     String?

  // Metadata
  searchDuration  Int?     // milliseconds
  createdAt       DateTime @default(now())

  // Relations
  user            User?    @relation(fields: [userId], references: [id])
  results         VisualSearchResult[]

  @@index([userId])
  @@index([sessionId])
  @@index([createdAt])
  @@map("visual_searches")
}

// Results from visual search
model VisualSearchResult {
  id                String        @id @default(cuid())
  visualSearchId    String
  productId         String

  // Similarity metrics
  similarityScore   Float         // 0.0 to 1.0
  rank              Int           // 1, 2, 3...

  // User interaction
  clicked           Boolean       @default(false)
  purchased         Boolean       @default(false)

  createdAt         DateTime      @default(now())

  // Relations
  visualSearch      VisualSearch  @relation(fields: [visualSearchId], references: [id], onDelete: Cascade)
  product           Product       @relation(fields: [productId], references: [id])

  @@index([visualSearchId])
  @@index([productId])
  @@map("visual_search_results")
}

// Extend Product model
model Product {
  // ... existing fields

  // Visual search fields
  imageEmbedding     String?  @db.Text // JSON array for CLIP embedding
  embeddingVersion   String?  // Track embedding model version
  embeddingUpdatedAt DateTime?

  visualSearchResults VisualSearchResult[]

  // ... existing relations
}
```

### Migration Script

```typescript
// prisma/migrations/add_visual_search.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Adding visual search tables...')

  // Migration will be handled by prisma migrate
  // This is for seeding/initialization

  console.log('✅ Visual search schema ready')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## 🎨 Frontend Implementation

### 1. Image Upload Component

**File:** `src/components/VisualSearch/ImageUpload.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Camera, Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onImageSelected: (file: File) => void
  onUrlPasted: (url: string) => void
}

export default function ImageUpload({ onImageSelected, onUrlPasted }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Drag & drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]

      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        alert('Image too large. Maximum size is 10MB.')
        return
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)

      onImageSelected(file)
    }
  }, [onImageSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxFiles: 1,
    multiple: false
  })

  // Camera capture (mobile)
  const handleCameraCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use rear camera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
        onImageSelected(file)
      }
    }
    input.click()
  }

  // URL paste handler
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return

    setLoading(true)
    try {
      // Download image from URL
      const response = await fetch(`/api/visual-search/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      })

      if (!response.ok) throw new Error('Failed to fetch image')

      const blob = await response.blob()
      const file = new File([blob], 'pasted-image.jpg', { type: blob.type })

      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)

      onImageSelected(file)
      onUrlPasted(urlInput)
    } catch (error) {
      alert('Failed to load image from URL. Please try uploading directly.')
    } finally {
      setLoading(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setUrlInput('')
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {!preview ? (
        <>
          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop image here' : 'Upload an image'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag & drop, or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Supports: JPG, PNG, WebP, GIF (max 10MB)
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCameraCapture}
              className="flex items-center justify-center gap-2 p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Take Photo</span>
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={loading || !urlInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Image Preview */
        <div className="relative">
          <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
```

### 2. Visual Search Page

**File:** `src/app/visual-search/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import ImageUpload from '@/components/VisualSearch/ImageUpload'
import ProductGrid from '@/components/ProductGrid'
import { Loader2, Camera } from 'lucide-react'

interface SearchResult {
  products: any[]
  totalFound: number
  searchTime: number
}

export default function VisualSearchPage() {
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelected = async (file: File) => {
    setSearching(true)
    setError(null)

    try {
      // Step 1: Upload image to S3
      const uploadResponse = await fetch('/api/visual-search/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, imageKey, searchToken } = await uploadResponse.json()

      // Step 2: Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      // Step 3: Trigger visual search
      const searchResponse = await fetch('/api/visual-search/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKey,
          searchToken,
          filters: {} // Optional filters
        })
      })

      if (!searchResponse.ok) {
        throw new Error('Search failed')
      }

      const searchResults = await searchResponse.json()
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleUrlPasted = async (url: string) => {
    // URL is already fetched in ImageUpload component
    // This is just for analytics tracking
    console.log('Image URL pasted:', url)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold">Visual Search</h1>
              <p className="text-gray-400">Find products by uploading an image</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Upload Section */}
        <div className="mb-12">
          <ImageUpload
            onImageSelected={handleImageSelected}
            onUrlPasted={handleUrlPasted}
          />
        </div>

        {/* Loading State */}
        {searching && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-4" />
            <p className="text-xl font-semibold">Analyzing image...</p>
            <p className="text-gray-400 mt-2">Finding similar products using AI</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {results && !searching && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {results.totalFound} Similar Products
                </h2>
                <p className="text-gray-400">
                  Found in {results.searchTime}ms
                </p>
              </div>
            </div>

            <ProductGrid products={results.products} />
          </div>
        )}
      </main>
    </div>
  )
}
```

---

## 🔧 Backend Implementation

### 1. Upload Endpoint

**File:** `src/app/api/visual-search/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    // Validate
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Generate unique key
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const timestamp = Date.now()
    const randomId = nanoid(10)
    const extension = fileName.split('.').pop()
    const imageKey = `visual-search/${userId}/${timestamp}-${randomId}.${extension}`

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imageKey,
      ContentType: fileType,
      Metadata: {
        'original-filename': fileName,
        'upload-timestamp': timestamp.toString()
      }
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }) // 5 minutes

    // Generate search token for security
    const searchToken = nanoid(32)

    // TODO: Store search token in Redis with expiry (5 minutes)
    // await redis.setex(`visual-search:${searchToken}`, 300, imageKey)

    return NextResponse.json({
      uploadUrl,
      imageKey,
      searchToken,
      expiresIn: 300
    })
  } catch (error) {
    console.error('Visual search upload error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
```

### 2. Search Endpoint

**File:** `src/app/api/visual-search/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/services/embeddingService'
import { searchSimilarProducts } from '@/lib/services/vectorSearchService'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { imageKey, searchToken, filters = {} } = body

    // Validate token
    // TODO: Verify token from Redis
    if (!imageKey || !searchToken) {
      return NextResponse.json(
        { error: 'Invalid search request' },
        { status: 400 }
      )
    }

    // Step 1: Download image from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: imageKey
    })

    const response = await s3Client.send(command)
    const imageBuffer = await response.Body?.transformToByteArray()

    if (!imageBuffer) {
      throw new Error('Failed to download image')
    }

    // Step 2: Generate embedding
    const embedding = await generateEmbedding(Buffer.from(imageBuffer))

    // Step 3: Search vector database
    const similarProducts = await searchSimilarProducts(embedding, {
      limit: 50,
      minScore: 0.7,
      filters
    })

    // Step 4: Fetch full product details
    const productIds = similarProducts.map(p => p.id)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true
      },
      include: {
        seller: {
          select: {
            businessName: true,
            rating: true
          }
        }
      }
    })

    // Step 5: Merge similarity scores with product data
    const resultsWithScores = products.map(product => {
      const match = similarProducts.find(p => p.id === product.id)
      return {
        ...product,
        similarityScore: match?.score || 0
      }
    })

    // Step 6: Sort by similarity
    resultsWithScores.sort((a, b) => b.similarityScore - a.similarityScore)

    // Step 7: Log search for analytics
    const userId = request.headers.get('x-user-id')
    await prisma.visualSearch.create({
      data: {
        userId,
        imageUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`,
        imageS3Key: imageKey,
        embedding: JSON.stringify(embedding),
        resultsFound: resultsWithScores.length,
        topResultId: resultsWithScores[0]?.id,
        searchDuration: Date.now() - startTime
      }
    })

    return NextResponse.json({
      products: resultsWithScores.slice(0, 20), // Return top 20
      totalFound: resultsWithScores.length,
      searchTime: Date.now() - startTime
    })
  } catch (error) {
    console.error('Visual search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
```

---

## 🤖 AI Service Implementation

### Embedding Generation Service

**File:** `src/lib/services/embeddingService.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function generateEmbedding(imageBuffer: Buffer): Promise<number[]> {
  try {
    // Option 1: Use OpenAI Vision API
    const base64Image = imageBuffer.toString('base64')

    // Note: OpenAI doesn't have a direct image embedding endpoint yet
    // We'll use the vision model to describe the image, then embed the description
    const descriptionResponse = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this fashion item in detail, focusing on: type of clothing, color, style, pattern, material, brand (if visible), and key visual features. Be concise but specific.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    })

    const description = descriptionResponse.choices[0].message.content || ''

    // Generate embedding from description
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: description
    })

    return embeddingResponse.data[0].embedding

    // Alternative: Use CLIP via Hugging Face API or self-hosted
    // See alternative implementation below
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw new Error('Failed to generate image embedding')
  }
}

// Alternative: Use Hugging Face CLIP (more accurate for visual similarity)
export async function generateEmbeddingCLIP(imageBuffer: Buffer): Promise<number[]> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY
  const MODEL = 'openai/clip-vit-base-patch32'

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${MODEL}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    }
  )

  if (!response.ok) {
    throw new Error('Hugging Face API request failed')
  }

  const embedding = await response.json()
  return embedding
}
```

---

## 📊 Vector Database Setup

### Pinecone Configuration

**File:** `src/lib/services/vectorSearchService.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone'
import { prisma } from '@/lib/prisma'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

const INDEX_NAME = 'thriftai-products'
const NAMESPACE = 'product-images'

// Initialize index (run once)
export async function initializeIndex() {
  const indexes = await pinecone.listIndexes()

  if (!indexes.indexes?.find(i => i.name === INDEX_NAME)) {
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 1536, // OpenAI embedding dimension
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    })
  }
}

// Index a product
export async function indexProduct(productId: string, embedding: number[]) {
  const index = pinecone.index(INDEX_NAME)

  await index.namespace(NAMESPACE).upsert([
    {
      id: productId,
      values: embedding,
      metadata: {
        productId,
        indexedAt: Date.now()
      }
    }
  ])
}

// Search similar products
export async function searchSimilarProducts(
  embedding: number[],
  options: {
    limit?: number
    minScore?: number
    filters?: any
  } = {}
) {
  const { limit = 50, minScore = 0.7 } = options

  const index = pinecone.index(INDEX_NAME)

  const results = await index.namespace(NAMESPACE).query({
    vector: embedding,
    topK: limit,
    includeMetadata: true
  })

  // Filter by minimum score
  const filtered = results.matches?.filter(match =>
    match.score && match.score >= minScore
  ) || []

  return filtered.map(match => ({
    id: match.metadata?.productId as string,
    score: match.score || 0
  }))
}

// Batch index all products
export async function indexAllProducts() {
  console.log('🚀 Starting batch indexing...')

  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    select: {
      id: true,
      imageUrl: true,
      imageEmbedding: true
    }
  })

  console.log(`📦 Found ${products.length} products to index`)

  for (const product of products) {
    try {
      if (product.imageEmbedding) {
        const embedding = JSON.parse(product.imageEmbedding)
        await indexProduct(product.id, embedding)
        console.log(`✅ Indexed product ${product.id}`)
      } else {
        console.log(`⚠️  Skipping ${product.id} - no embedding`)
      }
    } catch (error) {
      console.error(`❌ Failed to index ${product.id}:`, error)
    }
  }

  console.log('✅ Batch indexing complete')
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**File:** `tests/visual-search.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals'
import { generateEmbedding } from '@/lib/services/embeddingService'
import { searchSimilarProducts } from '@/lib/services/vectorSearchService'
import fs from 'fs'

describe('Visual Search', () => {
  let testEmbedding: number[]

  beforeAll(async () => {
    // Generate embedding from test image
    const testImage = fs.readFileSync('./tests/fixtures/test-product.jpg')
    testEmbedding = await generateEmbedding(testImage)
  })

  describe('Embedding Generation', () => {
    it('should generate embedding of correct dimension', () => {
      expect(testEmbedding).toHaveLength(1536)
    })

    it('should generate consistent embeddings', async () => {
      const testImage = fs.readFileSync('./tests/fixtures/test-product.jpg')
      const embedding1 = await generateEmbedding(testImage)
      const embedding2 = await generateEmbedding(testImage)

      // Embeddings should be very similar (cosine similarity > 0.99)
      const similarity = cosineSimilarity(embedding1, embedding2)
      expect(similarity).toBeGreaterThan(0.99)
    })
  })

  describe('Vector Search', () => {
    it('should find similar products', async () => {
      const results = await searchSimilarProducts(testEmbedding, {
        limit: 10,
        minScore: 0.7
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results.length).toBeLessThanOrEqual(10)

      // Verify results are sorted by score
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score)
      }
    })

    it('should respect minimum score threshold', async () => {
      const results = await searchSimilarProducts(testEmbedding, {
        limit: 100,
        minScore: 0.9
      })

      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0.9)
      })
    })
  })
})

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

---

## 📈 Performance Optimization

### 1. Image Preprocessing

```typescript
// src/lib/utils/imageProcessing.ts
import sharp from 'sharp'

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(224, 224, { // CLIP standard size
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toBuffer()
}
```

### 2. Caching Strategy

```typescript
// Cache embeddings to avoid regeneration
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export async function getCachedEmbedding(imageKey: string): Promise<number[] | null> {
  const cached = await redis.get(`embedding:${imageKey}`)
  return cached ? JSON.parse(cached as string) : null
}

export async function cacheEmbedding(imageKey: string, embedding: number[]) {
  await redis.setex(`embedding:${imageKey}`, 86400, JSON.stringify(embedding)) // 24h TTL
}
```

### 3. Batch Processing

```typescript
// Process multiple images in parallel
export async function batchGenerateEmbeddings(images: Buffer[]): Promise<number[][]> {
  const MAX_CONCURRENT = 5

  const results: number[][] = []
  for (let i = 0; i < images.length; i += MAX_CONCURRENT) {
    const batch = images.slice(i, i + MAX_CONCURRENT)
    const embeddings = await Promise.all(
      batch.map(img => generateEmbedding(img))
    )
    results.push(...embeddings)
  }

  return results
}
```

---

## 🚀 Deployment Checklist

### Infrastructure Setup
- [ ] Create AWS S3 bucket for image storage
- [ ] Configure CloudFront CDN
- [ ] Set up Pinecone account and index
- [ ] Configure environment variables
- [ ] Set up Redis for caching
- [ ] Configure CORS for S3 uploads

### API Keys Required
```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=thriftai-images

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws

# Redis (Upstash)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

### Initial Data Population
- [ ] Run `indexAllProducts()` to populate vector DB
- [ ] Test with sample images
- [ ] Verify search accuracy
- [ ] Monitor API costs

---

## 📊 Success Metrics & Monitoring

### Key Metrics to Track

```typescript
// Analytics events
interface VisualSearchEvent {
  event: 'visual_search_started' | 'visual_search_completed' | 'result_clicked' | 'result_purchased'
  userId?: string
  sessionId: string
  imageKey: string
  resultsFound?: number
  searchTime?: number
  clickedRank?: number
  similarityScore?: number
}

// Track in analytics service
export function trackVisualSearchEvent(event: VisualSearchEvent) {
  // Send to Mixpanel, Amplitude, etc.
}
```

### Dashboard Metrics
- Total visual searches
- Average search time
- Results found per search
- Click-through rate by result rank
- Conversion rate (visual vs text search)
- Top 10 most searched images
- Failed searches (errors, no results)

---

## 🔮 Future Enhancements

### Phase 2 Features
1. **Multi-object detection**
   - Detect multiple items in one image
   - Allow user to select which item to search

2. **Style matching**
   - "Find me something in this style"
   - Abstract style preferences

3. **Outfit completion**
   - Upload jacket → suggest matching pants
   - Build complete outfits

4. **AR try-on integration**
   - Virtual try-on using uploaded photos
   - Size recommendation based on body analysis

5. **Social features**
   - Share visual searches
   - "Search my outfit" challenges
   - Influencer outfit searches

---

## 💬 Support & Resources

### Documentation
- [OpenAI Vision API Docs](https://platform.openai.com/docs/guides/vision)
- [Pinecone Quickstart](https://docs.pinecone.io/docs/quickstart)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [CLIP Paper](https://arxiv.org/abs/2103.00020)

### Community
- GitHub Discussions
- Discord support channel
- Stack Overflow tag: `thriftai`

---

**Ready to implement? Start with the frontend component, then build the API layer, and finally integrate the AI services. Test thoroughly at each stage!** 🚀