-- ThriftAI Database Data Migration V2
-- Insert sample data that matches current H2 dataset

-- Insert sample sellers
INSERT INTO sellers (id, business_name, owner_name, email, password, phone, address, city, state, zip_code, seller_type, status, description, is_active, is_verified, rating, total_sales, total_revenue, commission_rate) VALUES
('store1', 'Vintage Treasures', 'Alice Johnson', 'alice@vintagetreasures.com', '$2a$10$abcd1234567890', '555-0001', '123 Main St', 'Portland', 'OR', '97201', 'THRIFT_STORE', 'APPROVED', 'Curated vintage clothing and accessories', true, true, 4.8, 150, 5500.00, 5.0),
('store2', 'Tech Resale Hub', 'Bob Smith', 'bob@techresale.com', '$2a$10$abcd1234567891', '555-0002', '456 Tech Ave', 'Seattle', 'WA', '98101', 'BUSINESS', 'APPROVED', 'Quality pre-owned electronics and gadgets', true, true, 4.6, 89, 15600.00, 4.5),
('store3', 'Green Valley Thrift', 'Carol Davis', 'carol@greenvalley.com', '$2a$10$abcd1234567892', '555-0003', '789 Valley Rd', 'San Francisco', 'CA', '94102', 'THRIFT_STORE', 'APPROVED', 'Sustainable shopping for the whole family', true, true, 4.7, 234, 8900.00, 5.5);

-- Insert sample buyers
INSERT INTO buyers (id, first_name, last_name, email, password, phone, buyer_type, is_active, email_verified, phone_verified, total_orders, total_spent, average_order_value, loyalty_points, max_budget, min_discount_threshold, favorite_items) VALUES
('buyer1', 'John', 'Doe', 'john.doe@email.com', '$2a$10$buyer1password', '555-1001', 'FREQUENT', true, true, false, 5, 249.95, 49.99, 125.00, 500.00, 15.0, 3),
('buyer2', 'Jane', 'Smith', 'jane.smith@email.com', '$2a$10$buyer2password', '555-1002', 'VIP', true, true, true, 12, 899.50, 74.96, 450.00, 1000.00, 10.0, 8),
('buyer3', 'Mike', 'Wilson', 'mike.wilson@email.com', '$2a$10$buyer3password', '555-1003', 'CASUAL', true, false, false, 2, 67.98, 33.99, 35.00, 200.00, 20.0, 1);

-- Insert sample products (matching current dataset)
INSERT INTO products (id, name, category, brand, price, original_price, condition, description, image_url, store_id, seller_id, size, is_available) VALUES
('b50089e4-b41e-4a0f-9454-f4c21205709a', 'Vintage Levi''s 501 Jeans', 'CLOTHING', 'LEVI''S', 45.99, 120.00, 'EXCELLENT', 'Classic vintage Levi''s 501 jeans in excellent condition', null, 'store1', 'store1', 'M', true),
('e9f7fee9-9916-449c-b69f-1f11e45d6162', 'Nike Air Max Sneakers', 'SHOES', 'NIKE', 65.00, 150.00, 'VERY_GOOD', 'Gently used Nike Air Max sneakers', null, 'store3', 'store3', '10', true),
('a7623e67-16cf-41a8-9910-6a78ad1b1579', 'MacBook Air 2019', 'ELECTRONICS', 'APPLE', 599.99, 999.99, 'GOOD', 'MacBook Air 2019, 13-inch, some signs of use but fully functional', null, 'store2', 'store2', null, true),
('da366b48-afd7-4ddd-8e1a-f2f5e075c4bd', 'Zara Wool Coat', 'CLOTHING', 'ZARA', 89.99, 199.99, 'LIKE_NEW', 'Beautiful wool coat from Zara, barely worn', null, 'store1', 'store1', 'L', true),
('5099fc21-1a28-4ef1-9e85-7f49800e3e5d', 'Samsung Galaxy Watch', 'ELECTRONICS', 'SAMSUNG', 149.99, 299.99, 'EXCELLENT', 'Samsung Galaxy Watch in excellent condition with original box', null, 'store2', 'store2', null, true),
('67353178-3068-4460-9011-d62686ec1b83', 'H&M Cotton T-Shirt', 'CLOTHING', 'H&M', 8.99, 19.99, 'GOOD', 'Soft cotton t-shirt in great condition', null, 'store1', 'store1', 'M', true),
('89fdbec6-353a-4788-9860-70a7154c2ab3', 'Vintage Coffee Mug', 'HOME', 'GENERIC', 12.50, 25.00, 'EXCELLENT', 'Charming vintage-style coffee mug, perfect condition', null, 'store3', 'store3', null, true),
('f0d66bc0-a2ec-4947-8687-e9bfb3e3956f', 'Used Paperback Novel', 'BOOKS', 'PENGUIN', 4.99, 14.99, 'GOOD', 'Classic paperback novel, some wear but readable', null, 'store2', 'store2', null, true),
('12345678-1234-1234-1234-123456789012', 'Canvas Tote Bag', 'ACCESSORIES', 'ECO_BAGS', 15.99, 29.99, 'VERY_GOOD', 'Durable canvas tote bag, lightly used', null, 'store1', 'store1', null, true),
('23456789-2345-2345-2345-234567890123', 'Ceramic Plant Pot', 'HOME', 'GARDEN_PLUS', 18.99, 35.00, 'EXCELLENT', 'Beautiful ceramic plant pot with drainage hole', null, 'store3', 'store3', null, true),
('34567890-3456-3456-3456-345678901234', 'Basic Baseball Cap', 'ACCESSORIES', 'SPORTS_WORLD', 9.99, 24.99, 'GOOD', 'Classic baseball cap in good condition', null, 'store1', 'store1', null, true),
('45678901-4567-4567-4567-456789012345', 'Kitchen Utensil Set', 'HOME', 'COOK_SMART', 22.99, 45.00, 'VERY_GOOD', 'Complete kitchen utensil set, gently used', null, 'store2', 'store2', null, true);

-- Insert seller categories
INSERT INTO seller_categories (seller_id, categories) VALUES
('store1', 'CLOTHING'),
('store1', 'ACCESSORIES'),
('store2', 'ELECTRONICS'),
('store2', 'HOME'),
('store3', 'SHOES'),
('store3', 'HOME'),
('store3', 'BOOKS');

-- Insert buyer preferences
INSERT INTO buyer_preferred_brands (buyer_id, preferred_brands) VALUES
('buyer1', 'NIKE'),
('buyer1', 'ADIDAS'),
('buyer2', 'APPLE'),
('buyer2', 'LEVI''S'),
('buyer2', 'ZARA'),
('buyer3', 'H&M'),
('buyer3', 'GENERIC');

INSERT INTO buyer_preferred_categories (buyer_id, preferred_categories) VALUES
('buyer1', 'SHOES'),
('buyer1', 'ELECTRONICS'),
('buyer2', 'CLOTHING'),
('buyer2', 'ELECTRONICS'),
('buyer3', 'HOME'),
('buyer3', 'BOOKS');

INSERT INTO buyer_preferred_sizes (buyer_id, preferred_sizes) VALUES
('buyer1', 'M'),
('buyer1', '10'),
('buyer2', 'L'),
('buyer2', 'M'),
('buyer3', 'M');

-- Insert sample cart items
INSERT INTO cart_items (id, buyer_id, session_id, product_id, quantity, price_at_time) VALUES
('cart1', 'buyer1', 'session123', '67353178-3068-4460-9011-d62686ec1b83', 1, 8.99),
('cart2', 'buyer2', 'session456', 'a7623e67-16cf-41a8-9910-6a78ad1b1579', 1, 599.99),
('cart3', 'buyer3', 'session789', '89fdbec6-353a-4788-9860-70a7154c2ab3', 2, 12.50);

-- Insert sample orders
INSERT INTO orders (id, buyer_id, session_id, status, payment_status, payment_method, subtotal, tax, shipping, total, billing_name, billing_address, billing_city, billing_state, billing_zip, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip) VALUES
('order1', 'buyer1', 'session123', 'DELIVERED', 'COMPLETED', 'CREDIT_CARD', 54.98, 4.95, 9.99, 69.92, 'John Doe', '123 Buyer St', 'Portland', 'OR', '97201', 'John Doe', '123 Buyer St', 'Portland', 'OR', '97201'),
('order2', 'buyer2', 'session456', 'SHIPPED', 'COMPLETED', 'PAYPAL', 689.98, 62.10, 0.00, 752.08, 'Jane Smith', '456 Customer Ave', 'Seattle', 'WA', '98101', 'Jane Smith', '456 Customer Ave', 'Seattle', 'WA', '98101');

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, seller_id, product_name, product_brand, product_category, product_condition, product_size, quantity, unit_price, total_price) VALUES
('item1', 'order1', 'b50089e4-b41e-4a0f-9454-f4c21205709a', 'store1', 'Vintage Levi''s 501 Jeans', 'LEVI''S', 'CLOTHING', 'EXCELLENT', 'M', 1, 45.99, 45.99),
('item2', 'order1', '67353178-3068-4460-9011-d62686ec1b83', 'store1', 'H&M Cotton T-Shirt', 'H&M', 'CLOTHING', 'GOOD', 'M', 1, 8.99, 8.99),
('item3', 'order2', 'da366b48-afd7-4ddd-8e1a-f2f5e075c4bd', 'store1', 'Zara Wool Coat', 'ZARA', 'CLOTHING', 'LIKE_NEW', 'L', 1, 89.99, 89.99),
('item4', 'order2', 'a7623e67-16cf-41a8-9910-6a78ad1b1579', 'store2', 'MacBook Air 2019', 'APPLE', 'ELECTRONICS', 'GOOD', null, 1, 599.99, 599.99);

-- Insert sample reviews
INSERT INTO reviews (id, buyer_id, product_id, title, content, rating, condition_rating, value_rating, shipping_rating, seller_rating, is_verified_purchase, helpful_votes, status) VALUES
('review1', 'buyer1', 'b50089e4-b41e-4a0f-9454-f4c21205709a', 'Great vintage jeans!', 'These Levi''s jeans are exactly as described. Perfect fit and excellent quality for a vintage piece.', 5, 5, 5, 4, 5, true, 3, 'APPROVED'),
('review2', 'buyer1', '67353178-3068-4460-9011-d62686ec1b83', 'Nice basic t-shirt', 'Good quality cotton t-shirt for the price. Some minor wear but overall satisfied.', 4, 4, 4, 5, 4, true, 1, 'APPROVED'),
('review3', 'buyer2', 'da366b48-afd7-4ddd-8e1a-f2f5e075c4bd', 'Beautiful coat!', 'This Zara coat is stunning and looks almost new. Great find!', 5, 5, 5, 5, 5, true, 5, 'APPROVED');

-- Update seller statistics based on inserted data
UPDATE sellers SET
    total_sales = (SELECT COUNT(*) FROM order_items WHERE seller_id = sellers.id),
    total_revenue = (SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE seller_id = sellers.id),
    rating = (SELECT COALESCE(AVG(seller_rating::DECIMAL), 0) FROM reviews r JOIN order_items oi ON r.product_id = oi.product_id WHERE oi.seller_id = sellers.id)
WHERE EXISTS (SELECT 1 FROM order_items WHERE seller_id = sellers.id);

-- Update buyer statistics based on inserted data
UPDATE buyers SET
    total_orders = (SELECT COUNT(*) FROM orders WHERE buyer_id = buyers.id),
    total_spent = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE buyer_id = buyers.id AND payment_status = 'COMPLETED'),
    average_order_value = (SELECT COALESCE(AVG(total), 0) FROM orders WHERE buyer_id = buyers.id AND payment_status = 'COMPLETED'),
    favorite_items = (SELECT COUNT(*) FROM cart_items WHERE buyer_id = buyers.id),
    last_order_at = (SELECT MAX(created_at) FROM orders WHERE buyer_id = buyers.id)
WHERE EXISTS (SELECT 1 FROM orders WHERE buyer_id = buyers.id);