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
    <div className="modal-modern" tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content-modern">
          <div className="modal-header-modern">
            <h5 className="modal-title-modern text-gradient-primary">
              <i className="fas fa-user-plus me-2" style={{ color: '#10b981' }}></i>
              Join Veritas.ai
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

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">First Name</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Last Name</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Email Address</label>
                <input
                  type="email"
                  className="input-modern"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Phone Number</label>
                <input
                  type="tel"
                  className="input-modern"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">City</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group-modern">
                    <label className="form-label-modern">State</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Enter your state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Password</label>
                <input
                  type="password"
                  className="input-modern"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Confirm Password</label>
                <input
                  type="password"
                  className="input-modern"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  required
                />
                <label className="form-check-label" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family-primary)' }}>
                  I agree to the{' '}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-family-primary)', textDecoration: 'none' }}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-family-primary)', textDecoration: 'none' }}>
                    Privacy Policy
                  </a>
                </label>
              </div>
              <button
                type="submit"
                className="btn-modern-primary w-100 mb-3"
                disabled={isLoading}
style={{ width: '100%', marginBottom: '16px' }}
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
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-family-primary)' }}>Already have an account? </span>
              <button
                type="button"
                className="link-primary"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0
                }}
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