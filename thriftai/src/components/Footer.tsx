import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-light mt-5 py-2">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0">
              <small style={{ opacity: 0.6 }}>&copy; 2024 Veritas.ai</small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;