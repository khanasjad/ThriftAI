import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-light mt-5 py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>
              <i className="fas fa-robot me-2" style={{ color: 'var(--accent-primary)' }}></i>
              <span className="text-gradient-primary">Veritas</span><span style={{ color: 'var(--text-primary)', fontWeight: 400 }}>.ai</span>
            </h5>
            <p className="mb-0">AI-powered shopping intelligence for the smartest decisions.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0 mt-2">
              <small>&copy; 2024 Veritas.ai. All rights reserved.</small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;