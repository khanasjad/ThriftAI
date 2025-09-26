import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import Footer from './Footer';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'buyer' | 'seller';
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  password: string;
  confirmPassword: string;
  accountType: 'buyer' | 'seller';
  agreeTerms: boolean;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Configure axios for credential support
  axios.defaults.withCredentials = true;

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check session or token - adjust endpoint as needed
      const response = await axios.get('/auth/api/status');
      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      // User not logged in or session expired
      console.log('No active session');
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
        // Login successful, check for user data
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

  const handleSignup = async (userData: SignupData): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        const typedKey = key as keyof SignupData;
        formData.append(key, String(userData[typedKey]));
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

  const handleSearch = async (query: string) => {
    try {
      // Use enhanced Claude AI search for better results
      const response = await axios.post('/buyers/api/claude-ai-search', {
        query,
        userId: user?.id || 'anonymous'
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Store enhanced search results and navigate using React Router
      sessionStorage.setItem('searchResults', JSON.stringify(response.data));
      sessionStorage.setItem('searchQuery', query);

      // Navigate to search results page using React Router
      navigate(`/buyers/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Enhanced search error:', error);
      // Fallback to basic search if Claude AI search fails
      try {
        const fallbackResponse = await axios.post('/buyers/api/chat-search', { query });
        sessionStorage.setItem('searchResults', JSON.stringify(fallbackResponse.data));
        sessionStorage.setItem('searchQuery', query);
        navigate(`/buyers/search?q=${encodeURIComponent(query)}`);
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        navigate(`/buyers/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleVisualSearch = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/visual-search/upload', formData);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Store results and navigate to visual search page
      sessionStorage.setItem('visualSearchResults', JSON.stringify(response.data));
      sessionStorage.setItem('visualSearchImage', file.name);

      // Navigate to visual search results
      navigate('/visual-search');
    } catch (error) {
      console.error('Visual search error:', error);
      throw error;
    }
  };

  return (
    <div className="HomePage">
      <Navigation
        user={user}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={handleLogout}
      />

      <HeroSection
        onSearch={handleSearch}
        onVisualSearch={handleVisualSearch}
      />

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

export default HomePage;