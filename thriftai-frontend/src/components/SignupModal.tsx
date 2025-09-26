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

interface SignupModalProps {
  show: boolean;
  onHide: () => void;
  onSignup: (userData: SignupData) => Promise<{ success: boolean; error?: string; message?: string }>;
  onShowLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ show, onHide, onSignup, onShowLogin }) => {
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
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title text-gradient-primary fw-bold">
              <i className="fas fa-user-plus me-2"></i>Join ThriftAI
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleHide}
            ></button>
          </div>
          <div className="modal-body pt-2">
            {/* Account Type Selection */}
            <div className="text-center mb-4">
              <p className="text-light mb-3">Choose your account type:</p>
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="accountType"
                  id="buyerType"
                  checked={formData.accountType === 'buyer'}
                  onChange={() => handleInputChange('accountType', 'buyer')}
                />
                <label className="btn btn-outline-primary" htmlFor="buyerType">
                  <i className="fas fa-shopping-cart me-2"></i>Buyer
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="accountType"
                  id="sellerType"
                  checked={formData.accountType === 'seller'}
                  onChange={() => handleInputChange('accountType', 'seller')}
                />
                <label className="btn btn-outline-primary" htmlFor="sellerType">
                  <i className="fas fa-store me-2"></i>Seller
                </label>
              </div>
            </div>

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
                      <label className="floating-label">First Name</label>
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
                      <label className="floating-label">Last Name</label>
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
                  <label className="floating-label">Email address</label>
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
                  <label className="floating-label">Phone number</label>
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
                      <label className="floating-label">City</label>
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
                      <label className="floating-label">State</label>
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
                  <label className="floating-label">Password</label>
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
                  <label className="floating-label">Confirm Password</label>
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
                <label className="form-check-label text-light">
                  I agree to the{' '}
                  <a href="#" style={{ color: 'var(--accent-blue)' }}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" style={{ color: 'var(--accent-blue)' }}>
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
              <span className="text-light">Already have an account? </span>
              <button
                type="button"
                className="btn btn-link p-0"
                style={{ color: 'var(--accent-blue)' }}
                onClick={onShowLogin}
              >
                Sign in here
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default SignupModal;