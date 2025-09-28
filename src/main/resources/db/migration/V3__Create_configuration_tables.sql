-- V3__Create_configuration_tables.sql
-- Database-driven configuration system to eliminate hardcoded business logic

-- Category Configuration Table
CREATE TABLE category_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category VARCHAR(100),
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Category Keywords - Many keywords can map to categories
CREATE TABLE category_keywords (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    synonym VARCHAR(100),
    weight DECIMAL(3,2) DEFAULT 1.0, -- Relevance weight for matching
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category_configuration(id) ON DELETE CASCADE,
    INDEX idx_keyword (keyword),
    INDEX idx_category_keyword (category_id, keyword)
);

-- Brand Configuration Table
CREATE TABLE brand_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    reputation_tier VARCHAR(50) DEFAULT 'STANDARD', -- BUDGET, STANDARD, PREMIUM, LUXURY
    primary_category_id BIGINT,
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_category_id) REFERENCES category_configuration(id)
);

-- Brand Keywords and Synonyms
CREATE TABLE brand_keywords (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    brand_id BIGINT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    synonym VARCHAR(100),
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brand_configuration(id) ON DELETE CASCADE,
    INDEX idx_brand_keyword (brand_id, keyword)
);

-- Search Intent Configuration
CREATE TABLE search_intent_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    intent_name VARCHAR(100) NOT NULL UNIQUE,
    intent_type VARCHAR(50) NOT NULL, -- PRODUCT_SEARCH, PRICE_FILTER, CATEGORY_BROWSE, etc.
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Search Intent Keywords - patterns that indicate specific intents
CREATE TABLE search_intent_keywords (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    intent_id BIGINT NOT NULL,
    keyword_pattern VARCHAR(200) NOT NULL,
    regex_pattern VARCHAR(500),
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intent_id) REFERENCES search_intent_configuration(id) ON DELETE CASCADE,
    INDEX idx_intent_keyword (intent_id, keyword_pattern)
);

-- Price Range Configuration
CREATE TABLE price_range_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    range_name VARCHAR(100) NOT NULL UNIQUE,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    category_id BIGINT, -- Different categories can have different price ranges
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category_configuration(id)
);

-- Price Keywords - words that indicate price intent
CREATE TABLE price_keywords (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    price_range_id BIGINT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    keyword_type VARCHAR(50) NOT NULL, -- UNDER, OVER, RANGE, BUDGET, LUXURY
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (price_range_id) REFERENCES price_range_configuration(id) ON DELETE CASCADE,
    INDEX idx_price_keyword (keyword, keyword_type)
);

-- Product Attribute Configuration (sizes, conditions, materials, etc.)
CREATE TABLE product_attribute_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attribute_type VARCHAR(50) NOT NULL, -- SIZE, CONDITION, MATERIAL, COLOR, etc.
    attribute_value VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    category_id BIGINT, -- Some attributes are category-specific
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category_configuration(id),
    UNIQUE KEY unique_attribute (attribute_type, attribute_value, category_id),
    INDEX idx_attribute_type (attribute_type)
);

-- Product Attribute Keywords - alternative ways to refer to attributes
CREATE TABLE product_attribute_keywords (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attribute_id BIGINT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    synonym VARCHAR(100),
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attribute_id) REFERENCES product_attribute_configuration(id) ON DELETE CASCADE,
    INDEX idx_attribute_keyword (attribute_id, keyword)
);

-- Search Exclusion Rules - terms that should exclude products from searches
CREATE TABLE search_exclusion_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    search_context VARCHAR(100) NOT NULL, -- e.g., 'bag_search', 'clothing_search'
    exclusion_keyword VARCHAR(100) NOT NULL,
    exclusion_type VARCHAR(50) DEFAULT 'STRICT', -- STRICT, SOFT, WEIGHTED
    category_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category_configuration(id),
    INDEX idx_exclusion_context (search_context, exclusion_keyword)
);

-- Marketplace Configuration - for external marketplace integrations
CREATE TABLE marketplace_configuration (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    marketplace_name VARCHAR(100) NOT NULL UNIQUE,
    api_endpoint VARCHAR(500),
    relevance_keywords TEXT, -- JSON array of keywords for this marketplace
    category_mapping TEXT, -- JSON mapping of internal categories to marketplace categories
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Configuration Cache Control
CREATE TABLE configuration_cache_control (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL UNIQUE,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cache_version INTEGER DEFAULT 1,
    INDEX idx_table_modified (table_name, last_modified)
);

-- Insert initial cache control records
INSERT INTO configuration_cache_control (table_name) VALUES
('category_configuration'),
('brand_configuration'),
('search_intent_configuration'),
('price_range_configuration'),
('product_attribute_configuration'),
('search_exclusion_configuration'),
('marketplace_configuration');