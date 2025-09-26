import React from 'react';

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
  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold" href="/">
          <i className="fas fa-robot me-2" style={{ color: '#00d4ff' }}></i>
          <span className="text-gradient-primary fw-bold">Thrift</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 300 }}>AI</span>
        </a>

        <button
          className="navbar-toggler"
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
              <a className="nav-link" href="/sellers">
                <i className="fas fa-store me-2"></i>Sellers
              </a>
            </li>
          </ul>

          {/* Login/Signup Buttons - shown when user is not logged in */}
          {!user && (
            <div className="navbar-nav ms-auto">
              <button
                className="btn btn-outline-primary me-2"
                onClick={onShowLogin}
              >
                <i className="fas fa-sign-in-alt me-1"></i>Login
              </button>
              <button
                className="btn btn-primary"
                onClick={onShowSignup}
              >
                <i className="fas fa-user-plus me-1"></i>Sign Up
              </button>
            </div>
          )}

          {/* User Menu - shown when user is logged in */}
          {user && (
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-user me-2"></i>
                  <span>User</span>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-cog me-2"></i>Preferences
                    </a>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={onLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;