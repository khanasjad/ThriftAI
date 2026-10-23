'use client'

/**
 * World-Class Hero Section
 * Inspired by Apple and Tesla minimalism
 */

import React, { useState, useEffect } from 'react'
import { Search, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react'

interface WorldClassHeroProps {
  onSearch?: (query: string) => void
}

export default function WorldClassHero({ onSearch }: WorldClassHeroProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim())
    }
  }

  const stats = [
    { icon: Sparkles, value: '95+', label: 'Veritas Score', color: 'from-blue-500 to-purple-500' },
    { icon: TrendingUp, value: '1000+', label: 'Products Analyzed', color: 'from-green-500 to-emerald-500' },
    { icon: Shield, value: '100%', label: 'Scam Protection', color: 'from-orange-500 to-red-500' },
  ]

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 opacity-90" />

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(237, 100, 166, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(99, 179, 237, 0.3) 0%, transparent 50%)',
      }} />

      {/* Floating Orbs - More Vibrant */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-4000" />

      <div className={`relative z-10 max-w-6xl mx-auto px-6 py-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Main Headline */}
        <div className="space-y-6 mb-12">
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
            Smart Shopping,
            <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent animate-gradient">
              Powered by AI
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-lg">
            Discover the best deals with intelligent scoring.
            <span className="font-semibold text-yellow-300"> Save money, shop smarter.</span>
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

            <div className="relative rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-300 group-hover:scale-[1.02]" style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}>
              <div className="flex items-center p-6">
                <Search className="w-6 h-6 text-white/80 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for anything... iPhone, MacBook, Sneakers"
                  className="flex-1 ml-4 text-lg text-white placeholder-white/60 bg-transparent border-none outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white px-8 py-3 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['iPhone 15', 'MacBook', 'Nike Sneakers', 'Headphones'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setSearchQuery(suggestion)
                  if (onSearch) onSearch(suggestion)
                }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`transition-all duration-500 delay-${index * 100}`}
                style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
              >
                <div className="rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}>
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">{stat.value}</div>
                  <div className="text-white/80 font-semibold">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: 'AI-Powered Scores',
              description: 'Every product analyzed by 10 intelligent agents',
              gradient: 'from-cyan-400 to-blue-500'
            },
            {
              title: 'Best Deals First',
              description: 'Automatically sorted by value and quality',
              gradient: 'from-pink-400 to-purple-500'
            },
            {
              title: 'Scam Protection',
              description: 'Suspicious listings flagged automatically',
              gradient: 'from-green-400 to-emerald-500'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="text-left p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-white text-xs font-bold mb-3 shadow-lg`}>
                NEW
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16">
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 shadow-2xl hover:shadow-3xl"
            style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              color: '#1a1a1a',
            }}
          >
            <Zap className="w-6 h-6" />
            Explore Products
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
