import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="text-light mt-5 py-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
      <div className="container">
        <div className="row">
          <div className="col-12">
            {/* Legal Links */}
            <div className="text-center mb-3">
              <nav aria-label="Footer legal navigation">
                <ul style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  flexWrap: 'wrap'
                }}>
                  <li>
                    <Link
                      href="/privacy-policy"
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        padding: '0.5rem',
                        minHeight: '44px',
                        minWidth: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li style={{ color: 'var(--text-tertiary)' }}>|</li>
                  <li>
                    <Link
                      href="/terms-of-service"
                      style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        padding: '0.5rem',
                        minHeight: '44px',
                        minWidth: '44px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Copyright */}
            <div className="text-center">
              <p className="mb-0">
                <small style={{ opacity: 0.6, fontSize: '0.85rem' }}>
                  &copy; {new Date().getFullYear()} Veritas.ai (ThriftAI). All rights reserved.
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;