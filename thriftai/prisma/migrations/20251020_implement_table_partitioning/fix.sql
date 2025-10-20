-- Fix 1: Update order_items foreign key to point to new partitioned orders table
-- Check if order_items exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items') THEN
    -- Drop old foreign key
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_orderId_fkey;

    -- Add new foreign key to partitioned table
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_orderId_fkey
    FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE;

    RAISE NOTICE 'Updated order_items foreign key to partitioned orders table';
  END IF;
END $$;

-- Fix 2: Now safely drop orders_old
DROP TABLE IF EXISTS orders_old CASCADE;

-- Fix 3: Run performance benchmark with real product (or skip if no products)
DO $$
DECLARE
  test_start TIMESTAMPTZ;
  test_end TIMESTAMPTZ;
  test_duration INTERVAL;
  test_product_id TEXT;
BEGIN
  -- Get a real product ID
  SELECT id INTO test_product_id FROM products LIMIT 1;

  IF test_product_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== Performance Benchmarks (Corrected) ===';

    -- Test 1: INSERT performance
    test_start := clock_timestamp();
    INSERT INTO product_views (id, "productId", "sessionId", source, "createdAt")
    SELECT
      gen_random_uuid()::text,
      test_product_id,
      gen_random_uuid()::text,
      'benchmark',
      CURRENT_TIMESTAMP
    FROM generate_series(1, 1000);
    test_end := clock_timestamp();
    test_duration := test_end - test_start;
    RAISE NOTICE 'INSERT 1000 rows (auto-routing): % ms',
      EXTRACT(MILLISECONDS FROM test_duration);

    -- Test 2: SELECT with date filter
    test_start := clock_timestamp();
    PERFORM * FROM product_views
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days';
    test_end := clock_timestamp();
    test_duration := test_end - test_start;
    RAISE NOTICE 'SELECT with date filter (partition pruning): % ms',
      EXTRACT(MILLISECONDS FROM test_duration);

    -- Test 3: COUNT across all partitions
    test_start := clock_timestamp();
    PERFORM COUNT(*) FROM product_views;
    test_end := clock_timestamp();
    test_duration := test_end - test_start;
    RAISE NOTICE 'COUNT all rows: % ms',
      EXTRACT(MILLISECONDS FROM test_duration);

    -- Cleanup test data
    DELETE FROM product_views WHERE source = 'benchmark';

    RAISE NOTICE '==========================================';
  ELSE
    RAISE NOTICE 'Skipping benchmark - no products in database';
  END IF;
END $$;
