# ThriftAI - World-Class UI Design System

> **Inspiration**: Apple minimalism + Tesla sophistication
> **Philosophy**: Less is more, every pixel has purpose

---

## 🎨 Design Principles

1. **Minimalism**: Clean, spacious, uncluttered
2. **Precision**: Pixel-perfect alignment, consistent spacing
3. **Premium**: Sophisticated colors, smooth animations
4. **Clarity**: Clear hierarchy, readable typography
5. **Performance**: Smooth 60fps animations, instant feedback

---

## 📝 Typography System

### Primary Font: **Inter**
- Used for: Body text, UI elements
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Why: Highly legible, modern, optimized for screens

### Display Font: **SF Pro Display** (Apple's font)
- Used for: Headlines, hero text
- Weights: 600 (Semibold), 700 (Bold), 800 (Heavy), 900 (Black)
- Why: Premium feel, Apple-like sophistication

### Scale
```
Display XL: 72px / 4.5rem - Weight 800 (Hero headlines)
Display LG: 60px / 3.75rem - Weight 700 (Section titles)
Display MD: 48px / 3rem - Weight 700 (Page titles)
Display SM: 36px / 2.25rem - Weight 600 (Subsection titles)

Heading XL: 30px / 1.875rem - Weight 600 (Card titles)
Heading LG: 24px / 1.5rem - Weight 600 (Component headers)
Heading MD: 20px / 1.25rem - Weight 600 (Labels)
Heading SM: 18px / 1.125rem - Weight 600 (Small headers)

Body LG: 18px / 1.125rem - Weight 400 (Lead paragraphs)
Body: 16px / 1rem - Weight 400 (Standard text)
Body SM: 14px / 0.875rem - Weight 400 (Secondary text)
Caption: 12px / 0.75rem - Weight 500 (Labels, tags)
```

---

## 🎨 Color Palette

### Neutrals (Primary)
```css
Pure White: #FFFFFF
Gray 50: #FAFAFA (Backgrounds)
Gray 100: #F5F5F7 (Light backgrounds - Apple gray)
Gray 200: #E8E8ED (Borders)
Gray 300: #D2D2D7 (Dividers)
Gray 400: #B0B0B0 (Disabled)
Gray 500: #86868B (Secondary text)
Gray 600: #6E6E73 (Tertiary text)
Gray 700: #515154 (Body text)
Gray 800: #1D1D1F (Headings)
Pure Black: #000000
```

### Accent Colors
```css
Blue (Primary): #0071E3 (Apple blue)
Blue Dark: #0051A8 (Hover state)
Green (Success): #30D158 (Apple green)
Orange (Warning): #FF9F0A (Apple orange)
Red (Error): #FF3B30 (Apple red)
Purple (Premium): #BF5AF2 (Apple purple)
```

### Veritas Score Gradients
```css
Exceptional (90-100): linear-gradient(135deg, #34C759, #30D158)
Excellent (80-89): linear-gradient(135deg, #007AFF, #0071E3)
Good (70-79): linear-gradient(135deg, #BF5AF2, #AF52DE)
Fair (60-69): linear-gradient(135deg, #FF9F0A, #FF9500)
Poor (<60): linear-gradient(135deg, #FF3B30, #FF2D20)
```

---

## 📐 Spacing System

Based on 4px grid (Apple standard)

```
XS: 4px (0.25rem) - Tight spacing
SM: 8px (0.5rem) - Icon padding
MD: 16px (1rem) - Standard gap
LG: 24px (1.5rem) - Section spacing
XL: 32px (2rem) - Large gaps
2XL: 48px (3rem) - Hero spacing
3XL: 64px (4rem) - Section padding
```

---

## 🔲 Border Radius

```
SM: 6px - Small buttons, tags
MD: 8px - Input fields
LG: 12px - Cards
XL: 16px - Large cards
2XL: 24px - Hero cards
Full: 9999px - Pills, avatars
```

---

## 🌑 Shadows

```css
SM: 0 1px 2px rgba(0, 0, 0, 0.05) - Subtle elevation
MD: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06) - Cards
LG: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05) - Hover
XL: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04) - Modal
2XL: 0 25px 50px rgba(0, 0, 0, 0.25) - Hero elements
```

---

## ⚡ Animation

### Timing Functions
```css
Fast: 150ms cubic-bezier(0.4, 0, 0.2, 1) - Quick feedback
Base: 200ms cubic-bezier(0.4, 0, 0.2, 1) - Standard
Slow: 300ms cubic-bezier(0.4, 0, 0.2, 1) - Smooth transitions
Smooth: 400ms cubic-bezier(0.4, 0, 0.2, 1) - Premium feel
```

### Animations
- **Fade In**: Opacity 0 → 1, translateY 10px → 0
- **Slide In**: translateX -100% → 0
- **Scale**: scale 0.98 on click (active state)
- **Hover Lift**: translateY 0 → -2px

---

## 🎯 Component Examples

### Button - Primary
```tsx
<button className="
  bg-[#0071E3]
  text-white
  px-6 py-3
  rounded-2xl
  font-medium
  transition-all duration-200
  hover:bg-[#0051A8]
  hover:shadow-lg
  active:scale-[0.98]
">
  Get Started
</button>
```

### Product Card
```tsx
<div className="
  bg-white
  rounded-3xl
  shadow-md
  overflow-hidden
  transition-all duration-200
  hover:shadow-xl
  hover:-translate-y-0.5
">
  {/* Content */}
</div>
```

### Score Badge
```tsx
<div className="
  bg-gradient-to-br from-[#34C759] to-[#30D158]
  text-white
  px-4 py-2
  rounded-full
  font-semibold
  shadow-lg
">
  95
</div>
```

### Glassmorphism Card
```tsx
<div className="
  bg-white/70
  backdrop-blur-lg
  border border-white/30
  rounded-2xl
  shadow-lg
">
  {/* Content */}
</div>
```

---

## 🖼️ Layout Examples

### Hero Section (Apple-style)
```tsx
<section className="py-24 text-center">
  <h1 className="text-7xl font-black text-gray-900 mb-6 tracking-tight">
    Smart Shopping,
    <span className="block bg-gradient-to-r from-[#0071E3] to-[#BF5AF2] bg-clip-text text-transparent">
      Powered by AI
    </span>
  </h1>
  <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
    Discover the best deals with our intelligent scoring system.
    Save money, shop smarter.
  </p>
  <button className="bg-[#0071E3] text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-[#0051A8] transition-all duration-200 hover:shadow-xl">
    Start Saving Today
  </button>
</section>
```

### Product Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</div>
```

### Navigation (Minimal)
```tsx
<nav className="bg-white/70 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="text-2xl font-bold text-gray-900">
      Thrift<span className="text-[#0071E3]">AI</span>
    </div>
    <div className="flex gap-8">
      <a href="/products" className="text-gray-700 hover:text-gray-900">Products</a>
      <a href="/deals" className="text-gray-700 hover:text-gray-900">Deals</a>
      <a href="/about" className="text-gray-700 hover:text-gray-900">About</a>
    </div>
    <button className="bg-[#0071E3] text-white px-6 py-2 rounded-full font-medium">
      Sign In
    </button>
  </div>
</nav>
```

---

## 🎨 Logo Design Concept

### ThriftAI Logo
```
Style: Minimal, modern, tech-forward
Symbol: Stylized "T" with AI circuit pattern
Colors:
  - Primary: #0071E3 (Blue)
  - Accent: #BF5AF2 (Purple)
Typography: SF Pro Display Bold
Tagline: "Smart Shopping, Powered by AI"
```

### Logo Variations
1. **Full Logo**: Symbol + Wordmark + Tagline
2. **Compact**: Symbol + Wordmark
3. **Icon Only**: Just the "T" symbol (for favicons)
4. **Monochrome**: Black version for light backgrounds

---

## 📱 Responsive Breakpoints

```css
Mobile: < 768px (Stack everything)
Tablet: 768px - 1024px (2 columns)
Desktop: 1024px - 1280px (3 columns)
Large: > 1280px (4 columns)
```

---

## ♿ Accessibility

- **Contrast Ratios**: WCAG AAA (7:1 for body text)
- **Focus States**: 2px blue outline, 2px offset
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full support
- **Screen Readers**: Semantic HTML, ARIA labels

---

## 🎯 Implementation Priority

### Phase 1: Foundation (Day 1)
- [ ] Update `globals.css` with design system
- [ ] Add Inter and SF Pro fonts
- [ ] Create color variables
- [ ] Set up spacing system

### Phase 2: Components (Day 2-3)
- [ ] Redesign ProductCard (Apple style)
- [ ] Create new Button components
- [ ] Build ScoreBreakdown modal
- [ ] Update Navigation

### Phase 3: Pages (Day 4-5)
- [ ] Redesign Home page (Hero section)
- [ ] Update Products listing
- [ ] Polish Product detail page
- [ ] Create Comparison view

### Phase 4: Polish (Day 6-7)
- [ ] Add animations
- [ ] Implement dark mode
- [ ] Optimize performance
- [ ] Final QA

---

## 🎬 Animation Examples

### Page Load
```tsx
// Stagger children with fade-in
{products.map((product, index) => (
  <div
    key={product.id}
    className="animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <ProductCard {...product} />
  </div>
))}
```

### Hover Effect
```css
.card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}
```

### Score Reveal
```tsx
// Count up animation for score
useEffect(() => {
  let start = 0;
  const end = veritasScore;
  const duration = 1000;
  const increment = end / (duration / 16);

  const timer = setInterval(() => {
    start += increment;
    if (start >= end) {
      clearInterval(timer);
      start = end;
    }
    setDisplayScore(Math.round(start));
  }, 16);

  return () => clearInterval(timer);
}, [veritasScore]);
```

---

## 💎 Premium Touches

1. **Micro-interactions**: Buttons respond to hover/click
2. **Smooth Scrolling**: Native smooth scroll behavior
3. **Loading States**: Skeleton screens, not spinners
4. **Empty States**: Beautifully designed, not just text
5. **Error States**: Friendly, helpful, actionable
6. **Success States**: Celebratory, satisfying feedback

---

*This design system creates a world-class, premium experience worthy of Apple and Tesla.* ✨
