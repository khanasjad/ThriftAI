import React, { useState } from 'react';
import DynamicContent from './DynamicContent';

interface HeroSectionProps {
  onSearch: (query: string) => Promise<void>;
  onVisualSearch: (file: File) => Promise<void>;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onVisualSearch }) => {
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
    setDynamicContentType('trending');
    setShowDynamicContent(true);
  };

  const showPriceComparison = () => {
    setDynamicContentType('price');
    setShowDynamicContent(true);
  };

  const hideDynamicContent = () => {
    setShowDynamicContent(false);
  };

  return (
    <main className="py-4">
      {/* Claude-like AI Search Hero Section */}
      <div className="claude-hero">
        <div className="claude-search-container">
          <h1 className="display-3 fw-light mb-4">
            How can <span className="text-gradient-primary fw-bold">ThriftAI</span> help you today?
          </h1>

          <p className="lead text-muted mb-5">Ask me anything about thrift shopping, products, or deals</p>

          {/* Claude-style Input Area */}
          <div className="claude-input-area">
            <textarea
              className="form-control claude-textarea"
              placeholder="What are you looking for? Try asking: 'Find me a vintage leather jacket under $50' or 'Show me the best tech deals this week'..."
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            <button
              className="claude-send-btn"
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>

            <div className="claude-visual-search-btn" title="Search by image">
              {isVisualLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-camera"></i>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isVisualLoading}
              />
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="claude-suggestions">
            <span className="claude-suggestion" onClick={() => askClaude('Find me vintage designer items')}>
              Vintage designer items
            </span>
            <span className="claude-suggestion" onClick={() => askClaude('Best deals under $25')}>
              Best deals under $25
            </span>
            <span className="claude-suggestion" onClick={() => askClaude('Sustainable fashion options')}>
              Sustainable fashion
            </span>
            <span className="claude-suggestion" onClick={() => askClaude('Electronics and gadgets')}>
              Electronics & gadgets
            </span>
            <span className="claude-suggestion" onClick={() => askClaude('Help me find a gift')}>
              Help me find a gift
            </span>
          </div>

          {/* Advanced Search Options */}
          <div className="advanced-search-section mt-4">
            <div className="row g-3">
              <div className="col-md-3">
                <button className="btn btn-outline-light w-100" onClick={openAdvancedFilters}>
                  <i className="fas fa-filter me-2"></i>Advanced Filters
                </button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-outline-light w-100" onClick={showRecommendations}>
                  <i className="fas fa-star me-2"></i>Get Recommendations
                </button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-outline-light w-100" onClick={showTrending}>
                  <i className="fas fa-fire me-2"></i>Trending Now
                </button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-outline-light w-100" onClick={showPriceComparison}>
                  <i className="fas fa-chart-line me-2"></i>Price Insights
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          {showDynamicContent && (
            <DynamicContent
              type={dynamicContentType}
              onHide={hideDynamicContent}
              onSearch={askClaude}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default HeroSection;