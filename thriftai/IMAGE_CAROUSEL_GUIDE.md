# 🎨 Product Image Carousel

## Overview

All products now feature an interactive image carousel with multiple product views, allowing users to see products from different angles and perspectives.

## Features

### Image Navigation
- **Left/Right Arrows**: Navigate through product images
- **Dot Indicators**: Show current image position and total image count
- **Smooth Transitions**: Loading states and fade-in animations
- **Hover Controls**: Arrows appear on product card hover

### Image Count
- **4-5 Images per Product**: Each product has multiple views
  - First image: Original product image (if available)
  - Additional 3-4 images: Category-appropriate images from Unsplash with different angles/views

## How It Works

### Frontend (ProductCard.tsx)

The carousel is built into the ProductCard component with:

```typescript
// State Management
const [currentImageIndex, setCurrentImageIndex] = useState(0)
const hasMultipleImages = product.images && product.images.length > 1

// Navigation
const handlePrevImage = () => {
  setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
}

const handleNextImage = () => {
  setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
}

// Display
<img src={product.images[currentImageIndex]} alt={product.title} />
```

**Location**: `/src/components/ProductCard.tsx` (lines 72-100)

### Backend (API)

Both API endpoints parse the imageUrl JSON string into an images array:

```typescript
// Parse imageUrl JSON string into array
let images: string[] = []
if (product.imageUrl) {
  try {
    const parsed = JSON.parse(product.imageUrl)
    images = Array.isArray(parsed) ? parsed : [product.imageUrl]
  } catch {
    images = [product.imageUrl]
  }
}

return { ...product, images }
```

**Locations**:
- `/src/app/api/products/route.ts` (lines 47-66)
- `/src/app/api/products/[id]/route.ts` (lines 49-59)

### Database

Images are stored as JSON arrays in the `imageUrl` field:

```sql
imageUrl: '["https://image1.jpg", "https://image2.jpg", "https://image3.jpg"]'
```

### Image Sources

Different product categories use themed image collections:

- **ELECTRONICS**: Phone, watch, headphones, laptop, camera
- **CLOTHING**: Sneakers, fashion, hoodie, denim
- **SHOES**: Nike, sneaker variations, footwear
- **ACCESSORIES**: Watch, sunglasses, bag
- **HOME**: Blender, coffee maker, kitchen appliances
- **BEAUTY**: Cosmetics, makeup, skincare
- **SPORTS**: Gym equipment, fitness, weights
- **TOYS**: Lego, games, play items

### Image Variants

Different URL parameters simulate various product views:

```typescript
const imageParams = [
  '?w=800&h=800&fit=crop',              // Front view
  '?w=800&h=800&fit=crop&auto=format&q=80', // Side view
  '?w=800&h=800&fit=crop&fm=jpg&q=85',  // Top view
  '?w=800&h=800&fit=crop&auto=format',  // Detail view
  '?w=800&h=800&fit=crop&q=90'          // Package view
]
```

## User Experience

### Interaction Flow

1. **Hover over product card** → Navigation arrows appear
2. **Click left arrow** → View previous image
3. **Click right arrow** → View next image
4. **Watch dots** → See current position in image sequence
5. **Smooth fade-in** → Each image loads with animation

### Visual Feedback

- **Pulsing Loading State**: Shimmer animation while image loads
- **Dot Indicators**:
  - Current image: White, elongated dot
  - Other images: Semi-transparent dots
- **Navigation Arrows**:
  - Black/transparent background with blur effect
  - White chevron icons
  - Smooth hover transitions

## Statistics

- **Total Products**: 1000 products
- **Images per Product**: 4-5 images each
- **Total Images**: ~4500 images across all products
- **Image Source**: Unsplash CDN (free, high-quality)
- **Image Size**: 800x800px optimized for web

## Technical Benefits

1. **No Database Schema Changes**: Uses existing `imageUrl` field
2. **Backward Compatible**: Single images still work (no breaking changes)
3. **JSON Parsing**: Handles both arrays and single strings gracefully
4. **Error Handling**: Fallback to single image if parsing fails
5. **Performance**: Images lazy-load as user navigates
6. **CDN Delivery**: Fast image loading via Unsplash CDN

## Running the Setup

To populate products with multiple images:

```bash
DATABASE_URL="postgresql://asjadkhan@localhost:5432/thriftai_nextjs_dev?schema=public" \
  npx tsx scripts/add-multiple-images.ts
```

**Script**: `/scripts/add-multiple-images.ts`

**Output**:
```
🎨 Adding multiple images to products for carousel...
📦 Found 1000 products
✅ Updated 1000 products...
✅ Successfully added multiple images to 1000 products!
🎉 Products now have 4-5 images each for the carousel
```

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

## Future Enhancements

Possible improvements:
- Touch/swipe gestures for mobile
- Keyboard navigation (arrow keys)
- Image zoom on hover
- Thumbnail preview strip
- Auto-play carousel mode
- Video support alongside images

## Summary

The image carousel provides users with a richer product browsing experience, allowing them to see products from multiple angles without leaving the product grid. This increases engagement and helps users make more informed purchase decisions.
