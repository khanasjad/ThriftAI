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
        <a className="navbar-brand fw-bold" href="/" style={{ textDecoration: 'none' }}>
          <span className="text-gradient-primary" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-black)' }}>
            Thrift
          </span>
          <span style={{
            color: 'var(--text-primary)',
            fontWeight: 'var(--font-light)',
            fontSize: 'var(--text-2xl)',
            marginLeft: '2px'
          }}>
            AI
          </span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--bg-glass)',
            backdropFilter: 'var(--backdrop-blur-md)'
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
          </ul>

          {/* Login/Signup Buttons - shown when user is not logged in */}
          {!user && (
            <div className="navbar-nav ms-auto d-flex align-items-center" style={{ gap: 'var(--space-3)' }}>
              <button
                className="btn-modern-secondary"
                onClick={onShowLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  padding: 'var(--space-3) var(--space-5)',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fas fa-sign-in-alt" style={{ fontSize: 'var(--text-sm)' }}></i>
                Sign In
              </button>
              <button
                className="btn-modern-primary"
                onClick={onShowSignup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  padding: 'var(--space-3) var(--space-5)',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fas fa-user-plus" style={{ fontSize: 'var(--text-sm)' }}></i>
                Get Started
              </button>
            </div>
          )}

          {/* User Menu - shown when user is logged in */}
          {user && (
            <div className="navbar-nav ms-auto">
              <div className="nav-item dropdown">
                <button
                  className="btn-modern-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    padding: 'var(--space-3) var(--space-4)',
                    border: 'none',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'var(--backdrop-blur-md)'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {user.firstName}
                  </span>
                </button>
                <ul
                  className="dropdown-menu"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-xl)',
                    backdropFilter: 'var(--backdrop-blur-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--space-2)',
                    minWidth: '200px'
                  }}
                >
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all var(--transition-base)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <i className="fas fa-user" style={{ fontSize: 'var(--text-sm)', width: '16px' }}></i>
                      Profile
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all var(--transition-base)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <i className="fas fa-cog" style={{ fontSize: 'var(--text-sm)', width: '16px' }}></i>
                      Settings
                    </a>
                  </li>
                  <li><hr style={{ margin: 'var(--space-2) 0', border: 'none', borderTop: '1px solid var(--border-primary)' }} /></li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={onLogout}
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all var(--transition-base)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        border: 'none',
                        background: 'transparent',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = 'var(--error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <i className="fas fa-sign-out-alt" style={{ fontSize: 'var(--text-sm)', width: '16px' }}></i>
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;