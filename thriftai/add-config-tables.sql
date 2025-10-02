-- Configuration System Tables
-- Run this to add configuration tables without migrating existing tables

-- Category-specific scoring algorithm weights
CREATE TABLE IF NOT EXISTS scoring_configurations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- 5-Pillar weights (must sum to 1.0)
  product_quality_weight DOUBLE PRECISION NOT NULL DEFAULT 0.30,
  value_proposition_weight DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  trust_and_safety_weight DOUBLE PRECISION NOT NULL DEFAULT 0.20,
  user_experience_weight DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  sustainability_weight DOUBLE PRECISION NOT NULL DEFAULT 0.10,

  -- Metadata
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Category-specific default product specifications
CREATE TABLE IF NOT EXISTS category_default_specs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  subcategory TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- JSON field storing all default specifications
  default_specs JSONB NOT NULL,

  -- Metadata
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(category, subcategory)
);

CREATE INDEX IF NOT EXISTS idx_category_default_specs_category ON category_default_specs(category);

-- Score display thresholds for badges/colors
CREATE TABLE IF NOT EXISTS score_thresholds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  min_score DOUBLE PRECISION NOT NULL,
  max_score DOUBLE PRECISION NOT NULL,

  -- Display properties
  badge_color TEXT NOT NULL,
  badge_class TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,

  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_thresholds_range ON score_thresholds(min_score, max_score);

-- System-wide configuration settings
CREATE TYPE config_value_type AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

CREATE TABLE IF NOT EXISTS system_configurations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  value_type config_value_type NOT NULL DEFAULT 'STRING',
  category TEXT NOT NULL DEFAULT 'general',

  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);

-- Success message
SELECT 'Configuration tables created successfully!' as status;
