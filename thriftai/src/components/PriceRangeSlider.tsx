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
  const handleMinChange = (value: number) => {
    if (value > priceRange.max) {
      onPriceRangeChange({ min: value, max: value });
    } else {
      onPriceRangeChange({ ...priceRange, min: value });
    }
  };

  const handleMaxChange = (value: number) => {
    if (value < priceRange.min) {
      onPriceRangeChange({ min: value, max: value });
    } else {
      onPriceRangeChange({ ...priceRange, max: value });
    }
  };

  const handlePresetClick = (maxPrice: number) => {
    onPriceRangeChange({ min: 0, max: maxPrice });
  };

  return (
    <div className="price-range-container">
      <div className="price-range-header">
        <label className="price-range-label">
          <i className="fas fa-dollar-sign" style={{ color: '#10b981' }} />
          Price Range
        </label>
        <span className="price-range-display">
          ${priceRange.min} - ${priceRange.max}
        </span>
      </div>

      <div className="price-range-sliders">
        <label className="slider-label">Min</label>
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={priceRange.min}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="price-slider"
          aria-label="Minimum price"
        />
        <label className="slider-label">Max</label>
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={priceRange.max}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="price-slider"
          aria-label="Maximum price"
        />
      </div>

      <div className="price-presets">
        {PRICE_PRESETS.map((price) => (
          <button
            key={price}
            onClick={() => handlePresetClick(price)}
            className={`price-preset-btn ${priceRange.max === price ? 'active' : ''}`}
            aria-label={`Set maximum price to $${price}`}
          >
            Under ${price}
          </button>
        ))}
      </div>

      <style jsx>{`
        .price-range-container {
          background: rgba(16, 185, 129, 0.08);
          padding: 15px 20px;
          border-radius: 12px;
          margin-top: 15px;
          border: 2px solid rgba(16, 185, 129, 0.3);
        }

        .price-range-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .price-range-label {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .price-range-display {
          color: #10b981;
          font-size: 16px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.15);
          padding: 6px 16px;
          border-radius: 20px;
          border: 2px solid #10b981;
        }

        .price-range-sliders {
          display: grid;
          grid-template-columns: 60px 1fr 60px 1fr;
          gap: 15px;
          align-items: center;
        }

        .slider-label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .price-slider {
          width: 100%;
          height: 6px;
          border-radius: 5px;
          background: linear-gradient(
            90deg,
            rgba(16, 185, 129, 0.3) 0%,
            rgba(16, 185, 129, 0.8) 100%
          );
          outline: none;
          cursor: pointer;
        }

        .price-presets {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .price-preset-btn {
          background: #ffffff;
          border: 2px solid #d1d5db;
          color: #374151;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .price-preset-btn.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #10b981;
        }

        .price-preset-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default PriceRangeSlider;
