'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Veritas AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/pilot"
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              Pilot Program
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/api-docs"
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              API Docs
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-6 py-4 space-y-3">
            <Link
              href="/dashboard"
              className="block text-base font-medium text-gray-700 hover:text-violet-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/pilot"
              className="block text-base font-medium text-gray-700 hover:text-violet-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pilot Program
            </Link>
            <Link
              href="/about"
              className="block text-base font-medium text-gray-700 hover:text-violet-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/api-docs"
              className="block text-base font-medium text-gray-700 hover:text-violet-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              API Docs
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
