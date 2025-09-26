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
}

interface SearchResponse {
  products: Product[];
  totalResults: number;
  query: string;
  suggestions?: string[];
  message?: string;
  chatResponse?: string;
  enhancedQuery?: string;
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
      // Check if we have cached results first
      const cachedResults = sessionStorage.getItem('searchResults');
      const cachedQuery = sessionStorage.getItem('searchQuery');

      if (cachedResults && cachedQuery === searchQuery) {
        setSearchResults(JSON.parse(cachedResults));
        setLoading(false);
        return;
      }

      const response = await axios.post('/buyers/api/chat-search', { query: searchQuery });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        console.log('Search API response:', response.data);
        setSearchResults(response.data);
        // Cache the results
        sessionStorage.setItem('searchResults', JSON.stringify(response.data));
        sessionStorage.setItem('searchQuery', searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
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
                          <div className="product-card-mini h-100">
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
                            <p className="text-info fw-bold mb-0">${product.price}</p>
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