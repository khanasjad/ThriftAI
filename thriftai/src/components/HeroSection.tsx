import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DynamicContent from './DynamicContent';

interface HeroSectionProps {
  onSearch: (query: string) => Promise<void>;
  onVisualSearch: (file: File) => Promise<void>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onVisualSearch }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [showDynamicContent, setShowDynamicContent] = useState(false);
  const [dynamicContentType, setDynamicContentType] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      await onSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

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
      e.target.value = ''; // Clear the input
    }
  };

  const askClaude = (suggestion: string) => {
    setQuery(suggestion);
  };

  const openAdvancedFilters = () => {
    setDynamicContentType('filters');
    setShowDynamicContent(true);
  };

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

  const suggestions = [
    { text: 'Find vintage designer bags', icon: 'fas fa-handbag' },
    { text: 'Best tech deals under $100', icon: 'fas fa-laptop' },
    { text: 'Sustainable fashion options', icon: 'fas fa-leaf' },
    { text: 'Rare collectibles and art', icon: 'fas fa-palette' },
    { text: 'Home decor inspiration', icon: 'fas fa-home' }
  ];

  return (
    <main className="hero-modern animate-fade-in">
      <div className="hero-content">
        {/* Modern Hero Title */}
        <h1 className="hero-title">
          Discover amazing finds with{' '}
          <span className="text-gradient-primary">ThriftAI</span>
        </h1>

        <p className="hero-subtitle">
          Your intelligent shopping companion for finding unique items, incredible deals,
          and sustainable treasures across the thrift marketplace.
        </p>

        {/* Modern Search Interface */}
        <div className="search-container-modern animate-slide-up">
          <div className="search-input-area">
            <textarea
              className="search-textarea"
              placeholder="What treasures are you looking for today? Try: 'Find me a vintage leather jacket under $50' or 'Show me sustainable home decor'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            <div className="search-button-container">
              <button
                className="search-btn-modern search-btn-secondary file-input-container"
                type="button"
                onClick={() => document.getElementById('visual-search-input')?.click()}
                disabled={isVisualLoading}
                title="Search by image"
              >
                {isVisualLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-camera"></i>
                )}
                <input
                  id="visual-search-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isVisualLoading}
                  className="file-input-hidden"
                />
              </button>

              <button
                className="search-btn-modern search-btn-primary"
                type="button"
                onClick={handleSearch}
                disabled={isLoading}
                title="Search"
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-arrow-right"></i>
                )}
              </button>
            </div>
          </div>

          {/* Modern Suggestions */}
          <div className="suggestions-container">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => askClaude(suggestion.text)}
              >
                <i className={suggestion.icon}></i>
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Feature Grid */}
        <div className="container mt-5">
          <div className="row g-4 justify-content-center">
            <div className="col-lg-3 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-100"
                onClick={openAdvancedFilters}
                type="button"
                aria-label="Open advanced filters"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-sliders-h"></i>
                </div>
                <h3 className="feature-card-title">
                  Smart Filters
                </h3>
                <p className="feature-card-description">
                  Advanced filtering with AI-powered recommendations based on your style and budget
                </p>
              </button>
            </div>

            <div className="col-lg-3 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-200"
                onClick={showRecommendations}
                type="button"
                aria-label="Show personal recommendations"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-magic"></i>
                </div>
                <h3 className="feature-card-title">
                  Personal Curator
                </h3>
                <p className="feature-card-description">
                  Get personalized recommendations tailored to your taste and shopping history
                </p>
              </button>
            </div>

            <div className="col-lg-3 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-300"
                onClick={showTrending}
                type="button"
                aria-label="Show trending finds"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-fire"></i>
                </div>
                <h3 className="feature-card-title">
                  Trending Finds
                </h3>
                <p className="feature-card-description">
                  Discover what's hot right now and find trending items before they're gone
                </p>
              </button>
            </div>

            <div className="col-lg-3 col-md-6">
              <button
                className="card-modern text-center animate-scale-in animate-delay-400"
                onClick={showPriceComparison}
                type="button"
                aria-label="Show price intelligence"
              >
                <div className="feature-card-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3 className="feature-card-title">
                  Price Intelligence
                </h3>
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
              onSearch={askClaude}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default HeroSection;