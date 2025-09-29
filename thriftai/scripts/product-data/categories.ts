// ThriftAI Product Categories Configuration
// Comprehensive category definitions for 1000+ diverse thrift products

export interface CategoryConfig {
  name: string
  subcategories: string[]
  searchTerms: string[]
  commonConditions: string[]
  priceRange: { min: number; max: number }
  sizingAvailable: boolean
  colorVariations: boolean
  unsplashQueries: string[]
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  CLOTHING: {
    name: 'Clothing',
    subcategories: [
      'Vintage Denim', 'Designer Dresses', 'Band T-Shirts', 'Sweaters & Cardigans',
      'Blazers & Jackets', 'Formal Wear', 'Activewear', 'Lingerie & Intimates',
      'Maternity Wear', 'Plus Size', 'Petite', 'Boho & Hippie',
      'Gothic & Alternative', 'Work Attire', 'Casual Wear', 'Evening Wear'
    ],
    searchTerms: [
      'vintage clothing', 'designer dresses', 'denim jacket', 'sweater cardigan',
      'blazer suit', 'formal dress', 'yoga pants', 'band t-shirt',
      'bohemian dress', 'work blouse', 'evening gown', 'casual shirt'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 8, max: 180 },
    sizingAvailable: true,
    colorVariations: true,
    unsplashQueries: [
      'vintage clothing rack', 'fashion clothing', 'dress wardrobe', 'vintage denim',
      'designer clothes', 'bohemian fashion', 'formal wear', 'casual clothes'
    ]
  },

  SHOES: {
    name: 'Shoes',
    subcategories: [
      'Athletic Sneakers', 'Dress Shoes', 'Boots & Ankle Boots', 'Heels & Pumps',
      'Sandals & Flip-Flops', 'Loafers & Flats', 'Vintage Sneakers', 'Designer Heels',
      'Work Boots', 'Rain Boots', 'Snow Boots', 'Running Shoes',
      'Basketball Shoes', 'Hiking Boots', 'Wedding Shoes', 'Platform Shoes'
    ],
    searchTerms: [
      'vintage sneakers', 'leather boots', 'high heels', 'running shoes',
      'dress shoes', 'sandals', 'athletic shoes', 'designer heels',
      'work boots', 'ankle boots', 'platform shoes', 'loafers'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good'],
    priceRange: { min: 12, max: 250 },
    sizingAvailable: true,
    colorVariations: true,
    unsplashQueries: [
      'vintage shoes', 'leather boots', 'sneakers collection', 'high heels',
      'athletic shoes', 'dress shoes', 'shoe closet', 'footwear'
    ]
  },

  ELECTRONICS: {
    name: 'Electronics',
    subcategories: [
      'Smartphones & Tablets', 'Laptops & Computers', 'Gaming Consoles', 'Cameras & Photography',
      'Audio & Headphones', 'Smart Home Devices', 'Vintage Electronics', 'TV & Entertainment',
      'Wearable Tech', 'Computer Accessories', 'Music Equipment', 'Office Electronics',
      'Kitchen Electronics', 'Personal Care Electronics', 'Car Electronics', 'Collectible Tech'
    ],
    searchTerms: [
      'smartphone phone', 'laptop computer', 'gaming console', 'vintage camera',
      'headphones audio', 'smart watch', 'tablet ipad', 'vintage stereo',
      'bluetooth speaker', 'drone camera', 'retro electronics', 'vintage radio'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good'],
    priceRange: { min: 25, max: 800 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage electronics', 'retro technology', 'old computer', 'vintage camera',
      'retro stereo', 'vintage phone', 'old gaming console', 'vintage audio equipment'
    ]
  },

  ACCESSORIES: {
    name: 'Accessories',
    subcategories: [
      'Handbags & Purses', 'Watches & Jewelry', 'Sunglasses & Eyewear', 'Belts & Suspenders',
      'Scarves & Wraps', 'Hats & Caps', 'Hair Accessories', 'Ties & Bow Ties',
      'Wallets & Money Clips', 'Tech Accessories', 'Travel Accessories', 'Vintage Jewelry',
      'Designer Bags', 'Statement Jewelry', 'Wedding Accessories', 'Sports Accessories'
    ],
    searchTerms: [
      'vintage handbag', 'leather watch', 'designer sunglasses', 'vintage jewelry',
      'silk scarf', 'leather belt', 'vintage hat', 'pearl necklace',
      'leather wallet', 'vintage brooch', 'designer bag', 'vintage earrings'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 5, max: 300 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage jewelry', 'leather handbag', 'vintage watch', 'designer sunglasses',
      'vintage accessories', 'silk scarf', 'vintage hat', 'fashion accessories'
    ]
  },

  HOME: {
    name: 'Home & Decor',
    subcategories: [
      'Kitchen & Dining', 'Vintage Decor', 'Artwork & Prints', 'Lighting & Lamps',
      'Textiles & Linens', 'Collectibles & Antiques', 'Pottery & Ceramics', 'Glassware & Crystal',
      'Mirrors & Wall Decor', 'Candles & Fragrance', 'Plants & Planters', 'Storage & Organization',
      'Vintage Furniture Pieces', 'Holiday Decorations', 'Bathroom Accessories', 'Outdoor Decor'
    ],
    searchTerms: [
      'vintage decor', 'antique vase', 'vintage lamp', 'ceramic pottery',
      'vintage mirror', 'crystal glass', 'vintage artwork', 'antique clock',
      'vintage kitchen', 'retro decor', 'vintage collectible', 'antique furniture'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 10, max: 200 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage home decor', 'antique vase', 'vintage lamp', 'retro kitchen',
      'vintage artwork', 'antique mirror', 'vintage pottery', 'antique collectibles'
    ]
  },

  BOOKS: {
    name: 'Books & Media',
    subcategories: [
      'Fiction & Literature', 'Non-Fiction & Biography', 'Vintage & Rare Books', 'Textbooks & Education',
      'Art & Design Books', 'Cookbooks & Food', 'Travel & Adventure', 'Self-Help & Philosophy',
      'Children\'s Books', 'Comics & Graphic Novels', 'Music & Entertainment', 'History & Politics',
      'Science & Technology', 'Religion & Spirituality', 'Poetry & Drama', 'Reference & Dictionaries'
    ],
    searchTerms: [
      'vintage book', 'antique book', 'rare book', 'first edition',
      'vintage cookbook', 'art book', 'vintage novel', 'antique bible',
      'vintage textbook', 'collectible book', 'vintage poetry', 'antique dictionary'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 3, max: 75 },
    sizingAvailable: false,
    colorVariations: false,
    unsplashQueries: [
      'vintage books', 'antique book', 'old library', 'vintage bookshelf',
      'rare books', 'vintage novel', 'antique literature', 'old manuscripts'
    ]
  },

  SPORTS: {
    name: 'Sports & Outdoors',
    subcategories: [
      'Exercise Equipment', 'Outdoor Gear & Camping', 'Athletic Apparel', 'Sports Memorabilia',
      'Bikes & Cycling', 'Water Sports', 'Winter Sports', 'Team Sports Equipment',
      'Golf Equipment', 'Tennis & Racquet Sports', 'Running & Fitness', 'Vintage Sports Gear',
      'Collectible Sports Items', 'Hunting & Fishing', 'Rock Climbing & Hiking', 'Yoga & Pilates'
    ],
    searchTerms: [
      'vintage sports equipment', 'athletic gear', 'exercise equipment', 'outdoor gear',
      'vintage bicycle', 'sports memorabilia', 'fitness equipment', 'camping gear',
      'vintage golf clubs', 'athletic apparel', 'vintage skis', 'exercise bike'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good'],
    priceRange: { min: 15, max: 350 },
    sizingAvailable: true,
    colorVariations: true,
    unsplashQueries: [
      'vintage sports equipment', 'athletic gear', 'exercise equipment', 'outdoor gear',
      'vintage bicycle', 'fitness equipment', 'sports memorabilia', 'camping equipment'
    ]
  },

  FURNITURE: {
    name: 'Furniture',
    subcategories: [
      'Vintage Chairs', 'Tables & Desks', 'Storage & Cabinets', 'Bedroom Furniture',
      'Living Room Pieces', 'Kitchen & Dining', 'Office Furniture', 'Outdoor Furniture',
      'Antique Furniture', 'Mid-Century Modern', 'Industrial Furniture', 'Rustic & Farmhouse',
      'Art Deco Pieces', 'Victorian Furniture', 'Scandinavian Design', 'Retro Furniture'
    ],
    searchTerms: [
      'vintage chair', 'antique table', 'mid century furniture', 'vintage desk',
      'antique cabinet', 'vintage dresser', 'retro furniture', 'vintage sofa',
      'antique bookshelf', 'vintage nightstand', 'industrial furniture', 'farmhouse furniture'
    ],
    commonConditions: ['Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 50, max: 500 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage furniture', 'antique chair', 'mid century modern', 'vintage table',
      'antique furniture', 'retro furniture', 'vintage desk', 'industrial furniture'
    ]
  },

  BEAUTY: {
    name: 'Beauty & Personal Care',
    subcategories: [
      'Vintage Perfumes', 'Makeup & Cosmetics', 'Skincare Products', 'Hair Care & Styling',
      'Beauty Tools & Accessories', 'Nail Care', 'Bath & Body', 'Men\'s Grooming',
      'Vintage Compacts', 'Designer Fragrances', 'Natural & Organic', 'Travel Size Products',
      'Gift Sets', 'Collectible Beauty Items', 'Professional Beauty Tools', 'Vintage Mirrors'
    ],
    searchTerms: [
      'vintage perfume', 'antique compact', 'vintage makeup', 'retro cosmetics',
      'vintage fragrance', 'antique mirror', 'vintage beauty', 'collectible perfume',
      'vintage vanity', 'antique cosmetics', 'retro beauty products', 'vintage grooming'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good'],
    priceRange: { min: 8, max: 120 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage perfume', 'antique compact', 'vintage cosmetics', 'retro beauty',
      'vintage fragrance', 'antique vanity', 'vintage makeup', 'beauty collectibles'
    ]
  },

  TOYS: {
    name: 'Toys & Collectibles',
    subcategories: [
      'Vintage Action Figures', 'Dolls & Dollhouses', 'Board Games & Puzzles', 'Educational Toys',
      'Collectible Toys', 'Plush & Stuffed Animals', 'Model Trains & Cars', 'Arts & Crafts',
      'Musical Toys', 'Outdoor Play Equipment', 'Electronic Toys', 'Building Sets',
      'Vintage Games', 'Antique Toys', 'Character Merchandise', 'Baby & Toddler Toys'
    ],
    searchTerms: [
      'vintage toy', 'antique doll', 'vintage action figure', 'retro game',
      'vintage puzzle', 'collectible toy', 'vintage board game', 'antique teddy bear',
      'vintage model train', 'retro electronic toy', 'vintage dollhouse', 'antique toy car'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair'],
    priceRange: { min: 5, max: 150 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage toys', 'antique doll', 'vintage action figures', 'retro games',
      'vintage teddy bear', 'antique toys', 'collectible toys', 'vintage dollhouse'
    ]
  },

  AUTOMOTIVE: {
    name: 'Automotive & Tools',
    subcategories: [
      'Car Accessories', 'Vintage Auto Parts', 'Tools & Equipment', 'Car Care Products',
      'Automotive Collectibles', 'Motorcycle Accessories', 'Vintage License Plates', 'Car Audio',
      'Navigation & Electronics', 'Safety Equipment', 'Vintage Manuals', 'Auto Memorabilia',
      'Classic Car Parts', 'Performance Parts', 'Interior Accessories', 'Exterior Accessories'
    ],
    searchTerms: [
      'vintage car accessory', 'antique auto part', 'vintage tool', 'classic car',
      'vintage license plate', 'auto memorabilia', 'vintage car manual', 'retro auto',
      'vintage car audio', 'antique tool', 'classic car part', 'vintage automotive'
    ],
    commonConditions: ['New', 'Like New', 'Excellent', 'Very Good', 'Good'],
    priceRange: { min: 10, max: 200 },
    sizingAvailable: false,
    colorVariations: true,
    unsplashQueries: [
      'vintage car accessories', 'antique auto parts', 'vintage tools', 'classic car',
      'vintage automotive', 'retro car accessories', 'vintage license plate', 'auto memorabilia'
    ]
  }
}

export const CONDITIONS = [
  { value: 'New', label: 'New', description: 'Brand new with tags/packaging' },
  { value: 'Like New', label: 'Like New', description: 'Excellent condition, barely used' },
  { value: 'Excellent', label: 'Excellent', description: 'Minor signs of wear' },
  { value: 'Very Good', label: 'Very Good', description: 'Light wear, good condition' },
  { value: 'Good', label: 'Good', description: 'Moderate wear, functional' },
  { value: 'Fair', label: 'Fair', description: 'Significant wear, still usable' }
]

export const SIZES = {
  CLOTHING: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'],
  SHOES: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'],
  SPORTS: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size']
}

export const COLORS = [
  'Black', 'White', 'Gray', 'Brown', 'Beige', 'Navy', 'Blue', 'Red', 'Pink', 'Purple',
  'Green', 'Yellow', 'Orange', 'Gold', 'Silver', 'Cream', 'Tan', 'Burgundy', 'Teal', 'Multi'
]