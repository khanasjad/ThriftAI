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
            <li className="nav-item">
              <a className="nav-link" href="/sustainability" style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}>
                Sustainability
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/affiliate-partners" style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}>
                <i className="fas fa-handshake" style={{ marginRight: '8px' }}></i>
                Affiliate Partners
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/data-sources" style={{
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 1rem',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}>
                <i className="fas fa-database" style={{ marginRight: '8px' }}></i>
                Data Sources
              </a>
            </li>
          </ul>

          {/* Login/Signup Buttons - shown when user is not logged in */}
          {!user && (
            <div className="navbar-nav ms-lg-auto d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 gap-lg-3 mt-3 mt-lg-0 nav-actions">
              <button
                className="btn-modern-secondary nav-btn w-100 w-lg-auto"
                onClick={toggleTheme}
                title={getThemeTooltip()}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
              >
                <i className={`fas ${getThemeIcon()} me-2`} style={{ fontSize: '18px' }}></i>
                <span className="d-lg-none">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                className="btn-modern-secondary nav-btn w-100 w-lg-auto"
                onClick={onShowLogin}
                style={{ minHeight: '44px' }}
              >
                <i className="fas fa-sign-in-alt nav-btn-icon"></i>
                Sign In
              </button>
              <button
                className="btn-modern-primary nav-btn w-100 w-lg-auto"
                onClick={onShowSignup}
                style={{ minHeight: '44px' }}
              >
                <i className="fas fa-user-plus nav-btn-icon"></i>
                Get Started
              </button>
              <div className="w-100 w-lg-auto">
                <CartBadge />
              </div>
            </div>
          )}

          {/* User Menu - shown when user is logged in */}
          {user && (
            <div className="navbar-nav ms-lg-auto d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 gap-lg-3 mt-3 mt-lg-0 nav-actions">
              <button
                className="btn-modern-secondary nav-btn w-100 w-lg-auto"
                onClick={toggleTheme}
                title={getThemeTooltip()}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
              >
                <i className={`fas ${getThemeIcon()} me-2`} style={{ fontSize: '18px' }}></i>
                <span className="d-lg-none">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className="nav-item dropdown w-100 w-lg-auto">
                <button
                  className="btn-modern-secondary dropdown-toggle nav-user-btn w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ minHeight: '44px' }}
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
              <div className="w-100 w-lg-auto">
                <CartBadge />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;