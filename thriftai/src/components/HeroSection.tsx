import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DynamicContent from './DynamicContent';
import PriceRangeSlider from './PriceRangeSlider';

interface HeroSectionProps {
  onSearch: (query: string) => Promise<void>;
  onVisualSearch: (file: File) => Promise<void>;
}

interface PriceRange {
  min: number;
  max: number;
}

interface CategoryItem {
  name: string;
  icon: string;
  emoji: string; // Cute animated emoji for the category
  subcategories?: {
    name: string;
    types: string[];
  }[];
}

const CATEGORIES: CategoryItem[] = [
  {
    name: 'Fashion & Apparel',
    icon: 'fas fa-tshirt',
    emoji: '👗',
    subcategories: [
      { name: 'Designer Bags', types: ['Handbags', 'Backpacks', 'Clutches', 'Totes', 'Crossbody'] },
      { name: 'Clothing', types: ['Jackets', 'Dresses', 'Jeans', 'T-Shirts', 'Sweaters'] },
      { name: 'Shoes', types: ['Sneakers', 'Boots', 'Heels', 'Sandals', 'Loafers'] },
      { name: 'Accessories', types: ['Belts', 'Scarves', 'Hats', 'Sunglasses', 'Wallets'] }
    ]
  },
  {
    name: 'Electronics',
    icon: 'fas fa-laptop',
    emoji: '💻',
    subcategories: [
      { name: 'Computers', types: ['Laptops', 'Desktops', 'Tablets', 'Monitors', 'Keyboards'] },
      { name: 'Phones', types: ['iPhone', 'Samsung', 'Google Pixel', 'OnePlus', 'Accessories'] },
      { name: 'Gaming', types: ['PlayStation', 'Xbox', 'Nintendo Switch', 'Gaming PCs', 'Controllers'] },
      { name: 'Audio', types: ['Headphones', 'Speakers', 'Earbuds', 'Turntables', 'Amplifiers'] }
    ]
  },
  {
    name: 'Home & Garden',
    icon: 'fas fa-home',
    emoji: '🏡',
    subcategories: [
      { name: 'Furniture', types: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Desks'] },
      { name: 'Decor', types: ['Wall Art', 'Mirrors', 'Rugs', 'Lamps', 'Vases'] },
      { name: 'Kitchen', types: ['Appliances', 'Cookware', 'Dinnerware', 'Glassware', 'Utensils'] },
      { name: 'Garden', types: ['Tools', 'Plants', 'Outdoor Furniture', 'Grills', 'Planters'] }
    ]
  },
  {
    name: 'Jewelry & Watches',
    icon: 'fas fa-gem',
    emoji: '💎',
    subcategories: [
      { name: 'Watches', types: ['Luxury Watches', 'Smart Watches', 'Vintage Watches', 'Sports Watches'] },
      { name: 'Jewelry', types: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches'] },
      { name: 'Fine Jewelry', types: ['Diamond', 'Gold', 'Silver', 'Platinum', 'Gemstones'] }
    ]
  },
  {
    name: 'Collectibles & Art',
    icon: 'fas fa-palette',
    emoji: '🎨',
    subcategories: [
      { name: 'Art', types: ['Paintings', 'Prints', 'Sculptures', 'Photography', 'Digital Art'] },
      { name: 'Vintage', types: ['Antiques', 'Coins', 'Stamps', 'Postcards', 'Maps'] },
      { name: 'Toys', types: ['Action Figures', 'LEGO', 'Dolls', 'Models', 'Trading Cards'] },
      { name: 'Books', types: ['First Editions', 'Rare Books', 'Comics', 'Manga', 'Vinyl Records'] }
    ]
  },
  {
    name: 'Sports & Outdoors',
    icon: 'fas fa-basketball-ball',
    emoji: '⚽',
    subcategories: [
      { name: 'Fitness', types: ['Weights', 'Yoga', 'Cardio Equipment', 'Resistance Bands'] },
      { name: 'Outdoor Gear', types: ['Camping', 'Hiking', 'Fishing', 'Climbing', 'Kayaking'] },
      { name: 'Sports Equipment', types: ['Basketball', 'Soccer', 'Tennis', 'Golf', 'Baseball'] },
      { name: 'Bikes', types: ['Road Bikes', 'Mountain Bikes', 'Electric Bikes', 'BMX'] }
    ]
  },
  {
    name: 'Music & Instruments',
    icon: 'fas fa-guitar',
    emoji: '🎸',
    subcategories: [
      { name: 'Guitars', types: ['Electric', 'Acoustic', 'Bass', 'Classical', 'Vintage'] },
      { name: 'Keyboards', types: ['Pianos', 'Synthesizers', 'MIDI Controllers', 'Organs'] },
      { name: 'Drums', types: ['Drum Kits', 'Cymbals', 'Electronic Drums', 'Percussion'] },
      { name: 'Recording', types: ['Microphones', 'Audio Interfaces', 'Mixers', 'Studio Monitors'] }
    ]
  },
  {
    name: 'Photography & Cameras',
    icon: 'fas fa-camera',
    emoji: '📷',
    subcategories: [
      { name: 'Cameras', types: ['DSLR', 'Mirrorless', 'Film Cameras', 'Action Cams', 'Drones'] },
      { name: 'Lenses', types: ['Prime Lenses', 'Zoom Lenses', 'Wide Angle', 'Telephoto'] },
      { name: 'Accessories', types: ['Tripods', 'Bags', 'Filters', 'Flash', 'Memory Cards'] }
    ]
  }
];

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onVisualSearch }) => {
  const router = useRouter();

  // State management
  const [query, setQuery] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 1000 });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [showDynamicContent, setShowDynamicContent] = useState(false);
  const [dynamicContentType, setDynamicContentType] = useState<string>('');
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryItem | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string | null>(null);
  const [searchTerms, setSearchTerms] = React.useState<string[]>([]);

  // Continuous scrolling animation like a screensaver
  React.useEffect(() => {
    const scrollSpeed = 0.5; // pixels per frame
    const itemHeight = 80; // approximate height of each item in pixels
    const totalHeight = CATEGORIES.length * itemHeight;

    const animate = () => {
      setScrollOffset((prev) => {
        const newOffset = prev + scrollSpeed;
        // Reset when we've scrolled past all items
        return newOffset >= totalHeight ? 0 : newOffset;
      });
    };

    const animationFrame = setInterval(animate, 16); // ~60fps
    return () => clearInterval(animationFrame);
  }, []);

  /**
   * Build search query with price range filters
   */
  const buildSearchQuery = (baseQuery: string, range: PriceRange): string => {
    if (range.min > 0) {
      return `${baseQuery} between $${range.min} and $${range.max}`;
    }
    if (range.max < 1000) {
      return `${baseQuery} under $${range.max}`;
    }
    return baseQuery;
  };

  /**
   * Handle search submission
   */
  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const searchQuery = buildSearchQuery(query, priceRange);
      await onSearch(searchQuery);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press in search textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  /**
   * Handle visual search image upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsVisualLoading(true);
    try {
      await onVisualSearch(file);
    } catch (error) {
      alert('Visual search failed. Please try again.');
    } finally {
      setIsVisualLoading(false);
      e.target.value = '';
    }
  };

  /**
   * Set query from suggestion
   */
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  /**
   * Handle category selection
   */
  const handleCategoryClick = (category: CategoryItem) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSearchTerms([category.name]);
    setQuery(category.name);
  };

  /**
   * Handle subcategory selection
   */
  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    if (selectedCategory) {
      const newTerms = [selectedCategory.name, subcategory];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    }
  };

  /**
   * Handle product type selection
   */
  const handleTypeClick = (type: string) => {
    if (selectedCategory && selectedSubcategory) {
      const newTerms = [selectedCategory.name, selectedSubcategory, type];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    } else if (selectedCategory) {
      const newTerms = [selectedCategory.name, type];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    }
  };

  /**
   * Remove a search term
   */
  const removeSearchTerm = (index: number) => {
    const newTerms = searchTerms.filter((_, i) => i !== index);
    setSearchTerms(newTerms);
    setQuery(newTerms.join(' '));

    // Reset navigation state based on remaining terms
    if (index === 0) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else if (index === 1) {
      setSelectedSubcategory(null);
    }
  };

  /**
   * Go back in navigation
   */
  const goBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      if (selectedCategory) {
        setSearchTerms([selectedCategory.name]);
        setQuery(selectedCategory.name);
      }
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSearchTerms([]);
      setQuery('');
    }
  };

  /**
   * Navigation handlers
   */
  const showRecommendations = () => {
    setDynamicContentType('recommendations');
    setShowDynamicContent(true);
  };

  const showBestDeals = () => {
    router.push('/deals');
  };

  const hideDynamicContent = () => {
    setShowDynamicContent(false);
  };

  return (
    <main className="hero-modern animate-fade-in">
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Category Navigation Sidebar - LEFT */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            position: 'sticky',
            top: '100px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}
        >
          <div
            className="card-modern p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            {/* Header with Back Button */}
            <div className="d-flex align-items-center gap-2 mb-3">
              {(selectedCategory || selectedSubcategory) && (
                <button
                  onClick={goBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    fontSize: '1rem'
                  }}
                  title="Go back"
                >
                  <i className="fas fa-arrow-left" />
                </button>
              )}
              <i className="fas fa-layer-group" style={{ color: '#ef4444', fontSize: '1.2rem' }} />
              <h3 className="text-primary font-bold mb-0" style={{ fontSize: '1.1rem' }}>
                {selectedSubcategory ? 'Product Types' : selectedCategory ? 'Subcategories' : '🎯 Browse Categories'}
              </h3>
            </div>

            {/* Breadcrumb Search Terms */}
            {searchTerms.length > 0 && (
              <div className="mb-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {searchTerms.map((term, index) => (
                  <span
                    key={index}
                    className="badge d-flex align-items-center gap-1"
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    {term}
                    <button
                      onClick={() => removeSearchTerm(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '4px',
                        fontSize: '0.9rem'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-secondary mb-3" style={{ fontSize: '0.875rem' }}>
              {selectedCategory ? 'Click to refine your search' : 'Select a category to start'}
            </p>

            {/* Scrolling Content Area */}
            <div
              style={{
                height: '500px',
                overflow: 'hidden',
                position: 'relative',
                maskImage: selectedCategory || selectedSubcategory ? 'none' : 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: selectedCategory || selectedSubcategory ? 'none' : 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transform: selectedCategory || selectedSubcategory ? 'none' : `translateY(-${scrollOffset}px)`,
                  transition: 'none',
                  overflowY: selectedCategory || selectedSubcategory ? 'auto' : 'hidden',
                  maxHeight: '500px'
                }}
              >
                {/* Show Product Types if subcategory selected */}
                {selectedCategory && selectedSubcategory ? (
                  selectedCategory.subcategories
                    ?.find(sub => sub.name === selectedSubcategory)
                    ?.types.map((type, index) => (
                      <button
                        key={index}
                        onClick={() => handleTypeClick(type)}
                        className="text-start"
                        style={{
                          padding: '0.875rem',
                          borderRadius: '12px',
                          border: '1px solid var(--border-primary)',
                          background: 'var(--bg-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03)';
                          e.currentTarget.style.border = '2px solid var(--accent)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.border = '1px solid var(--border-primary)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                      >
                        <span className="text-primary font-semibold" style={{ fontSize: '0.9rem' }}>
                          {type}
                        </span>
                      </button>
                    ))
                ) : selectedCategory ? (
                  /* Show Subcategories if category selected */
                  selectedCategory.subcategories?.map((sub, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubcategoryClick(sub.name)}
                      className="text-start"
                      style={{
                        padding: '0.875rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                        e.currentTarget.style.border = '2px solid var(--accent)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.border = '1px solid var(--border-primary)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-primary font-semibold" style={{ fontSize: '0.9rem' }}>
                          {sub.name}
                        </span>
                        <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent)', fontSize: '0.7rem' }}>
                          {sub.types.length}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  /* Show Categories (scrolling) */
                  [...CATEGORIES, ...CATEGORIES].map((category, index) => (
                    <button
                      key={index}
                      onClick={() => handleCategoryClick(category)}
                      className="text-start category-item-animated"
                      style={{
                        padding: '0.875rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.border = '2px solid var(--accent)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.border = '1px solid var(--border-primary)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="category-emoji-container">
                          <span className="category-emoji" style={{ fontSize: '2.5rem' }}>
                            {category.emoji}
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="text-primary font-semibold" style={{ fontSize: '0.95rem' }}>
                              {category.name}
                            </span>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: 'var(--accent)',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {category.subcategories?.length || 0} subcategories
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-sparkles" style={{ color: 'var(--accent)' }} />
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {selectedCategory ? 'Drill down to find exactly what you want' : 'Click to explore categories'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <div className="hero-content">
            {/* Hero Title */}
            <h1 className="hero-title">
              Discover amazing finds with{' '}
              <span className="text-gradient-primary">Veritas.ai</span>
            </h1>

            <p className="hero-subtitle">
              Your intelligent shopping companion for finding unique items, incredible deals,
              and hidden gems across the thrift marketplace.
            </p>

            {/* Search Interface */}
            <div className="search-container-modern animate-slide-up">
              <div className="search-input-area">
                <textarea
                  className="search-textarea"
                  placeholder="What treasures are you looking for today? Try: 'Find me a vintage leather jacket' or 'Show me modern home decor'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  aria-label="Search query"
                />

                <div className="search-button-container">
                  {/* Trending Button */}
                  <button
                    className="search-btn-modern search-btn-secondary"
                    type="button"
                    onClick={() => router.push('/swipe')}
                    title="Trending Finds"
                    aria-label="Trending finds"
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none',
                      color: '#fff'
                    }}
                  >
                    <i className="fas fa-fire" />
                  </button>

                  {/* Visual Search Button */}
                  <button
                    className="search-btn-modern search-btn-secondary file-input-container"
                    type="button"
                    onClick={() => document.getElementById('visual-search-input')?.click()}
                    disabled={isVisualLoading}
                    title="Search by image"
                    aria-label="Visual search"
                  >
                    {isVisualLoading ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <i className="fas fa-camera" />
                    )}
                    <input
                      id="visual-search-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isVisualLoading}
                      className="file-input-hidden"
                      aria-label="Upload image for visual search"
                    />
                  </button>

                  {/* Search Button */}
                  <button
                    className="search-btn-modern search-btn-primary"
                    type="button"
                    onClick={handleSearch}
                    disabled={isLoading}
                    title="Search"
                    aria-label="Submit search"
                  >
                    {isLoading ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <i className="fas fa-arrow-right" />
                    )}
                  </button>
                </div>
              </div>

              {/* Price Range Slider */}
              <PriceRangeSlider
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
              />
            </div>

            {/* Dynamic Content Area */}
            {showDynamicContent && (
              <div className="mt-5 animate-slide-up">
                <DynamicContent
                  type={dynamicContentType}
                  onHide={hideDynamicContent}
                  onSearch={selectSuggestion}
                />
              </div>
            )}
          </div>
        </div>

        {/* Best Deals Sidebar - RIGHT */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            position: 'sticky',
            top: '100px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}
        >
          <div
            className="card-modern p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="fas fa-tags" style={{ color: '#ef4444', fontSize: '1.2rem' }} />
              <h3 className="text-primary font-bold mb-0" style={{ fontSize: '1.1rem' }}>
                🔥 Best Deals
              </h3>
            </div>

            <p className="text-secondary mb-3" style={{ fontSize: '0.875rem' }}>
              AI-curated deals with biggest price drops
            </p>

            <button
              onClick={showBestDeals}
              className="w-100 text-start"
              style={{
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '0.75rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.border = '2px solid #ef4444';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.border = '1px solid var(--border-primary)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '2rem' }}>💰</div>
                <div className="flex-grow-1">
                  <div className="text-primary font-semibold mb-1" style={{ fontSize: '0.95rem' }}>
                    Today's Hot Deals
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                    Up to 80% off retail prices
                  </div>
                </div>
                <i className="fas fa-arrow-right" style={{ color: '#ef4444' }} />
              </div>
            </button>

            <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="fas fa-fire" style={{ color: '#ef4444' }} />
                <span className="text-primary font-semibold" style={{ fontSize: '0.85rem' }}>
                  Trending Deals
                </span>
              </div>
              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                • Designer handbags - 70% off<br />
                • Vintage electronics - 60% off<br />
                • Premium watches - 65% off<br />
                • Home decor - 75% off
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HeroSection;
