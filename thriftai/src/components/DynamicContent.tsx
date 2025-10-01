import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DynamicContentProps {
  type: string;
  onHide: () => void;
  onSearch: (query: string) => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | { current: number; original?: number; currency?: string };
  originalPrice?: number;
  category: string;
}

const DynamicContent: React.FC<DynamicContentProps> = ({ type, onHide, onSearch }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    brand: ''
  });

  // Helper function to extract price value
  const getPrice = (price: number | { current: number; original?: number; currency?: string }): number => {
    return typeof price === 'number' ? price : price.current;
  };

  const getOriginalPrice = (product: Product): number | undefined => {
    if (product.originalPrice) return product.originalPrice;
    if (typeof product.price === 'object' && product.price.original) {
      return product.price.original;
    }
    return undefined;
  };

  useEffect(() => {
    if (type === 'recommendations' || type === 'trending') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let queryData: any = {};

      if (type === 'recommendations') {
        endpoint = '/api/buyers/enhanced-search';
        queryData = { query: 'popular items' };
      } else if (type === 'trending') {
        endpoint = '/api/buyers/enhanced-search';
        queryData = { query: 'trending items' };
      }

      const response = await axios.post(endpoint, queryData);
      if (response.data) {
        if (type === 'recommendations' && response.data.products) {
          setProducts(response.data.products);
        } else if (type === 'trending' && response.data.products) {
          setProducts(response.data.products);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const performAdvancedSearch = () => {
    let query = 'Find me ';
    if (filters.category) query += filters.category.toLowerCase() + ' ';
    if (filters.brand) query += 'from ' + filters.brand + ' ';
    if (filters.minPrice || filters.maxPrice) {
      if (filters.minPrice && filters.maxPrice) {
        query += 'between $' + filters.minPrice + ' and $' + filters.maxPrice + ' ';
      } else if (filters.minPrice) {
        query += 'over $' + filters.minPrice + ' ';
      } else if (filters.maxPrice) {
        query += 'under $' + filters.maxPrice + ' ';
      }
    }
    if (filters.condition) query += 'in ' + filters.condition.toLowerCase() + ' condition';

    onSearch(query);
    onHide();
  };

  const renderFilters = () => (
    <div>
      <h4><i className="fas fa-filter me-2"></i>Advanced Search Filters</h4>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="filter-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Furniture">Furniture</option>
              <option value="Home Decor">Home Decor</option>
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <div className="filter-group">
            <label className="form-label">Price Range</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </div>
              <div className="col-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="filter-group">
            <label className="form-label">Condition</label>
            <select
              className="form-select"
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
            >
              <option value="">Any Condition</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <div className="filter-group">
            <label className="form-label">Brand</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter brand name"
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button className="btn-modern-primary me-2" onClick={performAdvancedSearch}>
          <i className="fas fa-search me-2"></i>Search with Filters
        </button>
        <button className="btn-modern-secondary" onClick={onHide}>Cancel</button>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div>
      <h4><i className="fas fa-star me-2"></i>Personalized Recommendations</h4>
      {loading ? (
        <p><i className="fas fa-spinner fa-spin me-2"></i>Loading recommendations...</p>
      ) : products.length > 0 ? (
        products.slice(0, 6).map((product, index) => {
          const currentPrice = getPrice(product.price);
          const originalPrice = getOriginalPrice(product);
          return (
            <div key={index} className="product-card-mini">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h6 className="text-light mb-1">{product.name}</h6>
                  <p className="text-muted small mb-1">{product.description}</p>
                  <span className="text-primary fw-bold">${currentPrice.toFixed(2)}</span>
                  {originalPrice && originalPrice > currentPrice && (
                    <span className="text-muted text-decoration-line-through ms-2">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="col-md-4 text-end">
                  <button className="btn-modern-secondary btn-sm">View</button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-muted">No recommendations available at the moment.</p>
      )}
      <div className="mt-3">
        <button className="btn-modern-secondary" onClick={onHide}>Close</button>
      </div>
    </div>
  );

  const renderTrending = () => (
    <div>
      <h4><i className="fas fa-fire me-2"></i>Trending Now</h4>
      {loading ? (
        <p><i className="fas fa-spinner fa-spin me-2"></i>Loading trending items...</p>
      ) : products.length > 0 ? (
        products.slice(0, 10).map((product, index) => {
          const currentPrice = getPrice(product.price);
          return (
            <div key={index} className="trend-item">
              <div className="trend-number">{index + 1}</div>
              <div className="flex-grow-1">
                <h6 className="text-light mb-1">{product.name}</h6>
                <span className="text-primary fw-bold">${currentPrice.toFixed(2)}</span>
                <span className="text-muted ms-2">{product.category}</span>
              </div>
              <button
                className="btn-modern-secondary btn-sm"
                onClick={() => onSearch(product.name)}
              >
                Search Similar
              </button>
            </div>
          );
        })
      ) : (
        <p className="text-muted">No trending items available at the moment.</p>
      )}
      <div className="mt-3">
        <button className="btn-modern-secondary" onClick={onHide}>Close</button>
      </div>
    </div>
  );

  const renderPriceComparison = () => (
    <div>
      <h4><i className="fas fa-chart-line me-2"></i>Price Insights & Market Trends</h4>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="filter-group">
            <h6 className="text-light">Market Categories</h6>
            <div className="trend-item">
              <div className="trend-number">📱</div>
              <div className="flex-grow-1">
                <span className="text-light">Electronics</span><br />
                <small className="text-success">↗ +12% this week</small>
              </div>
            </div>
            <div className="trend-item">
              <div className="trend-number">👗</div>
              <div className="flex-grow-1">
                <span className="text-light">Clothing</span><br />
                <small className="text-success">↗ +8% this week</small>
              </div>
            </div>
            <div className="trend-item">
              <div className="trend-number">🪑</div>
              <div className="flex-grow-1">
                <span className="text-light">Furniture</span><br />
                <small className="text-danger">↘ -3% this week</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="filter-group">
            <h6 className="text-light">Best Value Categories</h6>
            <p className="text-muted small">Based on price vs. retail comparison</p>
            <div className="trend-item">
              <div className="trend-number">1</div>
              <div className="flex-grow-1">
                <span className="text-light">Electronics</span><br />
                <small className="text-success">Up to 70% off retail</small>
              </div>
            </div>
            <div className="trend-item">
              <div className="trend-number">2</div>
              <div className="flex-grow-1">
                <span className="text-light">Designer Clothing</span><br />
                <small className="text-success">Up to 60% off retail</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button
          className="btn-modern-primary me-2"
          onClick={() => onSearch('Show me the best deals today')}
        >
          Find Best Deals
        </button>
        <button className="btn-modern-secondary" onClick={onHide}>Close</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'filters':
        return renderFilters();
      case 'recommendations':
        return renderRecommendations();
      case 'trending':
        return renderTrending();
      case 'price':
        return renderPriceComparison();
      default:
        return null;
    }
  };

  return (
    <div className="dynamic-content mt-4">
      {renderContent()}
    </div>
  );
};

export default DynamicContent;