'use client'

import React, { useState, useEffect } from 'react';
import CartBadge from './CartBadge';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'buyer' | 'seller';
}

interface NavigationProps {
  user: User | null;
  onShowLogin: () => void;
  onShowSignup: () => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onShowLogin, onShowSignup, onLogout }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Toggle between dark and light
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Theme toggled:', theme, '->', newTheme);
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Get icon for current theme
  const getThemeIcon = () => {
    return theme === 'dark' ? 'fa-sun' : 'fa-moon';
  };

  // Get tooltip text
  const getThemeTooltip = () => {
    return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold nav-logo-link" href="/">
          <span className="text-gradient-primary nav-logo-veritas">
            Veritas</span><span className="nav-logo-ai">.ai
          </span>
        </a>

        <button
          className="navbar-toggler nav-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href="/about" style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}>
                About Us
              </a>
            </li>
          </ul>

          {/* Login/Signup Buttons - shown when user is not logged in */}
          {!user && (
            <div className="navbar-nav ms-auto d-flex align-items-center nav-actions">
              <button
                className="btn-modern-secondary nav-btn"
                onClick={toggleTheme}
                title={getThemeTooltip()}
                style={{
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                <i className={`fas ${getThemeIcon()}`} style={{ fontSize: '18px' }}></i>
              </button>
              <button
                className="btn-modern-secondary nav-btn"
                onClick={onShowLogin}
              >
                <i className="fas fa-sign-in-alt nav-btn-icon"></i>
                Sign In
              </button>
              <button
                className="btn-modern-primary nav-btn"
                onClick={onShowSignup}
              >
                <i className="fas fa-user-plus nav-btn-icon"></i>
                Get Started
              </button>
              <CartBadge />
            </div>
          )}

          {/* User Menu - shown when user is logged in */}
          {user && (
            <div className="navbar-nav ms-auto d-flex align-items-center nav-actions">
              <button
                className="btn-modern-secondary nav-btn"
                onClick={toggleTheme}
                title={getThemeTooltip()}
                style={{
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                <i className={`fas ${getThemeIcon()}`} style={{ fontSize: '18px' }}></i>
              </button>
              <div className="nav-item dropdown">
                <button
                  className="btn-modern-secondary dropdown-toggle nav-user-btn"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div className="nav-user-avatar">
                    {user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="nav-user-name">
                    {user.firstName}
                  </span>
                </button>
                <ul className="dropdown-menu nav-dropdown">
                  <li>
                    <a className="nav-dropdown-item" href="#">
                      <i className="fas fa-user nav-dropdown-item-icon"></i>
                      Profile
                    </a>
                  </li>
                  <li>
                    <a className="nav-dropdown-item" href="#">
                      <i className="fas fa-cog nav-dropdown-item-icon"></i>
                      Settings
                    </a>
                  </li>
                  <li><hr className="nav-dropdown-divider" /></li>
                  <li>
                    <button
                      className="nav-dropdown-item danger"
                      onClick={onLogout}
                    >
                      <i className="fas fa-sign-out-alt nav-dropdown-item-icon"></i>
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
              <CartBadge />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;