import React, { useState } from 'react';

interface LoginModalProps {
  show: boolean;
  onHide: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onShowSignup: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onHide, onLogin, onShowSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLogin(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
    setError('');
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-gradient-primary fw-bold">
              <i className="fas fa-sign-in-alt me-2"></i>Welcome Back
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleHide}
            ></button>
          </div>
          <div className="modal-body pt-2">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <div className="floating-label-group">
                  <input
                    type="email"
                    className="form-control glass-input"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label className="floating-label">Email address</label>
                </div>
              </div>
              <div className="mb-4">
                <div className="floating-label-group">
                  <input
                    type="password"
                    className="form-control glass-input"
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label className="floating-label">Password</label>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label text-light">Remember me</label>
                </div>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#" className="text-decoration-none" style={{ color: 'var(--accent-blue)' }}>
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="btn btn-gradient-primary w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>Sign In
                  </>
                )}
              </button>
            </form>
            <div className="text-center">
              <span className="text-light">Don't have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                style={{ color: 'var(--accent-blue)' }}
                onClick={onShowSignup}
              >
                Sign up here
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default LoginModal;