'use client'

import React, { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'
import SignupModal from '@/components/SignupModal'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  // Adapt the user object to match what Navigation expects
  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || ''
  } : null

  const handleSearch = async (query: string) => {
    try {
      // Use chat search (which we know works) as primary method
      const response = await fetch('/api/buyers/chat-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        // Store search results and navigate
        sessionStorage.setItem('searchResults', JSON.stringify(data))
        sessionStorage.setItem('searchQuery', query)
        // Navigate to search results page
        router.push(`/buyers/search?q=${encodeURIComponent(query)}`)
      } else {
        throw new Error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      // If all else fails, navigate to search page which will handle the query
      router.push(`/buyers/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleVisualSearch = async (file: File) => {
    try {
      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise
      const imageFormat = file.type.split('/')[1] as 'jpeg' | 'png' | 'webp' | 'gif'

      const response = await fetch('/api/visual-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Data,
          imageFormat,
          additionalText: '',
          maxResults: 12
        })
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      // Navigate to search page with the generated query
      const searchQuery = data.imageAnalysis?.searchQuery || 'visual search results'
      router.push(`/buyers/search?q=${encodeURIComponent(searchQuery)}`)
    } catch (error) {
      console.error('Visual search error:', error)
      throw error
    }
  }

  const handleSignOut = () => {
    signOut()
  }

  // Simple auth service for signup compatibility
  const authService = {
    signup: async (userData: any) => {
      // Implement signup logic here if needed
      console.log('Signup attempt:', userData)
    }
  }

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupModal(true)}
        onLogout={handleSignOut}
      />

      <HeroSection
        onSearch={handleSearch}
        onVisualSearch={handleVisualSearch}
      />

      <Footer />

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onShowLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
        onSignup={authService.signup}
      />
    </div>
  )
}