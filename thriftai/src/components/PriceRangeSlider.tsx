import React from 'react';

interface PriceRange {
  min: number;
  max: number;
}

interface PriceRangeSliderProps {
  priceRange: PriceRange;
  onPriceRangeChange: (range: PriceRange) => void;
}

const PRICE_PRESETS = [50, 100, 250, 500, 1000];

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  priceRange,
  onPriceRangeChange,
}) => {
  const handlePresetClick = (maxPrice: number) => {
    onPriceRangeChange({ min: 0, max: maxPrice });
  };

  const isAnyActive = PRICE_PRESETS.includes(priceRange.max);

  return (
    <div className="price-range-container">
      <div className="price-presets">
        {PRICE_PRESETS.map((price) => (
          <button
            key={price}
            onClick={() => handlePresetClick(price)}
            className={`price-preset-btn ${priceRange.max === price && priceRange.min === 0 ? 'active' : ''}`}
            aria-label={`Set maximum price to $${price}`}
          >
            <span className="price-value">${price}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .price-range-container {
          margin-top: 0.75rem;
        }

        .price-presets {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .price-preset-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(16, 185, 129, 0.3);
          color: var(--text-secondary);
          padding: 0.4rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          -webkit-tap-highlight-color: transparent;
        }

        .price-value {
          display: inline-block;
        }

        .price-preset-btn.active {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          color: #10b981;
          transform: scale(1.05);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .price-preset-btn:hover {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.5);
          transform: translateY(-1px);
        }

        .price-preset-btn:active {
          transform: scale(0.98);
        }

        @media (max-width: 576px) {
          .price-presets {
            gap: 0.35rem;
          }

          .price-preset-btn {
            padding: 0.35rem 0.65rem;
            font-size: 0.7rem;
            min-height: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default PriceRangeSlider;
