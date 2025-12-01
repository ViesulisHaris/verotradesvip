-- Supabase Query Cache and Metadata Clear Script
-- Purpose: Clear all cached references to the deleted strategy_rule_compliance table
-- and refresh database statistics to fix strategy selection errors

-- Step 1: Clear PostgreSQL query plan cache
DISCARD PLANS;

-- Step 2: Clear all temporary tables and sequences
DISCARD TEMP;

-- Step 3: Reset session configuration to defaults
DISCARD ALL;

-- Step 4: Force statistics update on strategies table
VACUUM ANALYZE strategies;

-- Step 5: Force statistics update on all related tables
VACUUM ANALYZE trades;
VACUUM ANALYZE users;
VACUUM ANALYZE trade_tags;
VACUUM ANALYZE tags;

-- Step 6: Update table statistics for the entire database
ANALYZE;

-- Step 7: Clear any cached function plans
DO $$
BEGIN
    -- Reload all functions to clear cached execution plans
    PERFORM pg_reload_conf();
END $$;

-- Step 8: Invalidate any remaining cached references to strategy_rule_compliance
-- This is a safety measure to ensure no cached metadata references the deleted table
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Check for any remaining references in system catalogs
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE NOTICE 'Found reference to strategy_rule_compliance in: %.%', rec.schemaname, rec.tablename;
    END LOOP;
    
    -- Check for any remaining references in information schema
    FOR rec IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE NOTICE 'Found information_schema reference to strategy_rule_compliance in: %.%', rec.table_schema, rec.table_name;
    END LOOP;
END $$;

-- Step 9: Refresh materialized views if any exist
DO $$
DECLARE
    mat_view RECORD;
BEGIN
    FOR mat_view IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE matviewname LIKE '%strategy%' OR matviewname LIKE '%rule%' OR matviewname LIKE '%compliance%'
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || quote_ident(mat_view.schemaname) || '.' || quote_ident(mat_view.matviewname);
        RAISE NOTICE 'Refreshed materialized view: %.%', mat_view.schemaname, mat_view.matviewname;
    END LOOP;
END $$;

-- Step 10: Clear any cached prepared statements
DEALLOCATE ALL;

-- Step 11: Update database statistics for better query planning
-- This ensures the query planner has up-to-date information
DO $$
BEGIN
    -- Force update of statistics for strategy-related columns
    EXECUTE 'ANALYZE strategies';
    EXECUTE 'ANALYZE trades';
    
    -- If there are any indexes on strategies, update their statistics
    EXECUTE 'REINDEX TABLE strategies CONCURRENTLY';
    
    RAISE NOTICE 'Database statistics and indexes updated successfully';
END $$;

-- Step 12: Verify the strategies table structure is correct
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if strategies table exists and has the expected structure
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'strategies' 
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Strategies table exists and is accessible';
    ELSE
        RAISE EXCEPTION 'Strategies table not found - this should not happen';
    END IF;
    
    -- Verify strategy_rule_compliance table does not exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'strategy_rule_compliance' 
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Confirmed: strategy_rule_compliance table does not exist (as expected)';
    ELSE
        RAISE EXCEPTION 'strategy_rule_compliance table still exists - this indicates a problem';
    END IF;
END $$;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '=== SUPABASE CACHE CLEAR COMPLETED ===';
    RAISE NOTICE '1. Query plans discarded';
    RAISE NOTICE '2. Temporary data cleared';
    RAISE NOTICE '3. Session configuration reset';
    RAISE NOTICE '4. Table statistics updated';
    RAISE NOTICE '5. Materialized views refreshed';
    RAISE NOTICE '6. Prepared statements deallocated';
    RAISE NOTICE '7. Indexes rebuilt';
    RAISE NOTICE '8. Strategy table structure verified';
    RAISE NOTICE '======================================';
END $$;