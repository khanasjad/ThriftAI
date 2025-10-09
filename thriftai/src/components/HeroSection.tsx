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

const SEARCH_SUGGESTIONS = [
  { text: 'Find vintage designer bags', icon: 'fas fa-handbag' },
  { text: 'Best tech deals under $100', icon: 'fas fa-laptop' },
  { text: 'Sustainable fashion options', icon: 'fas fa-leaf' },
  { text: 'Rare collectibles and art', icon: 'fas fa-palette' },
  { text: 'Home decor inspiration', icon: 'fas fa-home' },
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
   * Navigation handlers
   */
  const showRecommendations = () => {
    setDynamicContentType('recommendations');
    setShowDynamicContent(true);
  };

  const showTrending = () => {
    router.push('/swipe');
  };

  const showPriceComparison = () => {
    setDynamicContentType('price');
    setShowDynamicContent(true);
  };

  const hideDynamicContent = () => {
    setShowDynamicContent(false);
  };

  return (
    <main className="hero-modern animate-fade-in">
      <div className="hero-content">
        {/* Hero Title */}
        <h1 className="hero-title">
          Discover amazing finds with{' '}
          <span className="text-gradient-primary">Veritas.ai</span>
        </h1>

        <p className="hero-subtitle">
          Your intelligent shopping companion for finding unique items, incredible deals,
          and sustainable treasures across the thrift marketplace.
        </p>

        {/* Search Interface */}
        <div className="search-container-modern animate-slide-up">
          <div className="search-input-area">
            <textarea
              className="search-textarea"
              placeholder="What treasures are you looking for today? Try: 'Find me a vintage leather jacket' or 'Show me sustainable home decor'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              aria-label="Search query"
            />

            <div className="search-button-container">
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

          {/* Search Suggestions */}
          <div className="suggestions-container">
            {SEARCH_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => selectSuggestion(suggestion.text)}
                aria-label={`Search for ${suggestion.text}`}
              >
                <i className={suggestion.icon} />
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="container mt-5">
          <div className="row g-4 justify-content-center">
            {/* Personal Curator */}
            <div className="col-lg-4 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-100"
                onClick={showRecommendations}
                type="button"
                aria-label="Open personal recommendations"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-magic" />
                </div>
                <h3 className="feature-card-title">Personal Curator</h3>
                <p className="feature-card-description">
                  Get personalized recommendations tailored to your taste and shopping history
                </p>
              </button>
            </div>

            {/* Trending Finds */}
            <div className="col-lg-4 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-200"
                onClick={showTrending}
                type="button"
                aria-label="Show trending finds"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-fire" />
                </div>
                <h3 className="feature-card-title">Trending Finds</h3>
                <p className="feature-card-description">
                  Discover what's hot right now and find trending items before they're gone
                </p>
              </button>
            </div>

            {/* Price Intelligence */}
            <div className="col-lg-4 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-300"
                onClick={showPriceComparison}
                type="button"
                aria-label="Show price intelligence"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-chart-line" />
                </div>
                <h3 className="feature-card-title">Price Intelligence</h3>
                <p className="feature-card-description">
                  Compare prices across platforms and get alerts for the best deals and savings
                </p>
              </button>
            </div>
          </div>
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
    </main>
  );
};

export default HeroSection;
