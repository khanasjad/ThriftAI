/**
 * Veritas.ai Logo Component
 *
 * Official branding logo with emerald green accent
 */

import React from 'react';

interface VeritasLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

const sizeMap = {
  sm: { text: 'text-xl', icon: 'w-8 h-8' },
  md: { text: 'text-2xl', icon: 'w-12 h-12' },
  lg: { text: 'text-4xl', icon: 'w-16 h-16' },
  xl: { text: 'text-6xl', icon: 'w-24 h-24' },
};

export const VeritasLogo: React.FC<VeritasLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const sizeClass = sizeMap[size];

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center bg-[#1e2139] rounded-2xl p-3 ${sizeClass.icon} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* V letter - bold white */}
          <path
            d="M20 15 L45 80 L70 15"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Emerald green dot - your brand color! */}
          <circle cx="78" cy="72" r="11" fill="#10b981" />
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <div className={`font-bold ${sizeClass.text} tracking-tight`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <span style={{ color: '#ffffff' }}>veritas</span>
          <span style={{ color: '#10b981' }}>.</span>
          <span style={{ color: '#9ca3af' }}>ai</span>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-500 mt-1 tracking-wider uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Truth in Every Transaction
          </div>
        )}
      </div>
    );
  }

  // Full variant with icon + text
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="inline-flex items-center justify-center bg-[#1e2139] rounded-xl p-2 w-10 h-10">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* V letter */}
          <path
            d="M20 15 L45 80 L70 15"
            stroke="white"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Emerald green dot */}
          <circle cx="78" cy="72" r="11" fill="#10b981" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-2xl tracking-tight leading-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <span style={{ color: '#ffffff' }}>veritas</span>
          <span style={{ color: '#10b981' }}>.</span>
          <span style={{ color: '#9ca3af' }}>ai</span>
        </div>
        {showTagline && (
          <div className="text-[10px] text-gray-500 tracking-wider uppercase mt-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Truth in Every Transaction
          </div>
        )}
      </div>
    </div>
  );
};

export default VeritasLogo;
