'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check } from 'lucide-react'
import { SwipeFilters } from '@/lib/stores/swipeStore'

interface FilterWizardProps {
  onComplete: (filters: SwipeFilters) => void
  onSkip: () => void
}

const CATEGORIES = [
  { id: 'CLOTHING', label: 'Clothing', emoji: '👕' },
  { id: 'SHOES', label: 'Shoes', emoji: '👟' },
  { id: 'ACCESSORIES', label: 'Accessories', emoji: '👜' },
  { id: 'ELECTRONICS', label: 'Electronics', emoji: '📱' },
  { id: 'HOME', label: 'Home', emoji: '🏠' },
  { id: 'SPORTS', label: 'Sports', emoji: '⚽' },
  { id: 'BEAUTY', label: 'Beauty', emoji: '💄' },
  { id: 'BOOKS', label: 'Books', emoji: '📚' },
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
    <div className="h-[calc(100vh-56px)] lg:h-[876px] flex flex-col bg-white">
      {/* Progress Dots */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i === step ? 'bg-pink-500 w-6' : i < step ? 'bg-pink-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What are you looking for?
              </h2>
              <p className="text-gray-500 mb-6">
                Choose one or more categories
              </p>

              {/* Category Grid */}
              <div className="grid grid-cols-2 gap-3 pb-6">
                {CATEGORIES.map((cat) => {
                  const isSelected = categories.includes(cat.id)
                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative p-5 rounded-2xl border-2 transition-all
                        ${
                          isSelected
                            ? 'bg-gradient-to-br from-pink-500 to-orange-500 border-transparent text-white'
                            : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="text-3xl mb-2">{cat.emoji}</div>
                      <div className="font-bold">{cat.label}</div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-pink-500" />
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Set your budget
              </h2>
              <p className="text-gray-500 mb-8">
                Maximum price you want to pay
              </p>

              {/* Price Display */}
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl p-8 mb-8">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Up to</div>
                  <div className="text-5xl font-black bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                    ${priceRange.max}
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="mb-6">
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
                    [&::-webkit-slider-thumb]:w-7
                    [&::-webkit-slider-thumb]:h-7
                    [&::-webkit-slider-thumb]:bg-gradient-to-r
                    [&::-webkit-slider-thumb]:from-pink-500
                    [&::-webkit-slider-thumb]:to-orange-500
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-3 gap-3">
                {[100, 250, 500].map((price) => (
                  <button
                    key={price}
                    onClick={() => setPriceRange({ min: 0, max: price })}
                    className={`
                      py-3 rounded-xl font-bold transition-all
                      ${
                        priceRange.max === price
                          ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    ${price}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="p-5 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          {step === 0 && (
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
              Skip
            </button>
          )}

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`
              flex-1 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all
              ${
                canProceed
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {step === totalSteps - 1 ? 'Start Swiping' : 'Continue'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
