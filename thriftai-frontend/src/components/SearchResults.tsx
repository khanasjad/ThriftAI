import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navigation from './Navigation';
import Footer from './Footer';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Doughnut, Scatter, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);


interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  condition?: string;
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
    chatResponse?: string;
  };
  graphs?: {
    priceComparison?: any[];
    qualityVsPrice?: any[];
    brandAnalysis?: any[];
    savingsBreakdown?: any[];
    conditionComparison?: any[];
    sustainabilityImpact?: any;
  };
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { appUser, signOut } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);

  // Transform AI scores into user-friendly value badges
  const getValueBadges = (product: Product) => {
    const badges = [];

    // Quality badge based on AI score
    if (product.aiScore && product.aiScore >= 85) {
      badges.push({ text: 'Excellent Quality', color: 'bg-success', icon: 'fas fa-star' });
    } else if (product.aiScore && product.aiScore >= 70) {
      badges.push({ text: 'Great Quality', color: 'bg-info', icon: 'fas fa-star-half-alt' });
    } else if (product.aiScore && product.aiScore >= 60) {
      badges.push({ text: 'Good Value', color: 'bg-warning', icon: 'fas fa-thumbs-up' });
    }

    // Savings badge
    if (product.savingsPercentage && product.savingsPercentage >= 30) {
      badges.push({ text: `Save ${Math.round(product.savingsPercentage)}%`, color: 'bg-danger', icon: 'fas fa-fire' });
    } else if (product.savings && product.savings > 0) {
      badges.push({ text: `Save $${product.savings.toFixed(0)}`, color: 'bg-warning', icon: 'fas fa-tag' });
    }

    // Eco-friendly badge for thrift items
    if (product.condition && product.condition.toLowerCase() !== 'new') {
      badges.push({ text: 'Eco-Friendly Choice', color: 'bg-success', icon: 'fas fa-leaf' });
    }

    // Condition-based badges
    if (product.condition && (product.condition.toLowerCase().includes('new') || product.condition.toLowerCase().includes('excellent'))) {
      badges.push({ text: 'Like New', color: 'bg-primary', icon: 'fas fa-gem' });
    }

    return badges.slice(0, 3); // Limit to 3 badges for clean UI
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);


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

      // Premium search experience
      console.log('🌟 Starting personalized search for:', searchQuery);

      const response = await axios.post('/buyers/api/claude-ai-search', {
        query: searchQuery,
        userId: appUser?.id || 'anonymous'
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        console.log('✨ Curated search results:', response.data);
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
          userId: appUser?.id || 'anonymous'
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




  return (
    <div className="SearchResults">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={signOut}
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
                <div className="spinner-border text-primary" role="status">
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
                      <i className="fas fa-star me-2"></i>🌟 **Perfect Style Matches**
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
                          <strong>Curated Collection</strong> - Products selected just for you
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Recommendations Section */}
                {searchResults.aiInsights && (
                  <div className="smart-recommendations-section mb-4 p-4 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-primary)' }}>
                    <h4 className="text-gradient-primary mb-3">
                      <i className="fas fa-sparkles me-2"></i>Smart Recommendations
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        {searchResults.aiInsights.chatResponse && (
                          <div className="recommendation-content">
                            <p className="text-light mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                              {searchResults.aiInsights.chatResponse}
                            </p>
                          </div>
                        )}
                        {searchResults.aiInsights.topRecommendation && (
                          <div className="top-pick mb-2">
                            <span className="badge bg-gradient-primary me-2">
                              <i className="fas fa-crown me-1"></i>Top Pick
                            </span>
                            <span className="text-light">{searchResults.aiInsights.topRecommendation}</span>
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <div className="value-highlights">
                          {(searchResults.aiInsights.averageAiScore || 0) >= 80 && (
                            <div className="value-badge mb-2">
                              <span className="badge bg-success">
                                <i className="fas fa-gem me-1"></i>Excellent Quality
                              </span>
                            </div>
                          )}
                          {(searchResults.aiInsights.totalSavings || 0) > 0 && (
                            <div className="savings-highlight mb-2">
                              <span className="badge bg-warning text-dark">
                                <i className="fas fa-tag me-1"></i>Save ${(searchResults.aiInsights.totalSavings || 0).toFixed(0)}
                              </span>
                            </div>
                          )}
                          <div className="sustainability-note">
                            <span className="badge bg-info">
                              <i className="fas fa-leaf me-1"></i>Eco-Friendly Choice
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Comparison Graphs Section */}
                {searchResults.graphs && (
                  <div className="graphs-section mb-4">
                    <h4 className="text-gradient-primary mb-4">
                      <i className="fas fa-chart-bar me-2"></i>Product Comparison Analysis
                    </h4>

                    <div className="row">
                      {/* Price Comparison Chart */}
                      {searchResults.graphs.priceComparison && searchResults.graphs.priceComparison.length > 0 && (
                        <div className="col-lg-6 mb-4">
                          <div className="graph-card p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-3">
                              <i className="fas fa-dollar-sign me-2"></i>Price Comparison
                            </h6>
                            <div style={{ height: '250px' }}>
                              <Bar
                                data={{
                                  labels: searchResults.graphs.priceComparison.map((item: any) =>
                                    item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name
                                  ),
                                  datasets: [
                                    {
                                      label: 'Current Price',
                                      data: searchResults.graphs.priceComparison.map((item: any) => item.price),
                                      backgroundColor: searchResults.graphs.priceComparison.map((item: any) => item.color),
                                      borderRadius: 4,
                                    },
                                    {
                                      label: 'Original Price',
                                      data: searchResults.graphs.priceComparison.map((item: any) => item.originalPrice),
                                      backgroundColor: 'rgba(128, 128, 128, 0.3)',
                                      borderColor: 'rgba(128, 128, 128, 0.8)',
                                      borderRadius: 4,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'top' as const, labels: { color: '#ffffff' } },
                                    tooltip: {
                                      callbacks: {
                                        afterLabel: function(context: any) {
                                          const item = searchResults.graphs!.priceComparison![context.dataIndex];
                                          return item.savings > 0 ? `Savings: $${item.savings} (${item.savingsPercentage}%)` : '';
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: { ticks: { color: '#ffffff' } },
                                    y: { beginAtZero: true, ticks: { color: '#ffffff' } }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quality vs Price Scatter Plot */}
                      {searchResults.graphs.qualityVsPrice && searchResults.graphs.qualityVsPrice.length > 0 && (
                        <div className="col-lg-6 mb-4">
                          <div className="graph-card p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-3">
                              <i className="fas fa-balance-scale me-2"></i>Quality vs Price Analysis
                            </h6>
                            <div style={{ height: '250px' }}>
                              <Scatter
                                data={{
                                  datasets: [{
                                    label: 'Products',
                                    data: searchResults.graphs.qualityVsPrice.map((item: any) => ({
                                      x: item.price,
                                      y: item.qualityScore,
                                    })),
                                    backgroundColor: searchResults.graphs.qualityVsPrice.map((item: any) =>
                                      item.valueRating === 'Excellent' ? '#22c55e' :
                                      item.valueRating === 'Great' ? '#3b82f6' :
                                      item.valueRating === 'Good' ? '#f59e0b' : '#fbbf24'
                                    ),
                                    pointRadius: 8,
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        title: function(context: any) {
                                          return searchResults.graphs!.qualityVsPrice![context[0].dataIndex].name;
                                        },
                                        label: function(context: any) {
                                          const item = searchResults.graphs!.qualityVsPrice![context.dataIndex];
                                          return [
                                            `Price: $${context.parsed.x}`,
                                            `Quality: ${context.parsed.y}/100`,
                                            `Brand: ${item.brand}`,
                                            `Value: ${item.valueRating}`
                                          ];
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: { title: { display: true, text: 'Price ($)', color: '#ffffff' }, ticks: { color: '#ffffff' } },
                                    y: { title: { display: true, text: 'Quality Score', color: '#ffffff' }, beginAtZero: true, max: 100, ticks: { color: '#ffffff' } }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Brand Analysis */}
                      {searchResults.graphs.brandAnalysis && searchResults.graphs.brandAnalysis.length > 0 && (
                        <div className="col-lg-6 mb-4">
                          <div className="graph-card p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-3">
                              <i className="fas fa-star me-2"></i>Brand Analysis
                            </h6>
                            <div style={{ height: '250px' }}>
                              <Doughnut
                                data={{
                                  labels: searchResults.graphs.brandAnalysis.map((item: any) => item.brand),
                                  datasets: [{
                                    data: searchResults.graphs.brandAnalysis.map((item: any) => item.productCount),
                                    backgroundColor: [
                                      '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
                                      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
                                    ],
                                    borderWidth: 2,
                                    borderColor: '#ffffff'
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { position: 'bottom' as const, labels: { color: '#ffffff', boxWidth: 12 } },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context: any) {
                                          const item = searchResults.graphs!.brandAnalysis![context.dataIndex];
                                          return `${item.brand}: ${item.productCount} products, Avg Quality: ${item.averageQuality}`;
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Savings Breakdown */}
                      {searchResults.graphs.savingsBreakdown && searchResults.graphs.savingsBreakdown.length > 0 && (
                        <div className="col-lg-6 mb-4">
                          <div className="graph-card p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h6 className="text-light mb-3">
                              <i className="fas fa-piggy-bank me-2"></i>Savings Breakdown
                            </h6>
                            <div style={{ height: '250px' }}>
                              <Bar
                                data={{
                                  labels: searchResults.graphs.savingsBreakdown.map((item: any) =>
                                    item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name
                                  ),
                                  datasets: [{
                                    label: 'Savings %',
                                    data: searchResults.graphs.savingsBreakdown.map((item: any) => item.percentOff),
                                    backgroundColor: searchResults.graphs.savingsBreakdown.map((item: any) =>
                                      item.dealQuality === 'Amazing Deal' ? '#22c55e' :
                                      item.dealQuality === 'Great Deal' ? '#3b82f6' :
                                      item.dealQuality === 'Good Deal' ? '#f59e0b' : '#fbbf24'
                                    ),
                                    borderRadius: 4
                                  }]
                                }}
                                options={{
                                  indexAxis: 'y' as const,
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      callbacks: {
                                        afterLabel: function(context: any) {
                                          const item = searchResults.graphs!.savingsBreakdown![context.dataIndex];
                                          return `Deal Quality: ${item.dealQuality}\nDollars Off: $${item.dollarsOff}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: { title: { display: true, text: 'Savings (%)', color: '#ffffff' }, beginAtZero: true, ticks: { color: '#ffffff' } },
                                    y: { ticks: { color: '#ffffff' } }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(searchResults.chatResponse || searchResults.message) && (
                  <div className="dynamic-content mb-4 p-4 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e' }}>
                    <h4 className="text-gradient-primary mb-3">
                      <i className="fas fa-robot me-2"></i>AI Shopping Assistant
                    </h4>
                    {searchResults.chatResponse ? (
                      <p className="text-light mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                        {searchResults.chatResponse}
                      </p>
                    ) : (
                      <p className="text-light mb-0">{searchResults.message}</p>
                    )}
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
                            {/* Value Badges */}
                            <div className="position-absolute top-0 end-0 m-2">
                              <div className="d-flex flex-column gap-1">
                                {getValueBadges(product).map((badge, badgeIndex) => (
                                  <span key={badgeIndex} className={`badge ${badge.color} d-flex align-items-center`} style={{ fontSize: '0.75rem' }}>
                                    <i className={`${badge.icon} me-1`} style={{ fontSize: '0.7rem' }}></i>
                                    {badge.text}
                                  </span>
                                ))}
                              </div>
                            </div>

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
                                    Save ${(product.savings || 0).toFixed(2)} ({(product.savingsPercentage || 0).toFixed(0)}%)
                                  </small>
                                </div>
                              )}
                            </div>

                            {/* Value Summary */}
                            {product.aiScore && product.aiScore >= 70 && (
                              <div className="value-summary mt-2">
                                <small className="text-success">
                                  <i className="fas fa-thumbs-up me-1"></i>
                                  Recommended by AI
                                </small>
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
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onShowLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
        onSignup={authService.signup.bind(authService)}
      />
    </div>
  );
};

export default SearchResults;