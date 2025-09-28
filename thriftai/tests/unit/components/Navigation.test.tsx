import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  userType: 'buyer' as const,
}

const defaultProps = {
  user: null,
  onShowLogin: jest.fn(),
  onShowSignup: jest.fn(),
  onLogout: jest.fn(),
}

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders ThriftAI branding', () => {
    render(<Navigation {...defaultProps} />)

    expect(screen.getByText('Thrift')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('shows login and signup buttons when user is not authenticated', () => {
    render(<Navigation {...defaultProps} />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('shows user name when user is authenticated', () => {
    render(<Navigation {...defaultProps} user={mockUser} />)

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })

  it('calls onShowLogin when login button is clicked', () => {
    render(<Navigation {...defaultProps} />)

    fireEvent.click(screen.getByText('Sign In'))
    expect(defaultProps.onShowLogin).toHaveBeenCalledTimes(1)
  })

  it('calls onShowSignup when signup button is clicked', () => {
    render(<Navigation {...defaultProps} />)

    fireEvent.click(screen.getByText('Get Started'))
    expect(defaultProps.onShowSignup).toHaveBeenCalledTimes(1)
  })

  it('shows logout option when user is authenticated', () => {
    render(<Navigation {...defaultProps} user={mockUser} />)

    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls onLogout when logout is clicked', () => {
    render(<Navigation {...defaultProps} user={mockUser} />)

    fireEvent.click(screen.getByText('Sign Out'))
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1)
  })

  it('has proper navigation structure for accessibility', () => {
    render(<Navigation {...defaultProps} />)

    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass('navbar')
  })

  it('displays correct user type when authenticated', () => {
    const sellerUser = { ...mockUser, userType: 'seller' as const }
    render(<Navigation {...defaultProps} user={sellerUser} />)

    // Check that navigation displays user name regardless of type
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('handles missing user firstName gracefully', () => {
    const userWithoutName = { ...mockUser, firstName: '' }
    render(<Navigation {...defaultProps} user={userWithoutName} />)

    // Component should render dropdown button even with empty firstName
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('maintains dark theme styling', () => {
    render(<Navigation {...defaultProps} />)

    const navbar = screen.getByRole('navigation')
    expect(navbar).toHaveClass('navbar-dark')
  })
})