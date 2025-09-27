import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import Footer from './Footer';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import axios from 'axios';



const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { appUser, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Configure axios for credential support
  axios.defaults.withCredentials = true;


  const handleSearch = async (query: string) => {
    try {
      // Use enhanced Claude AI search for better results
      const response = await axios.post('/buyers/api/claude-ai-search', {
        query,
        userId: appUser?.id || 'anonymous'
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
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={signOut}
      />

      <HeroSection
        onSearch={handleSearch}
        onVisualSearch={handleVisualSearch}
      />


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

export default HomePage;