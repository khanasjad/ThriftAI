-- ThriftAI Database Schema Migration V1
-- Create initial schema for PostgreSQL migration from H2

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sellers table
CREATE TABLE sellers (
    id VARCHAR(255) PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(50),
    state VARCHAR(20),
    zip_code VARCHAR(20),
    seller_type VARCHAR(255) NOT NULL CHECK (seller_type IN ('INDIVIDUAL','BUSINESS','THRIFT_STORE','CONSIGNMENT_SHOP')),
    status VARCHAR(255) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','SUSPENDED')),
    description VARCHAR(500),
    website VARCHAR(255),
    business_license VARCHAR(255),
    tax_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    total_sales INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Buyers table
CREATE TABLE buyers (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    zip_code VARCHAR(255),
    country VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(255) CHECK (gender IN ('MALE','FEMALE','NON_BINARY','PREFER_NOT_TO_SAY')),
    buyer_type VARCHAR(255) CHECK (buyer_type IN ('CASUAL','FREQUENT','VIP','BULK_BUYER')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    receive_newsletters BOOLEAN NOT NULL DEFAULT true,
    receive_sms BOOLEAN NOT NULL DEFAULT false,
    receive_deals BOOLEAN NOT NULL DEFAULT true,
    notification_frequency VARCHAR(255) CHECK (notification_frequency IN ('NEVER','DAILY','WEEKLY','MONTHLY')),
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    average_order_value DECIMAL(8,2) NOT NULL DEFAULT 0.0,
    loyalty_points DECIMAL(8,2) NOT NULL DEFAULT 0.0,
    max_budget DECIMAL(8,2) NOT NULL DEFAULT 1000.0,
    min_discount_threshold DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    favorite_items INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_order_at TIMESTAMP
);

-- Buyer preferred brands (collection table)
CREATE TABLE buyer_preferred_brands (
    buyer_id VARCHAR(255) NOT NULL,
    preferred_brands VARCHAR(255),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
);

-- Buyer preferred categories (collection table)
CREATE TABLE buyer_preferred_categories (
    buyer_id VARCHAR(255) NOT NULL,
    preferred_categories VARCHAR(255),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
);

-- Buyer preferred sizes (collection table)
CREATE TABLE buyer_preferred_sizes (
    buyer_id VARCHAR(255) NOT NULL,
    preferred_sizes VARCHAR(255),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
);

-- Seller categories (collection table)
CREATE TABLE seller_categories (
    seller_id VARCHAR(255) NOT NULL,
    categories VARCHAR(255),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    original_price DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    condition VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    store_id VARCHAR(255),
    seller_id VARCHAR(255),
    size VARCHAR(255),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL
);

-- Orders table
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    status VARCHAR(255) NOT NULL CHECK (status IN ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED')),
    payment_status VARCHAR(255) NOT NULL CHECK (payment_status IN ('PENDING','PROCESSING','COMPLETED','FAILED','REFUNDED','CANCELLED')),
    payment_method VARCHAR(255),
    payment_transaction_id VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    billing_name VARCHAR(255),
    billing_address VARCHAR(255),
    billing_city VARCHAR(255),
    billing_state VARCHAR(255),
    billing_zip VARCHAR(255),
    billing_country VARCHAR(255),
    shipping_name VARCHAR(255),
    shipping_address VARCHAR(255),
    shipping_city VARCHAR(255),
    shipping_state VARCHAR(255),
    shipping_zip VARCHAR(255),
    shipping_country VARCHAR(255),
    shipping_phone VARCHAR(255),
    tracking_number VARCHAR(255),
    order_notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    seller_id VARCHAR(255),
    product_name VARCHAR(255),
    product_brand VARCHAR(255),
    product_category VARCHAR(255),
    product_condition VARCHAR(255),
    product_size VARCHAR(255),
    product_image_url VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE cart_items (
    id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    price_at_time DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Reviews table
CREATE TABLE reviews (
    id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    shipping_rating INTEGER CHECK (shipping_rating >= 1 AND shipping_rating <= 5),
    seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    status VARCHAR(255) CHECK (status IN ('PENDING','APPROVED','REJECTED','FLAGGED')),
    moderation_notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Review photos table
CREATE TABLE review_photos (
    review_id VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_created ON products(created_at);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_cart_items_buyer ON cart_items(buyer_id);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_buyer ON reviews(buyer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_type ON sellers(seller_type);
CREATE INDEX idx_sellers_active ON sellers(is_active);

CREATE INDEX idx_buyers_email ON buyers(email);
CREATE INDEX idx_buyers_active ON buyers(is_active);
CREATE INDEX idx_buyers_type ON buyers(buyer_type);

-- Comments for documentation
COMMENT ON TABLE products IS 'Core products table for ThriftAI marketplace';
COMMENT ON TABLE sellers IS 'Seller accounts and business information';
COMMENT ON TABLE buyers IS 'Buyer accounts and preferences';
COMMENT ON TABLE orders IS 'Customer orders and order management';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE cart_items IS 'Shopping cart items for buyers';
COMMENT ON TABLE reviews IS 'Product reviews and ratings';