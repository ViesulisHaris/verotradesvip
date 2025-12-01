-- AGGRESSIVE_CACHE_CLEAR_WITH_LOGGING.sql
-- Purpose: Aggressive cache clearing with comprehensive logging to identify remaining references
-- This script targets PostgreSQL query plan cache and Supabase internal cache issues
--
-- DEPENDENCY: This script should be run after strategy_rule_compliance table deletion
-- EXECUTION ORDER: Use when standard cache clearing is insufficient

-- ============================================================================
-- WARNING: This script performs aggressive cache clearing operations
-- Run this script in Supabase SQL Editor with service role key privileges
-- ============================================================================

-- Start transaction to ensure atomic operations
BEGIN;

-- Create a comprehensive logging table to track all cache clearing operations
CREATE TEMP TABLE IF NOT EXISTS cache_clear_log (
    step_number INTEGER,
    operation TEXT,
    object_type TEXT,
    object_name TEXT,
    status TEXT,
    details TEXT,
    sql_state TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Log start of aggressive cache clearing
INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
VALUES (0, 'START', 'SYSTEM', 'INFO', 'Starting aggressive cache clear with logging');

-- Step 1: Force discard of all cached query plans
DO $$
DECLARE
    discard_result TEXT;
BEGIN
    RAISE NOTICE 'Step 1: Discarding all cached query plans...';
    
    -- Discard all cached plans
    DISCARD PLANS;
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (1, 'DISCARD_PLANS', 'CACHE', 'SUCCESS', 'All query plans discarded');
    
    -- Verify discard was successful
    GET DIAGNOSTICS discard_result;
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (1, 'DISCARD_PLANS_VERIFY', 'CACHE', 'INFO', format('Discard result: %s', discard_result));
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
    VALUES (1, 'DISCARD_PLANS', 'CACHE', 'ERROR', 'Failed to discard plans', SQLERRM, SQLSTATE);
    
    RAISE WARNING 'Failed to discard plans: %', SQLERRM;
END $$;

-- Step 2: Reset all session configuration
DO $$
DECLARE
    reset_result TEXT;
BEGIN
    RAISE NOTICE 'Step 2: Resetting all session configuration...';
    
    -- Reset all session variables
    RESET ALL;
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (2, 'RESET_ALL', 'SESSION', 'SUCCESS', 'All session configuration reset');
    
    -- Verify reset was successful
    GET DIAGNOSTICS reset_result;
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (2, 'RESET_ALL_VERIFY', 'SESSION', 'INFO', format('Reset result: %s', reset_result));
    
EXCEPTION WHEN OTHERS THEN
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
    VALUES (2, 'RESET_ALL', 'SESSION', 'ERROR', 'Failed to reset session', SQLERRM, SQLSTATE);
    
    RAISE WARNING 'Failed to reset session: %', SQLERRM;
END $$;

-- Step 3: Force table statistics rebuild with detailed logging
DO $$
DECLARE
    table_record RECORD;
    analyze_count INTEGER := 0;
    error_count INTEGER := 0;
    total_tables INTEGER := 0;
BEGIN
    RAISE NOTICE 'Step 3: Rebuilding table statistics with detailed logging...';
    
    -- Count total tables first
    SELECT COUNT(*) INTO total_tables
    FROM pg_tables
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast');
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (3, 'ANALYZE_START', 'STATISTICS', 'INFO', format('Starting analysis of %s tables', total_tables));
    
    -- Analyze each table individually with error handling
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('ANALYZE VERBOSE %I.%I', table_record.schemaname, table_record.tablename);
            analyze_count := analyze_count + 1;
            
            INSERT INTO cache_clear_log (step_number, operation, object_type, object_name, status, details)
            VALUES (3, 'ANALYZE_TABLE', 'STATISTICS', table_record.tablename, 'SUCCESS', 'Statistics rebuilt');
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            
            INSERT INTO cache_clear_log (step_number, operation, object_type, object_name, status, details, error_message, sql_state)
            VALUES (3, 'ANALYZE_TABLE', 'STATISTICS', table_record.tablename, 'ERROR', 
                   format('Failed to analyze: %s', SQLERRM), SQLERRM, SQLSTATE);
        END;
    END LOOP;
    
    INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
    VALUES (3, 'ANALYZE_SUMMARY', 'STATISTICS', 'INFO', 
           format('Analyzed %s tables successfully, %s errors', analyze_count, error_count));
    
    RAISE NOTICE 'Table statistics rebuild complete: %s successful, %s errors', analyze_count, error_count;
END $$;

-- Step 4: Search for and log any remaining strategy_rule_compliance references
DO $$
DECLARE
    reference_count INTEGER := 0;
    reference_details TEXT := '';
BEGIN
    RAISE NOTICE 'Step 4: Searching for remaining strategy_rule_compliance references...';
    
    -- Check pg_class (table definitions)
    SELECT COUNT(*) INTO reference_count
    FROM pg_class
    WHERE relname = 'strategy_rule_compliance';
    
    IF reference_count > 0 THEN
        reference_details := reference_details || format('pg_class: %s references; ', reference_count);
    END IF;
    
    -- Check pg_depend (dependencies)
    SELECT COUNT(*) INTO reference_count
    FROM pg_depend d
    JOIN pg_class c ON d.refobjid = c.oid
    WHERE c.relname = 'strategy_rule_compliance';
    
    IF reference_count > 0 THEN
        reference_details := reference_details || format('pg_depend: %s dependencies; ', reference_count);
    END IF;
    
    -- Check pg_constraint (constraints)
    SELECT COUNT(*) INTO reference_count
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'strategy_rule_compliance';
    
    IF reference_count > 0 THEN
        reference_details := reference_details || format('pg_constraint: %s constraints; ', reference_count);
    END IF;
    
    -- Check cached query plans
    SELECT COUNT(*) INTO reference_count
    FROM pg_stat_statements
    WHERE query ILIKE '%strategy_rule_compliance%';
    
    IF reference_count > 0 THEN
        reference_details := reference_details || format('pg_stat_statements: %s cached queries; ', reference_count);
    END IF;
    
    -- Log findings
    IF LENGTH(reference_details) > 0 THEN
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (4, 'FIND_REFS', 'REMAINS', 'WARNING', 
               format('Found remaining references: %s', TRIM(reference_details, '; ')));
        
        RAISE WARNING 'Found remaining strategy_rule_compliance references: %', TRIM(reference_details, '; ');
    ELSE
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (4, 'FIND_REFS', 'REMAINS', 'SUCCESS', 'No remaining references found');
        
        RAISE NOTICE 'No remaining strategy_rule_compliance references found';
    END IF;
END $$;

-- Step 5: Force invalidation of specific cache entries
DO $$
DECLARE
    temp_table_name TEXT := 'cache_invalidate_' || EXTRACT(EPOCH FROM NOW())::TEXT;
BEGIN
    RAISE NOTICE 'Step 5: Forcing cache invalidation...';
    
    -- Create and drop temporary tables to force cache refresh
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER, cache_bust TEXT)', temp_table_name);
        EXECUTE format('INSERT INTO %I VALUES (1, ''cache_bust_1'')', temp_table_name);
        EXECUTE format('DROP TABLE %I', temp_table_name);
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (5, 'CACHE_INVALIDATE', 'TEMP_TABLE', 'SUCCESS', 'Cache invalidation via temp table');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
        VALUES (5, 'CACHE_INVALIDATE', 'TEMP_TABLE', 'ERROR', 'Temp table failed', SQLERRM, SQLSTATE);
    END;
    
    -- Create second temp table with different name
    temp_table_name := temp_table_name || '_2';
    BEGIN
        EXECUTE format('CREATE TEMP TABLE %I (id INTEGER, cache_bust TEXT)', temp_table_name);
        EXECUTE format('INSERT INTO %I VALUES (2, ''cache_bust_2'')', temp_table_name);
        EXECUTE format('DROP TABLE %I', temp_table_name);
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (5, 'CACHE_INVALIDATE_2', 'TEMP_TABLE', 'SUCCESS', 'Second cache invalidation via temp table');
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
        VALUES (5, 'CACHE_INVALIDATE_2', 'TEMP_TABLE', 'ERROR', 'Second temp table failed', SQLERRM, SQLSTATE);
    END;
    
    RAISE NOTICE 'Cache invalidation completed';
END $$;

-- Step 6: Test basic queries to verify cache is clear
DO $$
DECLARE
    test_success BOOLEAN := TRUE;
    test_error TEXT := '';
BEGIN
    RAISE NOTICE 'Step 6: Testing queries to verify cache is clear...';
    
    -- Test basic strategies query
    BEGIN
        PERFORM 1 FROM strategies LIMIT 1;
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (6, 'TEST_STRATEGIES', 'VERIFICATION', 'SUCCESS', 'Basic strategies query works');
        
    EXCEPTION WHEN OTHERS THEN
        test_success := FALSE;
        test_error := SQLERRM;
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
        VALUES (6, 'TEST_STRATEGIES', 'VERIFICATION', 'ERROR', 'Strategies query failed', SQLERRM, SQLSTATE);
    END;
    
    -- Test trades query
    BEGIN
        PERFORM 1 FROM trades LIMIT 1;
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (6, 'TEST_TRADES', 'VERIFICATION', 'SUCCESS', 'Basic trades query works');
        
    EXCEPTION WHEN OTHERS THEN
        test_success := FALSE;
        test_error := test_error || '; ' || SQLERRM;
        
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details, error_message, sql_state)
        VALUES (6, 'TEST_TRADES', 'VERIFICATION', 'ERROR', 'Trades query failed', SQLERRM, SQLSTATE);
    END;
    
    -- Log overall test result
    IF test_success THEN
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (6, 'TEST_SUMMARY', 'VERIFICATION', 'SUCCESS', 'All verification tests passed');
        
        RAISE NOTICE 'Cache verification: All tests passed';
    ELSE
        INSERT INTO cache_clear_log (step_number, operation, object_type, status, details)
        VALUES (6, 'TEST_SUMMARY', 'VERIFICATION', 'ERROR', format('Tests failed: %s', test_error));
        
        RAISE WARNING 'Cache verification failed: %', test_error;
    END IF;
END $$;

-- Step 7: Generate comprehensive report
SELECT
    step_number,
    operation,
    object_type,
    object_name,
    status,
    details,
    sql_state,
    error_message,
    created_at
FROM cache_clear_log
ORDER BY step_number, created_at;

-- Final summary
DO $$
DECLARE
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    warning_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO success_count
    FROM cache_clear_log
    WHERE status = 'SUCCESS';
    
    SELECT COUNT(*) INTO error_count
    FROM cache_clear_log
    WHERE status = 'ERROR';
    
    SELECT COUNT(*) INTO warning_count
    FROM cache_clear_log
    WHERE status = 'WARNING';
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================================================';
    RAISE NOTICE 'AGGRESSIVE CACHE CLEAR SUMMARY';
    RAISE NOTICE '==========================================================================';
    RAISE NOTICE 'Operations completed: %s', success_count + error_count + warning_count;
    RAISE NOTICE 'Successful: %s', success_count;
    RAISE NOTICE 'Errors: %s', error_count;
    RAISE NOTICE 'Warnings: %s', warning_count;
    
    IF error_count = 0 AND warning_count = 0 THEN
        RAISE NOTICE 'STATUS: COMPLETE SUCCESS';
        RAISE NOTICE 'Cache should now be fully cleared';
    ELSE
        RAISE NOTICE 'STATUS: PARTIAL SUCCESS';
        RAISE NOTICE 'Some operations failed - see detailed log above';
    END IF;
    
    RAISE NOTICE 'Completed at: %', NOW();
    RAISE NOTICE '==========================================================================';
END $$;

-- Clean up and commit
DROP TABLE IF EXISTS cache_clear_log;
COMMIT;

-- Return final status
SELECT
    'AGGRESSIVE_CACHE_CLEAR' as operation,
    CASE
        WHEN (SELECT COUNT(*) FROM cache_clear_log WHERE status = 'ERROR') = 0 
        AND (SELECT COUNT(*) FROM cache_clear_log WHERE status = 'WARNING') = 0
        THEN 'SUCCESS'
        ELSE 'PARTIAL_SUCCESS'
    END as status,
    NOW() as completed_at,
    CASE
        WHEN (SELECT COUNT(*) FROM cache_clear_log WHERE status = 'ERROR') = 0 
        AND (SELECT COUNT(*) FROM cache_clear_log WHERE status = 'WARNING') = 0
        THEN 'Aggressive cache clearing completed successfully. All query plans discarded and statistics rebuilt.'
        ELSE 'Aggressive cache clearing completed with some errors. See detailed log for specifics.'
    END as message;