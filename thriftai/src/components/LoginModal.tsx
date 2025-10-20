import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
  show: boolean;
  onHide: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onHide }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Using next-auth signIn methods

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        onHide(); // Close modal on successful login
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const result = await signIn('google', {
        redirect: false,
      });

      if (result?.error) {
        setError('Failed to sign in with Google. Please try again.');
      } else {
        onHide(); // Close modal on successful login
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal-modern" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content-modern">
          <div className="modal-header-modern">
            <h5 className="modal-title-modern text-gradient-primary">
              <i className="fas fa-sign-in-alt me-2" style={{ color: 'var(--accent-primary)' }}></i>
              Welcome Back
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleHide}
            ></button>
          </div>
          <div className="modal-body-modern">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <p className="mb-4 text-center" style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.6
            }}>
              Sign in to access personalized recommendations and save your favorite finds!
            </p>

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin}>
              <div className="form-group-modern">
                <label className="form-label-modern" htmlFor="login-email">Email address</label>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  className="input-modern"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern" htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  className="input-modern"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="login-rememberMe" name="rememberMe" />
                  <label className="form-check-label text-primary font-primary" htmlFor="login-rememberMe">Remember me</label>
                </div>
                <a href="#" className="link-primary">Forgot password?</a>
              </div>
              <button
                type="submit"
                className="btn-modern-primary w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>Sign In
                  </>
                )}
              </button>
            </form>

            {/* OR Separator */}
            <div className="text-center mb-3">
              <div className="d-flex align-items-center">
                <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <span className="px-3 text-secondary font-primary">OR</span>
                <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              className="btn-modern-secondary w-100 d-flex align-items-center justify-content-center mb-4"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fab fa-google me-2"></i>
                  Sign in with Google
                </>
              )}
            </button>

            <div className="text-center">
              <small className="text-secondary font-primary">
                By signing in, you agree to our terms of service and privacy policy.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;