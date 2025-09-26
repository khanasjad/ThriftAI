import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navigation from './Navigation';
import Footer from './Footer';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'buyer' | 'seller';
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  aiScore?: number;
  scoreBreakdown?: {
    priceMatching: number;
    categoryRelevance: number;
    brandPreference: number;
    conditionMatching: number;
    valueProposition: number;
    keywordRelevance: number;
  };
  retailPrice?: number;
  savings?: number;
  savingsPercentage?: number;
}

interface SearchResponse {
  products: Product[];
  totalResults: number;
  query: string;
  suggestions?: string[];
  message?: string;
  chatResponse?: string;
  enhancedQuery?: string;
  searchIntent?: {
    style?: string;
    relevantCategories?: string[];
    excludedCategories?: string[];
  };
  aiInsights?: {
    userIntent: string;
    searchSummary: string;
    averageAiScore: number;
    topRecommendation: string;
    totalSavings: number;
  };
  graphs?: {
    priceDistribution: any[];
    categoryBreakdown: any[];
    aiScoreDistribution: any[];
    savingsAnalysis: any[];
  };
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [user, setUser] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    checkAuthStatus();
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/auth/api/status');
      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('No active session');
    }
  };

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    try {
      // TEMPORARILY DISABLED: Check if we have cached results first
      // Force fresh API calls to test enhanced search
      // const cachedResults = sessionStorage.getItem('searchResults');
      // const cachedQuery = sessionStorage.getItem('searchQuery');

      // if (cachedResults && cachedQuery === searchQuery) {
      //   setSearchResults(JSON.parse(cachedResults));
      //   setLoading(false);
      //   return;
      // }

      // 🚀 ENHANCED INTELLIGENT SEMANTIC SEARCH
      // Use our new intelligent semantic search endpoint that provides context-aware filtering
      console.log('🎯 Starting intelligent semantic search for:', searchQuery);

      const response = await axios.post('/buyers/api/claude-ai-search', {
        query: searchQuery,
        userId: user?.id || 'anonymous'
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        console.log('🚀 INTELLIGENT SEARCH API RESPONSE:', response.data);
        console.log('🎯 AI Insights:', response.data.aiInsights);
        console.log('📊 Graphs:', response.data.graphs);
        console.log('🏆 Products with AI scores:', response.data.products?.map((p: any) => ({ name: p.name, aiScore: p.aiScore, category: p.category })));
        console.log('🔍 Search Intent Analysis:', response.data.searchIntent);
        setSearchResults(response.data);
        // Cache the results
        sessionStorage.setItem('searchResults', JSON.stringify(response.data));
        sessionStorage.setItem('searchQuery', searchQuery);
      }
    } catch (error) {
      console.error('Intelligent search error:', error);
      // Fallback to original Claude AI search if intelligent search fails
      try {
        console.log('🔄 Falling back to Claude AI search...');
        const fallbackResponse = await axios.post('/buyers/api/claude-ai-search', {
          query: searchQuery,
          userId: user?.id || 'anonymous'
        });
        setSearchResults(fallbackResponse.data);
        sessionStorage.setItem('searchResults', JSON.stringify(fallbackResponse.data));
        sessionStorage.setItem('searchQuery', searchQuery);
      } catch (fallbackError) {
        console.error('All search methods failed:', fallbackError);
        setError('Failed to perform search. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userType', 'buyer');

      const response = await axios.post('/auth/api/login', formData);

      if (response.status === 200) {
        await checkAuthStatus();
        setShowLoginModal(false);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const handleSignup = async (userData: any): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        formData.append(key, userData[key]);
      });

      const endpoint = userData.accountType === 'seller' ? '/auth/api/signup/seller' : '/auth/api/signup/buyer';
      const response = await axios.post(endpoint, formData);

      if (response.status === 200) {
        setShowSignupModal(false);
        setShowLoginModal(true);
        return { success: true, message: 'Account created successfully! Please log in.' };
      }
      return { success: false, error: 'Failed to create account' };
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response?.data?.includes('Email already exists')) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      return { success: false, error: 'Failed to create account. Please try again.' };
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="SearchResults">
      <Navigation
        user={user}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={handleLogout}
      />

      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="text-gradient-primary mb-3">
              <i className="fas fa-search me-2"></i>
              Search Results for "{query}"
            </h2>

            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-light">Searching for products...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {searchResults && !loading && (
              <div>
                {/* Intelligent Search Intent Section */}
                {searchResults.searchIntent && (
                  <div className="search-intent-section mb-4 p-4 rounded" style={{ background: 'rgba(0, 255, 127, 0.1)', border: '1px solid #00ff7f' }}>
                    <h4 className="text-gradient-primary mb-3">
                      <i className="fas fa-lightbulb me-2"></i>🎯 Intelligent Search Analysis
                    </h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="text-light mb-2">
                          <strong>🔍 Search Type:</strong> {searchResults.searchIntent.style || 'General'}
                        </p>
                        {searchResults.searchIntent.relevantCategories && searchResults.searchIntent.relevantCategories.length > 0 && (
                          <p className="text-success mb-2">
                            <strong>✅ Included Categories:</strong> {searchResults.searchIntent.relevantCategories.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="col-md-6">
                        {searchResults.searchIntent.excludedCategories && searchResults.searchIntent.excludedCategories.length > 0 && (
                          <p className="text-warning mb-2">
                            <strong>🚫 Excluded Categories:</strong> {searchResults.searchIntent.excludedCategories.join(', ')}
                          </p>
                        )}
                        <p className="text-info mb-0">
                          <i className="fas fa-brain me-1"></i>
                          <strong>AI Filtered Results</strong> - Semantically relevant products only
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Insights Section */}
                {searchResults.aiInsights && (
                  <div className="ai-insights-section mb-4 p-4 rounded" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--accent-blue)' }}>
                    <h4 className="text-gradient-primary mb-3">
                      <i className="fas fa-brain me-2"></i>AI Analysis
                    </h4>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="text-light mb-2">
                          <strong>User Intent:</strong> {searchResults.aiInsights.userIntent}
                        </p>
                        <p className="text-light mb-2">
                          <strong>Search Summary:</strong> {searchResults.aiInsights.searchSummary}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="text-light mb-2">
                          <strong>Average AI Score:</strong>
                          <span className="badge bg-primary ms-2">{searchResults.aiInsights.averageAiScore.toFixed(1)}/100</span>
                        </p>
                        <p className="text-light mb-2">
                          <strong>Total Potential Savings:</strong>
                          <span className="text-success ms-2">${searchResults.aiInsights.totalSavings.toFixed(2)}</span>
                        </p>
                        <p className="text-info mb-0">
                          <i className="fas fa-star me-1"></i>
                          <strong>Top Recommendation:</strong> {searchResults.aiInsights.topRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Graph Visualizations Section */}
                {searchResults.graphs && (
                  <div className="graphs-section mb-4">
                    <h4 className="text-gradient-primary mb-3">
                      <i className="fas fa-chart-bar me-2"></i>Data Insights
                    </h4>
                    <div className="row">
                      {searchResults.graphs.priceDistribution && searchResults.graphs.priceDistribution.length > 0 && (
                        <div className="col-md-6 mb-3">
                          <div className="graph-card p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-2">
                              <i className="fas fa-dollar-sign me-1"></i>Price Distribution
                            </h6>
                            <div className="graph-data">
                              {searchResults.graphs.priceDistribution.map((item: any, index: number) => (
                                <div key={index} className="d-flex justify-content-between text-light small">
                                  <span>{item.range}</span>
                                  <span>{item.count} products</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {searchResults.graphs.categoryBreakdown && searchResults.graphs.categoryBreakdown.length > 0 && (
                        <div className="col-md-6 mb-3">
                          <div className="graph-card p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-2">
                              <i className="fas fa-tags me-1"></i>Category Breakdown
                            </h6>
                            <div className="graph-data">
                              {searchResults.graphs.categoryBreakdown.map((item: any, index: number) => (
                                <div key={index} className="d-flex justify-content-between text-light small">
                                  <span>{item.category}</span>
                                  <span>{item.count} products</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {searchResults.graphs.aiScoreDistribution && searchResults.graphs.aiScoreDistribution.length > 0 && (
                        <div className="col-md-6 mb-3">
                          <div className="graph-card p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-2">
                              <i className="fas fa-brain me-1"></i>AI Score Distribution
                            </h6>
                            <div className="graph-data">
                              {searchResults.graphs.aiScoreDistribution.map((item: any, index: number) => (
                                <div key={index} className="d-flex justify-content-between text-light small">
                                  <span>{item.scoreRange}</span>
                                  <span>{item.count} products</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {searchResults.graphs.savingsAnalysis && searchResults.graphs.savingsAnalysis.length > 0 && (
                        <div className="col-md-6 mb-3">
                          <div className="graph-card p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-2">
                              <i className="fas fa-piggy-bank me-1"></i>Savings Analysis
                            </h6>
                            <div className="graph-data">
                              {searchResults.graphs.savingsAnalysis.map((item: any, index: number) => (
                                <div key={index} className="d-flex justify-content-between text-light small">
                                  <span>{item.savingsRange}</span>
                                  <span className="text-success">{item.count} products</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(searchResults.message || searchResults.chatResponse) && (
                  <div className="dynamic-content mb-4">
                    <h4><i className="fas fa-robot me-2"></i>AI Assistant Response</h4>
                    <p className="text-light">{searchResults.message || searchResults.chatResponse}</p>
                  </div>
                )}

                {searchResults.products && searchResults.products.length > 0 ? (
                  <div>
                    <p className="text-light mb-4">
                      Found {searchResults.totalResults || searchResults.products.length} results
                    </p>
                    <div className="row">
                      {searchResults.products.map((product, index) => (
                        <div key={product.id || index} className="col-md-6 col-lg-4 mb-4">
                          <div className="product-card-mini h-100 position-relative">
                            {/* AI Score Badge */}
                            {product.aiScore && (
                              <div className="position-absolute top-0 end-0 m-2">
                                <span className={`badge ${product.aiScore >= 80 ? 'bg-success' : product.aiScore >= 60 ? 'bg-warning' : 'bg-secondary'}`}>
                                  <i className="fas fa-brain me-1"></i>
                                  AI: {product.aiScore.toFixed(0)}
                                </span>
                              </div>
                            )}

                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="img-fluid rounded mb-3"
                                style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                              />
                            )}

                            <h6 className="text-gradient-primary">{product.name}</h6>
                            <p className="text-light small mb-2">{product.description}</p>

                            {product.brand && (
                              <p className="text-muted small mb-1">Brand: {product.brand}</p>
                            )}
                            {product.category && (
                              <p className="text-muted small mb-1">Category: {product.category}</p>
                            )}

                            <div className="price-section mb-2">
                              <p className="text-info fw-bold mb-1">${product.price}</p>
                              {product.retailPrice && product.savings && (
                                <div className="savings-info">
                                  <small className="text-muted text-decoration-line-through">
                                    Retail: ${product.retailPrice}
                                  </small>
                                  <small className="text-success ms-2">
                                    <i className="fas fa-tag me-1"></i>
                                    Save ${product.savings.toFixed(2)} ({product.savingsPercentage?.toFixed(0)}%)
                                  </small>
                                </div>
                              )}
                            </div>

                            {/* AI Score Breakdown */}
                            {product.scoreBreakdown && (
                              <div className="ai-breakdown mt-2">
                                <small className="text-muted">AI Score Breakdown:</small>
                                <div className="score-bars mt-1">
                                  <div className="score-item d-flex justify-content-between">
                                    <small>Price Match:</small>
                                    <small>{product.scoreBreakdown.priceMatching.toFixed(0)}%</small>
                                  </div>
                                  <div className="score-item d-flex justify-content-between">
                                    <small>Relevance:</small>
                                    <small>{product.scoreBreakdown.categoryRelevance.toFixed(0)}%</small>
                                  </div>
                                  <div className="score-item d-flex justify-content-between">
                                    <small>Value:</small>
                                    <small>{product.scoreBreakdown.valueProposition.toFixed(0)}%</small>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !loading && searchResults && (
                    <div className="text-center py-5">
                      <i className="fas fa-search fa-3x text-muted mb-3"></i>
                      <h4 className="text-light">No products found</h4>
                      <p className="text-muted">The search completed successfully but no specific products were found for this query.</p>
                      {searchResults.enhancedQuery && (
                        <p className="text-info small mt-2">Enhanced search: {searchResults.enhancedQuery}</p>
                      )}
                    </div>
                  )
                )}

                {searchResults.suggestions && searchResults.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-light mb-3">You might also like:</h5>
                    <div className="claude-suggestions">
                      {searchResults.suggestions.map((suggestion, index) => (
                        <span
                          key={index}
                          className="claude-suggestion"
                          onClick={() => performSearch(suggestion)}
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onShowSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onSignup={handleSignup}
        onShowLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
};

export default SearchResults;