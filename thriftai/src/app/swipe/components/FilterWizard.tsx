'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check, Shirt, Watch, Smartphone, Home, Dumbbell, Sparkles, BookOpen, Package, ShieldCheck, Footprints } from 'lucide-react'
import { SwipeFilters } from '@/lib/stores/swipeStore'

interface FilterWizardProps {
  onComplete: (filters: SwipeFilters) => void
  onSkip: () => void
}

const CATEGORIES = [
  { id: 'CLOTHING', label: 'Clothing', description: 'Fashion & Apparel', icon: Shirt, gradient: 'from-[#667eea] to-[#764ba2]', color: '#667eea' },
  { id: 'SHOES', label: 'Shoes', description: 'Footwear & Sneakers', icon: Footprints, gradient: 'from-[#f093fb] to-[#f5576c]', color: '#f093fb' },
  { id: 'ACCESSORIES', label: 'Accessories', description: 'Bags & Jewelry', icon: Watch, gradient: 'from-[#4facfe] to-[#00f2fe]', color: '#4facfe' },
  { id: 'ELECTRONICS', label: 'Electronics', description: 'Tech & Gadgets', icon: Smartphone, gradient: 'from-[#43e97b] to-[#38f9d7]', color: '#43e97b' },
  { id: 'HOME', label: 'Home & Garden', description: 'Furniture & Decor', icon: Home, gradient: 'from-[#fa709a] to-[#fee140]', color: '#fa709a' },
  { id: 'SPORTS', label: 'Sports & Outdoors', description: 'Fitness & Gear', icon: Dumbbell, gradient: 'from-[#30cfd0] to-[#330867]', color: '#30cfd0' },
  { id: 'BEAUTY', label: 'Beauty & Health', description: 'Skincare & Wellness', icon: Sparkles, gradient: 'from-[#a8edea] to-[#fed6e3]', color: '#a8edea' },
  { id: 'BOOKS', label: 'Books & Media', description: 'Reading & Entertainment', icon: BookOpen, gradient: 'from-[#ff9a56] to-[#ff6a88]', color: '#ff9a56' },
]

export function FilterWizard({ onComplete, onSkip }: FilterWizardProps) {
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 })

  const totalSteps = 2

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      onComplete({
        categories,
        priceRange,
        styles: []
      })
    }
  }

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  const canProceed = step === 0 ? categories.length > 0 : true

  return (
    <div className="h-full w-full rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col" style={{
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.25), 0 8px 24px rgba(118, 75, 162, 0.15), 0 0 80px rgba(102, 126, 234, 0.1)',
      minHeight: '600px',
      maxHeight: '876px',
      height: '100%',
      transform: 'translateZ(0)'
    }}>
      {/* Progress Dots - Modern Style */}
      <div className="px-8 pt-16 pb-10 flex-shrink-0">
        <div className="flex gap-3 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ width: i === step ? 64 : 8 }}
              animate={{ width: i === step ? 64 : 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                height: '6px',
                borderRadius: '999px',
                background: i === step
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : i < step
                  ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
                  : '#e5e7eb',
                boxShadow: i === step ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8" style={{ color: '#000000' }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Category */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 0.5rem' }} className="filter-wizard-text-black">
                <h2
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    fontSize: '1.875rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '1.25rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  What are you looking for?
                </h2>
                <p
                  className="filter-wizard-text-black"
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  Select one or more categories to get started
                </p>
                <p
                  className="filter-wizard-text-black"
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    maxWidth: '480px',
                    margin: '0 auto',
                    padding: '0 1.25rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  Discover amazing secondhand treasures across fashion, tech, home decor, and more. Every purchase saves money and helps the planet! 🌍
                </p>
              </div>

              {/* Category Grid - Modern 2025 Style */}
              <div className="grid grid-cols-2 gap-5 pb-4">
                {CATEGORIES.map((cat, index) => {
                  const isSelected = categories.includes(cat.id)
                  const Icon = cat.icon
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleCategory(cat.id)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: isSelected ? 1.02 : 1.03 }}
                      className={`
                        relative py-8 px-5 rounded-2xl transition-all duration-300 group flex flex-col items-center justify-center text-center border-2
                        ${
                          isSelected
                            ? `bg-gradient-to-br ${cat.gradient} border-transparent`
                            : 'bg-white border-gray-200'
                        }
                      `}
                      style={{
                        boxShadow: isSelected
                          ? `0 8px 24px ${cat.color}40, 0 0 40px ${cat.color}20`
                          : '0 2px 12px rgba(0, 0, 0, 0.06)',
                        borderColor: isSelected ? 'transparent' : !isSelected && categories.length === 0 ? '#e5e7eb' : `${cat.color}30`,
                        minHeight: '165px',
                        height: 'auto'
                      }}
                    >
                      {/* Icon Container with Animated Background */}
                      <div className={`mb-4 transition-all duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '16px',
                          background: isSelected
                            ? 'rgba(255, 255, 255, 0.2)'
                            : `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}25 100%)`,
                          backdropFilter: isSelected ? 'blur(10px)' : 'none',
                          border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid ${cat.color}30`,
                          boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.1)' : `0 2px 8px ${cat.color}20`
                        }}>
                          <Icon
                            className={`w-7 h-7`}
                            strokeWidth={2.5}
                            style={{ color: isSelected ? '#ffffff' : cat.color }}
                          />
                        </div>
                      </div>

                      {/* Label */}
                      <div style={{
                        textAlign: 'center',
                        width: '100%',
                        padding: '0 4px'
                      }}>
                        <div
                          className={isSelected ? '' : 'filter-wizard-text-black'}
                          style={{
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            lineHeight: 1.4,
                            textShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                            marginBottom: '6px',
                            color: isSelected ? '#ffffff' : undefined,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            width: '100%'
                          }}
                        >
                          {cat.label}
                        </div>
                        <div
                          className={isSelected ? '' : 'filter-wizard-text-black'}
                          style={{
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: 500,
                            fontSize: '0.72rem',
                            lineHeight: 1.5,
                            opacity: isSelected ? 0.9 : 0.8,
                            textShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
                            color: isSelected ? '#ffffff' : undefined,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            width: '100%'
                          }}
                        >
                          {cat.description}
                        </div>
                      </div>

                      {/* Check Mark */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center"
                          style={{
                            boxShadow: `0 2px 8px ${cat.color}40`
                          }}
                        >
                          <Check className="w-4 h-4" strokeWidth={3} style={{ color: cat.color }} />
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Price */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 0.5rem' }}>
                <h2
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    fontSize: '1.875rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '1.25rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  Set your budget
                </h2>
                <p
                  className="filter-wizard-text-black"
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    marginBottom: 0,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  Find great deals within your price range
                </p>
              </div>

              {/* Price Display */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                borderRadius: '24px',
                padding: '2.5rem',
                marginBottom: '2rem',
                border: '2px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.1)'
              }}>
                <div className="text-center">
                  <div
                    className="text-gray-600 mb-3"
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '11px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Maximum Price
                  </div>
                  <motion.div
                    key={priceRange.max}
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-2"
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 800,
                      fontSize: '56px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    ${priceRange.max}
                  </motion.div>
                  <div
                    className="text-gray-600"
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px'
                    }}
                  >
                    Slide to adjust
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="mb-8 px-1">
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ min: 0, max: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:bg-gradient-to-br
                    [&::-webkit-slider-thumb]:from-[#667eea]
                    [&::-webkit-slider-thumb]:to-[#764ba2]
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white"
                  style={{
                    background: `linear-gradient(to right, #667eea 0%, #764ba2 ${(priceRange.max / 1000) * 100}%, #e5e7eb ${(priceRange.max / 1000) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-3 gap-3">
                {[100, 250, 500].map((price) => (
                  <motion.button
                    key={price}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setPriceRange({ min: 0, max: price })}
                    className={`
                      py-3.5 rounded-xl transition-all duration-200 border-2
                      ${
                        priceRange.max === price
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-transparent shadow-lg'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-purple-200 shadow-sm hover:shadow-md'
                      }
                    `}
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      fontSize: '15px',
                      boxShadow: priceRange.max === price ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    ${price}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="px-8 py-6 bg-white border-t border-gray-100 flex-shrink-0" style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="flex gap-4">
          {step === 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onSkip}
              style={{
                padding: '1rem 2.5rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                border: '2px solid #d1d5db',
                color: '#374151',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Skip
            </motion.button>
          )}

          {step > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setStep(step - 1)}
              style={{
                padding: '1rem 2.5rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                border: '2px solid #d1d5db',
                color: '#374151',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Back
            </motion.button>
          )}

          <motion.button
            whileTap={canProceed ? { scale: 0.96 } : {}}
            whileHover={canProceed ? { scale: 1.02 } : {}}
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              flex: 1,
              padding: '1rem 2.5rem',
              borderRadius: '16px',
              background: canProceed
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
              border: canProceed ? 'none' : '2px solid #d1d5db',
              color: canProceed ? '#ffffff' : '#9ca3af',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxShadow: canProceed ? '0 4px 16px rgba(102, 126, 234, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {step === totalSteps - 1 ? 'Start Swiping' : 'Continue'}
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
