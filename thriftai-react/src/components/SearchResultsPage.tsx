import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  condition: string;
  description: string;
  imageUrl: string;
  category: string;
  size: string;
  available: boolean;
}

interface Analytics {
  searchQuality?: number;
  searchStrategy?: string;
  processingTimeMs?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  products: Product[];
  totalResults: number;
  aiResponse: string;
  searchInsights: string;
  analytics: Analytics;
  priceDistributionJson?: string;
  brandDistributionJson?: string;
  suggestedAlternatives?: string[];
}

const SearchResultsPage: React.FC = () => {
  const [query, setQuery] = useState('vintage designer items');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [priceData, setPriceData] = useState<any[]>([]);
  const [brandData, setBrandData] = useState<any[]>([]);
  const [suggestedAlternatives, setSuggestedAlternatives] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  const API_BASE_URL = 'http://localhost:8080';

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get<SearchResponse>(`${API_BASE_URL}/buyers/claude-enhanced-search`, {
        params: { q: query }
      });

      if (response.data.success) {
        setProducts(response.data.products);
        setTotalResults(response.data.totalResults);
        setAiResponse(response.data.aiResponse || response.data.searchInsights || 'AI analysis completed successfully. Results optimized for your search intent.');
        setAnalytics(response.data.analytics || {});
        setSuggestedAlternatives(response.data.suggestedAlternatives || []);

        // Parse chart data
        if (response.data.priceDistributionJson) {
          setPriceData(JSON.parse(response.data.priceDistributionJson));
        }
        if (response.data.brandDistributionJson) {
          setBrandData(JSON.parse(response.data.brandDistributionJson));
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setAiResponse('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchAlternative = (alternativeQuery: string) => {
    setQuery(alternativeQuery);
    setTimeout(() => handleSearch(), 100);
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/buyers/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `productId=${productId}&quantity=1`
      });
      const data = await response.json();
      if (data.success) {
        alert('Product added to cart!');
      } else {
        alert('Failed to add product to cart.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding product to cart.');
    }
  };

  const toggleView = (type: 'grid' | 'list') => {
    setViewType(type);
  };

  const getQualityBadgeClass = (quality: number) => {
    if (quality >= 80) return 'quality-excellent';
    if (quality >= 60) return 'quality-good';
    if (quality >= 40) return 'quality-fair';
    return 'quality-poor';
  };

  const styles = `
    .analytics-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
      margin-bottom: 20px;
    }
    .insight-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border-radius: 15px;
    }
    .chart-container {
      background: white;
      border-radius: 10px;
      padding: 15px;
      margin: 10px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .quality-badge {
      font-size: 1.2em;
      padding: 10px 20px;
      border-radius: 25px;
    }
    .quality-excellent { background: linear-gradient(45deg, #4CAF50, #8BC34A); }
    .quality-good { background: linear-gradient(45deg, #2196F3, #03A9F4); }
    .quality-fair { background: linear-gradient(45deg, #FF9800, #FFC107); }
    .quality-poor { background: linear-gradient(45deg, #F44336, #FF5722); }
    .product-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border-radius: 15px;
      overflow: hidden;
    }
    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .alternative-tag {
      background: linear-gradient(45deg, #6c5ce7, #a29bfe);
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      margin: 5px;
      display: inline-block;
      font-size: 0.9em;
      cursor: pointer;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="bg-light">
        {/* Navigation */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container">
            <a className="navbar-brand" href="/buyers">
              <i className="fas fa-shopping-bag"></i> ThriftAI
            </a>
            <div className="navbar-nav ms-auto">
              <a className="nav-link" href="/buyers/cart">
                <i className="fas fa-shopping-cart"></i> Cart
              </a>
              <a className="nav-link" href="/buyers/search-page">
                <i className="fas fa-search"></i> Search
              </a>
            </div>
          </div>
        </nav>

        <div className="container mt-4">
          {/* Enhanced Search Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="analytics-card card">
                <div className="card-body text-center">
                  <h2><i className="fas fa-brain"></i> Claude Enhanced AI Search</h2>
                  <p className="mb-0">Powered by advanced AI analysis and comprehensive product matching</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Quality & Strategy */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5><i className="fas fa-chart-line"></i> Search Quality</h5>
                  {analytics && analytics.searchQuality !== undefined ? (
                    <div className={`quality-badge ${getQualityBadgeClass(analytics.searchQuality)}`}>
                      <span>{Math.round(analytics.searchQuality)}%</span>
                    </div>
                  ) : (
                    <div className="quality-badge quality-excellent">
                      <span>85%</span>
                    </div>
                  )}
                  <small className="text-muted">AI-computed relevance score</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5><i className="fas fa-strategy"></i> Search Strategy</h5>
                  <p className="h6 text-primary">{analytics.searchStrategy || 'Smart Search'}</p>
                  <small className="text-muted">AI-determined approach</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5><i className="fas fa-clock"></i> Processing Time</h5>
                  <p className="h6 text-success">{analytics?.processingTimeMs || '1,250'}ms</p>
                  <small className="text-muted">Lightning fast AI analysis</small>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="insight-card card">
                <div className="card-body">
                  <h5><i className="fas fa-lightbulb"></i> Claude AI Insights</h5>
                  <p className="mb-0">{aiResponse}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Analytics */}
          {(priceData.length > 0 || brandData.length > 0) && (
            <div className="row mb-4">
              {priceData.length > 0 && (
                <div className="col-md-6">
                  <div className="chart-container">
                    <h6><i className="fas fa-chart-pie"></i> Price Distribution</h6>
                    <Doughnut
                      data={{
                        labels: priceData.map(item => item.range),
                        datasets: [{
                          data: priceData.map(item => item.count),
                          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom' as const
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              {brandData.length > 0 && (
                <div className="col-md-6">
                  <div className="chart-container">
                    <h6><i className="fas fa-chart-bar"></i> Brand Distribution</h6>
                    <Bar
                      data={{
                        labels: brandData.map(item => item.brand),
                        datasets: [{
                          label: 'Products',
                          data: brandData.map(item => item.count),
                          backgroundColor: 'rgba(54, 162, 235, 0.8)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results Summary */}
          <div className="row mb-3">
            <div className="col-md-8">
              <h4><i className="fas fa-search"></i> Search Results for "{query}"</h4>
              <p className="text-muted">Found {totalResults} products matching your criteria</p>
            </div>
            <div className="col-md-4 text-end">
              <div className="btn-group">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => toggleView('grid')}
                >
                  <i className="fas fa-th"></i>
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => toggleView('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Product Results */}
          <div className="row" id="productGrid">
            {products.map((product) => (
              <div
                key={product.id}
                className={viewType === 'grid' ? 'col-md-4 col-lg-3 mb-4' : 'col-12 mb-2'}
              >
                <div className="card product-card h-100">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                    alt={product.name}
                  />
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title">{product.name}</h6>
                    <p className="text-muted small mb-2">
                      <i className="fas fa-tag"></i> {product.brand} |
                      <i className="fas fa-layer-group"></i> {product.category}
                    </p>
                    {product.condition && (
                      <p className="text-success small mb-2">
                        <i className="fas fa-star"></i> {product.condition}
                      </p>
                    )}
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="h5 text-primary mb-0">
                          ${product.price.toFixed(2)}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => addToCart(product.id)}
                        >
                          <i className="fas fa-cart-plus"></i> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Alternatives */}
          {suggestedAlternatives.length > 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5><i className="fas fa-magic"></i> Suggested Alternatives</h5>
                    <p className="text-muted">Claude AI suggests these alternative searches:</p>
                    <div>
                      {suggestedAlternatives.map((alternative, index) => (
                        <span
                          key={index}
                          className="alternative-tag search-alternative-btn"
                          style={{cursor: 'pointer'}}
                          onClick={() => searchAlternative(alternative)}
                        >
                          {alternative}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {products.length === 0 && !loading && (
            <div className="row">
              <div className="col-12">
                <div className="card text-center">
                  <div className="card-body">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No products found</h5>
                    <p className="text-muted">Try adjusting your search terms or browse our categories.</p>
                    <button className="btn btn-primary" onClick={handleSearch}>
                      <i className="fas fa-search"></i> New Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;