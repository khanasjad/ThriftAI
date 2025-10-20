-- Phase 3.5: A/B Testing Framework
-- Create tables for experiment tracking and statistical analysis

-- Experiment status enum
CREATE TYPE experiment_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- ============================================================================
-- Experiments Table
-- ============================================================================

CREATE TABLE ab_experiments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,

    -- Experiment configuration
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    duration_days INT NOT NULL,

    -- Status and metadata
    status experiment_status NOT NULL DEFAULT 'DRAFT',
    control_variant_id TEXT,

    -- Metrics
    primary_metric TEXT NOT NULL,  -- e.g., 'conversion_rate', 'avg_order_value'
    secondary_metrics JSONB,       -- Additional metrics to track

    -- Statistical settings
    confidence_level DECIMAL(3, 2) DEFAULT 0.95,  -- e.g., 0.95 for 95% confidence
    minimum_sample_size INT DEFAULT 1000,

    -- Results
    results JSONB,                 -- Cached analysis results
    winner_variant_id TEXT,

    -- Audit fields
    created_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_dates ON ab_experiments(start_date, end_date);
CREATE INDEX idx_ab_experiments_created ON ab_experiments(created_at);

-- ============================================================================
-- Variants Table
-- ============================================================================

CREATE TABLE ab_variants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,

    -- Traffic allocation
    traffic_percentage INT NOT NULL CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),

    -- Variant configuration (weights, algorithm changes, etc.)
    config JSONB NOT NULL,

    -- Control flag
    is_control BOOLEAN DEFAULT FALSE,

    -- Statistics (cached for performance)
    user_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_experiment_variant_name UNIQUE(experiment_id, name)
);

CREATE INDEX idx_ab_variants_experiment ON ab_variants(experiment_id);
CREATE INDEX idx_ab_variants_control ON ab_variants(is_control) WHERE is_control = true;

-- ============================================================================
-- User Assignments Table
-- ============================================================================

CREATE TABLE ab_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    variant_id TEXT NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Assignment details
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT DEFAULT 'system',  -- 'system' or 'manual'

    -- Session tracking
    session_id TEXT,

    CONSTRAINT uq_experiment_user UNIQUE(experiment_id, user_id)
);

CREATE INDEX idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX idx_ab_assignments_variant ON ab_assignments(variant_id);
CREATE INDEX idx_ab_assignments_date ON ab_assignments(assigned_at);

-- ============================================================================
-- Events Table
-- ============================================================================

CREATE TABLE ab_events (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    variant_id TEXT NOT NULL REFERENCES ab_variants(id) ON DELETE CASCADE,

    -- Event details
    event_type TEXT NOT NULL,  -- 'view', 'click', 'add_to_cart', 'purchase', 'custom'
    event_name TEXT,           -- Optional event name for custom events
    event_data JSONB,          -- Additional event data (product_id, amount, etc.)

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Session tracking
    session_id TEXT,

    -- Partitioning key for performance
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,

    PRIMARY KEY (id, event_date)
) PARTITION BY RANGE (event_date);

-- Partition by month for better query performance
CREATE TABLE ab_events_2025_10 PARTITION OF ab_events
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE ab_events_2025_11 PARTITION OF ab_events
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE ab_events_2025_12 PARTITION OF ab_events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE ab_events_2026_01 PARTITION OF ab_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Indexes on partitioned table
CREATE INDEX idx_ab_events_experiment ON ab_events(experiment_id, event_date);
CREATE INDEX idx_ab_events_variant ON ab_events(variant_id, event_type, event_date);
CREATE INDEX idx_ab_events_user ON ab_events(user_id, event_date);
CREATE INDEX idx_ab_events_type ON ab_events(event_type, event_date);

-- ============================================================================
-- Materialized View for Fast Metrics
-- ============================================================================

CREATE MATERIALIZED VIEW ab_experiment_metrics AS
SELECT
    e.id as experiment_id,
    e.name as experiment_name,
    e.status,
    v.id as variant_id,
    v.name as variant_name,
    v.is_control,

    -- User counts
    COUNT(DISTINCT a.user_id) as unique_users,

    -- Event counts by type
    COUNT(DISTINCT CASE WHEN ev.event_type = 'view' THEN ev.user_id END) as views,
    COUNT(DISTINCT CASE WHEN ev.event_type = 'click' THEN ev.user_id END) as clicks,
    COUNT(DISTINCT CASE WHEN ev.event_type = 'add_to_cart' THEN ev.user_id END) as add_to_carts,
    COUNT(DISTINCT CASE WHEN ev.event_type = 'purchase' THEN ev.user_id END) as purchases,

    -- Conversion metrics
    CASE
        WHEN COUNT(DISTINCT a.user_id) > 0
        THEN COUNT(DISTINCT CASE WHEN ev.event_type = 'purchase' THEN ev.user_id END)::FLOAT / COUNT(DISTINCT a.user_id)
        ELSE 0
    END as conversion_rate,

    -- Revenue metrics
    SUM(CASE WHEN ev.event_type = 'purchase' THEN (ev.event_data->>'amount')::DECIMAL ELSE 0 END) as total_revenue,
    CASE
        WHEN COUNT(DISTINCT CASE WHEN ev.event_type = 'purchase' THEN ev.user_id END) > 0
        THEN SUM(CASE WHEN ev.event_type = 'purchase' THEN (ev.event_data->>'amount')::DECIMAL ELSE 0 END) /
             COUNT(DISTINCT CASE WHEN ev.event_type = 'purchase' THEN ev.user_id END)
        ELSE 0
    END as avg_order_value,

    -- Engagement metrics
    CASE
        WHEN COUNT(DISTINCT CASE WHEN ev.event_type = 'view' THEN ev.user_id END) > 0
        THEN COUNT(DISTINCT CASE WHEN ev.event_type = 'click' THEN ev.user_id END)::FLOAT /
             COUNT(DISTINCT CASE WHEN ev.event_type = 'view' THEN ev.user_id END)
        ELSE 0
    END as click_through_rate,

    -- Timestamps
    MIN(a.assigned_at) as first_assignment,
    MAX(ev.created_at) as last_event,
    NOW() as calculated_at

FROM ab_experiments e
JOIN ab_variants v ON e.id = v.experiment_id
LEFT JOIN ab_assignments a ON v.id = a.variant_id
LEFT JOIN ab_events ev ON v.id = ev.variant_id AND a.user_id = ev.user_id

WHERE e.status IN ('ACTIVE', 'COMPLETED')

GROUP BY e.id, e.name, e.status, v.id, v.name, v.is_control;

-- Index on materialized view
CREATE UNIQUE INDEX idx_ab_metrics_experiment_variant ON ab_experiment_metrics(experiment_id, variant_id);
CREATE INDEX idx_ab_metrics_experiment ON ab_experiment_metrics(experiment_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to refresh metrics (call periodically)
CREATE OR REPLACE FUNCTION refresh_ab_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ab_experiment_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to assign user to variant (weighted random)
CREATE OR REPLACE FUNCTION assign_user_to_variant(
    p_experiment_id TEXT,
    p_user_id TEXT,
    p_session_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_variant_id TEXT;
    v_random_value INT;
    v_cumulative_weight INT := 0;
BEGIN
    -- Check if user already assigned
    SELECT variant_id INTO v_variant_id
    FROM ab_assignments
    WHERE experiment_id = p_experiment_id AND user_id = p_user_id;

    IF v_variant_id IS NOT NULL THEN
        RETURN v_variant_id;
    END IF;

    -- Generate random value (0-99)
    v_random_value := floor(random() * 100)::INT;

    -- Assign to variant based on traffic percentage
    SELECT v.id INTO v_variant_id
    FROM ab_variants v
    WHERE v.experiment_id = p_experiment_id
    ORDER BY v.traffic_percentage
    LIMIT 1;

    -- TODO: Implement proper weighted random selection
    -- For now, use simple random assignment

    -- Insert assignment
    INSERT INTO ab_assignments (experiment_id, user_id, variant_id, session_id)
    VALUES (p_experiment_id, p_user_id, v_variant_id, p_session_id);

    RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track event
CREATE OR REPLACE FUNCTION track_ab_event(
    p_experiment_id TEXT,
    p_user_id TEXT,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_variant_id TEXT;
BEGIN
    -- Get user's variant assignment
    SELECT variant_id INTO v_variant_id
    FROM ab_assignments
    WHERE experiment_id = p_experiment_id AND user_id = p_user_id;

    IF v_variant_id IS NULL THEN
        RAISE NOTICE 'User % not assigned to experiment %', p_user_id, p_experiment_id;
        RETURN;
    END IF;

    -- Insert event
    INSERT INTO ab_events (experiment_id, user_id, variant_id, event_type, event_data, session_id)
    VALUES (p_experiment_id, p_user_id, v_variant_id, p_event_type, p_event_data, p_session_id);

    -- Update cached variant statistics
    UPDATE ab_variants
    SET user_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM ab_assignments
            WHERE variant_id = v_variant_id
        ),
        conversion_count = (
            SELECT COUNT(DISTINCT user_id)
            FROM ab_events
            WHERE variant_id = v_variant_id AND event_type = 'purchase'
        ),
        total_revenue = (
            SELECT COALESCE(SUM((event_data->>'amount')::DECIMAL), 0)
            FROM ab_events
            WHERE variant_id = v_variant_id AND event_type = 'purchase'
        )
    WHERE id = v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate statistical significance (Chi-square test)
CREATE OR REPLACE FUNCTION calculate_statistical_significance(
    control_conversions INT,
    control_users INT,
    treatment_conversions INT,
    treatment_users INT
)
RETURNS TABLE(
    p_value FLOAT,
    is_significant BOOLEAN,
    chi_square_stat FLOAT
) AS $$
DECLARE
    control_rate FLOAT;
    treatment_rate FLOAT;
    pooled_rate FLOAT;
    expected_control FLOAT;
    expected_treatment FLOAT;
    v_chi_square FLOAT;
    v_p_value FLOAT;
BEGIN
    -- Calculate conversion rates
    control_rate := control_conversions::FLOAT / control_users;
    treatment_rate := treatment_conversions::FLOAT / treatment_users;

    -- Calculate pooled rate
    pooled_rate := (control_conversions + treatment_conversions)::FLOAT / (control_users + treatment_users);

    -- Calculate expected values
    expected_control := control_users * pooled_rate;
    expected_treatment := treatment_users * pooled_rate;

    -- Calculate chi-square statistic
    v_chi_square :=
        POWER(control_conversions - expected_control, 2) / expected_control +
        POWER(treatment_conversions - expected_treatment, 2) / expected_treatment;

    -- Approximate p-value (for 1 degree of freedom)
    -- This is a simplified calculation; for production, use proper statistical library
    v_p_value := 1 - (0.5 * (1 + erf(sqrt(v_chi_square) / sqrt(2))));

    RETURN QUERY SELECT v_p_value, (v_p_value < 0.05), v_chi_square;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update trigger for experiments
-- ============================================================================

CREATE OR REPLACE FUNCTION update_experiment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ab_experiments_updated_at
    BEFORE UPDATE ON ab_experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ab_experiments IS 'A/B test experiments for data-driven optimization';
COMMENT ON TABLE ab_variants IS 'Variants (control & treatments) for each experiment';
COMMENT ON TABLE ab_assignments IS 'User assignments to variants';
COMMENT ON TABLE ab_events IS 'Event tracking for experiment analysis (partitioned by month)';
COMMENT ON MATERIALIZED VIEW ab_experiment_metrics IS 'Pre-calculated metrics for fast querying';

COMMENT ON FUNCTION assign_user_to_variant IS 'Assigns user to variant using weighted random selection';
COMMENT ON FUNCTION track_ab_event IS 'Tracks an event for A/B testing analysis';
COMMENT ON FUNCTION calculate_statistical_significance IS 'Calculates statistical significance using Chi-square test';
COMMENT ON FUNCTION refresh_ab_metrics IS 'Refreshes materialized view with latest metrics';

-- ============================================================================
-- Initial Data / Examples
-- ============================================================================

-- Example: Create a sample experiment (commented out for production)
-- INSERT INTO ab_experiments (name, description, duration_days, primary_metric)
-- VALUES (
--     'Sustainability Weight Test',
--     'Test impact of increasing sustainability weight from 0.10 to 0.15',
--     14,
--     'conversion_rate'
-- );

COMMIT;
