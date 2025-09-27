import React, { useState } from 'react';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  password: string;
  confirmPassword: string;
  accountType: 'buyer' | 'seller';
  agreeTerms: boolean;
}

interface SignupResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface SignupModalProps {
  show: boolean;
  onHide: () => void;
  onShowLogin: () => void;
  onSignup: (formData: SignupData) => Promise<SignupResponse>;
}

const SignupModal: React.FC<SignupModalProps> = ({ show, onHide, onShowLogin, onSignup }) => {
  const [formData, setFormData] = useState<SignupData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    password: '',
    confirmPassword: '',
    accountType: 'buyer',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof SignupData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone ||
        !formData.city || !formData.state || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onSignup(formData);
      if (result.success) {
        // Form will be reset when modal hides
        alert(result.message || 'Account created successfully!');
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      password: '',
      confirmPassword: '',
      accountType: 'buyer',
      agreeTerms: false
    });
    setError('');
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #ffffff 50%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
            }}>
              <i className="fas fa-user-plus me-2" style={{ color: '#00d4ff' }}></i>Join ThriftAI
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
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        className="form-control glass-input"
                        placeholder=" "
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                      <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>First Name</label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        className="form-control glass-input"
                        placeholder=" "
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                      <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Last Name</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="floating-label-group">
                  <input
                    type="email"
                    className="form-control glass-input"
                    placeholder=" "
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Email address</label>
                </div>
              </div>
              <div className="mb-3">
                <div className="floating-label-group">
                  <input
                    type="tel"
                    className="form-control glass-input"
                    placeholder=" "
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                  <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Phone number</label>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        className="form-control glass-input"
                        placeholder=" "
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                      <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>City</label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="floating-label-group">
                      <input
                        type="text"
                        className="form-control glass-input"
                        placeholder=" "
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                      />
                      <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>State</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <div className="floating-label-group">
                  <input
                    type="password"
                    className="form-control glass-input"
                    placeholder=" "
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Password</label>
                </div>
              </div>
              <div className="mb-4">
                <div className="floating-label-group">
                  <input
                    type="password"
                    className="form-control glass-input"
                    placeholder=" "
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                  <label className="floating-label" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Confirm Password</label>
                </div>
              </div>
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  required
                />
                <label className="form-check-label" style={{ color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                  I agree to the{' '}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" style={{ color: '#00d4ff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" style={{ color: '#00d4ff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                    Privacy Policy
                  </a>
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-gradient-primary w-100 mb-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus me-2"></i>Create Account
                  </>
                )}
              </button>
            </form>
            <div className="text-center">
              <span style={{ color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Already have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                style={{ color: '#00d4ff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                onClick={onShowLogin}
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;