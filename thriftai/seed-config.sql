-- Seed Configuration Data

-- Scoring Configurations
INSERT INTO scoring_configurations (category, product_quality_weight, value_proposition_weight, trust_and_safety_weight, user_experience_weight, sustainability_weight, description)
VALUES
  ('ELECTRONICS', 0.35, 0.25, 0.25, 0.10, 0.05, 'Quality and trust critical for expensive electronics'),
  ('CLOTHING', 0.20, 0.35, 0.15, 0.20, 0.10, 'Price-sensitive category, fit and returns matter'),
  ('SHOES', 0.30, 0.25, 0.20, 0.15, 0.10, 'Balanced scoring for footwear'),
  ('ACCESSORIES', 0.25, 0.30, 0.20, 0.15, 0.10, 'Value-focused accessory scoring'),
  ('HOME', 0.35, 0.20, 0.25, 0.10, 0.10, 'Safety and durability paramount for home goods'),
  ('SPORTS', 0.30, 0.25, 0.20, 0.15, 0.10, 'Performance-focused sports equipment scoring'),
  ('DEFAULT', 0.30, 0.25, 0.20, 0.15, 0.10, 'Universal balanced scoring weights')
ON CONFLICT (category) DO UPDATE SET
  product_quality_weight = EXCLUDED.product_quality_weight,
  value_proposition_weight = EXCLUDED.value_proposition_weight,
  trust_and_safety_weight = EXCLUDED.trust_and_safety_weight,
  user_experience_weight = EXCLUDED.user_experience_weight,
  sustainability_weight = EXCLUDED.sustainability_weight,
  description = EXCLUDED.description;

-- Score Thresholds
INSERT INTO score_thresholds (name, min_score, max_score, badge_color, badge_class, label, description, display_order)
VALUES
  ('excellent', 80, 100, '#10b981', 'bg-green-600', 'Excellent', 'Outstanding product quality and value', 1),
  ('good', 70, 79.99, '#3b82f6', 'bg-blue-600', 'Good', 'Above average quality and value', 2),
  ('fair', 60, 69.99, '#f59e0b', 'bg-yellow-600', 'Fair', 'Acceptable quality, consider alternatives', 3),
  ('poor', 0, 59.99, '#ef4444', 'bg-gray-600', 'Poor', 'Below average, not recommended', 4)
ON CONFLICT (name) DO UPDATE SET
  min_score = EXCLUDED.min_score,
  max_score = EXCLUDED.max_score,
  badge_color = EXCLUDED.badge_color,
  badge_class = EXCLUDED.badge_class,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- System Configurations
INSERT INTO system_configurations (key, value, value_type, category, description)
VALUES
  ('batch_size_default', '50', 'NUMBER', 'performance', 'Default batch size for product processing'),
  ('batch_size_rescore', '20', 'NUMBER', 'performance', 'Batch size for product re-scoring'),
  ('enrichment_concurrency', '10', 'NUMBER', 'performance', 'Concurrent enrichment operations limit'),
  ('cache_ttl_company_metrics', '3600', 'NUMBER', 'caching', 'Company metrics cache TTL in seconds (1 hour)'),
  ('cache_ttl_config', '300', 'NUMBER', 'caching', 'Configuration cache TTL in seconds (5 minutes)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- Category Default Specs (sample - full migration would include all specs)
INSERT INTO category_default_specs (category, subcategory, default_specs, description, priority)
VALUES
  ('ELECTRONICS', NULL, '{"cpu": "Standard Processor", "ram": 4, "storage": "128GB", "screenSize": 6, "batteryLife": 8}', 'Default electronics specs', 0),
  ('ELECTRONICS', 'LAPTOP', '{"cpu": "Intel Core i5", "ram": 8, "storage": "256GB SSD", "screenSize": 14, "batteryLife": 6}', 'Laptop default specs', 10),
  ('CLOTHING', NULL, '{"fabric": "Cotton Blend", "fabricQuality": 70, "sizeAccuracy": "True to Size"}', 'Default clothing specs', 0),
  ('SHOES', NULL, '{"soleMaterial": "Rubber", "cushioning": "Medium", "breathability": 70}', 'Default shoe specs', 0),
  ('HOME', NULL, '{"materialSafety": 80, "durability": 75}', 'Default home goods specs', 0),
  ('SPORTS', NULL, '{"durability": 80, "weatherResistance": 70}', 'Default sports equipment specs', 0)
ON CONFLICT (category, subcategory) DO UPDATE SET
  default_specs = EXCLUDED.default_specs,
  description = EXCLUDED.description,
  priority = EXCLUDED.priority;

SELECT 'Configuration data seeded successfully!' as status;
