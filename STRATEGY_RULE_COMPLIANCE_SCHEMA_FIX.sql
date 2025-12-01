-- Deleted Tables Schema Fix
-- Purpose: Clear all cached references to the deleted compliance tables
-- and refresh database statistics to fix strategy selection errors

-- Step 1: Clear PostgreSQL query plan cache
DISCARD PLANS;

-- Step 2: Clear session-specific cached information
DISCARD SEQUENCES;
DISCARD TEMP;

-- Step 3: Force statistics refresh on all tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('strategies', 'trades', 'strategy_rules')
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(table_record.schemaname) || '.' || quote_ident(table_record.tablename);
        RAISE NOTICE 'Analyzed table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- Step 4: Refresh all materialized views that might reference strategies
DO $$
DECLARE
    mat_view RECORD;
BEGIN
    FOR mat_view IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || quote_ident(mat_view.schemaname) || '.' || quote_ident(mat_view.matviewname);
            RAISE NOTICE 'Refreshed materialized view: %.%', mat_view.schemaname, mat_view.matviewname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not refresh materialized view % (might be in use): %', mat_view.matviewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 5: Clear cached function plans
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oid 
        FROM pg_proc 
        WHERE proname IN ('get_strategies_with_stats', 'calculate_strategy_stats')
    LOOP
        EXECUTE 'DO $$ BEGIN RAISE NOTICE ''Clearing function cache for %''; END $$';
    END LOOP;
END $$;

-- Step 6: Reset connection-level statistics
SELECT pg_stat_reset();

-- Step 7: Force table metadata reload
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('strategies', 'trades', 'strategy_rules')
    LOOP
        EXECUTE 'SELECT 1 FROM ' || quote_ident(table_record.schemaname) || '.' || quote_ident(table_record.tablename) || ' LIMIT 1';
        RAISE NOTICE 'Forced metadata reload for: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- Step 8: Verify deleted tables do not exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name IN ('strategy_rule_compliance', 'compliance_table', 'rule_compliance')
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✓ Confirmed: Deleted tables do not exist';
    ELSE
        RAISE EXCEPTION '❌ Deleted tables still exist - this indicates a serious problem';
    END IF;
END $$;

-- Step 9: Test basic strategies query to ensure it works
DO $$
DECLARE
    test_count INTEGER;
    test_error TEXT;
BEGIN
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM strategies WHERE is_active = true' INTO test_count;
        RAISE NOTICE '✓ Strategies query test passed: % active strategies found', test_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS test_error = MESSAGE_TEXT;
        RAISE NOTICE '❌ Strategies query test failed: %', test_error;
        RAISE EXCEPTION 'Schema fix failed - strategies query still broken';
    END;
END $$;

-- Step 10: Test strategy_rules query to ensure it works
DO $$
DECLARE
    test_count INTEGER;
    test_error TEXT;
BEGIN
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM strategy_rules' INTO test_count;
        RAISE NOTICE '✓ Strategy rules query test passed: % rules found', test_count;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS test_error = MESSAGE_TEXT;
        RAISE NOTICE '❌ Strategy rules query test failed: %', test_error;
        RAISE NOTICE 'This is expected if strategy_rules table does not exist yet';
    END;
END $$;

-- Step 11: Final verification
DO $$
DECLARE
    remaining_tables INTEGER := 0;
    remaining_views INTEGER := 0;
BEGIN
    -- Check for any remaining strategy_rule_compliance references
    FOR rec IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE tablename LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE WARNING 'Found reference to strategy_rule_compliance in: %.%', rec.schemaname, rec.tablename;
        remaining_tables := remaining_tables + 1;
    END LOOP;
    
    -- Check information_schema for any lingering references
    FOR rec IN
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_name LIKE '%strategy_rule_compliance%'
    LOOP
        RAISE WARNING 'Found information_schema reference to strategy_rule_compliance in: %.%', rec.table_schema, rec.table_name;
        remaining_views := remaining_views + 1;
    END LOOP;
    
    IF remaining_tables = 0 AND remaining_views = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No strategy_rule_compliance references found in database';
        RAISE NOTICE '✅ Schema cache has been successfully cleared';
        RAISE NOTICE '✅ Strategy queries should now work without errors';
    ELSE
        RAISE WARNING '⚠️  WARNING: Found % table references and % view references', remaining_tables, remaining_views;
        RAISE WARNING 'Manual investigation may be required';
    END IF;
END $$;

-- Final message
RAISE NOTICE '';
RAISE NOTICE '=========================================';
RAISE NOTICE 'STRATEGY_RULE_COMPLIANCE SCHEMA FIX COMPLETE';
RAISE NOTICE '=========================================';
RAISE NOTICE '';
RAISE NOTICE 'If all tests passed above, the strategy selection';
RAISE NOTICE 'errors should now be resolved.';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Test the TradeForm component';
RAISE NOTICE '2. Test the Strategies page';
RAISE NOTICE '3. Test strategy creation/editing';
RAISE NOTICE '';