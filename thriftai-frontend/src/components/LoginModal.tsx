import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  show: boolean;
  onHide: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ show, onHide }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      onHide(); // Close modal on successful login
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
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
            <div className="text-center mb-4">
              <p className="text-light mb-4">
                Sign in to access personalized recommendations and save your favorite finds!
              </p>
              <button
                type="button"
                className="btn btn-gradient-primary w-100 d-flex align-items-center justify-content-center"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
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
            </div>
            <div className="text-center">
              <small className="text-muted">
                By signing in, you agree to our terms of service and privacy policy.
              </small>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default LoginModal;