import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DynamicContent from './DynamicContent';
import { VoiceSearchButton } from './VoiceSearchButton';

interface HeroSectionProps {
  onSearch: (query: string) => Promise<void>;
  onVisualSearch: (file: File) => Promise<void>;
}

interface CategoryItem {
  name: string;
  icon: string;
  emoji: string; // Cute animated emoji for the category
  subcategories?: {
    name: string;
    types: string[];
  }[];
}

const CATEGORIES: CategoryItem[] = [
  {
    name: 'Fashion & Apparel',
    icon: 'fas fa-tshirt',
    emoji: '👗',
    subcategories: [
      { name: 'Designer Bags', types: ['Handbags', 'Backpacks', 'Clutches', 'Totes', 'Crossbody'] },
      { name: 'Clothing', types: ['Jackets', 'Dresses', 'Jeans', 'T-Shirts', 'Sweaters'] },
      { name: 'Shoes', types: ['Sneakers', 'Boots', 'Heels', 'Sandals', 'Loafers'] },
      { name: 'Accessories', types: ['Belts', 'Scarves', 'Hats', 'Sunglasses', 'Wallets'] }
    ]
  },
  {
    name: 'Electronics',
    icon: 'fas fa-laptop',
    emoji: '💻',
    subcategories: [
      { name: 'Computers', types: ['Laptops', 'Desktops', 'Tablets', 'Monitors', 'Keyboards'] },
      { name: 'Phones', types: ['iPhone', 'Samsung', 'Google Pixel', 'OnePlus', 'Accessories'] },
      { name: 'Gaming', types: ['PlayStation', 'Xbox', 'Nintendo Switch', 'Gaming PCs', 'Controllers'] },
      { name: 'Audio', types: ['Headphones', 'Speakers', 'Earbuds', 'Turntables', 'Amplifiers'] }
    ]
  },
  {
    name: 'Home & Garden',
    icon: 'fas fa-home',
    emoji: '🏡',
    subcategories: [
      { name: 'Furniture', types: ['Sofas', 'Tables', 'Chairs', 'Beds', 'Desks'] },
      { name: 'Decor', types: ['Wall Art', 'Mirrors', 'Rugs', 'Lamps', 'Vases'] },
      { name: 'Kitchen', types: ['Appliances', 'Cookware', 'Dinnerware', 'Glassware', 'Utensils'] },
      { name: 'Garden', types: ['Tools', 'Plants', 'Outdoor Furniture', 'Grills', 'Planters'] }
    ]
  },
  {
    name: 'Jewelry & Watches',
    icon: 'fas fa-gem',
    emoji: '💎',
    subcategories: [
      { name: 'Watches', types: ['Luxury Watches', 'Smart Watches', 'Vintage Watches', 'Sports Watches'] },
      { name: 'Jewelry', types: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches'] },
      { name: 'Fine Jewelry', types: ['Diamond', 'Gold', 'Silver', 'Platinum', 'Gemstones'] }
    ]
  },
  {
    name: 'Collectibles & Art',
    icon: 'fas fa-palette',
    emoji: '🎨',
    subcategories: [
      { name: 'Art', types: ['Paintings', 'Prints', 'Sculptures', 'Photography', 'Digital Art'] },
      { name: 'Vintage', types: ['Antiques', 'Coins', 'Stamps', 'Postcards', 'Maps'] },
      { name: 'Toys', types: ['Action Figures', 'LEGO', 'Dolls', 'Models', 'Trading Cards'] },
      { name: 'Books', types: ['First Editions', 'Rare Books', 'Comics', 'Manga', 'Vinyl Records'] }
    ]
  },
  {
    name: 'Sports & Outdoors',
    icon: 'fas fa-basketball-ball',
    emoji: '⚽',
    subcategories: [
      { name: 'Fitness', types: ['Weights', 'Yoga', 'Cardio Equipment', 'Resistance Bands'] },
      { name: 'Outdoor Gear', types: ['Camping', 'Hiking', 'Fishing', 'Climbing', 'Kayaking'] },
      { name: 'Sports Equipment', types: ['Basketball', 'Soccer', 'Tennis', 'Golf', 'Baseball'] },
      { name: 'Bikes', types: ['Road Bikes', 'Mountain Bikes', 'Electric Bikes', 'BMX'] }
    ]
  },
  {
    name: 'Music & Instruments',
    icon: 'fas fa-guitar',
    emoji: '🎸',
    subcategories: [
      { name: 'Guitars', types: ['Electric', 'Acoustic', 'Bass', 'Classical', 'Vintage'] },
      { name: 'Keyboards', types: ['Pianos', 'Synthesizers', 'MIDI Controllers', 'Organs'] },
      { name: 'Drums', types: ['Drum Kits', 'Cymbals', 'Electronic Drums', 'Percussion'] },
      { name: 'Recording', types: ['Microphones', 'Audio Interfaces', 'Mixers', 'Studio Monitors'] }
    ]
  },
  {
    name: 'Photography & Cameras',
    icon: 'fas fa-camera',
    emoji: '📷',
    subcategories: [
      { name: 'Cameras', types: ['DSLR', 'Mirrorless', 'Film Cameras', 'Action Cams', 'Drones'] },
      { name: 'Lenses', types: ['Prime Lenses', 'Zoom Lenses', 'Wide Angle', 'Telephoto'] },
      { name: 'Accessories', types: ['Tripods', 'Bags', 'Filters', 'Flash', 'Memory Cards'] }
    ]
  }
];

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onVisualSearch }) => {
  const router = useRouter();

  // State management
  const [query, setQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [showDynamicContent, setShowDynamicContent] = useState(false);
  const [dynamicContentType, setDynamicContentType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryItem | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string | null>(null);
  const [searchTerms, setSearchTerms] = React.useState<string[]>([]);
  const [showSearchOptions, setShowSearchOptions] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string>('');

  /**
   * Handle search submission
   */
  const handleSearch = async () => {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      await onSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press in search textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  /**
   * Handle visual search image upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsVisualLoading(true);
    try {
      await onVisualSearch(file);
    } catch (error) {
      alert('Visual search failed. Please try again.');
    } finally {
      setIsVisualLoading(false);
      e.target.value = '';
    }
  };

  /**
   * Set query from suggestion
   */
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  /**
   * Handle category selection
   */
  const handleCategoryClick = (category: CategoryItem) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSearchTerms([category.name]);
    setQuery(category.name);
  };

  /**
   * Handle subcategory selection
   */
  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    if (selectedCategory) {
      const newTerms = [selectedCategory.name, subcategory];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    }
  };

  /**
   * Handle product type selection
   */
  const handleTypeClick = (type: string) => {
    if (selectedCategory && selectedSubcategory) {
      const newTerms = [selectedCategory.name, selectedSubcategory, type];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    } else if (selectedCategory) {
      const newTerms = [selectedCategory.name, type];
      setSearchTerms(newTerms);
      setQuery(newTerms.join(' '));
    }
  };

  /**
   * Remove a search term
   */
  const removeSearchTerm = (index: number) => {
    const newTerms = searchTerms.filter((_, i) => i !== index);
    setSearchTerms(newTerms);
    setQuery(newTerms.join(' '));

    // Reset navigation state based on remaining terms
    if (index === 0) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else if (index === 1) {
      setSelectedSubcategory(null);
    }
  };

  /**
   * Go back in navigation
   */
  const goBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      if (selectedCategory) {
        setSearchTerms([selectedCategory.name]);
        setQuery(selectedCategory.name);
      }
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSearchTerms([]);
      setQuery('');
    }
  };

  /**
   * Navigation handlers
   */
  const showRecommendations = () => {
    setDynamicContentType('recommendations');
    setShowDynamicContent(true);
  };

  const showBestDeals = () => {
    router.push('/deals');
  };

  const hideDynamicContent = () => {
    setShowDynamicContent(false);
  };

  return (
    <main className="hero-modern animate-fade-in">
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 1rem'
      }}>
        {/* Main Content */}
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div className="hero-content" style={{ margin: '0 auto', textAlign: 'center' }}>
            {/* Hero Title */}
            <h1 className="hero-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '1rem' }}>
              Discover amazing finds with{' '}
              <span className="text-gradient-primary">Veritas.ai</span>
            </h1>
          </div>
        </div>

        {/* Modern Category Tiles - 2025 Mobile-First Design */}
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          marginTop: '1.5rem',
          margin: '1.5rem auto 0 auto'
        }}>
          {/* Header with Breadcrumb */}
          <div style={{
            marginBottom: '1rem',
            position: 'relative'
          }}>
            {/* Decorative background */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />

            {/* Breadcrumb Navigation */}
            {(selectedCategory || selectedSubcategory) && (
              <div style={{
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setSearchTerms([]);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    border: '1.5px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '12px',
                    padding: '0.5rem 1rem',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} />
                  All Categories
                </button>
                {selectedCategory && (
                  <>
                    <span style={{
                      color: 'rgba(102, 126, 234, 0.5)',
                      fontSize: '1.25rem',
                      fontWeight: 300
                    }}>›</span>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.375rem 0.75rem',
                      background: 'rgba(102, 126, 234, 0.08)',
                      borderRadius: '8px'
                    }}>
                      {selectedCategory.name}
                    </span>
                  </>
                )}
                {selectedSubcategory && (
                  <>
                    <span style={{
                      color: 'rgba(102, 126, 234, 0.5)',
                      fontSize: '1.25rem',
                      fontWeight: 300
                    }}>›</span>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.375rem 0.75rem',
                      background: 'rgba(102, 126, 234, 0.08)',
                      borderRadius: '8px'
                    }}>
                      {selectedSubcategory}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Title */}
            <div style={{
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontWeight: 900,
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 6s ease infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                {selectedSubcategory
                  ? 'Select Type'
                  : selectedCategory
                  ? selectedCategory.name
                  : 'Browse by Category'}
              </h2>
              <p style={{
                fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
                color: 'var(--text-secondary)',
                maxWidth: '650px',
                margin: '0 auto',
                fontWeight: 500,
                lineHeight: 1.4,
                opacity: 0.85
              }}>
                {selectedSubcategory
                  ? 'Choose the specific type you\'re looking for'
                  : selectedCategory
                  ? 'Select a subcategory to refine your search'
                  : 'Discover amazing products across our curated collections'}
              </p>
            </div>
          </div>

          {/* Responsive Category/Subcategory Grid */}
          <div
            className={
              !selectedCategory
                ? 'category-grid-main'
                : selectedSubcategory
                  ? 'category-grid-types'
                  : 'category-grid-sub'
            }
            style={{
              display: 'grid',
              gap: 'clamp(0.4rem, 0.8vw, 0.5rem)',
              width: '100%',
              justifyContent: 'center'
            }}>
            {/* Category tiles will be here - keeping existing code */}
            {selectedCategory && selectedSubcategory ? (
              selectedCategory.subcategories
                ?.find(sub => sub.name === selectedSubcategory)
                ?.types.map((type, index) => {
                  const gradients = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  ];
                  const gradient = gradients[index % gradients.length];

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        handleTypeClick(type);
                        setSelectedType(type);
                        setShowSearchOptions(true);
                      }}
                      style={{
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'visible',
                        minHeight: '45px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: gradient,
                        opacity: 0.2,
                        borderRadius: '14px'
                      }} />
                      <div style={{
                        position: 'relative',
                        fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        wordBreak: 'break-word',
                        zIndex: 1,
                        padding: '0.25rem',
                        maxWidth: '100%'
                      }}>
                        {type}
                      </div>
                    </button>
                  );
                })
            ) : selectedCategory ? (
              /* Show Subcategories */
              selectedCategory.subcategories?.map((sub, index) => {
                const gradients = [
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <button
                    key={index}
                    onClick={() => handleSubcategoryClick(sub.name)}
                    style={{
                      position: 'relative',
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'visible',
                      minHeight: '50px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: gradient,
                      opacity: 0.2,
                      borderRadius: '14px'
                    }} />
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      textAlign: 'center',
                      width: '100%',
                      padding: '0.25rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}>
                      <div style={{
                        fontSize: 'clamp(0.7rem, 1.4vw, 0.8rem)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.2,
                        wordBreak: 'break-word',
                        maxWidth: '100%'
                      }}>
                        {sub.name}
                      </div>
                      <div style={{
                        fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        opacity: 0.75
                      }}>
                        {sub.types.length} types
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              /* Show Categories */
              CATEGORIES.map((category, index) => {
                const gradients = [
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <button
                    key={index}
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      position: 'relative',
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '0.5rem 0.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'visible',
                      minHeight: '50px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    aria-label={`Browse ${category.name}`}
                  >
                    {/* Gradient Background */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: gradient,
                      opacity: 0.2,
                      transition: 'opacity 0.3s ease',
                      borderRadius: '14px',
                      zIndex: 0
                    }} />

                    {/* Category Name */}
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      textAlign: 'center',
                      width: '100%',
                      padding: '0.25rem 0.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.15rem'
                    }}>
                      <div style={{
                        fontSize: 'clamp(0.65rem, 1vw, 0.7rem)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.1,
                        wordBreak: 'break-word',
                        letterSpacing: '-0.01em',
                        maxWidth: '100%'
                      }}>
                        {category.name}
                      </div>
                      <div style={{
                        fontSize: 'clamp(0.6rem, 0.85vw, 0.65rem)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        opacity: 0.75
                      }}>
                        {category.subcategories?.length || 0} categories
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Search Options Modal */}
        {showSearchOptions && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowSearchOptions(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: 'clamp(1rem, 4vw, 2rem)',
                maxWidth: 'min(600px, 90vw)',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                textAlign: 'center',
                color: 'var(--text-primary)'
              }}>
                How would you like to search?
              </h3>
              <p style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                fontSize: '0.95rem'
              }}>
                {selectedCategory?.name} › {selectedSubcategory} › {selectedType}
              </p>

              <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'
              }}>
                {/* Leaderboard Search */}
                <button
                  onClick={() => {
                    const searchQuery = selectedCategory && selectedSubcategory && selectedType
                      ? `${selectedCategory.name} ${selectedSubcategory} ${selectedType}`
                      : query;
                    setQuery(searchQuery);
                    setShowSearchOptions(false);
                    handleSearch();
                  }}
                  style={{
                    padding: '1.5rem 1rem',
                    borderRadius: '16px',
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                  }}
                >
                  <i className="fas fa-trophy" style={{ fontSize: '2rem', color: '#667eea' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Leaderboard
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Top rated products
                    </div>
                  </div>
                </button>

                {/* Swipe Search */}
                <button
                  onClick={() => {
                    const searchQuery = selectedCategory && selectedSubcategory && selectedType
                      ? `${selectedCategory.name} ${selectedSubcategory} ${selectedType}`
                      : query;
                    router.push(`/swipe?q=${encodeURIComponent(searchQuery)}`);
                    setShowSearchOptions(false);
                  }}
                  style={{
                    padding: '1.5rem 1rem',
                    borderRadius: '16px',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <i className="fas fa-fire" style={{ fontSize: '2rem', color: '#ef4444' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Swipe
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Discover by swiping
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Search Interface */}
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '1.5rem auto 0 auto'
        }}>
          <div className="hero-content" style={{ margin: '0 auto', textAlign: 'center' }}>
            {/* Search Interface - ChatGPT Style */}
            <div className="search-container-modern animate-slide-up">
              <div className="search-input-area-redesigned">
                {/* Text Input Section */}
                <div className="search-text-section">
                  <textarea
                    className="search-textarea-redesigned"
                    placeholder="What treasures are you looking for today? Try: 'Find me a vintage leather jacket' or 'Show me modern home decor'..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    aria-label="Search query"
                  />
                </div>

                {/* Divider Line */}
                <div className="search-divider" />

                {/* Action Buttons Section */}
                <div className="search-actions-section">
                  <div className="search-button-group">
                    {/* Trending/Swipe Button */}
                    <button
                      className="search-action-btn"
                      type="button"
                      onClick={() => {
                        const swipePath = query.trim()
                          ? `/swipe?q=${encodeURIComponent(query.trim())}`
                          : '/swipe'
                        router.push(swipePath)
                      }}
                      title="Swipe Mode"
                      aria-label="Swipe through products"
                    >
                      <i className="fas fa-fire" />
                    </button>

                    {/* Visual Search Button */}
                    <button
                      className="search-action-btn file-input-container"
                      type="button"
                      onClick={() => document.getElementById('visual-search-input')?.click()}
                      disabled={isVisualLoading}
                      title="Search by image"
                      aria-label="Visual search"
                    >
                      {isVisualLoading ? (
                        <i className="fas fa-spinner fa-spin" />
                      ) : (
                        <i className="fas fa-camera" />
                      )}
                      <input
                        id="visual-search-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isVisualLoading}
                        className="file-input-hidden"
                        aria-label="Upload image for visual search"
                      />
                    </button>

                    {/* Voice Search Button */}
                    <VoiceSearchButton
                      onTranscript={(text) => setQuery(text)}
                      className="search-action-btn"
                    />

                    {/* Search Submit Button */}
                    <button
                      className="search-submit-btn"
                      type="button"
                      onClick={handleSearch}
                      disabled={isLoading}
                      title="Search"
                      aria-label="Submit search"
                    >
                      {isLoading ? (
                        <i className="fas fa-spinner fa-spin" />
                      ) : (
                        <i className="fas fa-arrow-right" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ultra Compact Price Range Slider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '0.5rem',
                maxWidth: '500px',
                margin: '0.5rem auto 0 auto',
                padding: '0 1rem'
              }}>
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  Max: ${priceRange.max}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ min: 0, max: parseInt(e.target.value) })}
                  style={{
                    flex: 1,
                    height: '4px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(priceRange.max / 1000) * 100}%, rgba(255, 255, 255, 0.1) ${(priceRange.max / 1000) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  background: #10b981;
                  border: 2px solid white;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  transition: transform 0.2s;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  background: #10b981;
                  border: 2px solid white;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  transition: transform 0.2s;
                }
                input[type="range"]::-moz-range-thumb:hover {
                  transform: scale(1.2);
                }
              `}</style>
            </div>

            {/* Dynamic Content Area */}
            {showDynamicContent && (
              <div className="mt-5 animate-slide-up">
                <DynamicContent
                  type={dynamicContentType}
                  onHide={hideDynamicContent}
                  onSearch={selectSuggestion}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
};

export default HeroSection;
