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
  { id: 'CLOTHING', label: 'Clothing', icon: Shirt },
  { id: 'SHOES', label: 'Shoes', icon: Footprints },
  { id: 'ACCESSORIES', label: 'Accessories', icon: Watch },
  { id: 'ELECTRONICS', label: 'Electronics', icon: Smartphone },
  { id: 'HOME', label: 'Home & Garden', icon: Home },
  { id: 'SPORTS', label: 'Sports & Outdoors', icon: Dumbbell },
  { id: 'BEAUTY', label: 'Beauty & Health', icon: Sparkles },
  { id: 'BOOKS', label: 'Books & Media', icon: BookOpen },
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
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)',
      minHeight: '600px',
      maxHeight: '876px'
    }}>
      {/* Progress Dots */}
      <div className="px-6 pt-12 pb-8 flex-shrink-0">
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'bg-gradient-to-r from-[#FF4458] to-[#FD267D] w-16' : i < step ? 'bg-gray-300 w-16' : 'bg-gray-200 w-16'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6" style={{ color: '#000000' }}>
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
              <h2
                className="text-3xl text-black mb-3"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2
                }}
              >
                What are you looking for?
              </h2>
              <p
                className="text-gray-600 mb-8"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: 1.5
                }}
              >
                Select one or more categories to get started
              </p>

              {/* Category Grid */}
              <div className="grid grid-cols-2 gap-3 pb-6">
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
                      whileTap={{ scale: 0.97 }}
                      className={`
                        relative p-5 rounded-2xl transition-all duration-200 group flex flex-col items-center justify-center text-center min-h-[120px] border
                        ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#FF4458] to-[#FD267D] shadow-lg border-transparent scale-[1.02]'
                            : 'bg-white shadow-md hover:shadow-lg border-gray-200 hover:border-gray-300'
                        }
                      `}
                      style={{
                        boxShadow: isSelected ? '0 8px 20px rgba(253, 38, 125, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {/* Icon Container */}
                      <div className={`mb-2 transition-all ${isSelected ? '' : ''}`}>
                        <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-black'}`} strokeWidth={2} />
                      </div>
                      {/* Label */}
                      <div
                        className={`${isSelected ? 'text-white' : 'text-black'}`}
                        style={{
                          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          lineHeight: 1.3
                        }}
                      >
                        {cat.label}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
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
              <h2
                className="text-3xl text-black mb-3"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.2
                }}
              >
                Set your budget
              </h2>
              <p
                className="text-gray-600 mb-8"
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: 1.5
                }}
              >
                Find great deals within your price range
              </p>

              {/* Price Display */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-10 mb-8 border border-gray-200 shadow-sm">
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
                    className="text-black mb-2"
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 600,
                      fontSize: '56px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1
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
                    [&::-webkit-slider-thumb]:from-[#FF4458]
                    [&::-webkit-slider-thumb]:to-[#FD267D]
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white"
                  style={{
                    background: `linear-gradient(to right, #FF4458 0%, #FD267D ${(priceRange.max / 1000) * 100}%, #e5e7eb ${(priceRange.max / 1000) * 100}%, #e5e7eb 100%)`
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
                      py-3.5 rounded-xl transition-all duration-200 border
                      ${
                        priceRange.max === price
                          ? 'bg-gradient-to-r from-[#FF4458] to-[#FD267D] text-white border-transparent shadow-lg'
                          : 'bg-white text-black border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                      }
                    `}
                    style={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      fontSize: '15px',
                      boxShadow: priceRange.max === price ? '0 4px 12px rgba(253, 38, 125, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.08)'
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
      <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-3">
          {step === 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onSkip}
              className="px-10 py-4 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all duration-200"
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                fontWeight: 500
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
              className="px-10 py-4 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all duration-200"
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                fontWeight: 500
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
            className={`
              flex-1 py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-200
              ${
                canProceed
                  ? 'bg-gradient-to-r from-[#FF4458] to-[#FD267D] text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              boxShadow: canProceed ? '0 4px 16px rgba(253, 38, 125, 0.35)' : 'none'
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
