import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-light mt-5 py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>
              <i className="fas fa-robot me-2" style={{ color: 'var(--accent-primary)' }}></i>
              <span className="text-gradient-primary fw-bold">Thrift</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 300 }}>AI</span>
            </h5>
            <p className="mb-0">AI-powered thrift shopping for the smartest deals.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0 mt-2">
              <small>&copy; 2024 ThriftAI. All rights reserved.</small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;