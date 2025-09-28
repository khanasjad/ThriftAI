-- V4__Populate_configuration_data.sql
-- Migrate hardcoded business logic data into configuration tables

-- ========================================
-- CATEGORY CONFIGURATION
-- ========================================
INSERT INTO category_configuration (category_name, parent_category, display_name, description, sort_order) VALUES
('CLOTHING', NULL, 'Clothing & Apparel', 'All clothing items including tops, bottoms, dresses', 1),
('SHOES', NULL, 'Shoes & Footwear', 'All types of footwear', 2),
('ELECTRONICS', NULL, 'Electronics & Gadgets', 'Electronic devices and accessories', 3),
('ACCESSORIES', NULL, 'Accessories', 'Fashion and functional accessories', 4),
('BAGS', 'ACCESSORIES', 'Bags & Purses', 'All types of bags, purses, and luggage', 5),
('JEWELRY', 'ACCESSORIES', 'Jewelry & Watches', 'Jewelry, watches, and precious items', 6),
('HOME', NULL, 'Home & Garden', 'Home decor and garden items', 7),
('BOOKS', NULL, 'Books & Media', 'Books, magazines, and media', 8),
('SPORTS', NULL, 'Sports & Outdoors', 'Sports equipment and outdoor gear', 9),
('AUTOMOTIVE', NULL, 'Automotive', 'Car accessories and automotive items', 10);

-- Subcategories
INSERT INTO category_configuration (category_name, parent_category, display_name, description, sort_order) VALUES
('TOPS', 'CLOTHING', 'Tops', 'Shirts, blouses, sweaters, jackets', 11),
('BOTTOMS', 'CLOTHING', 'Bottoms', 'Pants, jeans, shorts, skirts', 12),
('DRESSES', 'CLOTHING', 'Dresses', 'All types of dresses and gowns', 13),
('SNEAKERS', 'SHOES', 'Sneakers', 'Athletic and casual sneakers', 14),
('FORMAL_SHOES', 'SHOES', 'Formal Shoes', 'Dress shoes and formal footwear', 15),
('PHONES', 'ELECTRONICS', 'Phones & Tablets', 'Mobile phones and tablets', 16),
('COMPUTERS', 'ELECTRONICS', 'Computers', 'Laptops, desktops, and accessories', 17);

-- ========================================
-- CATEGORY KEYWORDS
-- ========================================
-- Clothing keywords
INSERT INTO category_keywords (category_id, keyword, weight)
SELECT id, keyword, weight FROM category_configuration, (VALUES
    ('clothing', 1.0), ('clothes', 1.0), ('apparel', 1.0), ('wear', 0.8),
    ('shirt', 1.0), ('blouse', 1.0), ('sweater', 1.0), ('jacket', 1.0), ('coat', 1.0),
    ('pants', 1.0), ('jeans', 1.0), ('shorts', 1.0), ('skirt', 1.0), ('trousers', 1.0),
    ('dress', 1.0), ('gown', 1.0), ('maxi', 0.9), ('midi', 0.9)
) AS keywords(keyword, weight)
WHERE category_configuration.category_name = 'CLOTHING';

-- Shoes keywords
INSERT INTO category_keywords (category_id, keyword, weight)
SELECT id, keyword, weight FROM category_configuration, (VALUES
    ('shoes', 1.0), ('footwear', 1.0), ('sneakers', 1.0), ('boots', 1.0),
    ('athletic', 0.9), ('running', 0.9), ('casual', 0.8), ('formal', 0.8),
    ('heels', 1.0), ('flats', 1.0), ('sandals', 1.0)
) AS keywords(keyword, weight)
WHERE category_configuration.category_name = 'SHOES';

-- Electronics keywords
INSERT INTO category_keywords (category_id, keyword, weight)
SELECT id, keyword, weight FROM category_configuration, (VALUES
    ('electronics', 1.0), ('gadget', 1.0), ('device', 0.8), ('tech', 0.9),
    ('phone', 1.0), ('smartphone', 1.0), ('mobile', 1.0), ('tablet', 1.0),
    ('computer', 1.0), ('laptop', 1.0), ('desktop', 1.0), ('monitor', 1.0),
    ('headphones', 1.0), ('earbuds', 1.0), ('speaker', 1.0), ('camera', 1.0)
) AS keywords(keyword, weight)
WHERE category_configuration.category_name = 'ELECTRONICS';

-- Accessories keywords
INSERT INTO category_keywords (category_id, keyword, weight)
SELECT id, keyword, weight FROM category_configuration, (VALUES
    ('accessories', 1.0), ('accessory', 1.0),
    ('bag', 1.0), ('purse', 1.0), ('handbag', 1.0), ('backpack', 1.0), ('tote', 1.0),
    ('wallet', 1.0), ('belt', 1.0), ('scarf', 1.0), ('hat', 1.0), ('cap', 1.0),
    ('sunglasses', 1.0), ('glasses', 0.9), ('jewelry', 1.0), ('watch', 1.0),
    ('necklace', 1.0), ('bracelet', 1.0), ('ring', 1.0), ('earrings', 1.0)
) AS keywords(keyword, weight)
WHERE category_configuration.category_name = 'ACCESSORIES';

-- ========================================
-- BRAND CONFIGURATION
-- ========================================
INSERT INTO brand_configuration (brand_name, display_name, reputation_tier, primary_category_id) VALUES
-- Luxury brands
('GUCCI', 'Gucci', 'LUXURY', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('PRADA', 'Prada', 'LUXURY', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('LOUIS_VUITTON', 'Louis Vuitton', 'LUXURY', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('CHANEL', 'Chanel', 'LUXURY', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('HERMES', 'Hermès', 'LUXURY', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),

-- Premium brands
('NIKE', 'Nike', 'PREMIUM', (SELECT id FROM category_configuration WHERE category_name = 'SHOES')),
('ADIDAS', 'Adidas', 'PREMIUM', (SELECT id FROM category_configuration WHERE category_name = 'SHOES')),
('APPLE', 'Apple', 'PREMIUM', (SELECT id FROM category_configuration WHERE category_name = 'ELECTRONICS')),
('SAMSUNG', 'Samsung', 'PREMIUM', (SELECT id FROM category_configuration WHERE category_name = 'ELECTRONICS')),
('SUPREME', 'Supreme', 'PREMIUM', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),

-- Standard brands
('ZARA', 'Zara', 'STANDARD', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),
('H_AND_M', 'H&M', 'STANDARD', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),
('UNIQLO', 'Uniqlo', 'STANDARD', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),
('TARGET', 'Target', 'BUDGET', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),
('WALMART', 'Walmart', 'BUDGET', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING'));

-- ========================================
-- SEARCH INTENT CONFIGURATION
-- ========================================
INSERT INTO search_intent_configuration (intent_name, intent_type, description, priority) VALUES
('PRODUCT_SEARCH', 'PRODUCT_SEARCH', 'User is searching for specific products', 1),
('CATEGORY_BROWSE', 'CATEGORY_BROWSE', 'User is browsing a category', 2),
('BRAND_SEARCH', 'BRAND_SEARCH', 'User is searching for specific brand', 3),
('PRICE_FILTER', 'PRICE_FILTER', 'User wants to filter by price', 4),
('SIZE_FILTER', 'SIZE_FILTER', 'User wants to filter by size', 5),
('CONDITION_FILTER', 'CONDITION_FILTER', 'User wants to filter by condition', 6),
('COLOR_SEARCH', 'COLOR_SEARCH', 'User is searching by color', 7),
('OCCASION_SEARCH', 'OCCASION_SEARCH', 'User is searching for specific occasion', 8);

-- ========================================
-- SEARCH INTENT KEYWORDS
-- ========================================
-- Price intent keywords
INSERT INTO search_intent_keywords (intent_id, keyword_pattern, weight)
SELECT id, keyword_pattern, weight FROM search_intent_configuration, (VALUES
    ('under', 1.0), ('below', 1.0), ('less than', 1.0), ('up to', 1.0), ('max', 1.0),
    ('over', 1.0), ('above', 1.0), ('more than', 1.0), ('minimum', 1.0),
    ('cheap', 0.9), ('budget', 0.9), ('affordable', 0.9), ('inexpensive', 0.9),
    ('expensive', 0.9), ('luxury', 0.9), ('premium', 0.9), ('designer', 0.9)
) AS keywords(keyword_pattern, weight)
WHERE intent_name = 'PRICE_FILTER';

-- Size intent keywords
INSERT INTO search_intent_keywords (intent_id, keyword_pattern, weight)
SELECT id, keyword_pattern, weight FROM search_intent_configuration, (VALUES
    ('size', 1.0), ('small', 1.0), ('medium', 1.0), ('large', 1.0),
    ('xs', 1.0), ('s', 0.8), ('m', 0.8), ('l', 0.8), ('xl', 1.0), ('xxl', 1.0),
    ('petite', 1.0), ('plus size', 1.0), ('big', 0.8), ('tall', 0.8)
) AS keywords(keyword_pattern, weight)
WHERE intent_name = 'SIZE_FILTER';

-- ========================================
-- PRICE RANGE CONFIGURATION
-- ========================================
INSERT INTO price_range_configuration (range_name, min_price, max_price, description) VALUES
('BUDGET', 0.00, 25.00, 'Budget-friendly items under $25'),
('AFFORDABLE', 25.01, 75.00, 'Affordable items $25-$75'),
('MODERATE', 75.01, 200.00, 'Moderate price range $75-$200'),
('PREMIUM', 200.01, 500.00, 'Premium items $200-$500'),
('LUXURY', 500.01, NULL, 'Luxury items over $500');

-- ========================================
-- PRICE KEYWORDS
-- ========================================
INSERT INTO price_keywords (price_range_id, keyword, keyword_type, weight)
SELECT pr.id, pk.keyword, pk.keyword_type, pk.weight
FROM price_range_configuration pr, (VALUES
    ('BUDGET', 'cheap', 'BUDGET', 1.0),
    ('BUDGET', 'budget', 'BUDGET', 1.0),
    ('BUDGET', 'affordable', 'BUDGET', 1.0),
    ('BUDGET', 'inexpensive', 'BUDGET', 1.0),
    ('BUDGET', 'under 25', 'UNDER', 1.0),
    ('LUXURY', 'luxury', 'LUXURY', 1.0),
    ('LUXURY', 'designer', 'LUXURY', 1.0),
    ('LUXURY', 'premium', 'LUXURY', 0.8),
    ('LUXURY', 'expensive', 'LUXURY', 0.9),
    ('LUXURY', 'high end', 'LUXURY', 1.0)
) AS pk(range_name, keyword, keyword_type, weight)
WHERE pr.range_name = pk.range_name;

-- ========================================
-- PRODUCT ATTRIBUTE CONFIGURATION
-- ========================================
-- Sizes
INSERT INTO product_attribute_configuration (attribute_type, attribute_value, display_name, sort_order) VALUES
('SIZE', 'XS', 'Extra Small', 1),
('SIZE', 'S', 'Small', 2),
('SIZE', 'M', 'Medium', 3),
('SIZE', 'L', 'Large', 4),
('SIZE', 'XL', 'Extra Large', 5),
('SIZE', 'XXL', 'Double Extra Large', 6),
('SIZE', '6', 'Size 6', 10),
('SIZE', '7', 'Size 7', 11),
('SIZE', '8', 'Size 8', 12),
('SIZE', '9', 'Size 9', 13),
('SIZE', '10', 'Size 10', 14),
('SIZE', '11', 'Size 11', 15),
('SIZE', '12', 'Size 12', 16);

-- Conditions
INSERT INTO product_attribute_configuration (attribute_type, attribute_value, display_name, sort_order) VALUES
('CONDITION', 'NEW', 'New', 1),
('CONDITION', 'LIKE_NEW', 'Like New', 2),
('CONDITION', 'EXCELLENT', 'Excellent', 3),
('CONDITION', 'VERY_GOOD', 'Very Good', 4),
('CONDITION', 'GOOD', 'Good', 5),
('CONDITION', 'FAIR', 'Fair', 6),
('CONDITION', 'POOR', 'Poor', 7);

-- Colors
INSERT INTO product_attribute_configuration (attribute_type, attribute_value, display_name, sort_order) VALUES
('COLOR', 'BLACK', 'Black', 1),
('COLOR', 'WHITE', 'White', 2),
('COLOR', 'GRAY', 'Gray', 3),
('COLOR', 'BLUE', 'Blue', 4),
('COLOR', 'RED', 'Red', 5),
('COLOR', 'GREEN', 'Green', 6),
('COLOR', 'YELLOW', 'Yellow', 7),
('COLOR', 'PINK', 'Pink', 8),
('COLOR', 'PURPLE', 'Purple', 9),
('COLOR', 'BROWN', 'Brown', 10);

-- ========================================
-- SEARCH EXCLUSION CONFIGURATION
-- ========================================
-- Bag search exclusions (from the example you provided)
INSERT INTO search_exclusion_configuration (rule_name, search_context, exclusion_keyword, exclusion_type, category_id) VALUES
('bag_search_exclusions', 'bag_search', 'cap', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'hat', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'phone mount', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'charger', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ELECTRONICS')),
('bag_search_exclusions', 'bag_search', 'watch', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'jewelry', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'sunglasses', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'belt', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'scarf', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'gloves', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'keychain', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'wallet', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'card holder', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ACCESSORIES')),
('bag_search_exclusions', 'bag_search', 'phone case', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'ELECTRONICS'));

-- Automotive search exclusions for non-automotive items
INSERT INTO search_exclusion_configuration (rule_name, search_context, exclusion_keyword, exclusion_type, category_id) VALUES
('automotive_search_exclusions', 'automotive_search', 'clothing', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'CLOTHING')),
('automotive_search_exclusions', 'automotive_search', 'shoes', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'SHOES')),
('automotive_search_exclusions', 'automotive_search', 'jewelry', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'JEWELRY')),
('automotive_search_exclusions', 'automotive_search', 'home decor', 'STRICT', (SELECT id FROM category_configuration WHERE category_name = 'HOME'));

-- ========================================
-- MARKETPLACE CONFIGURATION
-- ========================================
INSERT INTO marketplace_configuration (marketplace_name, relevance_keywords, category_mapping) VALUES
('NIKE', '["shoe", "sneaker", "athletic", "sport", "running", "basketball"]', '{"SHOES": "footwear", "CLOTHING": "apparel", "ACCESSORIES": "gear"}'),
('ADIDAS', '["shoe", "sneaker", "athletic", "sport", "running", "soccer"]', '{"SHOES": "shoes", "CLOTHING": "clothing", "ACCESSORIES": "accessories"}'),
('AMAZON', '["general", "electronics", "books", "home"]', '{"ELECTRONICS": "Electronics", "BOOKS": "Books", "HOME": "Home & Garden"}'),
('EBAY', '["auction", "collectibles", "vintage", "rare"]', '{"CLOTHING": "Clothing", "ELECTRONICS": "Electronics", "ACCESSORIES": "Accessories"}');

-- Update cache control
UPDATE configuration_cache_control SET cache_version = cache_version + 1;