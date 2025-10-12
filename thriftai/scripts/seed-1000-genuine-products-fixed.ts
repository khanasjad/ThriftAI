#!/usr/bin/env npx tsx
/**
 * Seed 1000 GENUINE Products with CORRECT Brand Assignments
 *
 * FIX: Each product is now assigned to its actual manufacturer
 * - iPhones are ONLY Apple
 * - Galaxy phones are ONLY Samsung
 * - MacBooks are ONLY Apple
 * - etc.
 */

import { prisma } from '../src/lib/prisma'

const CATEGORIES = {
  ELECTRONICS: 'ELECTRONICS',
  CLOTHING: 'CLOTHING',
  SHOES: 'SHOES',
  ACCESSORIES: 'ACCESSORIES',
  HOME: 'HOME',
  BEAUTY: 'BEAUTY',
  SPORTS: 'SPORTS',
  TOYS: 'TOYS'
} as const

// Product templates with CORRECT brand assignments
const PRODUCT_TEMPLATES = {
  ELECTRONICS: {
    products: [
      // Apple Products
      { brand: 'Apple', base: 'iPhone 15 Pro Max', variants: ['256GB', '512GB', '1TB'], colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], priceRange: [899, 1199] },
      { brand: 'Apple', base: 'iPhone 14', variants: ['128GB', '256GB', '512GB'], colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red'], priceRange: [599, 799] },
      { brand: 'Apple', base: 'iPhone 13 Pro', variants: ['128GB', '256GB', '512GB'], colors: ['Sierra Blue', 'Graphite', 'Gold', 'Silver'], priceRange: [699, 899] },
      { brand: 'Apple', base: 'MacBook Pro', variants: ['14" M3 Pro', '16" M3 Pro', '16" M3 Max'], colors: ['Space Black', 'Silver'], priceRange: [1599, 2499] },
      { brand: 'Apple', base: 'MacBook Air', variants: ['13" M2', '15" M2'], colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'], priceRange: [849, 1299] },
      { brand: 'Apple', base: 'iPad Pro', variants: ['11" 128GB', '11" 256GB', '12.9" 256GB'], colors: ['Space Gray', 'Silver'], priceRange: [699, 1299] },
      { brand: 'Apple', base: 'iPad Air', variants: ['64GB', '256GB'], colors: ['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue'], priceRange: [549, 699] },
      { brand: 'Apple', base: 'AirPods Pro', variants: ['2nd Gen', '2nd Gen USB-C'], colors: ['White'], priceRange: [199, 249] },
      { brand: 'Apple', base: 'Apple Watch Series 9', variants: ['41mm', '45mm'], colors: ['Midnight', 'Starlight', 'Pink', 'Red'], priceRange: [349, 429] },
      { brand: 'Apple', base: 'Apple Watch Ultra 2', variants: ['49mm'], colors: ['Titanium'], priceRange: [749, 799] },

      // Samsung Products
      { brand: 'Samsung', base: 'Galaxy S24 Ultra', variants: ['256GB', '512GB', '1TB'], colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'], priceRange: [949, 1299] },
      { brand: 'Samsung', base: 'Galaxy S23', variants: ['128GB', '256GB'], colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'], priceRange: [599, 749] },
      { brand: 'Samsung', base: 'Galaxy Tab S9', variants: ['128GB', '256GB'], colors: ['Graphite', 'Beige', 'Cream'], priceRange: [649, 849] },
      { brand: 'Samsung', base: 'Galaxy Watch 6', variants: ['40mm', '44mm'], colors: ['Graphite', 'Silver'], priceRange: [249, 329] },
      { brand: 'Samsung', base: 'QLED QN90C', variants: ['55"', '65"', '75"'], colors: ['Titan Black'], priceRange: [1199, 2499] },

      // Google Products
      { brand: 'Google', base: 'Pixel 8 Pro', variants: ['128GB', '256GB', '512GB'], colors: ['Obsidian', 'Porcelain', 'Bay'], priceRange: [699, 899] },

      // Dell Products
      { brand: 'Dell', base: 'XPS 13', variants: ['i5 16GB', 'i7 16GB', 'i7 32GB'], colors: ['Platinum Silver', 'Graphite'], priceRange: [899, 1499] },

      // HP Products
      { brand: 'HP', base: 'Spectre x360', variants: ['13.5"', '14"', '16"'], colors: ['Nightfall Black', 'Nocturne Blue'], priceRange: [1099, 1699] },

      // Microsoft Products
      { brand: 'Microsoft', base: 'Surface Laptop 5', variants: ['13.5"', '15"'], colors: ['Platinum', 'Matte Black', 'Sage'], priceRange: [999, 1599] },

      // Lenovo Products
      { brand: 'Lenovo', base: 'ThinkPad X1 Carbon', variants: ['Gen 11 i5', 'Gen 11 i7'], colors: ['Black'], priceRange: [1299, 1899] },

      // Sony Products
      { brand: 'Sony', base: 'WH-1000XM5', variants: ['Wireless'], colors: ['Black', 'Silver'], priceRange: [329, 399] },
      { brand: 'Sony', base: 'A7 IV', variants: ['Body Only', 'With 28-70mm'], colors: ['Black'], priceRange: [2299, 2799] },
      { brand: 'Sony', base: 'Bravia XR A80L', variants: ['55"', '65"', '77"'], colors: [''], priceRange: [1499, 3299] },

      // Bose Products
      { brand: 'Bose', base: 'QuietComfort 45', variants: ['Wireless'], colors: ['Black', 'White Smoke'], priceRange: [279, 329] },

      // JBL Products
      { brand: 'JBL', base: 'Flip 6', variants: ['Portable Speaker'], colors: ['Black', 'Blue', 'Red', 'Gray'], priceRange: [99, 129] },

      // Beats Products
      { brand: 'Beats', base: 'Studio Pro', variants: ['Wireless'], colors: ['Black', 'Navy', 'Sandstone'], priceRange: [299, 349] },

      // Canon Products
      { brand: 'Canon', base: 'EOS R6 Mark II', variants: ['Body Only', 'With 24-105mm'], colors: ['Black'], priceRange: [2099, 2899] },

      // Nikon Products
      { brand: 'Nikon', base: 'Z6 III', variants: ['Body Only'], colors: ['Black'], priceRange: [2299, 2499] },

      // LG Products
      { brand: 'LG', base: 'OLED C3', variants: ['55"', '65"', '77"'], colors: [''], priceRange: [1299, 2999] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  CLOTHING: {
    products: [
      { brand: 'Nike', base: 'Air Jordan 1 High OG', variants: ['S', 'M', 'L', 'XL'], colors: ['Chicago', 'Royal', 'Shadow', 'Bred'], priceRange: [149, 199] },
      { brand: 'Nike', base: 'Tech Fleece Hoodie', variants: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Gray', 'Navy', 'Olive'], priceRange: [99, 129] },
      { brand: 'Adidas', base: 'Originals Track Pants', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Maroon'], priceRange: [59, 79] },
      { brand: 'Levis', base: '501 Original Jeans', variants: ['30x30', '32x32', '34x32', '36x34'], colors: ['Dark Wash', 'Light Wash', 'Black'], priceRange: [69, 89] },
      { brand: 'The North Face', base: 'Thermoball Jacket', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Red'], priceRange: [179, 229] },
      { brand: 'Patagonia', base: 'Better Sweater', variants: ['S', 'M', 'L', 'XL'], colors: ['Stonewash', 'Navy', 'Black'], priceRange: [129, 159] },
      { brand: 'Champion', base: 'Reverse Weave Hoodie', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Gray', 'Navy', 'Scarlet'], priceRange: [59, 79] },
      { brand: 'Carhartt', base: 'Work Jacket', variants: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Brown', 'Black', 'Moss'], priceRange: [89, 129] },
      { brand: 'Ralph Lauren', base: 'Polo Shirt', variants: ['S', 'M', 'L', 'XL'], colors: ['White', 'Navy', 'Black', 'Red'], priceRange: [69, 89] },
      { brand: 'Tommy Hilfiger', base: 'Windbreaker', variants: ['S', 'M', 'L', 'XL'], colors: ['Navy/Red/White', 'Black'], priceRange: [79, 109] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  SHOES: {
    products: [
      { brand: 'Nike', base: 'Dunk Low', variants: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'], colors: ['Panda', 'University Blue', 'Retro High'], priceRange: [99, 129] },
      { brand: 'Nike', base: 'Air Max 90', variants: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'], colors: ['White', 'Black', 'Grey'], priceRange: [119, 139] },
      { brand: 'Adidas', base: 'Ultraboost', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Core Black', 'Cloud White', 'Grey'], priceRange: [159, 189] },
      { brand: 'Adidas', base: 'Stan Smith', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['White/Green', 'All White', 'Navy'], priceRange: [79, 99] },
      { brand: 'New Balance', base: '574', variants: ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'], colors: ['Gray', 'Navy', 'Burgundy'], priceRange: [79, 99] },
      { brand: 'Converse', base: 'Chuck Taylor All Star', variants: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black', 'White', 'Red'], priceRange: [49, 69] },
      { brand: 'Vans', base: 'Old Skool', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black/White', 'Navy', 'All Black'], priceRange: [59, 79] },
      { brand: 'Puma', base: 'Suede Classic', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black', 'Navy', 'Burgundy'], priceRange: [69, 89] },
      { brand: 'Asics', base: 'Gel-Kayano 29', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black', 'Blue', 'White'], priceRange: [139, 169] },
      { brand: 'Brooks', base: 'Ghost 15', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black', 'Gray', 'Blue'], priceRange: [129, 149] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  ACCESSORIES: {
    products: [
      { brand: 'Ray-Ban', base: 'Aviator Sunglasses', variants: ['Small', 'Medium', 'Large'], colors: ['Gold/Green', 'Silver/Gray', 'Black/Green'], priceRange: [149, 199] },
      { brand: 'Oakley', base: 'Holbrook', variants: ['Standard'], colors: ['Matte Black', 'Polished Black', 'Gray'], priceRange: [139, 179] },
      { brand: 'Michael Kors', base: 'Lexington Watch', variants: ['40mm', '42mm'], colors: ['Gold', 'Silver', 'Rose Gold'], priceRange: [199, 299] },
      { brand: 'Fossil', base: 'Gen 6 Smartwatch', variants: ['42mm', '44mm'], colors: ['Black', 'Silver', 'Rose Gold'], priceRange: [249, 299] },
      { brand: 'Coach', base: 'Crossbody Bag', variants: ['Small', 'Medium'], colors: ['Black', 'Brown', 'Tan'], priceRange: [199, 299] },
      { brand: 'Kate Spade', base: 'Satchel', variants: ['Medium', 'Large'], colors: ['Black', 'Pink', 'Navy'], priceRange: [249, 349] },
      { brand: 'Tory Burch', base: 'Fleming Bag', variants: ['Small', 'Medium'], colors: ['Black', 'Royal Navy', 'Shell Pink'], priceRange: [399, 499] },
      { brand: 'Gucci', base: 'Marmont Belt', variants: ['Size 85', 'Size 90', 'Size 95'], colors: ['Black', 'Brown'], priceRange: [399, 499] },
      { brand: 'Louis Vuitton', base: 'Neverfull', variants: ['MM', 'GM'], colors: ['Monogram', 'Damier Ebene'], priceRange: [1299, 1499] },
      { brand: 'Casio', base: 'G-Shock Watch', variants: ['Standard'], colors: ['Black', 'Blue', 'Red', 'White'], priceRange: [79, 129] },
      { brand: 'Nixon', base: 'Time Teller', variants: ['38mm', '40mm'], colors: ['Gold', 'Silver', 'Black'], priceRange: [99, 149] },
      { brand: 'Herschel', base: 'Little America Backpack', variants: ['Standard'], colors: ['Black', 'Navy', 'Woodland Camo'], priceRange: [99, 129] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  HOME: {
    products: [
      { brand: 'Dyson', base: 'V11 Cordless Vacuum', variants: ['Animal', 'Torque Drive'], colors: ['Purple', 'Blue'], priceRange: [499, 599] },
      { brand: 'Ninja', base: 'Foodi Air Fryer', variants: ['6.5 Qt', '8 Qt'], colors: ['Black', 'Silver'], priceRange: [149, 199] },
      { brand: 'KitchenAid', base: 'Stand Mixer', variants: ['Artisan 5 Qt', 'Professional 6 Qt'], colors: ['Empire Red', 'Onyx Black', 'Ice Blue'], priceRange: [299, 449] },
      { brand: 'Instant Pot', base: 'Duo', variants: ['6 Qt', '8 Qt'], colors: ['Stainless Steel'], priceRange: [79, 119] },
      { brand: 'Keurig', base: 'K-Elite Coffee Maker', variants: ['Standard'], colors: ['Brushed Silver', 'Brushed Slate'], priceRange: [129, 159] },
      { brand: 'Vitamix', base: 'E310 Blender', variants: ['Standard'], colors: ['Black', 'Red'], priceRange: [299, 349] },
      { brand: 'iRobot', base: 'Roomba i7', variants: ['Standard', 'Plus'], colors: ['Black'], priceRange: [499, 699] },
      { brand: 'Philips', base: 'Hue White Bulbs', variants: ['2-Pack', '4-Pack'], colors: ['White'], priceRange: [29, 49] },
      { brand: 'Nest', base: 'Learning Thermostat', variants: ['3rd Gen'], colors: ['Mirror Black', 'Stainless Steel', 'White'], priceRange: [199, 249] },
      { brand: 'Ring', base: 'Video Doorbell', variants: ['Wired', 'Battery'], colors: ['Satin Nickel', 'Venetian Bronze'], priceRange: [79, 129] },
      { brand: 'Cuisinart', base: 'Food Processor', variants: ['8 Cup', '14 Cup'], colors: ['White', 'Stainless Steel'], priceRange: [99, 179] },
      { brand: 'Breville', base: 'Barista Express', variants: ['Standard'], colors: ['Stainless Steel', 'Black Truffle'], priceRange: [599, 699] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  BEAUTY: {
    products: [
      { brand: 'Dyson', base: 'Airwrap', variants: ['Complete', 'Volume + Shape'], colors: ['Nickel/Copper', 'Iron/Fuchsia'], priceRange: [499, 599] },
      { brand: 'Dyson', base: 'Supersonic Hair Dryer', variants: ['Standard'], colors: ['Iron/Fuchsia', 'Nickel/Copper'], priceRange: [399, 449] },
      { brand: 'Revlon', base: 'One-Step Hair Dryer', variants: ['2.4"', '2.8"'], colors: ['Black', 'Pink'], priceRange: [39, 59] },
      { brand: 'GHD', base: 'Platinum+ Styler', variants: ['Standard'], colors: ['Black', 'White'], priceRange: [249, 299] },
      { brand: 'BaByliss', base: 'Pro Straightener', variants: ['1"', '1.25"'], colors: ['Black'], priceRange: [79, 129] },
      { brand: 'Philips', base: 'Sonicare DiamondClean', variants: ['Standard'], colors: ['White', 'Black', 'Rose Gold'], priceRange: [179, 229] },
      { brand: 'Braun', base: 'Series 9 Shaver', variants: ['Standard', 'Pro'], colors: ['Silver', 'Black'], priceRange: [299, 399] },
      { brand: 'Oral-B', base: 'iO Series 9', variants: ['Standard'], colors: ['White', 'Black', 'Rose Quartz'], priceRange: [249, 299] },
      { brand: 'Waterpik', base: 'Water Flosser', variants: ['Countertop', 'Cordless'], colors: ['White', 'Black'], priceRange: [49, 79] },
      { brand: 'Foreo', base: 'Luna 3', variants: ['Normal Skin', 'Sensitive Skin'], colors: ['Pearl Pink', 'Mint'], priceRange: [179, 229] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  SPORTS: {
    products: [
      { brand: 'Nike', base: 'Dri-FIT Training Shirt', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White', 'Navy', 'Red'], priceRange: [29, 39] },
      { brand: 'Adidas', base: 'Training Shorts', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Gray'], priceRange: [29, 39] },
      { brand: 'Under Armour', base: 'Compression Shirt', variants: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Gray', 'Navy'], priceRange: [39, 49] },
      { brand: 'Lululemon', base: 'Align Leggings', variants: ['Size 4', 'Size 6', 'Size 8', 'Size 10'], colors: ['Black', 'Navy', 'Gray'], priceRange: [89, 109] },
      { brand: 'Reebok', base: 'CrossFit Nano X3', variants: ['US 8', 'US 9', 'US 10', 'US 11'], colors: ['Black', 'White', 'Gray'], priceRange: [119, 149] },
      { brand: 'YETI', base: 'Rambler', variants: ['20 oz', '30 oz', '36 oz'], colors: ['Black', 'Navy', 'Stainless'], priceRange: [29, 49] },
      { brand: 'Hydro Flask', base: 'Water Bottle', variants: ['32 oz', '40 oz'], colors: ['Black', 'White', 'Pacific'], priceRange: [39, 49] },
      { brand: 'TRX', base: 'Home2 System', variants: ['Standard'], colors: ['Black'], priceRange: [159, 189] },
      { brand: 'Bowflex', base: 'SelectTech Dumbbells', variants: ['52.5 lb', '90 lb'], colors: ['Black/Red'], priceRange: [399, 549] },
      { brand: 'Peloton', base: 'Bike', variants: ['Standard', 'Plus'], colors: ['Black'], priceRange: [1445, 1895] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  },

  TOYS: {
    products: [
      { brand: 'LEGO', base: 'Star Wars Millennium Falcon', variants: ['75257', '75192'], colors: [''], priceRange: [129, 849] },
      { brand: 'LEGO', base: 'Technic Bugatti', variants: ['42083'], colors: [''], priceRange: [349, 399] },
      { brand: 'LEGO', base: 'Harry Potter Hogwarts Castle', variants: ['71043'], colors: [''], priceRange: [399, 449] },
      { brand: 'Nintendo', base: 'Switch OLED', variants: ['White', 'Neon'], colors: ['White', 'Neon Red/Blue'], priceRange: [329, 349] },
      { brand: 'Sony', base: 'PlayStation 5', variants: ['Standard', 'Digital'], colors: ['White'], priceRange: [449, 499] },
      { brand: 'Microsoft', base: 'Xbox Series X', variants: ['Standard'], colors: ['Black'], priceRange: [449, 499] },
      { brand: 'Mattel', base: 'Barbie Dreamhouse', variants: ['2024 Edition'], colors: ['Pink'], priceRange: [179, 229] },
      { brand: 'Mattel', base: 'Hot Wheels Track Builder', variants: ['Mega Set'], colors: [''], priceRange: [49, 79] },
      { brand: 'Hasbro', base: 'Nerf Elite 2.0', variants: ['Commander', 'Turbine'], colors: ['Blue/Orange'], priceRange: [29, 49] },
      { brand: 'Fisher-Price', base: 'Little People', variants: ['Playset'], colors: [''], priceRange: [29, 49] },
    ],
    imageBase: 'https://images.unsplash.com/photo-'
  }
}

// Image IDs from Unsplash
const UNSPLASH_IMAGE_IDS = {
  ELECTRONICS: [
    '1505740420928-5e560c06d30e', '1511707171634-5f897ff02aa9', '1484788984921-03950022c9ef',
    '1512499617640-c74ae3a79d37', '1517336714731-489689fd1ca8', '1526738549149-8e07eca6c147',
    '1505751172876-fa1195b29f4ef', '1598327105666-5b89351aff97', '1531297484001-80022131f5a1',
    '1542751371-adc38448a05e', '1505156868547-9b49f4df4e04', '1588508065123-12ae48b4d1c5'
  ],
  CLOTHING: [
    '1489987707025-afc232f7ea0f', '1556821840-3a9cac6e5d6', '1525507119028-ed4c629a60a3',
    '1490114538077-0a7f8cb49891', '1521572163474-6864f9cf17ab', '1539533018447-63fcce2678e3',
    '1509631179647-a4cf9b9c8e4f', '1503342217505-b0a15ec3261c', '1556638893-23d12d8c8a5'
  ],
  SHOES: [
    '1542291026-7eec264c27ff', '1460353581641-37baddab0fa2', '1595950653106-6c9ebd614d3a',
    '1549298916-b41d501d3772', '1608231387042-66d1773070a5', '1606107557195-0b97725aae0',
    '1562183241-b937e95585b6', '1600185365483-5e66f63f77b1', '1584735175315-9d5df23860e6'
  ],
  ACCESSORIES: [
    '1511499767150-a48a237f0083', '1574169208507-843761f428e8', '1509941943102-cd00b4642710',
    '1589995952382-d8e0f7ad8ae6', '1584917865442-de89df76afd3', '1611892440504-42a792e24d32',
    '1553062407-98eebfa4f61', '1606760227091-3dd870d97f1d', '1622434641406-a158123450f8'
  ],
  HOME: [
    '1585821569331-f071db2abd8d', '1556909114-f6e7ad7d3136', '1585338107529-1317644a0f27',
    '1556911220-bff31c812dba', '1484154218962-a197022b5858', '1556911219-4057f86c5f8',
    '1505691723518-36587bcf5a31', '1558618666-fcd25c85cd64', '1507089947368-19c1ae4cbbe1'
  ],
  BEAUTY: [
    '1596462502278-27a2386a2d59', '1526947425960-945c6e72858f', '1522335789203-aabd1fc54bc9',
    '1560343090-f0409e92791a', '1612198188428-e1e99e506b5a', '1556228578-0d85b1a4d571',
    '1571781926291-c477ebfd024b', '1522338242992-e1a54906a8da', '1598440947619-2c35fc9aa908'
  ],
  SPORTS: [
    '1517836357463-d25dfeac3438', '1461896836934-689d83c3a51f', '1599058917212-d750089bc07e',
    '1556817411-31ae72fa3ea0', '1534438327276-14e5300c3a48', '1517649763962-0c623066013f',
    '1558618666-fcd25c85cd64', '1534681111987-e1b05fc1dc2d', '1517836357463-d25dfeac3438'
  ],
  TOYS: [
    '1515276941804-b8e5d3f8b4d4', '1587300003388-59208cc962cb', '1560582908-c4a52a6d6bfe',
    '1558618666-fcd25c85cd64', '1606936024423-48f2a7dbb2c7', '1526657782461-9fe13402a841',
    '1531482615713-2afd69097998', '1572635196237-bd526773e8f', '1621710122463-00b3b3d85d1a'
  ]
}

const CONDITIONS = ['New', 'Like New', 'Excellent', 'Very Good', 'Good']
const CONDITION_MULTIPLIERS = {
  'New': 1.0,
  'Like New': 0.85,
  'Excellent': 0.75,
  'Very Good': 0.65,
  'Good': 0.55
}

async function getOrCreateSeller(brandName: string) {
  const sellerId = `seller-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

  let seller = await prisma.seller.findUnique({
    where: { id: sellerId },
  })

  if (!seller) {
    const user = await prisma.user.create({
      data: {
        email: `${sellerId}@marketplace.com`,
        firstName: brandName,
        lastName: 'Store',
      },
    })

    seller = await prisma.seller.create({
      data: {
        id: sellerId,
        userId: user.id,
        businessName: `${brandName} Marketplace`,
        ownerName: brandName,
        email: `${sellerId}@marketplace.com`,
        phone: '555-0100',
        address: '123 Commerce St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        rating: 4.5 + Math.random() * 0.5,
        totalSales: Math.floor(200 + Math.random() * 800),
        categories: Object.values(CATEGORIES),
        isVerified: true,
        isActive: true,
      },
    })
  }

  return seller.id
}

function generateProductName(template: any, variant: string, color: string): string {
  const parts = [template.brand, template.base]
  if (variant && variant !== 'Standard' && variant !== '') parts.push(variant)
  if (color && color !== '') parts.push(`- ${color}`)
  return parts.join(' ')
}

function generateDescription(name: string, brand: string, condition: string, price: number, originalPrice: number): string {
  const savings = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  return `Genuine ${brand} ${name} in ${condition} condition. ${
    savings > 0 ? `Save ${savings}% off original price! ` : ''
  }Authentic product with verified specifications. Perfect for those seeking quality ${brand} products at competitive prices.`
}

async function main() {
  console.log('🚀 Seeding 1000 GENUINE Products with CORRECT Brand Assignments')
  console.log('='.repeat(80))
  console.log()

  let totalSeeded = 0
  const stats: Record<string, number> = {}

  console.log('🗑️  Clearing existing products...')
  const deleteResult = await prisma.product.deleteMany({})
  console.log(`   ✅ Deleted ${deleteResult.count} existing products\n`)

  for (const [category, config] of Object.entries(PRODUCT_TEMPLATES)) {
    console.log(`\n📂 Category: ${category}`)
    console.log('-'.repeat(80))

    let categoryCount = 0
    const productsToSeed = 125
    const imageIds = UNSPLASH_IMAGE_IDS[category as keyof typeof UNSPLASH_IMAGE_IDS]

    while (categoryCount < productsToSeed) {
      const template = config.products[categoryCount % config.products.length]
      const brand = template.brand  // ✅ USE THE CORRECT BRAND FROM TEMPLATE
      const variant = template.variants[categoryCount % template.variants.length]
      const color = template.colors[categoryCount % template.colors.length]
      const condition = CONDITIONS[categoryCount % CONDITIONS.length]
      const conditionMultiplier = CONDITION_MULTIPLIERS[condition as keyof typeof CONDITION_MULTIPLIERS]

      const basePrice = template.priceRange[0] + (Math.random() * (template.priceRange[1] - template.priceRange[0]))
      const originalPrice = basePrice
      const price = basePrice * conditionMultiplier

      const productName = generateProductName(template, variant, color)

      const imageId = imageIds[categoryCount % imageIds.length]
      const imageUrl = `${config.imageBase}${imageId}?w=800&h=600&fit=crop`

      const sellerId = await getOrCreateSeller(brand)

      try {
        await prisma.product.create({
          data: {
            name: productName,
            description: generateDescription(template.base, brand, condition, price, originalPrice),
            price: parseFloat(price.toFixed(2)),
            originalPrice: parseFloat(originalPrice.toFixed(2)),
            brand,
            category,
            condition,
            imageUrl,
            seller: {
              connect: { id: sellerId }
            },
            isAvailable: true,
            isAuthentic: true,
            qualityScore: 75 + Math.random() * 20,
            estimatedDeliveryDays: 3 + Math.floor(Math.random() * 5),
            hasFreeShipping: Math.random() > 0.3,
            hasFreeReturns: Math.random() > 0.4,
            hasWarranty: condition === 'New' && Math.random() > 0.5,
            warrantyMonths: condition === 'New' ? 12 : 0,
            returnPeriodDays: 30,
            shippingCost: Math.random() > 0.3 ? 0 : 5.99,
            certifications: [`${brand} Authentic`, condition === 'New' ? 'Factory Sealed' : 'Quality Checked'],
            stockQuantity: 1 + Math.floor(Math.random() * 10),
            popularityScore: 60 + Math.random() * 40,
            relevanceScore: 70 + Math.random() * 30,
            trendingScore: 50 + Math.random() * 50,
            viewCount: Math.floor(100 + Math.random() * 500),
            clickCount: Math.floor(20 + Math.random() * 100),
            purchaseCount: Math.floor(5 + Math.random() * 30),
            cartAdditionCount: Math.floor(15 + Math.random() * 60),
            tags: [brand, category, condition, 'Authentic', 'Quality'],
            searchKeywords: productName.toLowerCase().split(' ').filter(w => w.length > 2),
            dynamicSpecs: {
              source: 'Curated Database',
              genuine: true,
              verified: true,
              condition,
              variant,
              color: color || 'N/A'
            }
          }
        })

        categoryCount++
        totalSeeded++

        if (categoryCount % 25 === 0 || categoryCount === productsToSeed) {
          console.log(`  ✅ Seeded ${categoryCount}/${productsToSeed} products in ${category}`)
        }
      } catch (error) {
        console.error(`  ❌ Error:`, error instanceof Error ? error.message : error)
      }
    }

    stats[category] = categoryCount
    console.log(`  📊 Completed ${category}: ${categoryCount} products`)
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`✅ SEEDING COMPLETE!`)
  console.log('='.repeat(80))
  console.log()
  console.log(`📊 Summary:`)
  console.log(`   Total Products Seeded: ${totalSeeded}`)
  console.log()
  console.log(`📂 By Category:`)
  Object.entries(stats).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count} products`)
  })
  console.log()
  console.log(`🎯 All products are GENUINE with CORRECT brands:`)
  console.log(`   ✅ iPhones are ONLY Apple`)
  console.log(`   ✅ Galaxy phones are ONLY Samsung`)
  console.log(`   ✅ MacBooks are ONLY Apple`)
  console.log(`   ✅ Dyson products are ONLY Dyson`)
  console.log(`   ✅ NO impossible brand combinations`)
  console.log()
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Disconnected from database')
  })
